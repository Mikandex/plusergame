import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, AccessibilityInfo } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { hasEnoughBalance } from '@/utils/stakeGuard'
import z from 'zod'
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import GameBalancePill from '@/components/virtuals/GameBalancePill'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import displayCurrency from '@/utils/displayCurrency'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { triggerHaptic } from '@/utils/vibration'
import GameRulesSheet from '@/components/virtuals/GameRulesSheet'
import RoundResultOverlay from '@/components/virtuals/RoundResultOverlay'
import GameHistoryStrip from '@/components/virtuals/GameHistoryStrip'
import GameStatsRow from '@/components/virtuals/GameStatsRow'
import LotteryBall from '@/components/virtuals/LotteryBall'
import LotteryMachine from '@/components/virtuals/LotteryMachine'

const MAX_PICKS = 5
const RULES_KEY = 'plusergame.rules.lottery.v1'
const HOPPER_MS = 1100
const BALL_MS = 320

const LOTTERY_RULES = [
  'Pick exactly five numbers from 1 to 40. That is your ticket.',
  'Your stake is taken when you tap Draw. The house then pulls balls from the hopper.',
  'Each drawn ball that is on your ticket is a hit. Hits pay the multiplier into your wallet.',
  'Stake ₦50–₦1,000. Bingo is the bonus ball when the draw includes one.',
]

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
  picks: z.array(z.number().min(1).max(40)).length(MAX_PICKS, `Pick exactly ${MAX_PICKS} numbers`),
})

type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  bingoNumber: number
  drawCount: number
  drewNumbers: number[]
  matchedNumbers: number[]
  userPicks: number[]
}

const emptyResult = (): Result => ({
  isWin: false,
  message: '',
  payout: 0,
  multiplier: '3x',
  bingoNumber: 0,
  drawCount: 0,
  drewNumbers: [],
  matchedNumbers: [],
  userPicks: [],
})

const ALL_NUMBERS = Array.from({ length: 40 }, (_, i) => i + 1)

function pickQuickFive() {
  const pool = [...ALL_NUMBERS]
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, MAX_PICKS).sort((a, b) => a - b)
}

const LotteryScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [loading, setLoading] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const [revealed, setRevealed] = useState(0)
  const [result, setResult] = useState<Result>(emptyResult)
  const [history, setHistory] = useState<boolean[]>([])
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [fetchWallet, setFetchWallet] = useState(false)
  const [numbersSelected, setNumbersSelected] = useState<number[]>([])
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const revealTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => {
      sub?.remove?.()
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
      revealTimers.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    AsyncStorage.getItem(RULES_KEY)
      .then((seen) => {
        if (!seen) setRulesOpen(true)
      })
      .catch(() => {})
  }, [])

  const clearRevealTimers = () => {
    revealTimers.current.forEach(clearTimeout)
    revealTimers.current = []
  }

  const resetDraw = () => {
    clearRevealTimers()
    setShowOverlay(false)
    setDrawing(false)
    setRevealed(0)
    setResult(emptyResult())
  }

  const addNumber = (item: number) => {
    if (loading || drawing) return
    resetDraw()

    if (numbersSelected.includes(item)) {
      sfx.next()
      setNumbersSelected((prev) => prev.filter((n) => n !== item))
      return
    }

    if (numbersSelected.length >= MAX_PICKS) {
      sfx.error()
      Toast.show({
        type: 'info',
        text1: `You already picked ${MAX_PICKS} numbers`,
        text2: 'Tap a selected ball to swap it out',
      })
      return
    }

    sfx.next()
    setNumbersSelected((prev) => {
      if (prev.includes(item) || prev.length >= MAX_PICKS) return prev
      return [...prev, item]
    })
  }

  const quickPick = () => {
    if (loading || drawing) return
    sfx.next()
    resetDraw()
    setNumbersSelected(pickQuickFive())
  }

  const clearPicks = () => {
    if (loading || drawing) return
    sfx.next()
    resetDraw()
    setNumbersSelected([])
  }

  const runReveal = (drawn: number[], onDone: () => void) => {
    if (reduceMotion || drawn.length === 0) {
      setRevealed(drawn.length)
      onDone()
      return
    }

    drawn.forEach((_, index) => {
      const t = setTimeout(() => {
        setRevealed(index + 1)
        sfx.next()
        triggerHaptic('roll')
        if (index === drawn.length - 1) onDone()
      }, index * BALL_MS)
      revealTimers.current.push(t)
    })
  }

  const handlePlay = async () => {
    if (loading || drawing) return

    const parsed = schema.safeParse({ stake, picks: numbersSelected })
    if (!parsed.success) {
      return Toast.show({
        type: 'info',
        text1: parsed.error.issues[0].message,
      })
    }

    if (!hasEnoughBalance(Number(stake))) return

    try {
      setLoading(true)
      setShowOverlay(false)
      setRevealed(0)
      setDrawing(true)
      sfx.flip()
      triggerHaptic('roll')

      const started = Date.now()
      const res = await axiosClient.post('/virtual/play-lottery', {
        picks: numbersSelected,
        stake: Number(stake),
      })

      const data = res.data.game.result
      const correct: boolean = data.is_win
      const drewNumbers: number[] = data.drew_numbers || []

      const hopperWait = reduceMotion ? 0 : Math.max(0, HOPPER_MS - (Date.now() - started))
      if (hopperWait) await new Promise((resolve) => setTimeout(resolve, hopperWait))

      setResult({
        isWin: correct,
        message: data.win_message,
        payout: data.payout || 0,
        multiplier: data.multiplier,
        bingoNumber: data.bingo_number,
        drawCount: data.draw_count,
        drewNumbers,
        matchedNumbers: data.matched_numbers || [],
        userPicks: data.user_picks || numbersSelected,
      })
      setHistory((prev) => [correct, ...prev].slice(0, 12))
      setDrawing(false)
      setFetchWallet(true)

      runReveal(drewNumbers, () => {
        if (correct) {
          sfx.win()
          triggerHaptic('win')
        } else {
          sfx.lose()
          triggerHaptic('lose')
        }
        setShowOverlay(true)
        if (overlayTimer.current) clearTimeout(overlayTimer.current)
        overlayTimer.current = setTimeout(() => setShowOverlay(false), 2000)
        setLoading(false)
      })
    } catch (error: any) {
      sfx.error()
      setDrawing(false)
      setRevealed(0)
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error),
      })
      setLoading(false)
    }
  }

  const goBack = () => {
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  const ticketSlots = Array.from({ length: MAX_PICKS }, (_, i) => numbersSelected[i])
  const matchSet = new Set(result.matchedNumbers)
  const busy = loading || drawing

  return (
    <LinearGradient colors={['#0b2a3a', '#061c26']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 18, padding: 12 }}
      >
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#fff" />
            </TouchableOpacity>
            <View style={styles.logoCircle}>
              <Text>🎱</Text>
            </View>
            <Text style={styles.title}>Lottery draw</Text>
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
          stakeEditable={!busy}
        />

        <View style={styles.ticket}>
          <View style={styles.ticketHead}>
            <Text style={styles.ticketLabel}>
              {numbersSelected.length}/{MAX_PICKS} on your ticket
            </Text>
            <View style={styles.ticketActions}>
              <TouchableOpacity onPress={quickPick} disabled={busy}>
                <Text style={styles.actionText}>Quick pick</Text>
              </TouchableOpacity>
              {numbersSelected.length > 0 ? (
                <TouchableOpacity onPress={clearPicks} disabled={busy}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          <View style={styles.ticketRow}>
            {ticketSlots.map((n, i) =>
              n ? (
                <LotteryBall key={`t-${n}`} n={n} size={44} tone={matchSet.has(n) ? 'hit' : 'picked'} />
              ) : (
                <View key={`empty-${i}`} style={styles.ticketEmpty} />
              ),
            )}
          </View>
        </View>

        <View style={styles.machineWrap}>
          <LotteryMachine
            drawing={drawing}
            drawn={result.drewNumbers}
            matched={result.matchedNumbers}
            revealed={revealed}
            bingoNumber={result.bingoNumber}
            reduceMotion={reduceMotion}
          />
          <RoundResultOverlay
            visible={showOverlay}
            isWin={result.isWin}
            title={result.isWin ? 'You hit the draw' : 'No payout this draw'}
            detail={
              result.isWin
                ? `+${displayCurrency(Number(result.payout || 0))}`
                : result.matchedNumbers.length
                  ? `${result.matchedNumbers.length} hit${result.matchedNumbers.length === 1 ? '' : 's'}`
                  : 'No numbers matched'
            }
            reduceMotion={reduceMotion}
          />
        </View>

        <View style={styles.gridBox}>
          <View style={styles.grid}>
            {ALL_NUMBERS.map((num) => {
              const picked = numbersSelected.includes(num)
              const lockedOut = !picked && numbersSelected.length >= MAX_PICKS
              const hit = matchSet.has(num)
              return (
                <TouchableOpacity
                  key={num}
                  onPress={() => addNumber(num)}
                  disabled={busy}
                  activeOpacity={0.85}
                  style={lockedOut ? styles.locked : undefined}
                >
                  <LotteryBall
                    n={num}
                    size={46}
                    tone={hit && picked ? 'hit' : picked ? 'picked' : 'idle'}
                  />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.resultBox}>
          {busy ? (
            <Text style={styles.betText}>Drawing from the hopper…</Text>
          ) : result.message ? (
            <Text style={styles.betText}>
              {result.isWin ? 'Win' : 'Loss'}
              {result.matchedNumbers.length ? ` · ${result.matchedNumbers.length} hit` : ' · no hits'}
            </Text>
          ) : (
            <Text style={styles.betText}>Five numbers. One draw.</Text>
          )}
          <Text style={styles.multiHint}>{result.multiplier}</Text>
        </View>

        <TouchableOpacity disabled={busy} style={[styles.playBtn, busy && styles.playBtnBusy]} onPress={handlePlay}>
          {busy ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ActivityIndicator color="#0b1d26" />
              <Text style={styles.playText}>DRAWING…</Text>
            </View>
          ) : (
            <Text style={styles.playText}>DRAW</Text>
          )}
        </TouchableOpacity>

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Draw to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Lottery draw works"
        steps={LOTTERY_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default LotteryScreen

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
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1b4a5f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#dbe7ee',
    fontSize: 20,
    fontWeight: '700',
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#e6d59b',
    fontSize: 18,
    fontWeight: '800',
  },
  ticket: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.28)',
    gap: 12,
  },
  ticketHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  ticketLabel: {
    color: '#e6e1c5',
    fontWeight: '700',
    fontSize: 14,
    flex: 1,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionText: {
    color: '#caa85e',
    fontWeight: '700',
  },
  clearText: {
    color: '#e06969',
    fontWeight: '700',
  },
  ticketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ticketEmpty: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(159,183,169,0.4)',
  },
  machineWrap: {
    position: 'relative',
  },
  gridBox: {
    backgroundColor: '#123544',
    borderRadius: 28,
    padding: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  locked: {
    opacity: 0.32,
  },
  resultBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2f5668',
    padding: 16,
  },
  betText: {
    color: '#c7d6df',
    fontSize: 15,
    flex: 1,
    paddingRight: 8,
  },
  multiHint: {
    color: '#e6d59b',
    fontWeight: '700',
  },
  playBtn: {
    backgroundColor: '#e3a843',
    padding: 20,
    borderRadius: 40,
    alignItems: 'center',
  },
  playBtnBusy: {
    opacity: 0.7,
  },
  playText: {
    color: '#0b1d26',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
})
