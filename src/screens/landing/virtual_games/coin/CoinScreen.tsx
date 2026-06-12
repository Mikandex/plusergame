import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { images } from "@/constants";
import { useState } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  cancelAnimation,
  withSpring,
} from 'react-native-reanimated'
import z from "zod";
import Toast from "react-native-toast-message";
import { useSfx } from "@/hooks/useSfx";

type Bet = 'heads' | 'tails' | 'edge' | null
type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  systemPick: Bet
  userPick: Bet
}

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(1000, "Maximum stake is 1000"),
  bet: z.enum(["heads", "tails", "edge"], {
    message: "Please select a bet, either heads, tails or edge",
  })
})

export default function CoinScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const [bet, setBet] = useState<Bet>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: "",
    payout: 0,
    multiplier: "3x",
    systemPick: null,
    userPick: null
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [face, setFace] = useState<'head' | 'tail' | 'edge'>('head')
  const [stake, setStake] = useState("50")
  const sfx = useSfx()

  const spin = useSharedValue(0)

  const headsScale = useSharedValue(1)
  const tailsScale = useSharedValue(1)
  const edgeScale = useSharedValue(1)

  const bounce = (scale: any) => {
    scale.value = 0.9
    scale.value = withSpring(1.1, { damping: 5 }, () => {
      scale.value = withSpring(1)
    })
  }


  const headsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headsScale.value }]
  }))

  const tailsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: tailsScale.value }]
  }))

  const edgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: edgeScale.value }]
  }))

  const startSpin = () => {
    spin.value = 0

    spin.value = withRepeat(
      withTiming(360, {
        duration: 300,
        easing: Easing.linear,
      }),
      -1, // infinite loop
      false
    )

    // toggle face while spinning
    let current: 'head' | 'tail' = 'head'

    const interval = setInterval(() => {
      current = current === 'head' ? 'tail' : 'head'
      setFace(current)
    }, 150) // speed of flipping

    return interval
  }

  const stopSpin = () => {
    cancelAnimation(spin)
    spin.value = 0
  }

  const spinStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 },
        { rotateY: `${spin.value}deg` },
      ],
    }
  })

  const handleToss = async () => {
    if (loading) return

    const result = schema.safeParse({ stake, bet });

    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
      });
    }

    let flipInterval: any

    sfx.flip()
    flipInterval = startSpin() // store interval


    setTimeout(() => {
      stopSpin()
      clearInterval(flipInterval) // stop flipping

      setBet(null)
      
    }, 300)

    router.push("/(onboarding)/Register")
    
  }

  const getBetColor = (bet: 'heads' | 'tails' | 'edge' | null) => {
    switch (bet) {
      case 'heads':
        return '#2f8f4e'
      case 'tails':
        return '#c45a33'
      case 'edge':
        return '#b8a34a'
      default:
        return '#e6e1c5'
    }
  }

  return (
    <LinearGradient
      colors={["#0f3b2e", "#06281f"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 20, padding: 12 }}
      >
        {/* HEADER */}
        <View className='flex-row gap-2 justify-between items-center flex-wrap' style={{ marginTop: top }}>
          <View className='flex-row gap-1 items-center'>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()}>
              <Feather name="chevron-left" size={34} color="#d4af37" />
            </TouchableOpacity> 

            <View style={styles.logo}>
              <Image
                source={images.coin}
                style={{ width: 20, height: 20 }}
              />
            </View>

            <Text style={styles.title}>edge toss</Text>
          </View>

          <View style={styles.stats}>
            <View>
              <Text style={styles.statLabel}>PAYOUT</Text>
              <Text style={styles.statValue}>{result?.payout}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>MULTIPLIER</Text>
              <Text style={styles.statValue}>{result?.multiplier}</Text>
            </View>
          </View>
        </View>

        {/* COIN */}
        <View style={styles.coinWrapper}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleToss}
            disabled={loading}
          >
            <Animated.View style={[styles.coinOuter, spinStyle]}>
              <View style={styles.coinInner}>
                {face === 'edge' && 
                  <Text style={{ fontSize: 100, color: "#caa85e" }}>
                    ⚡
                  </Text>
                }
                {face === 'head' && (
                  <Image
                    source={images.coin}
                    style={{ width: 200, height: 200 }}
                  />
                )}
                {face === 'tail' && 
                  <Image
                    source={images.coinTail}
                    style={{ width: 200, height: 200 }}
                  />
                }
              </View>
            </Animated.View>
          </TouchableOpacity>

          <View style={styles.controlPill}>
            <Text style={styles.controlLabel}>Enter stake</Text>
            <View style={styles.counterRow}>
              <TextInput
                value={stake}
                onChangeText={text => setStake(text)}
                keyboardType="numeric"
                placeholder="Enter stake"
                placeholderTextColor="#9fb7a9"
                cursorColor="white"
                style={{
                  backgroundColor: "rgba(255,255,255,0.06)",
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
          <Text style={styles.tapText}>tap coin to flip</Text>
        </View>

        {/* ACTION BOX */}
        <View style={styles.actionBox}>
          <View style={styles.row}>
            <Animated.View style={[{ width: 140 }, headsStyle]}>
              <TouchableOpacity 
                style={styles.greenBtn}
                onPress={() => {
                  sfx.next()
                  setBet('heads')
                  bounce(headsScale)
                  setResult(prev => ({
                    ...prev,
                    message: ""
                  }))
                }}
                className={`${loading ? 'opacity-50' : ''}`}
                disabled={loading}
              >
                <Text style={styles.btnText}>🪙 heads</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[{ width: 140 }, tailsStyle]}>
              <TouchableOpacity 
                style={styles.orangeBtn}
                onPress={() => {
                  sfx.next()
                  setBet('tails')
                  bounce(tailsScale)
                  setResult(prev => ({
                    ...prev,
                    message: ""
                  }))
                }}
                className={`${loading ? 'opacity-50' : ''}`}
                disabled={loading}
              >
                <Text style={styles.btnText}>🪙 tails</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <Animated.View style={[{ width: 160, marginHorizontal: "auto"}, edgeStyle]}>
            <TouchableOpacity 
              style={styles.edgeBtn}
              onPress={() => {
                sfx.next()
                setBet('edge')
                bounce(edgeScale)
                setResult(prev => ({
                  ...prev,
                  message: ""
                }))
              }}
              className={`${loading ? 'opacity-50' : ''}`}
              disabled={loading}
            >
              <Text style={styles.edgeText}>⚡ edge</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* BET */}
        <View style={styles.betBox}>
          {loading ? (
            <Text style={styles.betText}>Spinning...</Text>
          ) : !bet && !result?.message ? (
            <Text style={styles.betText}>Place your bet</Text>
          ) : result?.message ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {result?.isWin ? (
                <>
                  <Text className="text-white text-3xl">✅</Text>
                  <Text className="text-white font-msbold text-xl">
                    CORRECT! <Text style={{ color: getBetColor(result?.systemPick), fontWeight: "700", textTransform: "uppercase" }}>{result?.systemPick}</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white text-3xl">❌</Text>
                  <Text className="text-white font-msbold text-xl">
                    Wrong. It is <Text style={{ color: getBetColor(result?.systemPick), fontWeight: "700", textTransform: "uppercase" }}>{result?.systemPick}</Text>
                  </Text>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.betText}>
              Bet:{" "}
              <Text style={{ color: getBetColor(bet), fontWeight: "700", textTransform: "uppercase" }}>
                {bet}
              </Text>{" "}
              - tap coin or toss
            </Text>
          )}

          <View style={styles.betBadge}>
            <Text style={{ color: "#1c2b1f", fontWeight: "700" }}>
              {result?.multiplier}
            </Text>
          </View>
        </View>

        {/* TOSS BUTTON */}
        <TouchableOpacity
          className={`${loading || !bet ? 'opacity-50' : ''}`}
          style={styles.tossBtn}
          onPress={handleToss}
          disabled={loading}
        >
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ActivityIndicator color="#000" />
              <Text style={{ fontSize: 18 }}>Spinning...</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 18 }}>🎲 toss coin</Text>
          )}
        </TouchableOpacity>

        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last rolls 🔊 sound on</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length <= 0 ? (
              <Text className='text-white text-xl italic'>Place a bet & toss</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between"
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d4af37",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  title: {
    color: "#e6e1c5",
    fontSize: 20,
  },

  stats: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: "#caa85e",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  statLabel: {
    color: "#9fb7a9",
    fontSize: 10,
  },

  statValue: {
    color: "#e6d59b",
    fontSize: 16,
    fontWeight: "bold",
  },

  coinWrapper: {
    alignItems: "center",
  },

  coinOuter: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#d4af37",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },

  coinInner: {
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  tapText: {
    marginTop: 20,
    color: "#c9c39c",
    fontSize: 16
  },

  actionBox: {
    borderWidth: 1,
    borderColor: "#caa85e",
    borderRadius: 30,
    padding: 20,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  greenBtn: {
    flex: 1,
    backgroundColor: "#2f8f4e",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 30,
    marginRight: 10,
    alignItems: "center",
  },

  orangeBtn: {
    flex: 1,
    backgroundColor: "#c45a33",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 30,
    marginLeft: 10,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 18,
  },

  edgeBtn: {
    marginTop: 20,
    backgroundColor: "#b8a34a",
    padding: 16,
    borderRadius: 30,
    alignItems: "center",
    width: "100%",
    marginHorizontal: "auto"
  },

  edgeText: {
    fontSize: 18,
    fontWeight: "600",
  },

  betBox: {
    borderWidth: 1,
    borderColor: "#caa85e",
    borderRadius: 30,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  betText: {
    color: "#e6e1c5",
    fontSize: 18,
  },

  betBadge: {
    backgroundColor: "#e2b95b",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexShrink: 0 
  },

  tossBtn: {
    backgroundColor: "#b8a34a",
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
    width: 250,
    marginHorizontal: "auto"
  },

  footer: {
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#caa85e",
  },

  footerText: {
    color: "#e6e1c5",
    fontSize: 16,
    marginBottom: 10,
  },

  controlPill: {
    width: 150,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 18,
    padding: 14,
    marginTop: 20
  },

  controlLabel: {
    color: "#e6e1c5",
    marginBottom: 6,
  },

  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6
  },

});