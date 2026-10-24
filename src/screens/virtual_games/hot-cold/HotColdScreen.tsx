import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, AccessibilityInfo } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { z } from 'zod'
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
import LotteryBall from '@/components/virtuals/LotteryBall'
import HotColdMeter, { heatOf } from '@/components/virtuals/HotColdMeter'

const ranges = [
  { label: '1-10', max: 10, pot: 'pot1', pay: '10x' },
  { label: '1-20', max: 20, pot: 'pot2', pay: '20x' },
  { label: '1-30', max: 30, pot: 'pot3', pay: '30x' },
]

const RULES_KEY = 'plusergame.rules.hotcold.v1'
const REVEAL_MS = 900

const HOTCOLD_RULES = [
  'Pick a range, then one number in that range. Your stake is taken when you reveal.',
  'The AI draws one number from the same range. Only an exact match pays.',
  'After the reveal, hot means you were close and cold means you were far. Close does not pay.',
  'Wider range, bigger multiplier: 1–10 pays 10x, 1–20 pays 20x, 1–30 pays 30x. Stake ₦50–₦1,000.',
]

type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  house: number
  guess: number
}

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
  pick: z.number().min(1, 'Pick a number first'),
})

const HotColdScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [loading, setLoading] = useState(false)
  const [fetchWallet, setFetchWallet] = useState(false)
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: '',
    payout: 0,
    multiplier: '10x',
    house: 0,
    guess: 0,
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [selectedRange, setSelectedRange] = useState(ranges[0])
  const [selectedNumber, setSelectedNumber] = useState(0)
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const numbers = Array.from({ length: selectedRange.max }, (_, i) => i + 1)

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

  const handleGuess = async () => {
    if (loading) return

    const parsed = schema.safeParse({ stake, pick: selectedNumber })
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
      setResult((prev) => ({ ...prev, message: '' }))
      sfx.flip()
      triggerHaptic('roll')

      const started = Date.now()
      const res = await axiosClient.post('/virtual/guess', {
        game_type: selectedRange.pot,
        pick: selectedNumber,
        stake: Number(stake),
      })

      const data = res.data
      const game = data?.game
      if (!game) {
        throw new Error(data?.message || 'The AI number did not come back. Try again.')
      }

      const wait = reduceMotion ? 0 : Math.max(0, REVEAL_MS - (Date.now() - started))
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait))

      const correct = Boolean(game.is_win)
      const house = Number(game.system_number)
      const guess = Number(game.user_picked_number || selectedNumber)

      setHistory((prev) => [correct, ...prev].slice(0, 12))
      setResult({
        isWin: correct,
        message: data.message,
        payout: game.payout || 0,
        multiplier: game.multiplier || selectedRange.pay,
        house,
        guess,
      })

      if (correct) {
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
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error),
      })
    } finally {
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

  const heat = result.house && result.guess ? heatOf(result.guess, result.house, selectedRange.max) : null
  const overlayTitle =
    heat === 'hit' ? 'Exact hit' : heat === 'hot' ? 'Hot — no pay' : heat === 'warm' ? 'Warm — no pay' : 'Cold'

  return (
    <LinearGradient colors={['#0b2a3a', '#061c26']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 16, padding: 12 }}
      >
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#e6e1c5" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <Text>🌡️</Text>
            </View>
            <Text style={styles.title}>Hot / cold</Text>
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
          multiplier={result.multiplier || selectedRange.pay}
          stakeEditable={!loading}
        />

        <Text style={styles.explain}>
          Guess the AI number. Hot is close. Only exact pays.
        </Text>

        <View style={styles.rangeRow}>
          {ranges.map((r) => {
            const active = r.label === selectedRange.label
            return (
              <TouchableOpacity
                key={r.label}
                style={[styles.rangeBtn, active && styles.activeRange]}
                disabled={loading}
                onPress={() => {
                  sfx.next()
                  setSelectedRange(r)
                  setSelectedNumber(0)
                  setShowOverlay(false)
                  setResult({
                    isWin: false,
                    message: '',
                    payout: 0,
                    multiplier: r.pay,
                    house: 0,
                    guess: 0,
                  })
                }}
              >
                <Text style={active ? styles.activeText : styles.rangeText}>{r.label}</Text>
                <Text style={styles.rangePay}>{r.pay}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.gridBox}>
          <View style={styles.grid}>
            {numbers.map((num) => {
              const picked = num === selectedNumber
              const house = result.house === num && Boolean(result.message)
              const hit = picked && house
              const tone = hit ? 'hit' : house ? 'drawn' : picked ? 'picked' : 'idle'
              return (
                <TouchableOpacity
                  key={num}
                  disabled={loading}
                  onPress={() => {
                    sfx.next()
                    setSelectedNumber(num)
                    setShowOverlay(false)
                    setResult((prev) => ({ ...prev, message: '', house: 0, guess: 0, payout: 0 }))
                  }}
                >
                  <LotteryBall n={num} size={48} tone={tone} />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {result.message && result.house && result.guess ? (
          <HotColdMeter guess={result.guess} house={result.house} max={selectedRange.max} />
        ) : null}
        <View style={{ height: showOverlay ? 96 : 0, position: 'relative' }}>
          <RoundResultOverlay
            visible={showOverlay}
            isWin={result.isWin}
            title={result.isWin ? 'Exact hit' : overlayTitle}
            detail={
              result.isWin
                ? `+${displayCurrency(Number(result.payout || 0))}`
                : `AI ${result.house}`
            }
            reduceMotion={reduceMotion}
          />
        </View>

        <View style={styles.pickBox}>
          <Text style={styles.pickText}>
            {loading
              ? 'AI is drawing…'
              : selectedNumber
                ? `Calling ${selectedNumber} in ${selectedRange.label}`
                : `Pick one number from ${selectedRange.label}`}
          </Text>
          <Text style={styles.multiHint}>{result.multiplier || selectedRange.pay}</Text>
        </View>

        <TouchableOpacity
          style={[styles.playBtn, (loading || !selectedNumber) && styles.playBusy]}
          onPress={handleGuess}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ActivityIndicator color="#0b1d26" />
              <Text style={styles.playText}>REVEALING…</Text>
            </View>
          ) : (
            <Text style={styles.playText}>REVEAL</Text>
          )}
        </TouchableOpacity>

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Guess to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Hot / cold works"
        steps={HOTCOLD_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default HotColdScreen

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
    backgroundColor: '#12394a',
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
  explain: {
    color: '#c7d6df',
    fontSize: 15,
    lineHeight: 22,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rangeBtn: {
    flex: 1,
    backgroundColor: '#173b4c',
    paddingVertical: 12,
    borderRadius: 18,
    alignItems: 'center',
  },
  activeRange: {
    borderWidth: 2,
    borderColor: '#e3a843',
  },
  rangeText: {
    color: '#c7d6df',
    fontWeight: '600',
  },
  activeText: {
    color: '#f6d98a',
    fontWeight: '800',
  },
  rangePay: {
    color: '#9fb7a9',
    fontSize: 11,
    marginTop: 2,
  },
  gridBox: {
    backgroundColor: '#173b4c',
    borderRadius: 24,
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  pickBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#2f5668',
    padding: 16,
    gap: 8,
  },
  pickText: {
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
    padding: 18,
    borderRadius: 40,
    alignItems: 'center',
  },
  playBusy: {
    opacity: 0.6,
  },
  playText: {
    color: '#0b1d26',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
})
