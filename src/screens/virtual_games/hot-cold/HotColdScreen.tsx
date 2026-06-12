import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import { z } from "zod"
import Toast from 'react-native-toast-message'
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'

const ranges = [
  { label: "1-10", max: 10 },
  { label: "1-20", max: 20 },
  { label: "1-30", max: 30 },
]

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
  pick: z.number().min(1, "Pick a number"),
})

const HotColdScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const [stake, setStake] = useState("50")
  const [loading, setLoading] = useState(false)
  const [fetchWallet, setFetchWallet] = useState(false)
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: "",
    payout: 0,
    multiplier: "10x",
    systemPick: null,
    userPick: null
  })
  const [history, setHistory] = useState<boolean[]>([])
  const sfx = useSfx()
  const [selectedRange, setSelectedRange] = useState(ranges[0])
  const [selectedNumber, setSelectedNumber] = useState<number>(0)

  const numbers = Array.from({ length: selectedRange.max }, (_, i) => i + 1)

  const handleGuess = async () => {
    if (loading) return

    const result = schema.safeParse({ stake, pick: selectedNumber, });
    
    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
      });
    }

    sfx.flip()

    try {
      setLoading(true)

      const res = await axiosClient.post("/virtual/guess", {
        game_type: selectedRange.label === "1-10" ? "pot1" : selectedRange.label === "1-20" ? "pot2" : "pot3",
        pick: selectedNumber,
        stake: Number(stake)
      })
      console.log("RESULT", res.data)

      const data = res.data

      const correct: boolean = data.game.is_win
 
      //outcome sound
      if (correct) {
        sfx.win()
      } else {
        sfx.lose()
      }

      setHistory(prev => [correct, ...prev].slice(0, 20))

      setResult({
        isWin: correct,
        message: data.message,
        payout: data.game.payout || 0,
        multiplier: data.game.multiplier,
        systemPick: data.game.system_number,
        userPick: data.game.user_picked_number
      })
      setSelectedNumber(0)

      setFetchWallet(true)

    } catch (error: any) {
      sfx.error()
      Toast.show({
        type: 'error',
        text1:
          error?.response?.data?.message?.stake ||
          error?.response?.data?.message ||
          "Something went wrong",
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
        <View className='flex-row items-center gap-1' style={{ marginTop: top }}>
          <TouchableOpacity activeOpacity={0.8} onPress={goBack}>
            <Feather name="chevron-left" size={34} color="#e6e1c5" />
          </TouchableOpacity>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={{ fontSize: 18 }}>🔢</Text>
            </View>
            <Text style={styles.title}>hot/cold guess</Text>
          </View>
        </View>

        {/* RANGE INFO */}
        <View style={styles.row}>
          <View style={styles.controlPill}>
            <Text style={styles.controlLabel}>STAKE</Text>
            <View style={styles.counterRow}>
              <TextInput
                value={stake}
                onChangeText={(text) => setStake(text)}
                keyboardType="numeric"
                placeholder="Enter stake"
                placeholderTextColor="#9fb7a9"
                cursorColor="white"
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
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

          <View style={styles.rangeInfo}>
            <View>
              <Text style={styles.label}>Payout</Text>
              <Text style={styles.gold}>{result?.payout}</Text>
            </View>
            <View>
              <Text style={styles.label}>MULTIPLIER</Text>
              <Text style={styles.gold}>{result?.multiplier}</Text>
            </View>
          </View>
        </View>

        {/* RANGE SELECT */}
        <View style={styles.rangeRow}>
          {ranges.map((r) => {
            const active = r.label === selectedRange.label
            return (
              <TouchableOpacity
                key={r.label}
                style={[styles.rangeBtn, active && styles.activeRange]}
                onPress={() => {
                  setSelectedRange(r)
                  setSelectedNumber(0)
                  if(!loading) setResult(prev => ({
                    ...prev,
                    message: "",
                    multiplier: `${r.max}x`
                  }))  
                }}
              >
                <Text style={active ? styles.activeText : styles.rangeText}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* NUMBER GRID */}
        <View style={styles.gridBox}>
          <View style={styles.grid}>
            {numbers.map((num) => {
              const active = num === selectedNumber
              return (
                <TouchableOpacity
                  key={num}
                  style={[styles.circle, active && styles.activeCircle]}
                  onPress={() => { 
                    sfx.next()
                    setSelectedNumber(num)
                    if(!loading) setResult(prev => ({
                      ...prev,
                      message: ""
                    })) 
                  }}
                >
                  <Text style={styles.circleText}>{num}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* PICK BOX */}
        <View style={styles.pickBox}>
            {loading ? (
              <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: "900", color: "#fff" }}>Loading...</Text>
              </View>
            ) : !selectedNumber && !result?.message ? (
              <Text style={styles.pickText}>🤔 pick a number</Text>
            ) : result?.message ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {result?.isWin ? (
                  <>
                    <Text className="text-white text-3xl">✅</Text>
                    <Text className="text-white font-msbold text-xl">
                      🎯 🎉 WIN! it was<Text style={{ fontWeight: "700", textTransform: "uppercase" }}>{result?.systemPick}</Text>
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-white text-3xl">🌡️ ❌</Text>
                    <Text className="text-white font-msbold text-xl">
                      LOSS. It was <Text style={{ fontWeight: "700", textTransform: "uppercase" }}>{result?.systemPick}</Text>
                    </Text>
                  </>
                )}
              </View>
            ) : (
              <Text style={styles.pickText}>
                🤔 picked {selectedNumber}
              </Text>
            )}

          <View style={styles.multiplierPill}>
            <Text style={styles.multiplierText}>
              {result?.multiplier}
            </Text>
          </View>
        </View>

        {/* ACTION BUTTON */}
        <TouchableOpacity className={`${loading || !selectedNumber ? 'opacity-60' : ''}`} style={styles.playBtn} onPress={handleGuess} disabled={loading}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ActivityIndicator color="#000" />
              <Text style={{ fontSize: 18, fontWeight: "900" }}>Loading...</Text>
            </View>
          ) : (
             <Text style={styles.playText}>🎯 guess & reveal</Text>
          )}
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last rolls 🔊 sound on</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length <= 0 ? (
              <Text className='text-white text-xl italic'>Make a guess</Text>
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

export default HotColdScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#12394a",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#dbe7ee",
    fontSize: 20,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "stretch",
  },

  controlPill: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 25,
    padding: 16
  },

  controlLabel: {
    fontSize: 12,
    color: "#9fb7a9",
    marginBottom: 6,
  },

  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6
  },

  rangeInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 16,
    borderRadius: 25,
    gap: 10,
  },

  label: {
    color: "#7fa6b8",
    fontSize: 12,
  },

  gold: {
    color: "#f6d98a",
    fontSize: 22,
    fontWeight: "bold",
  },

  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },

  rangeBtn: {
    flex: 1,
    backgroundColor: "#173b4c",
    padding: 16,
    borderRadius: 25,
    alignItems: "center",
    marginHorizontal: 5,
  },

  activeRange: {
    borderWidth: 2,
    borderColor: "#e3a843",
  },

  rangeText: {
    color: "#c7d6df",
  },

  activeText: {
    color: "#f6d98a",
    fontWeight: "bold",
  },

  gridBox: {
    backgroundColor: "#173b4c",
    borderRadius: 30,
    padding: 20,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10
  },

  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6e3da",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,

    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  activeCircle: {
    backgroundColor: "#e3a843",
  },

  circleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1b2a34",
  },

  pickBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2f5668",
    padding: 18,
    flexWrap: "wrap",
    gap: 8,
  },

  pickText: {
    color: "#c7d6df",
    fontSize: 18,
  },

  multiplierPill: {
    backgroundColor: "#e3a843",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    flexShrink: 0 
  },

  multiplierText: {
    color: "#1b2a34",
    fontWeight: "bold",
  },

  playBtn: {
    backgroundColor: "#4fa3d1",
    padding: 20,
    borderRadius: 40,
    alignItems: "center",
  },

  playText: {
    color: "#0b1d26",
    fontSize: 20,
    fontWeight: "900",
  },

  footer: {
    gap: 4,
    backgroundColor: '#163447',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#2f5668",
  },

  footerText: {
    color: "#e6e1c5",
    fontSize: 16,
    marginBottom: 10,
  }
})