import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, AccessibilityInfo } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import z from 'zod'
import Toast from 'react-native-toast-message'
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
import CoinToss, { type CoinFace } from '@/components/virtuals/CoinToss'

type Bet = 'heads' | 'tails' | 'edge'
type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  systemPick: Bet | null
  userPick: Bet | null
}

const RULES_KEY = 'plusergame.rules.coin.v1'
const MIN_TOSS_MS = 1500

const COIN_RULES = [
  'Call heads, tails, or edge before the toss. Edge is the thin landing — rare, pays more.',
  'Your stake is taken when the coin leaves the felt.',
  'The house result is the face that lands toward you, including standing on the rim.',
  'Stake ₦50–₦1,000. A hit pays the multiplier shown into your wallet.',
]

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
  bet: z.enum(['heads', 'tails', 'edge'], {
    message: 'Call heads, tails, or edge first',
  }),
})

function asFace(value: unknown): CoinFace {
  if (value === 'tails' || value === 'tail') return 'tails'
  if (value === 'edge') return 'edge'
  return 'heads'
}

export default function CoinScreen() {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [bet, setBet] = useState<Bet | null>(null)
  const [loading, setLoading] = useState(false)
  const [tossing, setTossing] = useState(false)
  const [face, setFace] = useState<CoinFace>('heads')
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: '',
    payout: 0,
    multiplier: '3x',
    systemPick: null,
    userPick: null,
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [stake, setStake] = useState('50')
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [fetchWallet, setFetchWallet] = useState(false)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const headsScale = useSharedValue(1)
  const tailsScale = useSharedValue(1)
  const edgeScale = useSharedValue(1)

  const bounce = (scale: { value: number }) => {
    scale.value = 0.9
    scale.value = withSpring(1.08, { damping: 8 }, () => {
      scale.value = withSpring(1)
    })
  }

  const headsStyle = useAnimatedStyle(() => ({ transform: [{ scale: headsScale.value }] }))
  const tailsStyle = useAnimatedStyle(() => ({ transform: [{ scale: tailsScale.value }] }))
  const edgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: edgeScale.value }] }))

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

  const pickBet = (next: Bet) => {
    if (loading) return
    sfx.next()
    setBet(next)
    setShowOverlay(false)
    setResult((prev) => ({ ...prev, message: '' }))
    if (next === 'heads') bounce(headsScale)
    if (next === 'tails') bounce(tailsScale)
    if (next === 'edge') bounce(edgeScale)
  }

  const handleToss = async () => {
    if (loading) return

    const parsed = schema.safeParse({ stake, bet })
    if (!parsed.success) {
      return Toast.show({
        type: 'info',
        text1: parsed.error.issues[0].message,
      })
    }

    try {
      setLoading(true)
      setShowOverlay(false)
      setResult((prev) => ({ ...prev, message: '' }))
      if (!reduceMotion) {
        setTossing(true)
        triggerHaptic('roll')
        sfx.flip()
      }

      const started = Date.now()
      const res = await axiosClient.post('/virtual/toss', {
        pick: bet,
        stake: Number(stake),
      })

      const data = res.data
      const game = data?.game
      if (!game) {
        throw new Error(data?.message || 'The toss did not come back. Try again.')
      }

      const wait = reduceMotion ? 0 : Math.max(0, MIN_TOSS_MS - (Date.now() - started))
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait))

      const correct = Boolean(game.is_win)
      const landed = asFace(game.system_pick)
      setFace(landed)
      setTossing(false)

      if (!reduceMotion) {
        await new Promise((resolve) => setTimeout(resolve, 750))
      }

      setHistory((prev) => [correct, ...prev].slice(0, 12))
      setResult({
        isWin: correct,
        message: data.message,
        payout: game.payout || 0,
        multiplier: game.multiplier,
        systemPick: (game.system_pick as Bet) || landed,
        userPick: (game.user_pick as Bet) || bet,
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
      setTossing(false)
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error),
      })
    } finally {
      setTossing(false)
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

  const busy = loading || tossing
  const callLabel = bet ? `Calling ${bet}` : 'Call a face, then toss'

  return (
    <LinearGradient colors={['#0f3b2e', '#06281f']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', gap: 16, padding: 12 }}
      >
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
              <Feather name="chevron-left" size={30} color="#d4af37" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <Text>🪙</Text>
            </View>
            <Text style={styles.title}>Edge toss</Text>
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

        <View style={styles.stage}>
          <CoinToss face={face} tossing={tossing} reduceMotion={reduceMotion} />
        </View>
        <Text style={styles.tapText}>{busy ? 'In the air…' : 'Call a face. Then toss.'}</Text>
        <View style={{ height: showOverlay ? 96 : 0, position: 'relative' }}>
          <RoundResultOverlay
            visible={showOverlay}
            isWin={result.isWin}
            title={result.isWin ? 'You called it' : 'Wrong face'}
            detail={
              result.isWin
                ? `+${displayCurrency(Number(result.payout || 0))}`
                : `Landed ${result.systemPick || face}`
            }
            reduceMotion={reduceMotion}
          />
        </View>

        <View style={styles.actionBox}>
          <View style={styles.row}>
            <Animated.View style={[{ flex: 1 }, headsStyle]}>
              <TouchableOpacity
                style={[styles.greenBtn, bet === 'heads' && styles.callOn]}
                onPress={() => pickBet('heads')}
                disabled={busy}
              >
                <Text style={styles.btnText}>Heads</Text>
              </TouchableOpacity>
            </Animated.View>
            <Animated.View style={[{ flex: 1 }, tailsStyle]}>
              <TouchableOpacity
                style={[styles.orangeBtn, bet === 'tails' && styles.callOn]}
                onPress={() => pickBet('tails')}
                disabled={busy}
              >
                <Text style={styles.btnText}>Tails</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
          <Animated.View style={[styles.edgeWrap, edgeStyle]}>
            <TouchableOpacity
              style={[styles.edgeBtn, bet === 'edge' && styles.callOn]}
              onPress={() => pickBet('edge')}
              disabled={busy}
            >
              <Text style={styles.edgeText}>Edge — the rare land</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.betBox}>
          <Text style={styles.betText}>
            {busy ? 'Watch the rim…' : result.message ? `${result.isWin ? 'Hit' : 'Miss'} · ${result.systemPick}` : callLabel}
          </Text>
          <Text style={styles.multiHint}>{result.multiplier}</Text>
        </View>

        <View style={styles.tossWrap}>
          <TouchableOpacity style={[styles.tossBtn, busy && styles.tossBusy]} onPress={handleToss} disabled={busy}>
            {busy ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <ActivityIndicator color="#0b1d26" />
                <Text style={styles.tossText}>TOSSING…</Text>
              </View>
            ) : (
              <Text style={styles.tossText}>TOSS COIN</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Toss to start a streak" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Edge toss works"
        steps={COIN_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

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
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#e6e1c5',
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
  stage: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.35)',
  },
  tapText: {
    textAlign: 'center',
    color: '#e6d59b',
    fontSize: 13,
    fontWeight: '600',
  },
  actionBox: {
    borderWidth: 1,
    borderColor: '#caa85e',
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  greenBtn: {
    backgroundColor: '#2f8f4e',
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    opacity: 0.85,
  },
  orangeBtn: {
    backgroundColor: '#c45a33',
    paddingVertical: 16,
    borderRadius: 22,
    alignItems: 'center',
    opacity: 0.85,
  },
  callOn: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#f6e27a',
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  edgeWrap: {
    alignSelf: 'center',
    width: 168,
  },
  edgeBtn: {
    backgroundColor: '#b8a34a',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 22,
    alignItems: 'center',
  },
  edgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c2b1f',
  },
  betBox: {
    borderWidth: 1,
    borderColor: '#caa85e',
    borderRadius: 22,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  betText: {
    color: '#e6e1c5',
    fontSize: 16,
    flex: 1,
    paddingRight: 8,
  },
  multiHint: {
    color: '#e6d59b',
    fontWeight: '700',
  },
  tossWrap: {
    alignItems: 'center',
  },
  tossBtn: {
    backgroundColor: '#e3a843',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 30,
    alignItems: 'center',
    minWidth: 220,
  },
  tossBusy: {
    opacity: 0.75,
  },
  tossText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0b1d26',
    letterSpacing: 0.5,
  },
})
