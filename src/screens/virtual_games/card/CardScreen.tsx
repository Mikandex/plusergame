import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  AccessibilityInfo,
} from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Entypo, Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { hasEnoughBalance } from '@/utils/stakeGuard'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated'
import { z } from 'zod'
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import GameBalancePill from '@/components/virtuals/GameBalancePill'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'
import { images } from '@/constants'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import displayCurrency from '@/utils/displayCurrency'
import AsyncStorage from '@react-native-async-storage/async-storage'
import GameRulesSheet from '@/components/virtuals/GameRulesSheet'
import RoundResultOverlay from '@/components/virtuals/RoundResultOverlay'
import GameHistoryStrip from '@/components/virtuals/GameHistoryStrip'
import GameStatsRow from '@/components/virtuals/GameStatsRow'

type GameInfo = {
  nextCard: string | number
  correct: boolean
  multiplier: string
  payout: number
  message: string
}

const RULES_KEY = 'plusergame.rules.card.v1'
const SUITS = ['♠', '♥', '♦', '♣'] as const

const CARD_RULES = [
  'Your stake is taken when you tap Higher or Lower.',
  'The next card is compared to the one on the table — higher or lower, not a flip of this card.',
  'Aces count as high. If the ranks tie, the round follows the server result.',
  'After the reveal, tap Next for a new table card.',
]

const schema = z.object({
  stake: z.coerce.number().min(50, 'Minimum stake is 50').max(1000, 'Maximum stake is 1000'),
})

const getSuitData = (input: string) => {
  const suit = input.toLowerCase()
  switch (suit) {
    case 'spades':
    case '♠':
      return { symbol: '♠', color: '#1f2f38' }
    case 'hearts':
    case '♥':
      return { symbol: '♥', color: '#c03939' }
    case 'diamonds':
    case '♦':
      return { symbol: '♦', color: '#c03939' }
    case 'clubs':
    case '♣':
      return { symbol: '♣', color: '#1f2f38' }
    default:
      return { symbol: input, color: '#1f2f38' }
  }
}

const parseCard = (raw: string | number, fallbackSuit: string) => {
  const text = String(raw ?? '').trim()
  const suitMatch = text.match(/spades?|hearts?|diamonds?|clubs?|[♠♥♦♣]/i)
  const suit = suitMatch ? getSuitData(suitMatch[0]).symbol : fallbackSuit
  const rank = text
    .replace(/of\s+/i, ' ')
    .replace(/spades?|hearts?|diamonds?|clubs?|[♠♥♦♣]/gi, '')
    .trim() || text || '?'
  return { rank, suit }
}

const CardScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState('50')
  const [card, setCard] = useState<string | number>('—')
  const [cardSuit, setCardSuit] = useState('♠')
  const [sessionSuit, setSessionSuit] = useState('♠')
  const [loading, setLoading] = useState(false)
  const [loadingDefaultCard, setLoadingDefaultCard] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfo>({
    nextCard: '',
    correct: false,
    multiplier: '2x',
    payout: 0,
    message: '',
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [roundOver, setRoundOver] = useState(false)
  const [canAdvance, setCanAdvance] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const [fetchWallet, setFetchWallet] = useState(false)

  const pendingFace = useRef<{ rank: string | number; suit: string } | null>(null)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)
  const rotateY = useSharedValue(0)

  const applyPendingFace = () => {
    if (!pendingFace.current) return
    setCard(pendingFace.current.rank)
    setCardSuit(pendingFace.current.suit)
  }

  const flipToPending = (onDone?: () => void) => {
    if (reduceMotion) {
      applyPendingFace()
      onDone?.()
      return
    }

    rotateY.value = withTiming(90, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (!finished) return
      runOnJS(applyPendingFace)()
      rotateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.cubic) }, (done) => {
        if (done && onDone) runOnJS(onDone)()
      })
    })

    scale.value = withSpring(1.05, { damping: 12, stiffness: 160 }, () => {
      scale.value = withSpring(1)
    })
    translateY.value = withSpring(-8, { damping: 12, stiffness: 160 }, () => {
      translateY.value = withSpring(0)
    })
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }))

  const closeRules = useCallback(async () => {
    setRulesOpen(false)
    await AsyncStorage.setItem(RULES_KEY, '1')
  }, [])

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion)
    return () => sub?.remove?.()
  }, [])

  useEffect(() => {
    AsyncStorage.getItem(RULES_KEY)
      .then((seen) => {
        if (!seen) setRulesOpen(true)
      })
      .catch(() => {})
  }, [])

  const getDefaultCard = async (withFlip = false) => {
    try {
      setLoadingDefaultCard(true)
      const startRes = await axiosClient.get('/virtual/start-card')
      const section_id = startRes.data.game.session_id
      const current_card = startRes.data.game.current_card
      const nextSuit = SUITS[Math.floor(Math.random() * SUITS.length)]
      const parsed = parseCard(current_card || 'A', nextSuit)

      setSessionId(section_id)
      setSessionSuit(parsed.suit)
      pendingFace.current = parsed

      if (withFlip) {
        sfx.flip()
        flipToPending(() => setLoadingDefaultCard(false))
      } else {
        applyPendingFace()
        sfx.next()
        setLoadingDefaultCard(false)
      }
    } catch (error: unknown) {
      setLoadingDefaultCard(false)
      Toast.show({ type: 'error', text1: getApiErrorMessage(error) })
    }
  }

  useEffect(() => {
    void getDefaultCard(false)
    return () => {
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const revealOutcome = (correct: boolean) => {
    setShowOverlay(true)
    if (correct) sfx.win()
    else sfx.lose()
    if (overlayTimer.current) clearTimeout(overlayTimer.current)
    overlayTimer.current = setTimeout(() => setShowOverlay(false), 1800)
  }

  const handleNext = () => {
    if (loading || loadingDefaultCard) return
    setRoundOver(false)
    setCanAdvance(false)
    setShowOverlay(false)
    setGameInfo((prev) => ({ ...prev, message: '', payout: 0 }))
    void getDefaultCard(true)
  }

  const handleGuess = async (guess: 'higher' | 'lower') => {
    if (loading || !sessionId || roundOver) return

    const result = schema.safeParse({ stake })
    if (!result.success) {
      return Toast.show({
        type: 'info',
        text1: result.error.issues[0].message,
        text2: 'Please check your input',
      })
    }

    if (!hasEnoughBalance(Number(stake))) return

    try {
      setLoading(true)
      sfx.flip()

      const res = await axiosClient.post('/virtual/pick-card', {
        guess,
        stake: Number(stake),
        session_id: sessionId,
      })

      const correct = Boolean(res.data.game.correct)
      const nextCard = res.data.game.next_card
      const parsed = parseCard(nextCard, sessionSuit)
      pendingFace.current = parsed

      setGameInfo({
        nextCard,
        correct,
        multiplier: res.data.game.multiplier,
        payout: res.data.game.payout,
        message: res.data.message,
      })
      setHistory((prev) => [correct, ...prev].slice(0, 12))
      setRoundOver(true)
      setFetchWallet(true)

      flipToPending(() => {
        setCanAdvance(true)
        revealOutcome(correct)
      })
    } catch (error: any) {
      sfx.error()
      if (error.response?.status === 400 && error.response?.data?.message === 'Session expired or invalid') {
        void getDefaultCard(false)
        setHistory([])
        setGameInfo({
          nextCard: '',
          correct: false,
          multiplier: '2x',
          payout: 0,
          message: '',
        })
        setRoundOver(false)
        setCanAdvance(false)
        Toast.show({
          type: 'error',
          text1: 'Session expired. Starting a new game.',
        })
      } else {
        Toast.show({
          type: 'error',
          text1: getApiErrorMessage(error),
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const suitColor = getSuitData(cardSuit).color
  const guessLocked = loading || loadingDefaultCard || roundOver || !sessionId
  const nextEnabled = canAdvance && roundOver && !loading && !loadingDefaultCard

  const goBack = () => {
    if (fetchWallet) {
      getWallet(false)
      getUnreadNotifications()
    }
    router.back()
  }

  return (
    <LinearGradient colors={['#0f3b2e', '#06281f']} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'space-between',
          gap: 20,
          padding: 12,
        }}
      >
        <View style={{ marginTop: top, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <TouchableOpacity onPress={goBack} accessibilityLabel="Back">
            <Feather name="chevron-left" size={34} color="#e6e1c5" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image source={images.jackOfSpades} style={{ width: 24, height: 24 }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.title}>Higher</Text>
              <Entypo name="arrow-long-up" size={18} color="#e6e1c5" />
              <Entypo name="arrow-long-down" size={18} color="#e6e1c5" />
              <Text style={styles.title}>Lower</Text>
            </View>
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
          payout={gameInfo.payout ? displayCurrency(Number(gameInfo.payout)) : '—'}
          multiplier={gameInfo.multiplier || '—'}
          stakeEditable={!roundOver && !loading}
        />

        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 200, height: 240 }}>
            <Animated.View style={[styles.card, animatedStyle]}>
              {loadingDefaultCard && !sessionId ? (
                <ActivityIndicator size="large" color={suitColor} />
              ) : !sessionId ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                  <Text style={{ color: '#000', textAlign: 'center' }}>No session. Please restart the game.</Text>
                  <TouchableOpacity onPress={() => void getDefaultCard(false)} style={{ backgroundColor: '#caa85e', padding: 12, borderRadius: 12 }}>
                    <Text style={{ color: '#000', fontSize: 14 }}>Restart Game</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={[styles.cardNumber, { color: suitColor }]}>{card}</Text>
                  <Text style={[styles.cardSuit, { color: suitColor }]}>{cardSuit}</Text>
                </>
              )}
            </Animated.View>
            <RoundResultOverlay
              visible={showOverlay}
              isWin={gameInfo.correct}
              title={gameInfo.correct ? 'Nice read' : 'Not this time'}
              detail={
                gameInfo.correct
                  ? `+${displayCurrency(Number(gameInfo.payout || 0))}`
                  : `It was ${gameInfo.nextCard}`
              }
              reduceMotion={reduceMotion}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.greenBtn, guessLocked && styles.btnFinished]}
            disabled={guessLocked}
            onPress={() => void handleGuess('higher')}
          >
            <Text style={styles.btnText}>
              <Entypo name="arrow-long-up" size={18} color="#e6e1c5" /> Higher
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.orangeBtn, guessLocked && styles.btnFinished]}
            disabled={guessLocked}
            onPress={() => void handleGuess('lower')}
          >
            <Text style={styles.btnText}>
              <Entypo name="arrow-long-down" size={18} color="#e6e1c5" /> Lower
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBox}>
          <View style={{ flex: 1 }}>
            {!gameInfo.message ? (
              <Text style={styles.prompt}>Will the next card be higher or lower?</Text>
            ) : (
              <Text style={styles.prompt}>
                {roundOver ? 'Round over — tap Next for a new table card.' : gameInfo.message}
              </Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, !nextEnabled && styles.nextBtnIdle]}
            disabled={!nextEnabled}
            onPress={handleNext}
          >
            {loadingDefaultCard && roundOver ? (
              <ActivityIndicator color="#0f3b2e" />
            ) : (
              <Text style={[styles.nextText, !nextEnabled && styles.nextTextIdle]}>
                Next <Entypo name="arrow-long-right" size={16} color={nextEnabled ? '#0f3b2e' : '#7f8b82'} />
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Make your first guess" />
        </View>
      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Higher or Lower works"
        steps={CARD_RULES}
        onClose={() => void closeRules()}
      />
    </LinearGradient>
  )
}

export default CardScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d4af37',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#e6e1c5',
    fontSize: 20,
    fontWeight: '600',
  },
  helpBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#caa85e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    color: '#e6e1c5',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    width: 200,
    height: 240,
    backgroundColor: '#e9e5dc',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cardNumber: {
    fontSize: 90,
    fontWeight: 'bold',
  },
  cardSuit: {
    fontSize: 50,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  greenBtn: {
    flex: 1,
    backgroundColor: '#2f8f4e',
    padding: 20,
    borderRadius: 40,
    marginRight: 10,
    alignItems: 'center',
  },
  orangeBtn: {
    flex: 1,
    backgroundColor: '#c45a33',
    padding: 20,
    borderRadius: 40,
    marginLeft: 10,
    alignItems: 'center',
  },
  btnFinished: {
    opacity: 0.38,
  },
  btnText: {
    color: '#fff',
    fontSize: 18,
  },
  bottomBox: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#caa85e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  prompt: {
    color: '#e6e1c5',
    fontSize: 16,
    lineHeight: 22,
  },
  nextBtn: {
    backgroundColor: '#caa85e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  nextBtnIdle: {
    backgroundColor: 'rgba(202,168,94,0.22)',
  },
  nextText: {
    color: '#0f3b2e',
    fontSize: 18,
    fontWeight: '600',
  },
  nextTextIdle: {
    color: '#7f8b82',
  },
})
