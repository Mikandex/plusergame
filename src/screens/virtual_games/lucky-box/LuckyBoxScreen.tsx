import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import AnimatedBox from '@/components/virtuals/AnimatedBox'

import { z } from "zod"
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(1000, "Maximum stake is 1000"),
  pick: z.number()
})

type Box = {
  revealed: boolean
  prize: boolean
}

type Result = {
  isWin: boolean
  message: string
  payout: number
  multiplier: string
  systemPick: number | null
  userPick: number | null
}

const LuckyBoxScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const [stake, setStake] = useState("50")
  const [boxCount, setBoxCount] = useState(3)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [gameActive, setGameActive] = useState(true)
  const [resultText, setResultText] = useState("🎁 pick a box")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Result>({
    isWin: false,
    message: "",
    payout: 0,
    multiplier: "2.5x",
    systemPick: null,
    userPick: null
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [fetchWallet, setFetchWallet] = useState(false)
  const sfx = useSfx()

  // INIT EMPTY BOXES
  const initBoxes = (count: number) => {
    const newBoxes = Array.from({ length: count }, () => ({
      revealed: false,
      prize: false
    }))

    setBoxes(newBoxes)
    setGameActive(true)
  }

  useEffect(() => {
    initBoxes(3)
  }, [])

  // PLAY
  const handlePick = async (index: number) => {
    if (!gameActive || loading) return

    const result = schema.safeParse({ stake, pick: index + 1 });
      
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

      const res = await axiosClient.post('/virtual/box', {
        pick: index + 1,
        stake: Number(stake)
      })

      const data = res.data
      console.log("box data:", data)

      const correct: boolean = data.game.is_win
 
      //outcome sound
      if (correct) {
        sfx.win()
      } else {
        sfx.lose()
      }

      const systemPickIndex = data.game.system_pick - 1 // if backend is 1-based
      const userPickIndex = data.game.user_picked - 1

      const updatedBoxes = Array.from({ length: boxCount }, (_, i) => ({
        revealed: true,
        prize: i === systemPickIndex
      }))

      setBoxes(updatedBoxes)

      setGameActive(false)
      setHistory(prev => [correct, ...prev].slice(0, 20))
      setResult({
        isWin: correct,
        message: data.message,
        payout: data.game.payout || 0,
        multiplier: data.game.multiplier,
        systemPick: data.game.system_pick,
        userPick: data.game.user_picked
      })

      if (data.game.is_win) {
        setResultText(`💰 WIN! +${data.game.payout}`)
      } else {
        setResultText(`😞 LOSE... -${stake}`)
      }

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

  //  NEW ROUND
  const newRound = () => {
    if (loading) return
    sfx.next()

    initBoxes(boxCount)
    setResultText("🎁 pick a box")
    setGameActive(true)
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
      colors={["#1a0f2b", "#0d061a"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 20, padding: 12 }}
      >
        {/* HEADER */}
        <View className='flex-row gap-2 justify-between items-center flex-wrap' style={{ marginTop: top }}>
          <View className='flex-row gap-1 items-center'>
            <TouchableOpacity activeOpacity={0.8} onPress={goBack}>
              <Feather name="chevron-left" size={34} color="#d2b48c" />
            </TouchableOpacity> 

            <View style={styles.logo}>
              <Text style={{ fontSize: 20 }}>🎁</Text>
            </View>
            <Text style={styles.title}>lucky box</Text>
          </View>

          <View style={styles.balanceBox}>
            <Text style={styles.small}>PAYOUT</Text>
            <Text style={styles.gold}>{result?.payout}</Text>
          </View>
        </View>

        {/* STAKE + MULTIPLIER */}
        <View style={styles.row}>
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

          <View style={styles.multiplierBtn}>
            <Text style={styles.multiplierText}>{result?.multiplier}</Text>
          </View>
        </View>

        {/* BOX OPTIONS */}
        {/* <View style={styles.optionRow}>
          <TouchableOpacity style={styles.optionBtn} 
            onPress={() => {
              setBoxCount(3)
              initBoxes(3)   // use value directly
              setResultText("🎁 pick a box")
            }}
          >
            <Text>3 boxes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionBtn} 
            onPress={() => {
              setBoxCount(5)
              initBoxes(5)   // use value directly
              setResultText("🎁 pick a box")
            }}
          >
            <Text>5 boxes</Text>
          </TouchableOpacity>
        </View> */}

        {/* BOXES */}
        <View style={styles.boxRow}>
          {boxes.map((box, i) => (
            <AnimatedBox
              key={i}
              box={box}
              index={i}
              onPress={handlePick}
              disabled={!gameActive}
              loading={loading}
            />
          ))}
        </View>

        {/* PICK BAR */}
        <View style={styles.pickBar}>
          {loading ? (
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <ActivityIndicator size={"small"} color="#fff" />
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#fff" }}>Loading...</Text>
            </View>
          ) : (
            <Text style={styles.pickText}>{resultText}</Text>
          )}
          <View style={styles.multiplierResult}>
            <Text style={styles.multiplierResultText}>{result?.multiplier}</Text>
          </View>
        </View>

        {/* ACTION BUTTON */}
        <TouchableOpacity style={styles.openBtn} className={`${gameActive ? 'opacity-60' : ''}`} disabled={gameActive} onPress={newRound}>
          <Text style={styles.openText}>✨ open new boxes</Text>
        </TouchableOpacity>

        {/* FOOTER */}
        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last picks   🔊 sound on</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length === 0 ? (
              <Text style={styles.footerHint}>pick a box</Text>
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

export default LuckyBoxScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6c4bb8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },

  title: {
    color: '#e5dcff',
    fontSize: 20
  },

  balanceBox: {
    backgroundColor: '#2d214a',
    padding: 14,
    borderRadius: 14
  },

  small: {
    fontSize: 10,
    color: '#b9a7e6'
  },

  gold: {
    color: '#f6d98a',
    fontSize: 18,
    fontWeight: 'bold'
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
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

  stakeValueBox: {
    backgroundColor: '#1a1230',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },

  stakeValue: {
    color: '#f6d98a',
    fontWeight: 'bold'
  },

  multiplierBtn: {
    backgroundColor: '#b18cff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20
  },

  multiplierText: {
    fontWeight: 'bold',
    fontSize: 18
  },

  optionRow: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'flex-end'
  },

  optionBtn: {
    backgroundColor: '#6b56a5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },

  boxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  },

  box: {
    width: 110,
    height: 140,
    borderRadius: 25,
    backgroundColor: '#d2b48c',
    justifyContent: 'center',
    alignItems: 'center'
  },

  boxEmoji: {
    fontSize: 40
  },

  boxNumber: {
    marginTop: 10,
    backgroundColor: '#3b2b5a',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15
  },

  boxNumberText: {
    color: '#fff'
  },

  pickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: "wrap",
    gap: 8,
    backgroundColor: '#2d214a',
    padding: 20,
    borderRadius: 30
  },

  pickText: {
    color: '#e5dcff',
    fontSize: 18,
    fontWeight: '700'
  },

  multiplierResult: {
    backgroundColor: '#f6d98a',
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
     justifyContent: 'center'
  },

  multiplierResultText: {
    fontWeight: 'bold'
  },

  openBtn: {
    backgroundColor: '#b18cff',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center'
  },

  openText: {
    fontSize: 20,
    fontWeight: 'bold'
  },

  footer: {
    backgroundColor: '#2d214a',
    padding: 20,
    borderRadius: 30
  },

  footerText: {
    color: '#c7bff0',
    marginBottom: 10,
  },

  footerHint: {
    marginTop: 10,
    color: '#b9a7e6',
    fontStyle: 'italic'
  },

  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6
  },
})
