import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

type RoundResultOverlayProps = {
  visible: boolean
  isWin: boolean
  title: string
  detail?: string
  reduceMotion?: boolean
}

export default function RoundResultOverlay({
  visible,
  isWin,
  title,
  detail,
  reduceMotion = false,
}: RoundResultOverlayProps) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.86)

  useEffect(() => {
    cancelAnimation(opacity)
    cancelAnimation(scale)

    if (!visible) {
      opacity.value = withTiming(0, { duration: reduceMotion ? 80 : 220 })
      scale.value = 0.86
      return
    }

    if (reduceMotion) {
      opacity.value = 1
      scale.value = 1
      return
    }

    opacity.value = withTiming(1, { duration: 180 })
    scale.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.back(1.4)) })
  }, [visible, isWin, reduceMotion, opacity, scale])

  const flashStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  if (!visible) {
    return null
  }

  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        style={[
          styles.card,
          isWin ? styles.win : styles.lose,
          flashStyle,
        ]}
      >
        <Text style={styles.kicker}>{isWin ? 'WIN' : 'LOSS'}</Text>
        <Text style={styles.title}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    minWidth: 220,
    paddingVertical: 22,
    paddingHorizontal: 28,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  win: {
    backgroundColor: 'rgba(15,59,46,0.92)',
    borderColor: 'rgba(202,168,94,0.85)',
  },
  lose: {
    backgroundColor: 'rgba(48,18,16,0.92)',
    borderColor: 'rgba(196,90,51,0.85)',
  },
  kicker: {
    color: '#caa85e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
  },
  detail: {
    color: '#e6e1c5',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
})
