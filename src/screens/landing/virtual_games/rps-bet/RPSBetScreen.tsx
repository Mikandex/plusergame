import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import z from 'zod'
import Toast from 'react-native-toast-message'
import { useSfx } from '@/hooks/useSfx'

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(1000, "Maximum stake is 1000"),
  pick: z.enum(["rock", "paper", "scissors"], {
    message: "Please select a bet, either rock, paper or scissors",
  })
})

const RPSBetScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const sfx = useSfx()
  const [stake, setStake] = useState("50")
  const [payout, setPayout] = useState(0)
  const [multiplier, setMultiplier] = useState("5x")
  const [userChoice, setUserChoice] = useState("✋")
  const [aiChoice, setAiChoice] = useState("🤖")
  const [resultText, setResultText] = useState("choose your move")
  const [roundActive, setRoundActive] = useState(true)
  const [history, setHistory] = useState<boolean[]>([])
  const [loading, setLoading] = useState(false)
  const [choicePicked, setChoicePicked] = useState("")

  const iconMap: any = {
    rock: "✊",
    paper: "📄",
    scissors: "✂️"
  }

  const handlePlay = async (choice: string) => {
    if (loading) return;

    const result = schema.safeParse({ stake, pick: choice });
    
    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
      });
    }

    sfx.flip()
    setChoicePicked(choice)

    router.push("/(onboarding)/Register")

  }

  const resetGame = () => {
    sfx.next()
    setRoundActive(true)
    setUserChoice("✋")
    setAiChoice("🤖")
    setResultText("choose your move")
  }

  return (
    <LinearGradient colors={["#0b1d2e", "#071421"]} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, justifyContent: "space-between", gap: 20, padding: 12 }}
      >

        {/* HEADER */}
        <View className='flex-row gap-2 justify-between items-center flex-wrap' style={{ marginTop: top }}>
          <View className='flex-row gap-1 items-center'>
            <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()}>
              <Feather name="chevron-left" size={34} color="#f5d27a" />
            </TouchableOpacity>

            <View style={styles.logo}>
              <Text style={{ fontSize: 20 }}>✊</Text>
            </View>
            <Text style={styles.title}>rps bet</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.statBox}>
              <Text style={styles.small}>PAYOUT</Text>
              <Text style={styles.gold}>{payout}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.small}>MULTIPLIER</Text>
              <Text style={styles.gold}>{multiplier}</Text>
            </View>
          </View>
        </View>

        {/* STAKE */}
        <View style={styles.stakeContainer}>
          <Text style={styles.stakeLabel}>stake</Text>
          <View style={styles.stakeBox}>
            <TextInput
              value={String(stake)}
              onChangeText={(text) => setStake(text)}
              keyboardType="numeric"
              placeholder="Enter stake"
              placeholderTextColor="#9fb7a9"
              cursorColor="white"
              style={{
                backgroundColor: '#163447',
                borderRadius: 12,
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

        {/* VS */}
        <View style={styles.vsContainer}>
          <View style={styles.playerBox}>
            <Text style={styles.playerLabel}>you</Text>
            <Text style={styles.emoji}>{userChoice}</Text>
          </View>

          <Text style={styles.vs}>VS</Text>

          <View style={styles.playerBox}>
            <Text style={styles.playerLabel}>AI</Text>
            <Text style={styles.emoji}>{aiChoice}</Text>
          </View>
        </View>

        {/* CHOICES */}
        <View style={styles.choices}>
          <TouchableOpacity disabled={!roundActive || loading} style={styles.choiceBtn} onPress={() => handlePlay("rock")}>
            {loading && choicePicked === "rock" ? (
              <ActivityIndicator color="#f5d27a" />
            ) : (
              <Text style={styles.choiceEmoji}>✊</Text>
            )} 
          </TouchableOpacity>

          <TouchableOpacity disabled={!roundActive || loading} style={styles.choiceBtn} onPress={() => handlePlay("paper")}>
            {loading && choicePicked === "paper" ? (
              <ActivityIndicator color="#f5d27a" />
            ) : (
              <Text style={styles.choiceEmoji}>📄</Text>
            )} 
          </TouchableOpacity>

          <TouchableOpacity disabled={!roundActive || loading} style={styles.choiceBtn} onPress={() => handlePlay("scissors")}>
            {loading && choicePicked === "scissors" ? (
              <ActivityIndicator color="#f5d27a" />
            ) : (
              <Text style={styles.choiceEmoji}>✂️</Text>
            )} 
          </TouchableOpacity>
        </View>

        {/* MULTIPLIER */}
        <View style={styles.multiplierBar}>
          <Text style={styles.multiplierText}>{resultText}</Text>
          <View style={styles.multiplierBox}>
            <Text style={styles.multiplierValue}>{multiplier}</Text>
          </View>
        </View>

        {/* PLAY AGAIN */}
        <TouchableOpacity
          disabled={roundActive}
          style={[styles.playBtn, { marginBottom: bottom, opacity: roundActive ? 0.5 : 1 }]}
          onPress={resetGame}
        >
          <Text style={styles.playText}>▶ play again</Text>
        </TouchableOpacity>

        {/* FOOTER / HISTORY */}
        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last rolls 🔊 sound on</Text>

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length <= 0 ? (
              <Text className='text-white text-xl italic'>Play a round</Text>
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

export default RPSBetScreen

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2f6f88',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },

  title: {
    color: '#dce7f5',
    fontSize: 20,
  },

  headerRight: {
    flexDirection: 'row',
    gap: 12,
  },

  statBox: {
    backgroundColor: '#163447',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center'
  },

  small: {
    fontSize: 10,
    color: '#9fb6c9'
  },

  gold: {
    color: '#f5d27a',
    fontSize: 16,
    fontWeight: 'bold'
  },

  stakeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10
  },

  stakeLabel: {
    color: '#9fb6c9',
    fontSize: 16
  },

  stakeBox: {
    width: 150,
    backgroundColor: '#163447',
    padding: 15,
    borderRadius: 20
  },

  stakeValue: {
    color: '#f5d27a',
    fontSize: 18,
    fontWeight: 'bold'
  },

  vsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },

  playerBox: {
    backgroundColor: '#163447',
    padding: 30,
    borderRadius: 30,
    alignItems: 'center',
    width: 120,
    borderWidth: 1,
    borderColor: "#9fb6c9",
  },

  playerLabel: {
    color: '#9fb6c9',
    marginBottom: 10
  },

  emoji: {
    fontSize: 50
  },

  vs: {
    color: '#f5d27a',
    fontSize: 28,
    fontWeight: 'bold'
  },

  choices: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  },

  choiceBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#163447',
    justifyContent: 'center',
    alignItems: 'center'
  },

  choiceEmoji: {
    fontSize: 30
  },

  multiplierBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#163447',
    padding: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#9fb6c9",
  },

  multiplierText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },

  multiplierBox: {
    backgroundColor: '#f5d27a',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },

  multiplierValue: {
    color: '#0b1d2e',
    fontWeight: 'bold'
  },

  playBtn: {
    backgroundColor: '#358FCC',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center'
  },

  playText: {
    color: '#0b1d2e',
    fontSize: 20,
    fontWeight: 'bold'
  },

  footer: {
    gap: 4,
    backgroundColor: '#163447',
    padding: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#9fb6c9",
  },

  footerText: {
    color: "#e6e1c5",
    fontSize: 16,
    marginBottom: 10,
  }
})
