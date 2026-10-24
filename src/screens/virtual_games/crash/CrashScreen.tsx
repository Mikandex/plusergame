import { View, Text, TouchableOpacity, StyleSheet, ScrollView, AccessibilityInfo, TextInput } from 'react-native'
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
import GameStatsRow from '@/components/virtuals/GameStatsRow'
import CrashChart, { CRASH_RATE, type CrashPhase } from '@/components/virtuals/CrashChart'

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
  target: z.coerce.number().min(1.01, 'Cash-out must be at least 1.01x').max(1000, 'Cash-out can be at most 1000x'),
})

const RULES_KEY = 'plusergame.rules.crash.v1'
const MAX_FLIGHT_MS = 9000
const TARGET_CHIPS = [1.5, 2, 3, 5, 10, 50]

const CRASH_RULES = [
  'Pick your cash-out point before launch, for example 2.00x.',
  'Tap Launch. Your stake is taken and the rocket starts climbing.',
  'If the rocket passes your cash-out point, you win stake × that point, even if it crashes later.',
  'If it crashes first, the round is lost. Higher cash-outs pay more but hit less often.',
  'Stake ₦50–₦1,000. Cash-out 1.01x–1000x.',
]

type Round = {
  crashAt: number
  target: number
  isWin: boolean
  payout: number
}

const CrashScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [targetText, setTargetText] = useState('2.00')
  const [phase, setPhase] = useState<CrashPhase>('idle')
  const [multiplier, setMultiplier] = useState(1)
  const [elapsed, setElapsed] = useState(0)
  const [cashedAt, setCashedAt] = useState<number | null>(null)
  const [round, setRound] = useState<Round | null>(null)
  const [recent, setRecent] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchWallet, setFetchWallet] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const raf = useRef<number | null>(null)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const target = Number(targetText) || 0
  const winChance = target >= 1.01 ? Math.min(99, 97 / target) : 0
  const flying = phase === 'flying' || (phase === 'cashed' && loading)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => {
      sub?.remove?.()
      if (raf.current) cancelAnimationFrame(raf.current)
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

  const finish = (result: Round) => {
    setMultiplier(result.crashAt)
    setElapsed(Math.log(Math.max(1, result.crashAt)) / CRASH_RATE)
    setPhase('crashed')
    setRecent((prev) => [result.crashAt, ...prev].slice(0, 14))
    if (result.isWin) {
      setCashedAt(result.target)
    } else {
      sfx.lose()
      triggerHaptic('lose')
    }
    setShowOverlay(true)
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    overlayTimer.current = setTimeout(() => setShowOverlay(false), 2400)
    setLoading(false)
  }

  // Plays the flight up to the crash point the server already settled.
  const fly = (result: Round) => {
    const naturalSec = Math.log(Math.max(1, result.crashAt)) / CRASH_RATE
    const speed = Math.max(1, (naturalSec * 1000) / MAX_FLIGHT_MS)
    const startedAt = Date.now()
    let paid = false
    setPhase('flying')

    const step = () => {
      const t = Math.min(naturalSec, ((Date.now() - startedAt) / 1000) * speed)
      const m = Math.exp(CRASH_RATE * t)
      setElapsed(t)
      setMultiplier(Math.floor(m * 100) / 100)

      if (!paid && result.isWin && m >= result.target) {
        paid = true
        setCashedAt(result.target)
        setPhase('cashed')
        sfx.win()
        triggerHaptic('win')
      }

      if (t >= naturalSec) {
        raf.current = null
        finish(result)
        return
      }
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
  }

  const launch = async () => {
    if (loading) return
    const parsed = schema.safeParse({ stake, target: targetText })
    if (!parsed.success) {
      return Toast.show({ type: 'info', text1: parsed.error.issues[0].message })
    }

    if (!hasEnoughBalance(Number(stake))) return

    try {
      setLoading(true)
      setShowOverlay(false)
      setCashedAt(null)
      setRound(null)
      setMultiplier(1)
      setElapsed(0)
      sfx.flip()
      triggerHaptic('roll')

      const res = await axiosClient.post('/virtual/crash', {
        stake: Number(stake),
        target: Math.round(parsed.data.target * 100) / 100,
      })
      const game = res.data?.game
      if (!game) {
        throw new Error(res.data?.message || 'The rocket did not launch. Try again.')
      }

      const result: Round = {
        crashAt: Number(game.crash_at) || 1,
        target: Number(game.target) || parsed.data.target,
        isWin: Boolean(game.is_win),
        payout: Number(game.payout) || 0,
      }
      setRound(result)
      setFetchWallet(true)

      if (reduceMotion) {
        if (result.isWin) sfx.win()
        finish(result)
      } else {
        fly(result)
      }
    } catch (error: unknown) {
      sfx.error()
      setPhase('idle')
      setLoading(false)
      Toast.show({ type: 'error', text1: getApiErrorMessage(error) })
    }
  }

  const nudgeTarget = (delta: number) => {
    sfx.next()
    const next = Math.min(1000, Math.max(1.01, Math.round(((target || 1) + delta) * 100) / 100))
    setTargetText(next.toFixed(2))
  }

  const goBack = () => {
    if (raf.current) cancelAnimationFrame(raf.current)
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  const potential = Number(stake) > 0 && target >= 1.01 ? displayCurrency(Math.floor(Number(stake) * target * 100) / 100) : '—'

  return (
    <LinearGradient colors={['#101b33', '#070d1c']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, gap: 14, padding: 12 }}
      >
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#f5d27a" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <Text style={{ fontSize: 22 }}>🚀</Text>
            </View>
            <Text style={styles.title}>Crash</Text>
          </View>
          <TouchableOpacity onPress={() => setRulesOpen(true)} style={styles.helpBtn} accessibilityLabel="How to play">
            <Text style={styles.helpText}>?</Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <GameBalancePill />
        </View>

        <View style={styles.recentRow}>
          {recent.length === 0 ? (
            <Text style={styles.recentEmpty}>Recent crashes show here</Text>
          ) : (
            recent.map((m, i) => (
              <View key={`${m}-${i}`} style={[styles.recentPill, m >= 2 ? styles.recentHigh : styles.recentLow]}>
                <Text style={[styles.recentText, { color: m >= 2 ? '#3fe08a' : '#ff8a7a' }]}>{m.toFixed(2)}x</Text>
              </View>
            ))
          )}
        </View>

        <CrashChart multiplier={multiplier} elapsed={elapsed} target={target >= 1.01 ? target : 2} phase={phase} cashedAt={cashedAt} />

        <View style={{ height: showOverlay ? 96 : 0, position: 'relative' }}>
          <RoundResultOverlay
            visible={showOverlay}
            isWin={Boolean(round?.isWin)}
            title={round?.isWin ? `Cashed out at ${round.target.toFixed(2)}x` : `Crashed at ${round?.crashAt.toFixed(2) ?? '1.00'}x`}
            detail={round?.isWin ? `+${displayCurrency(round.payout)}` : `Your cash-out was ${round?.target.toFixed(2) ?? ''}x`}
            reduceMotion={reduceMotion}
          />
        </View>

        <GameStatsRow
          stake={stake}
          onStakeChange={setStake}
          payout={round?.isWin && phase === 'crashed' ? displayCurrency(round.payout) : potential}
          multiplier={`${target >= 1.01 ? target.toFixed(2) : '—'}x`}
          stakeEditable={!flying && !loading}
        />

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelLabel}>AUTO CASH-OUT</Text>
            <Text style={styles.chance}>Win chance {winChance ? `${winChance.toFixed(winChance < 10 ? 2 : 1)}%` : '—'}</Text>
          </View>
          <View style={styles.targetRow}>
            <TouchableOpacity style={styles.stepBtn} disabled={loading} onPress={() => nudgeTarget(target > 10 ? -1 : -0.1)}>
              <Feather name="minus" size={20} color="#f5d27a" />
            </TouchableOpacity>
            <View style={styles.targetBox}>
              <TextInput
                value={targetText}
                onChangeText={(v) => setTargetText(v.replace(/[^0-9.]/g, ''))}
                onBlur={() => target >= 1.01 && setTargetText(Math.min(1000, target).toFixed(2))}
                editable={!loading}
                keyboardType="decimal-pad"
                style={styles.targetInput}
                maxLength={7}
              />
              <Text style={styles.targetX}>x</Text>
            </View>
            <TouchableOpacity style={styles.stepBtn} disabled={loading} onPress={() => nudgeTarget(target >= 10 ? 1 : 0.1)}>
              <Feather name="plus" size={20} color="#f5d27a" />
            </TouchableOpacity>
          </View>
          <View style={styles.chips}>
            {TARGET_CHIPS.map((chip) => {
              const active = Math.abs(target - chip) < 0.001
              return (
                <TouchableOpacity
                  key={chip}
                  disabled={loading}
                  onPress={() => {
                    sfx.next()
                    setTargetText(chip.toFixed(2))
                  }}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{chip}x</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.playBtn, loading && styles.playBtnBusy]}
          disabled={loading}
          onPress={launch}
          accessibilityLabel="Launch"
        >
          <Text style={styles.playText}>{loading ? (phase === 'cashed' ? 'CASHED OUT ✓' : 'IN FLIGHT…') : 'LAUNCH'}</Text>
          {!loading ? <Text style={styles.playSub}>Win {potential}</Text> : null}
        </TouchableOpacity>

        <View style={{ height: bottom }} />
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Crash works"
        steps={CRASH_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default CrashScreen

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
    backgroundColor: '#1b2a4a',
    justifyContent: 'center',
    alignItems: 'center',
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
  recentRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 6,
    overflow: 'hidden',
    minHeight: 26,
    alignItems: 'center',
  },
  recentEmpty: {
    color: 'rgba(199,214,223,0.55)',
    fontSize: 12,
  },
  recentPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  recentHigh: {
    backgroundColor: 'rgba(63,224,138,0.1)',
    borderColor: 'rgba(63,224,138,0.35)',
  },
  recentLow: {
    backgroundColor: 'rgba(255,77,61,0.1)',
    borderColor: 'rgba(255,77,61,0.35)',
  },
  recentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  panel: {
    backgroundColor: '#13213b',
    borderRadius: 18,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.18)',
  },
  panelHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panelLabel: {
    color: '#9fb3c8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  chance: {
    color: '#c7d6df',
    fontSize: 12,
    fontWeight: '600',
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#1b2a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBox: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#0a1626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetInput: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 80,
    padding: 0,
  },
  targetX: {
    color: '#9fb3c8',
    fontSize: 18,
    fontWeight: '800',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#1b2a4a',
  },
  chipActive: {
    backgroundColor: '#f5d27a',
  },
  chipText: {
    color: '#dce7f5',
    fontSize: 13,
    fontWeight: '800',
  },
  chipTextActive: {
    color: '#101b33',
  },
  playBtn: {
    alignSelf: 'stretch',
    backgroundColor: '#3fe08a',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  playBtnBusy: {
    backgroundColor: '#2a6b4c',
  },
  playText: {
    color: '#07140d',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  playSub: {
    color: '#0b3a22',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
})
