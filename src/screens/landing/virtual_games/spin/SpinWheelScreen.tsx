import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Feather } from '@expo/vector-icons'
import { router } from 'expo-router'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  withRepeat,
  Easing,
  cancelAnimation
} from 'react-native-reanimated'
import Svg, { G, Path, Text as SvgText } from 'react-native-svg'
import z from 'zod'
import Toast from 'react-native-toast-message'
import { useSfx } from '@/hooks/useSfx'

const schema = z.object({
  stake: z.coerce.number()
    .min(50, "Minimum stake is 50")
    .max(500, "Maximum stake is 500"),
});

const SpinWheelScreen = () => {
  const { top, bottom } = useSafeAreaInsets()
  const [stake, setStake] = useState("50")
  const [spinning, setSpinning] = useState(false)
  const [multiplier, setMultiplier] = useState("2x")
  const [resultText, setResultText] = useState("⬆️ spin the wheel")
  const [history, setHistory] = useState<boolean[]>([])
  const [payout, setPayout] = useState(0)
  const sfx = useSfx()

  const rotation = useSharedValue(0)
  // Track whether the component is still mounted to avoid setState after unmount
  const isMounted = useRef(true)

  useEffect(() => {
    return () => {
      isMounted.current = false
      cancelAnimation(rotation)
    }
  }, [])

  const segments = [
    { label: "❌", spin_value: 0 },
    { label: "🍒", spin_value: 2 },
    { label: "🍋", spin_value: 2.5 },
    { label: "🍋", spin_value: 3 },
    { label: "❌", spin_value: 0 },
    { label: "🔔", spin_value: 5 },
    { label: "🔔", spin_value: 7 },
    { label: "💎", spin_value: 10 },
  ]

  const animatedWheel = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }))

  const anglePerSegment = 360 / segments.length

  const spinWheel = async () => {
    if (spinning) return

    const result = schema.safeParse({ stake })

    if (!result.success) {
      const firstIssue = result.error.issues[0]
      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your input",
      })
    }

    sfx.flip()
    setSpinning(true)
    setResultText("spinning...")
    
    // Start a smooth infinite spin
    rotation.value = withRepeat(
      withTiming(rotation.value + 360, {
        duration: 800,
        easing: Easing.linear,
      }),
      -1
    )
    setSpinning(false)

    router.push("/(onboarding)/Register")
  }

  const handleResult = (result: { multiplier: string; payout: number; is_win: boolean }) => {
    if (!isMounted.current) return

    setHistory(prev => [...prev, result.is_win])
    setMultiplier(result.multiplier)
    if (result.is_win) {
      sfx.win()
      setPayout(result.payout)
      setResultText(`🎉 WIN! +${result.payout}`)
    } else {
      sfx.lose()
      setResultText(`❌ LOSE... -${stake}`)
    }
    setSpinning(false)
  }

  return (
    <LinearGradient
      colors={["#0c2036", "#071827"]}
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
              <Feather name="chevron-left" size={34} color="#fff" />
            </TouchableOpacity>
            <View style={styles.logo}>
              <Text style={{ fontSize: 22 }}>🎡</Text>
            </View>
            <Text style={styles.title}>Spin wheel</Text>
          </View>

          <View style={styles.balanceBox}>
            <Text style={styles.small}>PAYOUT</Text>
            <Text style={styles.gold}>{payout}</Text>
          </View>
        </View>

        {/* STAKE + HELP */}
        <View style={styles.row}>
          <View style={styles.stakeBox}>
            <Text style={styles.stakeLabel}>stake</Text>
            <View style={styles.counterRow}>
              <TextInput
                value={stake}
                onChangeText={(text) => {
                  // Only allow numeric input — prevents silent NaN coercion
                  if (/^\d*$/.test(text)) setStake(text)
                }}
                keyboardType="numeric"
                placeholder="Enter stake"
                placeholderTextColor="#9fb7a9"
                cursorColor="white"
                style={{
                  backgroundColor: '#102a44',
                  borderRadius: 16,
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

          <TouchableOpacity style={styles.helpBtn}>
            <Text style={styles.helpText}>?</Text>
          </TouchableOpacity>
        </View>

        {/* WHEEL */}
        <View style={styles.wheelWrapper}>
          <View style={styles.pointer} />
          <Pressable style={styles.shadowWrapper} onPress={spinWheel}>
            <Animated.View style={[styles.wheelOuter, animatedWheel]}>
              <View style={styles.wheelInner} />

              <Svg width={280} height={280} viewBox="0 0 280 280" style={{ position: 'absolute' }}>
                <G x={140} y={140}>
                  {segments.map((seg, i) => {
                    const startAngle = (i * anglePerSegment) * (Math.PI / 180)
                    const endAngle = ((i + 1) * anglePerSegment) * (Math.PI / 180)

                    const radius = 130

                    const x1 = radius * Math.cos(startAngle)
                    const y1 = radius * Math.sin(startAngle)

                    const x2 = radius * Math.cos(endAngle)
                    const y2 = radius * Math.sin(endAngle)

                    const largeArc = anglePerSegment > 180 ? 1 : 0

                    const pathData = `
                      M 0 0
                      L ${x1} ${y1}
                      A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}
                      Z
                    `

                    const midAngle = (startAngle + endAngle) / 2
                    const TEXT_RADIUS = 94

                    const textX = TEXT_RADIUS * Math.cos(midAngle)
                    const textY = TEXT_RADIUS * Math.sin(midAngle)
                    const midAngleDeg = (midAngle * 180) / Math.PI

                    return (
                      <G key={i}>
                        <Path
                          d={pathData}
                          fill={i % 2 === 0 ? '#eadbb5' : '#d7c39c'}
                          stroke="#caa96b"
                          strokeWidth={2}
                        />
                        <Path
                          d={`M 0 0 L ${x1} ${y1}`}
                          stroke="#b8903c"
                          strokeWidth={2}
                        />
                        <G rotation={midAngleDeg} origin={`${textX}, ${textY}`}>
                          <SvgText
                            x={textX}
                            y={textY - 10}
                            fontSize="16"
                            textAnchor="middle"
                          >
                            {seg.label}
                          </SvgText>
                          <SvgText
                            x={textX}
                            y={textY + 10}
                            fill="#2b2b2b"
                            fontSize="14"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {seg.spin_value > 0 ? `${seg.spin_value}x` : '0x'}
                          </SvgText>
                        </G>
                      </G>
                    )
                  })}

                  {/* OUTER GOLD RING */}
                  <Path
                    d={`M 0 -132 A 132 132 0 1 1 0 132 A 132 132 0 1 1 0 -132`}
                    stroke="#e3b75f"
                    strokeWidth={6}
                    fill="none"
                  />

                  {/* INNER GOLD RING */}
                  <Path
                    d={`M 0 -120 A 120 120 0 1 1 0 120 A 120 120 0 1 1 0 -120`}
                    stroke="#f3d27a"
                    strokeWidth={2}
                    fill="none"
                  />

                  {/* GOLD DOTS */}
                  {segments.map((_, i) => {
                    const angle = (i * anglePerSegment) * (Math.PI / 180)
                    const r = 132
                    const DOT_RADIUS = 6

                    const x = r * Math.cos(angle)
                    const y = r * Math.sin(angle)

                    return (
                      <G key={`dot-${i}`}>
                        <Path
                          d={`
                            M ${x} ${y}
                            m -${DOT_RADIUS}, 0
                            a ${DOT_RADIUS},${DOT_RADIUS} 0 1,0 ${DOT_RADIUS * 2},0
                            a ${DOT_RADIUS},${DOT_RADIUS} 0 1,0 -${DOT_RADIUS * 2},0
                          `}
                          fill="#e3b75f"
                        />
                      </G>
                    )
                  })}
                </G>
              </Svg>

              <View style={styles.centerDot} />
            </Animated.View>
          </Pressable>
        </View>

        {/* SPIN BAR */}
        <View style={styles.spinBar}>
          <Text style={styles.spinText}>{resultText}</Text>
          <View style={styles.multiplierBox}>
            <Text style={styles.multiplierText}>{multiplier}</Text>
          </View>
        </View>

        {/* MAIN BUTTON */}
        <TouchableOpacity
          style={[styles.spinBtn, spinning && { opacity: 0.5 }, { marginBottom: bottom }]}
          onPress={spinWheel}
          disabled={spinning}
        >
          <Text style={styles.spinBtnText}>{spinning ? "spinning..." : "🎡 LONG SPIN"}</Text>
        </TouchableOpacity>

        {/* FOOTER / HISTORY */}
        <View style={[styles.footer, { marginBottom: bottom }]}>
          <Text style={styles.footerText}>📋 last rolls 🔊 sound on</Text>

          <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
            {history.length === 0 ? (
              <Text style={{ color: '#9fb6c9', fontStyle: 'italic' }}>
                spin to start
              </Text>
            ) : (
              history.map((h, i) => (
                <View
                  key={i}
                  style={{
                    backgroundColor: '#2e4b77',
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

export default SpinWheelScreen

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
    backgroundColor: '#2e5f8a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  title: {
    color: '#dbe7f5',
    fontSize: 20
  },
  balanceBox: {
    backgroundColor: '#2a4a68',
    padding: 14,
    borderRadius: 10,
  },
  small: {
    fontSize: 10,
    color: '#9fb6c9'
  },
  gold: {
    color: '#f3d27a',
    fontSize: 16,
    fontWeight: 'bold'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stakeBox: {
    width: 150,
    backgroundColor: '#2a4a68',
    borderRadius: 30,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  stakeLabel: {
    color: '#c7d6e6',
    marginBottom: 6
  },
  counterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6
  },
  stakeValueBox: {
    backgroundColor: '#102a44',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  stakeValue: {
    color: '#f3d27a',
    fontWeight: 'bold'
  },
  helpBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e3b75f',
    justifyContent: 'center',
    alignItems: 'center'
  },
  helpText: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  wheelWrapper: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  pointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 18,
    borderRightWidth: 18,
    borderTopWidth: 36,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#e53935',
    marginBottom: -36,
    zIndex: 2
  },
  shadowWrapper: {
    width: 280,
    height: 280,
    borderRadius: 140,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 20,
  },
  wheelOuter: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#3b5d7a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wheelInner: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#d9cfbf',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 20,
    borderWidth: 6,
    borderColor: '#e3b75f',
  },
  centerDot: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3d27a',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 20,
  },
  spinBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a4a68',
    padding: 16,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "#9fb6c9",
    flexWrap: "wrap",
    gap: 8
  },
  spinText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  multiplierBox: {
    backgroundColor: '#e3b75f',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },
  multiplierText: {
    fontWeight: 'bold'
  },
  spinBtn: {
    backgroundColor: '#5f92c2',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center'
  },
  spinBtnText: {
    fontSize: 22,
    fontWeight: 'bold'
  },
  footer: {
    gap: 4,
    backgroundColor: '#2a4a68',
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