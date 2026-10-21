import { View, Text, TouchableOpacity, StyleSheet, ScrollView, AccessibilityInfo, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import z from 'zod'
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
import SlotCabinet from '@/components/virtuals/SlotCabinet'
import { normalizeSlotSymbol } from '@/components/virtuals/SlotSymbol'

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(500, 'Maximum stake is 500'),
})

const RULES_KEY = 'plusergame.rules.reel.v1'
const SPIN_MS = 1100
const SETTLE_MS = 1400

const REEL_RULES = [
  'Three reels. The payline is the gold band across the centre.',
  'Your stake is taken when you hit SPIN. Match on the payline to win.',
  'Stake ₦50–₦500. A hit pays the multiplier shown into your wallet.',
  'The faces that stop are the house result — not a preview.',
]

const ReelStreakScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [multiplier, setMultiplier] = useState('15x')
  const [reels, setReels] = useState<[string, string, string]>(['🍒', '🍋', '🍊'])
  const [spinning, setSpinning] = useState(false)
  const [isWin, setIsWin] = useState(false)
  const [payout, setPayout] = useState(0)
  const [message, setMessage] = useState('')
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

  const handleSpin = async () => {
    if (spinning) return
    const parsed = schema.safeParse({ stake })
    if (!parsed.success) {
      return Toast.show({
        type: 'info',
        text1: parsed.error.issues[0].message,
      })
    }

    try {
      setSpinning(true)
      setShowOverlay(false)
      setIsWin(false)
      setMessage('')
      sfx.flip()
      triggerHaptic('roll')

      const started = Date.now()
      const res = await axiosClient.post('/virtual/reel', { stake: Number(stake) })
      const data = res.data?.game
      if (!data) {
        throw new Error(res.data?.message || 'The reels did not come back. Try again.')
      }

      const faces: [string, string, string] = Array.isArray(data.reels)
        ? [
            normalizeSlotSymbol(data.reels[0]),
            normalizeSlotSymbol(data.reels[1]),
            normalizeSlotSymbol(data.reels[2]),
          ]
        : ['🍒', '🍋', '🍊']
      setReels(faces)

      const wait = reduceMotion ? 0 : Math.max(0, SPIN_MS - (Date.now() - started))
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait))

      setSpinning(false)
      if (!reduceMotion) {
        await new Promise((resolve) => setTimeout(resolve, SETTLE_MS))
      }

      const win = Boolean(data.is_win)
      const pay = data.payout || 0
      setIsWin(win)
      setPayout(pay)
      setMultiplier(data.multiplier || multiplier)
      setMessage(res.data.message || (win ? 'Hit' : 'Miss'))
      setHistory((prev) => [win, ...prev].slice(0, 12))

      if (win) {
        sfx.win()
        triggerHaptic('win')
      } else {
        sfx.lose()
        triggerHaptic('lose')
      }

      setShowOverlay(true)
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
      overlayTimer.current = setTimeout(() => setShowOverlay(false), 1800)
      setFetchWallet(true)
    } catch (error: unknown) {
      sfx.error()
      setSpinning(false)
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error),
      })
    }
  }

  const goBack = () => {
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  const busy = spinning

  return (
    <LinearGradient colors={['#1a050a', '#0d0610']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 16, padding: 12 }}
      >
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#f6d98a" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <Text>🎰</Text>
            </View>
            <Text style={styles.title}>Reel streak</Text>
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
          payout={payout ? displayCurrency(Number(payout)) : '—'}
          multiplier={multiplier}
          stakeEditable={!busy}
        />

        <SlotCabinet reels={reels} spinning={spinning} win={isWin} reduceMotion={reduceMotion} />

        <Text style={styles.hint}>
          {busy ? 'Reels in motion…' : message ? (isWin ? 'Payline hit' : 'No match on the payline') : 'Three faces. One gold line.'}
        </Text>
        <View style={{ height: showOverlay ? 96 : 0, position: 'relative' }}>
          <RoundResultOverlay
            visible={showOverlay}
            isWin={isWin}
            title={isWin ? 'Payline hit' : 'No match'}
            detail={isWin ? `+${displayCurrency(Number(payout || 0))}` : reels.join('  ')}
            reduceMotion={reduceMotion}
          />
        </View>

        <TouchableOpacity style={[styles.spinBtn, busy && styles.spinBusy]} onPress={handleSpin} disabled={busy}>
          {busy ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color="#3a0f18" />
              <Text style={styles.spinText}>SPINNING</Text>
            </View>
          ) : (
            <Text style={styles.spinText}>SPIN</Text>
          )}
        </TouchableOpacity>

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Spin to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Reel streak works"
        steps={REEL_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default ReelStreakScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#6b0000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f6d98a',
  },
  title: {
    color: '#f6d98a',
    fontSize: 20,
    fontWeight: '800',
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(246,217,138,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#f6d98a',
    fontSize: 18,
    fontWeight: '800',
  },
  hint: {
    textAlign: 'center',
    color: '#e5dcff',
    fontSize: 15,
  },
  spinBtn: {
    alignSelf: 'center',
    minWidth: 180,
    backgroundColor: '#c41e3a',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 40,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#f6d98a',
  },
  spinBusy: {
    opacity: 0.7,
  },
  spinText: {
    color: '#fff8e1',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
})
