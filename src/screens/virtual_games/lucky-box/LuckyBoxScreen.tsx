import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, AccessibilityInfo } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { z } from 'zod'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import GameBalancePill from '@/components/virtuals/GameBalancePill'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import displayCurrency from '@/utils/displayCurrency'
import { triggerHaptic } from '@/utils/vibration'
import GameRulesSheet from '@/components/virtuals/GameRulesSheet'
import RoundResultOverlay from '@/components/virtuals/RoundResultOverlay'
import GameHistoryStrip from '@/components/virtuals/GameHistoryStrip'
import GameStatsRow from '@/components/virtuals/GameStatsRow'
import GiftBox from '@/components/virtuals/GiftBox'

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
  pick: z.number().min(1).max(3),
})

type Box = {
  revealed: boolean
  prize: boolean
}

type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  systemPick: number | null
  userPick: number | null
}

const RULES_KEY = 'plusergame.rules.box.v1'
const OPEN_MS = 650

const BOX_RULES = [
  'Three closed boxes. The prize is in one of them.',
  'Your stake is taken when you tap a box. That lid opens first.',
  'The other two open after, so you can see where the prize sat.',
  'Stake ₦50–₦1,000. A hit pays the multiplier shown into your wallet.',
]

const emptyBoxes = (): Box[] =>
  Array.from({ length: 3 }, () => ({ revealed: false, prize: false }))

const LuckyBoxScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [boxes, setBoxes] = useState<Box[]>(emptyBoxes)
  const [picking, setPicking] = useState<number | null>(null)
  const [gameActive, setGameActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: '',
    payout: 0,
    multiplier: '2.5x',
    systemPick: null,
    userPick: null,
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [fetchWallet, setFetchWallet] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => {
      sub?.remove?.()
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
    }
  }, [])

  useEffect(() => {
    AsyncStorage.getItem(RULES_KEY)
      .then((seen) => {
        if (!seen) setRulesOpen(true)
      })
      .catch(() => {})
  }, [])

  const handlePick = async (index: number) => {
    if (!gameActive || loading) return

    const parsed = schema.safeParse({ stake, pick: index + 1 })
    if (!parsed.success) {
      return Toast.show({
        type: 'info',
        text1: parsed.error.issues[0].message,
      })
    }

    try {
      setLoading(true)
      setPicking(index)
      setShowOverlay(false)
      sfx.flip()
      triggerHaptic('roll')

      const started = Date.now()
      const res = await axiosClient.post('/virtual/box', {
        pick: index + 1,
        stake: Number(stake),
      })

      const data = res.data
      const game = data?.game
      if (!game) {
        throw new Error(data?.message || 'The boxes did not come back. Try again.')
      }

      const wait = reduceMotion ? 0 : Math.max(0, OPEN_MS - (Date.now() - started))
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait))

      const correct = Boolean(game.is_win)
      const prizeIndex = Number(game.system_pick) - 1

      setBoxes((prev) =>
        prev.map((box, i) =>
          i === index ? { revealed: true, prize: index === prizeIndex } : box,
        ),
      )

      if (!reduceMotion) {
        await new Promise((resolve) => setTimeout(resolve, 380))
      }

      setBoxes(
        Array.from({ length: 3 }, (_, i) => ({
          revealed: true,
          prize: i === prizeIndex,
        })),
      )
      setGameActive(false)
      setPicking(null)
      setHistory((prev) => [correct, ...prev].slice(0, 12))
      setResult({
        isWin: correct,
        message: data.message,
        payout: game.payout || 0,
        multiplier: game.multiplier,
        systemPick: game.system_pick,
        userPick: game.user_picked,
      })

      if (correct) {
        sfx.win()
        triggerHaptic('win')
      } else {
        sfx.lose()
        triggerHaptic('lose')
      }

      if (!reduceMotion) {
        await new Promise((resolve) => setTimeout(resolve, 420))
      }
      setShowOverlay(true)
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
      overlayTimer.current = setTimeout(() => setShowOverlay(false), 1800)
      setFetchWallet(true)
    } catch (error: unknown) {
      sfx.error()
      setPicking(null)
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error),
      })
    } finally {
      setLoading(false)
      setPicking(null)
    }
  }

  const newRound = () => {
    if (loading) return
    sfx.next()
    setBoxes(emptyBoxes())
    setGameActive(true)
    setShowOverlay(false)
    setResult((prev) => ({ ...prev, message: '', payout: 0, systemPick: null, userPick: null }))
  }

  const goBack = () => {
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  const hint = loading
    ? 'Lids are lifting…'
    : gameActive
      ? 'Tap a box. One holds the prize.'
      : result.isWin
        ? `Win · box ${result.systemPick}`
        : `Miss · prize was box ${result.systemPick}`

  return (
    <LinearGradient colors={['#1a0f2b', '#0d061a']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 16, padding: 12 }}
      >
        <View style={[styles.headerRow, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#d2b48c" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <Text>🎁</Text>
            </View>
            <Text style={styles.title}>Lucky box</Text>
          </View>
          <TouchableOpacity onPress={() => setRulesOpen(true)} style={styles.helpBtn} accessibilityLabel="How to play">
            <Text style={styles.helpText}>?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <GameBalancePill />
        </View>

        <GameStatsRow
          stake={stake}
          onStakeChange={setStake}
          payout={result.payout ? displayCurrency(Number(result.payout)) : '—'}
          multiplier={result.multiplier || '—'}
          stakeEditable={gameActive && !loading}
        />

        <View style={styles.stage}>
          <View style={styles.boxRow}>
            {boxes.map((box, i) => (
              <GiftBox
                key={i}
                index={i}
                revealed={box.revealed}
                prize={box.prize}
                shaking={picking === i}
                disabled={!gameActive || loading}
                reduceMotion={reduceMotion}
                onPress={handlePick}
              />
            ))}
          </View>
        </View>

        <Text style={styles.hint}>{hint}</Text>
        <View style={{ height: showOverlay ? 96 : 0, position: 'relative' }}>
          <RoundResultOverlay
            visible={showOverlay}
            isWin={result.isWin}
            title={result.isWin ? 'That was the prize' : 'Empty box'}
            detail={
              result.isWin
                ? `+${displayCurrency(Number(result.payout || 0))}`
                : `It was box ${result.systemPick}`
            }
            reduceMotion={reduceMotion}
          />
        </View>

        {!gameActive ? (
          <TouchableOpacity style={styles.openBtn} disabled={loading} onPress={newRound}>
            <Text style={styles.openText}>NEW BOXES</Text>
          </TouchableOpacity>
        ) : loading ? (
          <View style={styles.openBtn}>
            <ActivityIndicator color="#1a0f2b" />
          </View>
        ) : null}

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Open a box to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Lucky box works"
        steps={BOX_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default LuckyBoxScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6c4bb8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#e5dcff',
    fontSize: 20,
    fontWeight: '700',
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(210,180,140,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#f6d98a',
    fontSize: 18,
    fontWeight: '800',
  },
  stage: {
    minHeight: 188,
    justifyContent: 'center',
    paddingVertical: 12,
    overflow: 'visible',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  hint: {
    textAlign: 'center',
    color: '#c7bff0',
    fontSize: 15,
  },
  openBtn: {
    backgroundColor: '#e3a843',
    padding: 18,
    borderRadius: 30,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 220,
  },
  openBusy: {
    opacity: 0.55,
  },
  openText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1a0f2b',
    letterSpacing: 0.4,
  },
})
