import { View, Text, TouchableOpacity, StyleSheet, ScrollView, AccessibilityInfo, ActivityIndicator } from 'react-native'
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
import GameHistoryStrip from '@/components/virtuals/GameHistoryStrip'
import GameStatsRow from '@/components/virtuals/GameStatsRow'
import CasinoWheel, { WHEEL_SEGMENTS } from '@/components/virtuals/CasinoWheel'
import ConfettiBurst from '@/components/virtuals/ConfettiBurst'

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(500, 'Maximum stake is 500'),
})

const RULES_KEY = 'plusergame.rules.spin.v1'

const SPIN_RULES = [
  'The peg at the top is the payline. Where it stops is the house result.',
  'Your stake is taken when the wheel leaves rest. Stake ₦50–₦500.',
  'MISS pays nothing. 2x through 10x pays that multiple into your wallet.',
  'The spin is real — the slice under the peg when it stops is what you get.',
]

function sliceIndexFor(spine: number) {
  const byValue = WHEEL_SEGMENTS.findIndex((s) => s.spin_value === Number(spine))
  if (byValue >= 0) return byValue
  const asIndex = Math.round(Number(spine))
  if (asIndex >= 0 && asIndex < WHEEL_SEGMENTS.length) return asIndex
  return 0
}

const SpinWheelScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [spinning, setSpinning] = useState(false)
  const [multiplier, setMultiplier] = useState('2x')
  const [history, setHistory] = useState<boolean[]>([])
  const [payout, setPayout] = useState(0)
  const [isWin, setIsWin] = useState(false)
  const [message, setMessage] = useState('')
  const [fetchWallet, setFetchWallet] = useState(false)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const mounted = useRef(true)
  const resultRef = useRef<{ multiplier: string; payout: number; is_win: boolean } | null>(null)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => {
      mounted.current = false
      sub?.remove?.()
    }
  }, [])

  useEffect(() => {
    AsyncStorage.getItem(RULES_KEY)
      .then((seen) => {
        if (!seen) setRulesOpen(true)
      })
      .catch(() => {})
  }, [])

  const finish = () => {
    const result = resultRef.current
    if (!mounted.current || !result) return
    setHistory((prev) => [result.is_win, ...prev].slice(0, 12))
    setMultiplier(result.multiplier)
    setPayout(result.payout || 0)
    setIsWin(result.is_win)
    setMessage(result.is_win ? 'Hit' : 'Miss')
    if (result.is_win) {
      sfx.win()
      triggerHaptic('win')
    } else {
      sfx.lose()
      triggerHaptic('lose')
    }
    setSpinning(false)
  }

  const spinWheel = async () => {
    if (spinning) return
    const parsed = schema.safeParse({ stake })
    if (!parsed.success) {
      return Toast.show({ type: 'info', text1: parsed.error.issues[0].message })
    }

    if (!hasEnoughBalance(Number(stake))) return

    sfx.flip()
    triggerHaptic('roll')
    resultRef.current = null
    setTargetIndex(null)
    setSpinning(true)
    setIsWin(false)
    setMessage('')

    try {
      const res = await axiosClient.post('/virtual/spin', { stake: Number(stake) })
      const game = res.data?.game
      if (!game) {
        throw new Error(res.data?.message || 'The wheel did not come back. Try again.')
      }

      const { spine_number, multiplier: mult, payout: pay, is_win } = game
      resultRef.current = { multiplier: mult, payout: pay || 0, is_win: Boolean(is_win) }
      setTargetIndex(sliceIndexFor(spine_number))
      setFetchWallet(true)
    } catch (error: unknown) {
      sfx.error()
      setSpinning(false)
      setTargetIndex(null)
      Toast.show({ type: 'error', text1: getApiErrorMessage(error) })
    }
  }

  const goBack = () => {
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  return (
    <LinearGradient colors={['#1a0a08', '#0c1520']} style={styles.container}>
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
              <Text>🎡</Text>
            </View>
            <Text style={styles.title}>Spin wheel</Text>
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
          onStakeChange={(text) => {
            if (/^\d*$/.test(text)) setStake(text)
          }}
          payout={payout ? displayCurrency(Number(payout)) : '—'}
          multiplier={multiplier}
          stakeEditable={!spinning}
        />

        <View style={styles.wheelStage}>
          {isWin && !spinning ? <ConfettiBurst burst={11} reduceMotion={reduceMotion} /> : null}
          <CasinoWheel
            spinning={spinning}
            targetIndex={targetIndex}
            reduceMotion={reduceMotion}
            onSettled={finish}
          />
        </View>

        <View style={[styles.resultChip, isWin ? styles.resultWin : message ? styles.resultLose : styles.resultIdle]}>
          <Text style={styles.resultText}>
            {spinning
              ? 'The wheel is live…'
              : message
                ? isWin
                  ? `Pays ${multiplier}  ·  +${displayCurrency(Number(payout || 0))}`
                  : 'MISS · stake is gone'
                : 'Red pointer at the top is the payline'}
          </Text>
        </View>

        <TouchableOpacity onPress={spinWheel} disabled={spinning} activeOpacity={0.9}>
          <LinearGradient
            colors={spinning ? ['#8a2438', '#5a1420'] : ['#ff5a6e', '#c41e3a', '#8a1020']}
            style={[styles.spinBtn, spinning && styles.spinBusy]}
          >
            {spinning ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <ActivityIndicator color="#fff8e1" />
                <Text style={styles.spinBtnText}>SPINNING</Text>
              </View>
            ) : (
              <Text style={styles.spinBtnText}>SPIN</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Spin to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Spin wheel works"
        steps={SPIN_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default SpinWheelScreen

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
    borderColor: 'rgba(246,217,138,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#f6d98a',
    fontSize: 18,
    fontWeight: '800',
  },
  wheelStage: {
    position: 'relative',
    alignItems: 'center',
  },
  resultChip: {
    alignSelf: 'center',
    minWidth: 220,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  resultIdle: {
    backgroundColor: 'rgba(20,8,10,0.55)',
    borderColor: 'rgba(246,217,138,0.35)',
  },
  resultWin: {
    backgroundColor: 'rgba(16,70,48,0.85)',
    borderColor: '#e8c547',
  },
  resultLose: {
    backgroundColor: 'rgba(80,16,28,0.85)',
    borderColor: 'rgba(246,217,138,0.4)',
  },
  resultText: {
    color: '#fff4d0',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  spinBtn: {
    alignSelf: 'center',
    minWidth: 220,
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f6d98a',
  },
  spinBusy: {
    opacity: 0.9,
  },
  spinBtnText: {
    color: '#fff8e1',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
})
