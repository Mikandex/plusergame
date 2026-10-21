import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, AccessibilityInfo } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { triggerHaptic } from '@/utils/vibration'
import z from 'zod'
import { useSfx } from '@/hooks/useSfx'
import { useDiceGameAudio } from '@/hooks/useDiceGameAudio'
import getWallet from '@/utils/WalletApi'
import GameBalancePill from '@/components/virtuals/GameBalancePill'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import displayCurrency from '@/utils/displayCurrency'
import AsyncStorage from '@react-native-async-storage/async-storage'
import GameRulesSheet from '@/components/virtuals/GameRulesSheet'
import RoundResultOverlay from '@/components/virtuals/RoundResultOverlay'
import GameHistoryStrip from '@/components/virtuals/GameHistoryStrip'
import GameStatsRow from '@/components/virtuals/GameStatsRow'
import DiceTable from '@/components/virtuals/DiceTable'

const DICE_COUNT = 2
const RULES_KEY = 'plusergame.rules.dice.v1'
const MIN_ROLL_MS = 1300

const DICE_RULES = [
  'You always roll two dice. Bets are on the total (2 through 12), not a single die.',
  'Even / odd is the total. High is 7–12, low is 2–6.',
  'Specific pays more: pick the exact total before you roll.',
  'Stake ₦50–₦1,000. A win pays the multiplier shown into your wallet.',
]

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(1000, "Maximum stake is 1000"),
  bet_type: z.enum(['even', 'odd', 'highest', 'lowest', 'specific'], {
    message: "Please select a valid bet type",
  }),
  guess: z.number().min(2).max(12, "Choose a number between 2 and 12").optional(),
}).superRefine((value, ctx) => {
  if (value.bet_type === 'specific' && value.guess == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Pick a total from 2 to 12",
      path: ["guess"],
    })
  }
});

type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  diceOne: number,
  diceTwo: number,
  totalDice: number
}

const DiceScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState("50")

  const [mode, setMode] = useState<'even' | 'odd' | 'highest' | 'lowest' | 'specific'>('even')
  const [specificNumber, setSpecificNumber] = useState(2)
  const [fetchWallet, setFetchWallet] = useState(false)

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: "",
    payout: 0,
    multiplier: "2.5x",
    diceOne: 1,
    diceTwo: 1,
    totalDice: 2
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [showOverlay, setShowOverlay] = useState(false)
  const [rulesOpen, setRulesOpen] = useState(false)
  const [reduceMotion, setReduceMotion] = useState(false)
  const overlayTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [rolling, setRolling] = useState(false)

  const { playSound, stopRollSound: stopRollAudio } = useDiceGameAudio()

  const stopRollSound = () => {
    void stopRollAudio()
  }

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

  const betHint = (() => {
    if (mode === 'even') return 'Betting the total is even'
    if (mode === 'odd') return 'Betting the total is odd'
    if (mode === 'highest') return 'Betting the total is 7–12'
    if (mode === 'lowest') return 'Betting the total is 2–6'
    return `Betting the total is exactly ${specificNumber}`
  })()

  const getSpecificNumbers = () => {
    const min = DICE_COUNT
    const max = DICE_COUNT * 6
    return Array.from({ length: max - min + 1 }, (_, i) => i + min)
  }

  // ROLL FUNCTION
  const handleRoll = async () => {
    if (loading) return
    
    const validation = schema.safeParse({
      stake,
      bet_type: mode,
      guess: specificNumber
    });
          
    if (!validation.success) {
      const firstIssue = validation.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
      });
    }

    try {
      setLoading(true)
      setShowOverlay(false)
      setResult((prev) => ({ ...prev, message: '' }))

      const started = Date.now()
      if (!reduceMotion) {
        setRolling(true)
        playSound('roll')
        triggerHaptic('roll')
      }

      const res = await axiosClient.post("/virtual/dice", {
        bet_type: mode === "specific" ? "exact" : mode,
        stake: Number(stake),
        ...(mode === "specific" && { guess: specificNumber }),
      })

      const data = res.data
      const game = data?.game

      if (!game) {
        throw new Error(data?.message || "The dice result did not come back. Try again.")
      }

      const wait = reduceMotion ? 0 : Math.max(0, MIN_ROLL_MS - (Date.now() - started))
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait))

      const correct = Boolean(game.win)
      const diceOne = Number(game.Dice_one ?? game.dice_one ?? 1)
      const diceTwo = Number(game.Dice_two ?? game.dice_two ?? 1)

      stopRollSound()
      setHistory(prev => [correct, ...prev].slice(0, 12))
      setResult({
        isWin: correct,
        message: data.message,
        payout: Number(game.payout) || 0,
        multiplier: game.multiplier,
        diceOne,
        diceTwo,
        totalDice: Number(game.Total_Dice ?? game.Total_dice ?? diceOne + diceTwo)
      })
      setRolling(false)

      if (correct) {
        sfx.win()
        triggerHaptic('win')
        playSound('win')
      } else {
        sfx.lose()
        triggerHaptic('lose')
        playSound('lose')
      }

      setShowOverlay(true)
      if (overlayTimer.current) clearTimeout(overlayTimer.current)
      overlayTimer.current = setTimeout(() => setShowOverlay(false), 1800)

      setFetchWallet(true)

    } catch (error: any) {
      sfx.error()
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error)
      })
    } finally {
      stopRollSound()
      setRolling(false)
      setLoading(false)
    }
  }

  const goBack = () => {
    if(fetchWallet){
      getWallet(false)
      getUnreadNotifications();
    }
    router.back()
  }

  return (
    <LinearGradient
      colors={["#0b2a3a", "#061c26"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 20, padding: 12 }}
      >

        {/* HEADER */}
        <View style={[styles.header, { marginTop: top }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <TouchableOpacity onPress={goBack}>
              <Feather name="chevron-left" size={30} color="#fff" />
            </TouchableOpacity>

            <View style={styles.logoCircle}>
              <Text>🎲</Text>
            </View>

            <Text style={styles.title}>Dice streak</Text>
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
          stakeEditable={!loading}
        />

        <View style={styles.diceMeta}>
          <Text style={styles.diceMetaLabel}>Two dice · total 2–12</Text>
          <Text style={styles.diceMetaHint}>{betHint}</Text>
        </View>

        {/* MODES */}
        <View style={styles.modeRow}>
          {['even', 'highest', 'specific'].map((m) => {

            const isModeActive = (m: string) => {
              if (m === "even") return ["even", "odd"].includes(mode)
              if (m === "highest") return ["highest", "lowest"].includes(mode)
              return mode === "specific"
            }
            return (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, isModeActive(m) && styles.activeMode]}
              onPress={() => {
                setMode(m as any)
                setResult(prev => ({
                  ...prev,
                  multiplier: m === "specific" ? "5x" : "2.5x"
                }));
              }}
            >
              <Text style={isModeActive(m) ? styles.activeModeText : styles.modeText}>
                {m === 'even' ? 'even/odd' : m === 'highest' ? 'high/low' : 'specific'}
              </Text>
            </TouchableOpacity>
          )})}
        </View>

        {/* DYNAMIC OPTIONS */}
        {(mode === 'even' || mode === 'odd') && (
          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[styles.choiceBtn, mode === 'even' && styles.activeChoice]}
              onPress={() => { sfx.next(); setMode('even') }}
            >
              <Text style={[styles.choiceText, mode === 'even' && styles.choiceActiveText]}>Even</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceBtn, mode === 'odd' && styles.activeChoice]}
              onPress={() => { sfx.next(); setMode('odd') }}
            >
              <Text style={[styles.choiceText, mode === 'odd' && styles.choiceActiveText]}>Odd</Text>
            </TouchableOpacity>
          </View>
        )}

        {(mode === 'highest' || mode === 'lowest') && (
          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[styles.choiceBtn, mode === 'highest' && styles.activeChoice]}
              onPress={() => { sfx.next(); setMode('highest') }}
            >
              <Text style={[styles.choiceText, mode === 'highest' && styles.choiceActiveText]}>High (7–12)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceBtn, mode === 'lowest' && styles.activeChoice]}
              onPress={() => { sfx.next(); setMode('lowest') }}
            >
              <Text style={[styles.choiceText, mode === 'lowest' && styles.choiceActiveText]}>Low (2–6)</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'specific' && (
          <View style={styles.grid}>
            {getSpecificNumbers().map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.circle,
                  specificNumber === num && styles.activeCircle
                ]}
                onPress={() => { sfx.next(); setSpecificNumber(num) }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <LinearGradient
          colors={['#061a22', '#0a3340', '#07141c']}
          start={[0.5, 0]}
          end={[0.5, 1]}
          style={styles.table}
        >
          <View style={styles.tableGlow} />
          <DiceTable
            left={result.diceOne || 1}
            right={result.diceTwo || 1}
            rolling={rolling}
            reduceMotion={reduceMotion}
          />
          {!rolling && result.message ? (
            <Text style={styles.totalLabel}>Total {result.totalDice}</Text>
          ) : rolling ? (
            <Text style={styles.totalLabel}>Rolling…</Text>
          ) : (
            <Text style={styles.totalLabel}>Ready to roll</Text>
          )}
          <RoundResultOverlay
            visible={showOverlay}
            isWin={result.isWin}
            title={result.isWin ? 'You hit it' : 'Not this roll'}
            detail={
              result.isWin
                ? `+${displayCurrency(Number(result.payout || 0))}`
                : `Total was ${result.totalDice}`
            }
            reduceMotion={reduceMotion}
          />
        </LinearGradient>

        {/* RESULT */}
        <View style={styles.resultBox}>
          {loading ? (
            <Text style={styles.betText}>Rolling both dice…</Text>
          ) : !result?.message ? (
            <Text style={styles.betText}>{betHint}. Then roll.</Text>
          ) : (
            <Text style={styles.betText}>
              {result.isWin ? 'Win' : 'Loss'} · total {result.totalDice}
            </Text>
          )}
          <Text style={{ color: "#c7d6df" }}>{result?.multiplier}</Text>
        </View>

        {/* ROLL */}
        <TouchableOpacity style={styles.rollBtn} onPress={handleRoll} disabled={loading}>
          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color="#0b1d26" />
              <Text style={styles.rollText}>ROLLING...</Text>
            </View>
          ) : (
            <Text style={styles.rollText}>{loading ? 'ROLLING…' : 'ROLL DICE'}</Text>
          )}
        </TouchableOpacity>

        <View style={{ marginBottom: bottom }}>
          <GameHistoryStrip history={history} emptyLabel="Roll to start a streak" />
        </View>

      </ScrollView>

      <GameRulesSheet
        visible={rulesOpen}
        title="How Dice streak works"
        steps={DICE_RULES}
        onClose={() => {
          setRulesOpen(false)
          void AsyncStorage.setItem(RULES_KEY, '1')
        }}
      />
    </LinearGradient>
  )
}

export default DiceScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8
  },

  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#1b4a5f",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },

  title: {
    color: "#dbe7ee",
    fontSize: 20,
    fontWeight: "600",
  },

  helpBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#caa85e",
    alignItems: "center",
    justifyContent: "center",
  },

  helpText: {
    color: "#e6e1c5",
    fontSize: 16,
    fontWeight: "700",
  },

  diceMeta: {
    gap: 4,
  },

  diceMetaLabel: {
    color: "#f6d98a",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },

  diceMetaHint: {
    color: "#9fb7c3",
    fontSize: 14,
  },

  table: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRadius: 28,
    paddingVertical: 28,
    paddingHorizontal: 12,
    borderColor: "rgba(202,168,94,0.35)",
  },

  tableGlow: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(212,175,55,0.12)",
    top: 20,
  },

  diceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },

  totalLabel: {
    color: "#e6e1c5",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    zIndex: 1,
  },

  balanceBox: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  smallLabel: {
    fontSize: 10,
    color: "#7fa6b8",
  },

  goldText: {
    color: "#f6d98a",
    fontSize: 18,
    fontWeight: "bold",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  controlPill: {
    flex: 1,
    backgroundColor: "#173b4c",
    borderRadius: 30,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  controlLabel: {
    color: "#9fb7c3",
    marginBottom: 6,
  },

  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6
  },

  counterValue: {
    color: "#f6d98a",
    fontSize: 22,
    fontWeight: "bold",
  },

  lockedHint: {
    color: "#7fa6b8",
    fontSize: 11,
    marginTop: 4,
  },

  /* MODE TABS */
  modeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  modeBtn: {
    flex: 1,
    backgroundColor: "#173b4c",
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: "center",
  },

  activeMode: {
    borderWidth: 2,
    borderColor: "#e3a843",
    backgroundColor: "#1f4d5f",
  },

  activeModeText: {
    color: "#f6d98a",
    fontWeight: "600",
  },

  modeText: {
    color: "#c7d6df",
  },

  /* CHOICE BUTTONS */
  choiceRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  choiceBtn: {
    flex: 1,
    paddingVertical: 18,
    fontWeight: "800",
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "#173b4c",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4
  },

  activeChoice: {
    backgroundColor: "#e3a843",
  },

  choiceActiveText: {
    color: "#1b2a34",
    fontWeight: "800",
  },

  choiceText: {
    color: "#c7d6df",
  },

  /* SPECIFIC GRID */
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginTop: 10,
  },

  circle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#e6e1d9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  activeCircle: {
    backgroundColor: "#e3a843",
  },

  /* RESULT BOX */
  resultBox: {
    marginTop: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2f5668",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.03)",
    flexWrap: "wrap",
    gap: 8
  },

  betText: {
    color: "#e6e1c5",
    fontSize: 18,
  },

  /* ROLL BUTTON */
  rollBtn: {
    marginTop: 10,
    backgroundColor: "#d4af37",
    padding: 20,
    borderRadius: 40,
    alignItems: "center",
    shadowColor: "#d4af37",
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },

  rollText: {
    color: "#0b1d26",
    fontWeight: "800",
    fontSize: 18,
  },

  /* LAST ROLLS */
  footer: {
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },

  footerText: {
    color: "#c7d6df",
    fontSize: 16,
    marginBottom: 10,
  },
})