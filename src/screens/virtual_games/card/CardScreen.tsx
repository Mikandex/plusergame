import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Entypo, Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Toast from 'react-native-toast-message'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated'
import { z } from "zod";
import { useSfx } from '@/hooks/useSfx'
import getWallet from '@/utils/WalletApi'
import getUnreadNotifications from '@/utils/getUnreadNotifications'
import { axiosClient } from '@/globalApi'
import { images } from '@/constants'

type GameInfo = {
  nextCard: string | number;
  correct: boolean
  multiplier: string
  payout: number
  message: string
}

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(1000, "Maximum stake is 1000"),
});

const CardScreen = () => {

  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState("50")
  const [card, setCard] = useState<string | number>(0)
  const [cardSuit, setCardSuit] = useState("♠")
  const [loading, setLoading] = useState(false)
  const [loadingDefaultCard, setLoadingDefaultCard] = useState(true)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [gameInfo, setGameInfo] = useState<GameInfo>({
    nextCard: "",
    correct: false,
    multiplier: "2x",
    payout: 0,
    message: ""
  })
  const [history, setHistory] = useState<boolean[]>([])
  const [next, setNext] = useState(false)
  const [fetchWallet, setFetchWallet] = useState(false)

  const scale = useSharedValue(1)
  const translateY = useSharedValue(0)
  const rotateY = useSharedValue(0)

  const animateCard = () => {
    // start smaller (stronger press)
    scale.value = 0.85
    translateY.value = 20

    // big pop out + bounce
    scale.value = withSpring(1, {
      damping: 5,
      stiffness: 150,
    }, () => {
      // settle back to normal
      scale.value = withSpring(1.1, {
        damping: 6,
        stiffness: 120,
      })
    })

    translateY.value = withSpring(-10, {
      damping: 5,
      stiffness: 150,
    }, () => {
      translateY.value = withSpring(0)
    })
  }

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { perspective: 1000 }, // important for 3D feel
        { rotateY: `${rotateY.value}deg` },
        { scale: scale.value },
        { translateY: translateY.value },
      ],
    }
  })

  const handleNext = () => {
    if (loading) return
    
    sfx.flip()
    animateCard()

    rotateY.value = withTiming(90, { duration: 150 }, () => {
      rotateY.value = withTiming(0, { duration: 150 })
    })

    setNext(false)
    setGameInfo(prev => ({ ...prev, message: "" }))
    getDefaultCard() // fetches new session + new card
  }

  const getSuitData = (input: string) => {
    const suit = input.toLowerCase()

    switch (suit) {
      case "spades":
      case "♠":
        return { symbol: "♠", color: "#1f2f38" }

      case "hearts":
      case "♥":
        return { symbol: "♥", color: "#c03939" }

      case "diamonds":
      case "♦":
        return { symbol: "♦", color: "#c03939" }

      case "clubs":
      case "♣":
        return { symbol: "♣", color: "#1f2f38" }

      default:
        return { symbol: input, color: "#000" }
    }
  }

  const getRandomSuit = () => {
    const suits = ["♠", "♥", "♦", "♣"]
    return suits[Math.floor(Math.random() * suits.length)]
  }

  useEffect(() => {
    getDefaultCard()
  }, [])

  const getDefaultCard = async () => {
    try {
      setLoadingDefaultCard(true)
      const startRes = await axiosClient.get("/virtual/start-card")
      console.log("c=", startRes.data)
      sfx.next()
      const section_id = startRes.data.game.session_id
      const current_card = startRes.data.game.current_card
      const randomSuit = getRandomSuit() // randomize suit on each new round

      setSessionId(section_id)
      setCard(current_card || 0)
      setCardSuit(randomSuit)
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || "Something went wrong" })
    } finally {
      setLoadingDefaultCard(false)
    }
  }

  const handleGuess = async (guess: string) => {
    if (loading || !sessionId) return

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
    animateCard()

    try {
      setLoading(true)

      const res = await axiosClient.post("/virtual/pick-card", {
        guess, // "higher" or "lower"
        stake: Number(stake),
        session_id: sessionId,
      })

      const correct: boolean = res.data.game.correct
 
      //outcome sound
      if (correct) {
        sfx.win()
      } else {
        sfx.lose()
      }

      console.log("res=", res.data)

      setGameInfo({
        nextCard: res.data.game.next_card,
        correct: correct,
        multiplier: res.data.game.multiplier,
        payout: res.data.game.payout,
        message: res.data.message
      })
      setHistory(prev => [correct, ...prev].slice(0, 20))
      setNext(true)

      setFetchWallet(true)

    } catch (error: any) {
      sfx.error() 
      if(error.response?.status === 400 && error.response?.data?.message === "Session expired or invalid"){
        getDefaultCard() // reset game on error (like session expired)
        setHistory([])
        setGameInfo({
          nextCard: "",
          correct: false,
          multiplier: "",
          payout: 0,
          message: ""
        })
        setNext(false)
        Toast.show({
          type: 'error',
          text1: "Session expired. Starting a new game.",
        })
      } else{
        Toast.show({
          type: 'error',
          text1:
            error?.response?.data?.message?.stake ||
            error?.response?.data?.message ||
            "Something went wrong",
        })
      }
        console.log("e=",error.response?.data?.message)
      
    } finally {
      setLoading(false)
    }
  }

  const suitColor = getSuitData(cardSuit).color;

  const goBack = () => {
    if(fetchWallet){
      getWallet(false)
      getUnreadNotifications();
    }
    router.back()
  }

  return (
    <LinearGradient
      colors={["#0f3b2e", "#06281f"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "space-between",
          gap: 20,
          padding: 12,
        }}
      >

        {/* HEADER */}
        <View style={{ marginTop: top, flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <TouchableOpacity onPress={goBack}>
            <Feather name="chevron-left" size={34} color="#e6e1c5" />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Image
                source={images.jackOfSpades}
                style={{ width: 24, height: 24 }}
              />
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={styles.title}>Higher</Text>
              <Entypo name="arrow-long-up" size={18} color="#e6e1c5" />
              <Entypo name="arrow-long-down" size={18} color="#e6e1c5" />
              <Text style={styles.title}>Lower</Text>
            </View>
          </View>
        </View>

        {/* STATS */}
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
                  backgroundColor: "rgba(255,255,255,0.08)",
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

          <View style={styles.stats}>
            <View>
              <Text style={styles.statLabel}>PAYOUT</Text>
              <Text style={styles.statValue}>{gameInfo?.payout}</Text>
            </View>

            <View>
              <Text style={styles.statLabel}>MULTIPLIER</Text>
              <Text style={styles.statValue}>{gameInfo?.multiplier}</Text>
            </View>
          </View>
        </View>

        {/* CARD FLIP */}
        <View style={{ alignItems: "center" }}>
          <View style={{ width: 200, height: 240 }}>
            <Animated.View style={[styles.card, animatedStyle]}>
              {loadingDefaultCard ? (
                <ActivityIndicator size="large" color={suitColor} />
              ) : ( 
                !sessionId ? (
                  <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 12 }}>
                    <Text style={{ color: "#000", textAlign: "center" }}>No session. Please restart the game.</Text>
                    <TouchableOpacity onPress={getDefaultCard} style={{ backgroundColor: "#caa85e", padding: 12, borderRadius: 12 }}>
                      <Text style={{ color: "#000", fontSize: 14 }}>Restart Game</Text> 
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={[styles.cardNumber, { color: suitColor }]}>{card}</Text>
                    <Text style={[styles.cardSuit, { color: suitColor }]}>{cardSuit}</Text>
                    {loading && (
                      <ActivityIndicator size="large" color={suitColor} />
                    )}
                  </> 
                ))}
            </Animated.View>
          </View>
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <TouchableOpacity
            className={`${loading || loadingDefaultCard || next ? 'opacity-50' : ''}`}
            style={styles.greenBtn}
            disabled={loading || loadingDefaultCard || next}
            onPress={() => handleGuess("higher")}
          >
            <Text style={styles.btnText}><Entypo name="arrow-long-up" size={18} color="#e6e1c5" /> Higher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`${loading || loadingDefaultCard || next ? 'opacity-50' : ''}`}
            style={styles.orangeBtn}
            disabled={loading || loadingDefaultCard || next}
            onPress={() => handleGuess("lower")}
          >
            <Text style={styles.btnText}><Entypo name="arrow-long-down" size={18} color="#e6e1c5" /> Lower</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBox}>
          {/* LEFT TEXT */}
          {!gameInfo?.message ? (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Entypo name="arrow-long-up" size={18} color="#2f8f4e" /> 
              <Text className='text-white text-lg'>or</Text> 
              <Entypo name="arrow-long-up" size={18} color="#c45a33" /> 
              <Text className='text-white text-lg'>?</Text> 
            </View>
          ) : (
            <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6 }}>

              {gameInfo.correct ? (
                <>
                <Text className='text-white text-3xl'>✅</Text>
                <Text className='text-white font-msbold text-xl'>CORRECT! {gameInfo.multiplier}</Text>
                </>
              ) : (
                <>
                  <Text className='text-white text-3xl'>❌</Text>
                  <Text className='text-white font-msbold text-xl'>Wrong. it was {gameInfo.nextCard}</Text>
                </>
              )}
              
            </View>
          )}
          

          {/* RIGHT BUTTON */}
          <TouchableOpacity style={styles.nextBtn} disabled={loading || loadingDefaultCard || !next} onPress={handleNext}  className={`${loading || loadingDefaultCard || !next} ? 'opacity-50' : ''}`}>
            <Text style={styles.nextText}>next <Entypo name="arrow-long-right" size={16} color="#0f3b2e" /> </Text>
          </TouchableOpacity>

        </View>

        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last results 🔊 sound on</Text>
          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length <= 0 ? (
              <Text className='text-[#9fb7a9] text-lg italic'> Make your first guess</Text> 
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

export default CardScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#d4af37",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#e6e1c5",
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
    backgroundColor: "rgba(255,255,255,0.08)",
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

  stats: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    justifyContent:'space-between',
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    borderRadius: 25,
  },

  statLabel: {
    color: "#9fb7a9",
    fontSize: 12,
  },

  statValue: {
    color: "#e6d59b",
    fontSize: 22,
    fontWeight: "bold",
  },

  card: {
    width: 200,
    height: 240,
    backgroundColor: "#e9e5dc",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  cardNumber: {
    fontSize: 90,
    fontWeight: "bold",
  },

  cardSuit: {
    fontSize: 50
  },

  actions: {
    flexDirection: "row",
    marginTop: 20,
  },

  greenBtn: {
    flex: 1,
    backgroundColor: "#2f8f4e",
    padding: 20,
    borderRadius: 40,
    marginRight: 10,
    alignItems: "center",
  },

  orangeBtn: {
    flex: 1,
    backgroundColor: "#c45a33",
    padding: 20,
    borderRadius: 40,
    marginLeft: 10,
    alignItems: "center",
  },

  btnText: {
    color: "#fff",
    fontSize: 18,
  },

  bottomBox: {
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#caa85e",

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,

    //  gradient-like feel
    backgroundColor: "rgba(255,255,255,0.05)",
  },

  bottomText: {
    color: "#e6e1c5",
    fontSize: 18,
  },

  nextBtn: {
    backgroundColor: "#caa85e",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 30,

    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    flexShrink: 0 // prevent shrinking when text is long
  },

  nextText: {
    color: "#0f3b2e",
    fontSize: 18,
    fontWeight: "600",
  },

  /* LAST ROLLS */
  footer: {
    backgroundColor: "rgba(255,255,255,0.05)",
    gap: 4,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#caa85e",
  },

  footerText: {
    color: "#e6d59b",
    fontSize: 16,
    marginBottom: 10,
  },
})