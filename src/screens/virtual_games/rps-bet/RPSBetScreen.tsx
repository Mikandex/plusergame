import { View, Text, TouchableOpacity, StyleSheet, ScrollView, AccessibilityInfo } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import z from 'zod'
import Toast from 'react-native-toast-message'
import { hasEnoughBalance } from '@/utils/stakeGuard'
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
import RpsSign, { type RpsMove } from '@/components/virtuals/RpsSign'
import RpsArena from '@/components/virtuals/RpsArena'

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
  pick: z.enum(['rock', 'paper', 'scissors'], { message: 'Pick rock, paper, or scissors' }),
})

const RULES_KEY = 'plusergame.rules.rps.v1'
const THROW_MS = 720

const RPS_RULES = [
  'Rock breaks scissors. Paper covers rock. Scissors cut paper.',
  'Your stake is taken when you throw. Tap a move — that is the round.',
  'A win pays the multiplier. A draw returns the stake. A loss takes it.',
  'Stake ₦50–₦1,000.',
]

function asMove(raw: unknown): RpsMove {
  const s = String(raw || '').toLowerCase()
  if (s.includes('sci')) return 'scissors'
  if (s.includes('pap')) return 'paper'
  return 'rock'
}

const RPSBetScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [payout, setPayout] = useState(0)
  const [multiplier, setMultiplier] = useState('5x')
  const [you, setYou] = useState<RpsMove | 'unknown'>('unknown')
  const [house, setHouse] = useState<RpsMove | 'unknown'>('unknown')
  const [winner, setWinner] = useState<'user' | 'ai' | 'draw' | null>(null)
  const [clashing, setClashing] = useState(false)
  const [roundActive, setRoundActive] = useState(true)
  const [history, setHistory] = useState<boolean[]>([])
  const [loading, setLoading] = useState(false)
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

  const handlePlay = async (choice: RpsMove) => {
    if (loading || !roundActive) return
    const parsed = schema.safeParse({ stake, pick: choice })
    if (!parsed.success) {
      return Toast.show({ type: 'info', text1: parsed.error.issues[0].message })
    }

    if (!hasEnoughBalance(Number(stake))) return

    try {
      setLoading(true)
      setClashing(true)
      setShowOverlay(false)
      setWinner(null)
      setYou('unknown')
      setHouse('unknown')
      sfx.flip()
      triggerHaptic('roll')

      const started = Date.now()
      const res = await axiosClient.post('/virtual/rsp', {
        pick: choice,
        stake: Number(stake),
      })

      const game = res.data?.game?.Game
      if (!game) {
        throw new Error(res.data?.message || 'The throw did not come back. Try again.')
      }

      const wait = reduceMotion ? 0 : Math.max(0, THROW_MS - (Date.now() - started))
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait))

      const youMove = asMove(game.user_choice || choice)
      const houseMove = asMove(game.ai_choice)
      const who = (game.winner === 'user' || game.winner === 'ai' || game.winner === 'draw'
        ? game.winner
        : 'draw') as 'user' | 'ai' | 'draw'

      setClashing(false)
      setYou(youMove)
      setHouse(houseMove)
      setWinner(who)
      setPayout(game.payout || 0)
      setMultiplier(game.multiplier || multiplier)

      if (who === 'user') {
        sfx.win()
        triggerHaptic('win')
        setHistory((prev) => [true, ...prev].slice(0, 12))
      } else if (who === 'ai') {
        sfx.lose()
        triggerHaptic('lose')
        setHistory((prev) => [false, ...prev].slice(0, 12))
      } else {
        sfx.next()
      }

      setShowOverlay(true)
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
      overlayTimer.current = setTimeout(() => setShowOverlay(false), 1800)
      setRoundActive(false)
      setFetchWallet(true)
    } catch (error: unknown) {
      sfx.error()
      setClashing(false)
      Toast.show({ type: 'error', text1: getApiErrorMessage(error) })
    } finally {
      setLoading(false)
    }
  }

  const resetGame = () => {
    sfx.next()
    setRoundActive(true)
    setYou('unknown')
    setHouse('unknown')
    setWinner(null)
    setShowOverlay(false)
    setPayout(0)
  }

  const goBack = () => {
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  const status =
    clashing
      ? 'Throwing…'
      : winner === 'user'
        ? 'You take it'
        : winner === 'ai'
          ? 'AI takes it'
          : winner === 'draw'
            ? 'Draw · stake back'
            : 'Throw a move. That’s the round.'

  return (
    <LinearGradient colors={['#0b1d2e', '#071421']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 16, padding: 12 }}
      >
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#f5d27a" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <RpsSign move="rock" size={28} />
            </View>
            <Text style={styles.title}>RPS bet</Text>
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
          stakeEditable={roundActive && !loading}
        />

        <RpsArena
          you={you}
          house={house}
          clashing={clashing}
          winner={winner}
          reduceMotion={reduceMotion}
        />

        <Text style={styles.hint}>{status}</Text>
        <View style={{ height: showOverlay ? 96 : 0, position: 'relative' }}>
          <RoundResultOverlay
            visible={showOverlay}
            isWin={winner === 'user'}
            title={winner === 'user' ? 'You take it' : winner === 'draw' ? 'Draw' : 'AI takes it'}
            detail={
              winner === 'user'
                ? `+${displayCurrency(Number(payout || 0))}`
                : winner === 'draw'
                  ? 'Stake returned'
                  : `${you} vs ${house}`
            }
            reduceMotion={reduceMotion}
          />
        </View>

        <View style={styles.choices}>
          {(['rock', 'paper', 'scissors'] as const).map((move) => (
            <TouchableOpacity
              key={move}
              disabled={!roundActive || loading}
              style={[styles.choiceBtn, !roundActive && styles.choiceOff]}
              onPress={() => handlePlay(move)}
            >
              <RpsSign move={move} size={52} />
              <Text style={styles.choiceLabel}>{move}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {!roundActive ? (
          <TouchableOpacity style={styles.playBtn} onPress={resetGame}>
            <Text style={styles.playText}>THROW AGAIN</Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Throw to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How RPS bet works"
        steps={RPS_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default RPSBetScreen

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
    backgroundColor: '#163447',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  title: {
    color: '#dce7f5',
    fontSize: 20,
    fontWeight: '700',
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#f5d27a',
    fontSize: 18,
    fontWeight: '800',
  },
  hint: {
    textAlign: 'center',
    color: '#c7d6df',
    fontSize: 15,
  },
  choices: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  choiceBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#163447',
    borderRadius: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.28)',
    gap: 6,
  },
  choiceOff: {
    opacity: 0.4,
  },
  choiceLabel: {
    color: '#e6e1c5',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  playBtn: {
    alignSelf: 'center',
    minWidth: 200,
    backgroundColor: '#e3a843',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: 'center',
  },
  playText: {
    color: '#0b1d2e',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
})
