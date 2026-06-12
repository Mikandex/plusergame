import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Modal, TouchableWithoutFeedback } from 'react-native'
import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import z from 'zod'
import { useSfx } from '@/hooks/useSfx'

type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  bingoNumber: number,
  drawCount: number,
  drewNumbers: number[],
  matchedNumbers: number[],
  userPicks: number[]
}

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(1000, "Maximum stake is 1000"),
  picks: z.array(
    z.number()
      .min(1, "Number must be at least 1")
      .max(40, "Number cannot exceed 40")
  ).length(5, "You must pick exactly 5 numbers"),
})

const LotteryScreen = () => {

  const { top, bottom } = useSafeAreaInsets()
  const [stake, setStake] = useState("50")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: "",
    payout: 0,
    multiplier: "3x",
    bingoNumber: 0,
    drawCount: 0,
    drewNumbers: [],
    matchedNumbers: [],
    userPicks: []
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [showModal, setShowModal] = useState(false)
  const sfx = useSfx()

  const numbers = Array.from({ length: 40 }, (_, i) => i + 1);
  const [numbersSelected, setNumbersSelected] = useState<number[]>([]);

    const addNumber = (item: number) => {
      setResult({
        isWin: false,
        message: "",
        payout: 0,
        multiplier: "3x",
        bingoNumber: 0,
        drawCount: 0,
        drewNumbers: [],
        matchedNumbers: [],
        userPicks: []
      })

      setNumbersSelected(prev => {
          // If already selected → remove (no error)
          if (prev.includes(item)) {
            return prev.filter(n => n !== item);
          }

          // If not selected and limit reached → show error
          if (prev.length === 5) {
            sfx.error()
            Toast.show({
              type: 'error',
              text1: 'Maximum numbers reached',
              text2: 'You can only pick up to 5 numbers',
            });
            return prev;
          }

          // Otherwise → add number
          sfx.next()
          return [...prev, item];
      });
    };

    const handlePlay = async () => {
      if (loading) return
      
      const result = schema.safeParse({ stake, picks: numbersSelected });
      
      if (!result.success) {
        const firstIssue = result.error.issues[0];
  
        return Toast.show({
          type: 'info',
          text1: firstIssue.message,
        });
      }

      sfx.flip()

      router.push("/(onboarding)/Register")
    };

    const clear = () => {
      sfx.next()
      setNumbersSelected([])
      setResult({
        isWin: false,
        message: "",
        payout: 0,
        multiplier: "3x",
        bingoNumber: 0,
        drawCount: 0,
        drewNumbers: [],
        matchedNumbers: [],
        userPicks: []
      })
      setShowModal(false)
    }

    const goBack = () => {
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
        <View className='flex-row items-center gap-1 flex-wrap' style={{ marginTop: top }}>
          <TouchableOpacity activeOpacity={0.8} onPress={goBack}>
            <Feather name="chevron-left" size={34} color="#e6e1c5" />
          </TouchableOpacity>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={{ fontSize: 18 }}>🔢</Text>
            </View>
            <Text style={styles.title}>Lottery</Text>
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
              <Text style={styles.label}>PAYOUT</Text>
              <Text style={styles.gold}>{result?.payout}</Text>
            </View>
            <View>
              <Text style={styles.label}>MULTIPLIER</Text>
              <Text style={styles.gold}>{result?.multiplier}</Text>
            </View>
          </View>
        </View>

        <View className='gap-2 px-4'>
            {numbersSelected.length <= 0 && (
                <Text className='font-msbold text-white'>Pick 5 numbers</Text>
            )}
            {numbersSelected.length > 0 && (
                <View className='flex-row items-center justify-between'>
                    <Text className='font-msbold text-white'>Numbers picked</Text>
                    <TouchableOpacity onPress={clear}>
                        <Text className='font-msbold text-red-500'>Clear</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View className='flex-row gap-1 flex-wrap items-center'>
                {numbersSelected.map((num, index) => (
                    <View
                      key={num}
                      style={styles.pickedCircle}
                    >
                      <Text style={styles.circleText}>{num}</Text>
                    </View>
                ))}
            </View>
        </View>

        {/* NUMBER GRID */}
        <View style={styles.gridBox}>
          <View style={styles.grid}>
            {numbers.map((num) => {
              const picked = numbersSelected.includes(num)
              return (
                <TouchableOpacity
                  key={num}
                  style={[styles.circle, picked && styles.activeCircle]}
                  onPress={() => addNumber(num)}
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
          ) : !numbersSelected?.length && !result?.message ? (
            <Text style={styles.pickText}>🔥 pick 5 numbers</Text>
          ) : result?.message ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {result?.isWin ? (
                <>
                  <Text className="text-white text-3xl">✅</Text>
                  <Text className="text-white font-msbold text-xl">
                    🎯 🎉 WIN! <Text style={{ fontWeight: "700", textTransform: "uppercase" }}>+{result?.payout}</Text>
                  </Text>
                </>
              ) : (
                <>
                  <Text className="text-white text-3xl">🌡️ ❌</Text>
                  <Text className="text-white font-msbold text-xl">
                    LOSS. <Text style={{ fontWeight: "700", textTransform: "uppercase" }}>-{stake}</Text>
                  </Text>
                </>
              )}
            </View>
          ) : (
            <Text style={styles.pickText}>
              🤔 {numbersSelected?.length} number{numbersSelected?.length !== 1 ? 's' : ''} picked 
            </Text>
          )}

          <View style={styles.multiplierPill}>
            <Text style={styles.multiplierText}>
              {result.multiplier}
            </Text>
          </View>
        </View>

        {/* ACTION BUTTON */}
        <TouchableOpacity disabled={loading} className={`${loading || numbersSelected.length < 5 ? 'opacity-60' : ''}`} style={styles.playBtn} onPress={handlePlay}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ActivityIndicator color="#000" />
              <Text style={{ fontSize: 18, fontWeight: "900" }}>Loading...</Text>
            </View>
          ) : (
              <Text style={styles.playText}>▶ Play</Text>
          )}
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last rolls 🔊 sound on</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length <= 0 ? (
              <Text className='text-white text-xl italic'>Place a lottery bet</Text>
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

        <Modal
          transparent={true}
          visible={showModal}
          statusBarTranslucent={true}
          onRequestClose={() => setShowModal(false)}>
          <View className="flex-1 justify-center items-center px-8" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>

              {/* Actual modal content */}
              <View className="relative rounded-2xl max-h-[60%] py-4 w-full bg-white">

                {/* TOP BADGE */}
                <View className="absolute -top-10 left-0 right-0 items-center">
                  <View className={`rounded-full items-center justify-center size-20 bg-white`}>
                    <Text className={`font-mbold text-base`}>
                     {result.isWin ? '🎉' : '❌'} 
                    </Text>
                    <Text className={`font-mbold text-lg ${result.isWin ? 'text-green-600' : 'text-red-600'}`}>
                      {result.isWin ? 'WIN' : 'LOSE'}
                    </Text>
                  </View>
                </View>

                {/* CONTENT */}
                <View className="w-full px-4 mt-10">

                  <Text className="font-mbold text-xl text-center">
                    {result.isWin ? '🎉 Congratulations!' : '😢 Better luck next time'}
                  </Text>

                  <Text className="font-mmedium text-center my-2">
                    {result.message}
                  </Text>

                  {/* PAYOUT */}
                  <Text className="text-center text-lg font-mbold my-1">
                    {result.isWin ? `+${result.payout}` : `-${stake}`}
                  </Text>

                  {/* PAYOUT */}
                  <Text className="text-center text-base font-msbold my-1">
                    Bingo Number: {result.bingoNumber}
                  </Text>

                  {/* NUMBERS */}
                  <View className="my-2 gap-2">

                    <Text className="font-mbold text-center">Your Picks</Text>
                    <View className="flex-row flex-wrap justify-center gap-2">
                      {result.userPicks.map((num) => (
                        <View key={num} className="bg-gray-200 px-3 py-1 rounded-full">
                          <Text>{num}</Text>
                        </View>
                      ))}
                    </View>

                    <Text className="font-mbold text-center mt-3">Drawn Numbers</Text>
                    <View className="flex-row flex-wrap justify-center gap-2">
                      {result.drewNumbers.map((num) => {
                        const isMatched = result.matchedNumbers.includes(num)
                        return (
                          <View
                            key={num}
                            className={`px-3 py-1 rounded-full ${isMatched ? 'bg-green-400' : 'bg-gray-200'}`}
                          >
                            <Text>{num}</Text>
                          </View>
                        )
                      })}
                    </View>

                    <View className="mt-4">
                      <Text className="font-mbold text-center">Matched Numbers</Text>

                      {result.matchedNumbers.length === 0 ? (
                        <Text className="text-center text-gray-400 mt-2">No matches</Text>
                      ) : (
                        <View className="flex-row flex-wrap justify-center gap-2 mt-2">
                          {result.matchedNumbers.map((num) => (
                            <View
                              key={num}
                              className="bg-green-500 px-3 py-1 rounded-full"
                            >
                              <Text className="text-white font-mbold">{num}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                  </View>

                  {/* ACTION */}
                  <TouchableOpacity style={styles.playAgainBtn} onPress={clear}>
                    <Text style={styles.playAgainText}>▶ Play Again</Text>
                  </TouchableOpacity>

                </View>
              </View>
          </View>
      </Modal>
            
      </ScrollView>
    </LinearGradient>
  )
}

export default LotteryScreen

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
    fontSize: 10,
  },

  gold: {
    color: "#f6d98a",
    fontSize: 18,
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
    padding: 20
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

  pickedCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6e3da",
    justifyContent: "center",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },

  pickBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#2f5668",
    padding: 18,
  },

  pickText: {
    color: "#c7d6df",
    fontSize: 16,
  },

  multiplierPill: {
    backgroundColor: "#e3a843",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    fontWeight: "bold",
  },

   playAgainBtn: {
    backgroundColor: "#4fa3d1",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10
  },

  playAgainText: {
    color: "#0b1d26",
    fontSize: 18,
    fontWeight: "bold",
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