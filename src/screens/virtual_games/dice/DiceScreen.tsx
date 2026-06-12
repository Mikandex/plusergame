import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import { useAudioPlayer } from 'expo-audio';
import { triggerHaptic } from '@/utils/vibration'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated'
import { sounds } from '@/constants'
import z from 'zod'
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(1000, "Maximum stake is 1000"),
  bet_type: z.enum(['even', 'odd', 'highest', 'lowest', 'specific'], {
    message: "Please select a valid bet type",
  }),
  guess: z.number().min(2).max(12, "Choose a number between 2 and 12")

});

const Dice = ({ value }: { value: number }) => {
  const dots: Record<number, number[][]> = {
    1: [[1,1]],
    2: [[0,0],[2,2]],
    3: [[0,0],[1,1],[2,2]],
    4: [[0,0],[0,2],[2,0],[2,2]],
    5: [[0,0],[0,2],[1,1],[2,0],[2,2]],
    6: [[0,0],[0,1],[0,2],[2,0],[2,1],[2,2]],
  }

  return (
    <View style={styles.dice}>
      <View style={styles.diceGrid}>
        {[0,1,2].map(row =>
          [0,1,2].map(col => {
            const isActive = dots[value]?.some(
              ([r,c]) => r === row && c === col
            )

            return (
              <View
                key={`${row}-${col}`}
                style={[
                  styles.dot,
                  { opacity: isActive ? 1 : 0 }
                ]}
              />
            )
          })
        )}
      </View>
    </View>
  )
}

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
  const [diceCount, setDiceCount] = useState(2)

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

  const [rolling, setRolling] = useState(false)
  const [animDice, setAnimDice] = useState<number[]>(
    Array.from({ length: diceCount }, () => 1)
  );

  const rollPlayer = useAudioPlayer(sounds.rollDice);
  const winPlayer = useAudioPlayer(sounds.winDice);
  const losePlayer = useAudioPlayer(sounds.rollDice);

  const shake = useSharedValue(0)

  const playSound = (type: 'roll' | 'win' | 'lose') => {
    if (type === 'roll') {
      rollPlayer.seekTo(0);
      rollPlayer.play();
    }

    if (type === 'win') {
      winPlayer.seekTo(0);
      winPlayer.play();
    }

    if (type === 'lose') {
      losePlayer.seekTo(0);
      losePlayer.play();
    }
  };

  const stopRollSound = () => {
    rollPlayer.pause()
    rollPlayer.seekTo(0)
    stopShake()
    // rollPlayer.loop = false
  }

  rollPlayer.loop = true;
  rollPlayer.volume = 0.7;
  winPlayer.volume = 1.0;
  losePlayer.volume = 1.0;

  const startShake = () => {
    shake.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 60 }),
        withTiming(-1, { duration: 60 })
      ),
      -1, // infinite
      true
    )
  }

  const stopShake = () => {
    cancelAnimation(shake)
    shake.value = 0
  }

  const startRollingAnimation = () => {
    setRolling(true)

    const interval = setInterval(() => {
      setAnimDice(prev =>
        prev.map(() => Math.ceil(Math.random() * 6))
      )
    }, 500)

    return interval
  }

  const shakeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: shake.value * 6 },
        { translateY: shake.value * 3 },
        { rotate: `${shake.value * 6}deg` },
      ],
    }
  })

  useEffect(() => {
    setAnimDice(Array.from({ length: diceCount }, () => 1));
  }, [diceCount]);

  const getSpecificNumbers = () => {
    const min = diceCount
    const max = diceCount * 6

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

    console.log("VALIDATION PASSED, ROLLING WITH:", {
      stake,
      mode,
      specificNumber: specificNumber
    })

    try {
      setLoading(true)
      setRolling(true)

      const interval = startRollingAnimation() // start switching
      startShake()
      playSound('roll')
      triggerHaptic('roll')

      const res = await axiosClient.post("/virtual/dice", {
        bet_type: mode === "specific" ? "exact" : mode,
        stake: Number(stake),
        ...(mode === "specific" && { guess: specificNumber }),
      })

      console.log("ROLL RESULT", res.data)

      clearInterval(interval) // STOP switching
        
      const data = res.data

      const correct: boolean = data.game.win

      setHistory(prev => [correct, ...prev].slice(0, 20))

      setResult({
        isWin: correct,
        message: data.message,
        payout: data.game.payout || 0,
        multiplier: data.game.multiplier,
        diceOne: data.game.Dice_one,
        diceTwo: data.game.Dice_two,
        totalDice: data.game.Total_dice
      })

      if (correct) {
        sfx.win()
        triggerHaptic('win')
        playSound('win')
      } else {
        sfx.lose()
        triggerHaptic('lose')
        playSound('lose')
      }

      stopRollSound()
      setRolling(false)

      setFetchWallet(true)

    } catch (error: any) {
      sfx.error()
      setRolling(false)
      stopRollSound()
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || "Something went wrong"
      })
    } finally {
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TouchableOpacity onPress={goBack}>
              <Feather name="chevron-left" size={30} color="#fff" />
            </TouchableOpacity>

            <View style={styles.logoCircle}>
              <Text>🎲</Text>
            </View>

            <Text style={styles.title}>dice streak</Text>
          </View>

          <View style={styles.balanceBox}> 
            <View> 
              <Text style={styles.smallLabel}>PAYOUT</Text> 
              <Text style={styles.goldText}>{result?.payout}</Text> 
            </View> 
            <View> 
              <Text style={styles.smallLabel}>MULTIPLIER</Text> 
              <Text style={styles.goldText}>{result?.multiplier}</Text> 
            </View> 
          </View>
        </View>

        {/* CONTROLS */}
        <View style={styles.row}>
          <View style={styles.controlPill}>
            <Text style={styles.controlLabel}>stake</Text>
            <View style={styles.counterRow}>
              <TextInput
                value={stake}
                onChangeText={(text) => setStake(text)}
                keyboardType="numeric"
                placeholder="Enter stake"
                placeholderTextColor="#9fb7a9"
                cursorColor="white"
                style={{
                  backgroundColor: "#0e2c40",
                  borderRadius:16,
                  borderWidth: 1,
                  borderColor: "#caa85e",
                  padding: 8,
                  fontSize: 16,
                  flex: 1,
                  color: "#fff",
                  textAlign: "center"
                }}
              />
            </View>
            
          </View>

          <View style={styles.controlPill}>
            <Text style={styles.controlLabel}>dice</Text>
            <View style={styles.counterRow}>
              <TouchableOpacity disabled onPress={() => setDiceCount(Math.max(1, diceCount - 1))}>
                <Text style={styles.counterBtn}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{diceCount}</Text>
              <TouchableOpacity disabled onPress={() => setDiceCount(Math.min(6, diceCount + 1))}>
                <Text style={styles.counterBtn}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>
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
              <Text style={[styles.choiceText, mode === 'even' && styles.choiceActiveText]}>✅ EVEN</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceBtn, mode === 'odd' && styles.activeChoice]}
              onPress={() => { sfx.next(); setMode('odd') }}
            >
              <Text style={[styles.choiceText, mode === 'odd' && styles.choiceActiveText]}>🔴 ODD</Text>
            </TouchableOpacity>
          </View>
        )}

        {(mode === 'highest' || mode === 'lowest') && (
          <View style={styles.choiceRow}>
            <TouchableOpacity
              style={[styles.choiceBtn, mode === 'highest' && styles.activeChoice]}
              onPress={() => { sfx.next(); setMode('highest') }}
            >
              <Text style={[styles.choiceText, mode === 'highest' && styles.choiceActiveText]}>⬆️ HIGH (&gt;6)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.choiceBtn, mode === 'lowest' && styles.activeChoice]}
              onPress={() => { sfx.next(); setMode('lowest') }}
            >
              <Text style={[styles.choiceText, mode === 'lowest' && styles.choiceActiveText]}>⬇️ LOW (≤6)</Text>
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

        <View style={{ flexDirection: "row", justifyContent: "center", flexWrap: "wrap", marginTop: 20, width:"100%" }}>
          {Array.from({ length: diceCount }).map((_, i) => {
            const finalDice = [result.diceOne, result.diceTwo]
            return (
            <Animated.View key={i} style={rolling ? shakeStyle : undefined}>
              <Dice
                value={
                  rolling
                    ? animDice[i] || 1   // LIVE changing values
                    : finalDice[i] || 1 //final result
                }
              />
            </Animated.View>
          )})}
        </View>

        {/* RESULT */}
        {result && (
          <View style={styles.resultBox}>
            {loading ? (
              <Text style={styles.betText}>Rolling...</Text>
            ) : !result?.message ? (
              <Text style={styles.betText}>🎲 Place your bet</Text>
            ) : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {result?.isWin ? (
                  <>
                    <Text className="text-white text-3xl">✅</Text>
                    <Text className="text-white font-msbold text-xl">
                      WIN! 🎉 <Text style={{ fontWeight: "700", textTransform: "uppercase" }}>+{result?.payout}</Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-3xl">❌</Text>
                    <Text className="text-white font-msbold text-xl">
                      LOSE 🤕 <Text style={{ fontWeight: "700", textTransform: "uppercase" }}>-{stake}</Text>
                    </Text>
                  </>
                )}
              </View>
            )}

            <Text style={{ color: "#c7d6df" }}>
              {result?.multiplier}
            </Text>
          </View>
        )}

        {/* ROLL */}
        <TouchableOpacity style={styles.rollBtn} onPress={handleRoll} disabled={loading}>
          {loading ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <ActivityIndicator size="small" color="#0b1d26" />
              <Text style={styles.rollText}>ROLLING...</Text>
            </View>
          ) : (
            <Text style={styles.rollText}>🎲 ROLL DICE</Text>
          )}
        </TouchableOpacity>

        {/* LAST ROLLS */}
        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last rolls 🔊 sound on</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length <= 0 ? (
              <Text className='text-white text-xl italic'>roll the dice</Text>
            ) : (
              history.map((h, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.06)",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderLeftWidth: 4,
                    borderLeftColor: h ? '#5fd48c' : '#e06969'
                  }}
                >
                  <Text style={{ color: '#ffeca6' }}>
                    {h ? '✅' : '❌'}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
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

  counterBtn: {
    fontSize: 22,
    color: "#c7d6df",
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
    backgroundColor: "#4fa3d1",
    padding: 20,
    borderRadius: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
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

  dice: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#e6d9c3",
    justifyContent: "center",
    alignItems: "center",
    margin: 8,
  },

  diceGrid: {
    width: "70%",
    height: "70%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignContent: "space-between",
  },

  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#000",
  },
})