import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native'
import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  cancelAnimation,
  runOnJS
} from 'react-native-reanimated'
import Toast from 'react-native-toast-message'
import z from 'zod'
import { useSfx } from '@/hooks/useSfx'

const symbols = ['🍒', '🍋', '🍊', '🍇', '💎'];

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(500, "Maximum stake is 500"),
});

const ReelStreakScreen = () => {
  const { top, bottom } = useSafeAreaInsets()

  const [stake, setStake] = useState("50")
  const [multiplier, setMultiplier] = useState("15x")
  const [reels, setReels] = useState(["🍒", "🍒", "🍒"])
  const [pulling, setPulling] = useState(false)
  const [isWin, setIsWin] = useState(false)
  const [resultText, setResultText] = useState("✨ pull the lever ✨")
  const [payout, setPayout] = useState(0)
  const [history, setHistory] = useState<boolean[]>([])
  const sfx = useSfx()

  // animations per reel
  const r1 = useSharedValue(0)
  const r2 = useSharedValue(0)
  const r3 = useSharedValue(0)

  const stopReel = (reel: any, isLast = false, data?: any) => {
    cancelAnimation(reel)
    reel.value = withTiming(0, { duration: 200 })

    if (isLast) {
      runOnJS(finishSpin)(data)
    }
  }


  const finishSpin = (data: any) => {
    if (!data) return

    const newReels = Array.isArray(data.reels)
    ? data.reels
    : ["❓", "❓", "❓"]

    setReels(newReels)

    const payout = data.payout || 0
    const isWin = data.is_win
    const multiplier = data.multiplier || 0

    if (isWin) {
      sfx.win()
    } else {
      sfx.lose()
    }

    setHistory(prev => [...prev, isWin])

    if (isWin) {
      setMultiplier(multiplier)
      setResultText(`🎉 WIN! +${payout}`)
      setPayout(payout)
    } else {
      setResultText("😞 no win... try again")
    }

    setIsWin(isWin)
    setPulling(false)
  }

  const handleSpin = async () => {
    if (pulling) return
    const result = schema.safeParse({ stake });
    
    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your input",
      });
    }

    sfx.flip()

    // start animation
    r1.value = withRepeat(withTiming(-10, { duration: 150 }), -1, false)
    r2.value = withRepeat(withTiming(-10, { duration: 130 }), -1, false)
    r3.value = withRepeat(withTiming(-10, { duration: 110 }), -1, false)

    router.push("/(onboarding)/Register")
  }

  // animated styles
  const style1 = useAnimatedStyle(() => ({
    transform: [{ translateY: r1.value }]
  }))

  const style2 = useAnimatedStyle(() => ({
    transform: [{ translateY: r2.value }]
  }))

  const style3 = useAnimatedStyle(() => ({
    transform: [{ translateY: r3.value }]
  }))

  return (
    <LinearGradient colors={["#1a0f2b", "#0d061a"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 20, padding: 12 }}
      >

        {/* HEADER */}
        <View className='flex-row gap-2 justify-between items-center flex-wrap' style={{ marginTop: top }}>
          <View className='flex-row gap-1 items-center'>
            <TouchableOpacity onPress={() => router.back()}>
              <Feather name="chevron-left" size={34} color="#f6d98a" />
            </TouchableOpacity>

            <View style={styles.logo}>
              <Text style={{ fontSize: 18 }}>🎰</Text>
            </View>

            <Text style={styles.title}>reel streak</Text>
          </View>

          <View style={styles.topStats}>
            <View>
              <Text style={styles.small}>PAYOUT</Text>
              <Text style={styles.gold}>{payout}</Text>
            </View>
            <View>
              <Text style={styles.small}>MULTIPLIER</Text>
              <Text style={styles.gold}>{multiplier}</Text>
            </View>
          </View>
        </View>

        {/* REELS */}
        <View style={styles.reelBox}>
          <View style={styles.reels}>
            {[0,1,2].map((i) => {
              const animStyle = [style1, style2, style3][i]

              return (
                <Animated.View key={i} style={[styles.reel, isWin && styles.winReel, animStyle]}>
                  <Text style={styles.reelEmoji}>{reels[i]}</Text>
                </Animated.View>
              )
            })}
          </View>

          <Text style={styles.pullText}>
            {pulling ? "pulling..." : resultText}
          </Text>
        </View>

        {/* BET + SPIN */}
        <View style={styles.betRow}>
          <View style={styles.stakeBox}>
            <Text style={styles.stakeLabel}>stake</Text>
            <View style={styles.counterRow}>
              <TextInput
                value={stake}
                onChangeText={(text) => setStake(text)}
                keyboardType="numeric"
                placeholder="Enter stake"
                placeholderTextColor="#9fb7a9"
                cursorColor="white"
                style={{
                  backgroundColor: "#1a1230",
                  borderRadius:16,
                  borderWidth: 1,
                  borderColor: "#d2b48c",
                  padding: 8,
                  fontSize: 16,
                  flex: 1,
                  color: "#fff",
                  textAlign: "center"
                }}
              />
            </View>
            
          </View>

          <TouchableOpacity
            style={[styles.spinBtn, pulling && { opacity: 0.5 }]}
            onPress={handleSpin}
            disabled={pulling}
          >
            <Text style={styles.spinText}>🎲 PULL</Text>
          </TouchableOpacity>
        </View>

        {/* STATS */}
        <View style={styles.stats}>
          <View>
            <Text style={styles.small}>PAYOUT</Text>
            <Text style={styles.gold}>{payout}</Text>
          </View>
          <View>
            <Text style={styles.small}>MULTIPLIER</Text>
            <Text style={styles.gold}>{multiplier}</Text>
          </View>
        </View>

        {/* FOOTER */}
        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last spins   🔊 sound fx</Text>

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length === 0 ? (
              <Text style={styles.footerHint}>Pull the lever</Text>
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

export default ReelStreakScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#6f4bb8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },

  title: {
    color: "#e5dcff",
    fontSize: 20,
  },

  topStats: {
    flexDirection: "row",
    gap: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 12,
    borderRadius: 20,
  },

  small: {
    fontSize: 10,
    color: "#b9a7e6",
  },

  gold: {
    color: "#f6d98a",
    fontSize: 16,
    fontWeight: "bold",
  },

  stakeBox: {
    width: 150,
    backgroundColor: "#2d214a",
    borderRadius: 30,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  stakeLabel: {
    color: "#9fb7c3",
    marginBottom: 6,
  },

  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6
  },

  reelBox: {
    backgroundColor: "#2a1d44",
    borderRadius: 30,
    padding: 20,
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 12,
  },

  reels: {
    flexDirection: "row",
    gap: 15,
  },

  reel: {
    width: 90,
    height: 90,
    borderRadius: 20,
    backgroundColor: "#eae7df",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },

  winReel: {
    borderWidth: 5,
    borderColor: '#f6d98a',

    shadowColor: '#ffd700',
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 25,

    backgroundColor: '#fff8e1',
  },

  reelEmoji: {
    fontSize: 40,
  },

  pullText: {
    marginTop: 15,
    color: "#f6d98a",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center"
  },

  betRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  betBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  betLabel: {
    color: "#c7bff0",
    fontSize: 18,
  },

  betValueBox: {
    backgroundColor: "#4c3575",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },

  betValue: {
    color: "#f6d98a",
    fontSize: 20,
    fontWeight: "bold",
  },

  spinBtn: {
    backgroundColor: "#a88be0",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,

    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },

  spinText: {
    color: "#1b1030",
    fontSize: 20,
    fontWeight: "bold",
  },

  stats: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#2a1d44",
    padding: 20,
    borderRadius: 30,
  },

  footer: {
    backgroundColor: "#2a1d44",
    borderRadius: 30,
    padding: 20,
  },

  footerText: {
    color: '#c7bff0',
    marginBottom: 10,
  },

  footerHint: {
    marginTop: 10,
    color: '#b9a7e6',
    fontStyle: 'italic'
  }

})