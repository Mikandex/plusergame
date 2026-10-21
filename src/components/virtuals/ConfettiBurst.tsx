import { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

const COLORS = ['#f6d98a', '#ffe08a', '#ff6b8a', '#c9a0ff', '#fff', '#ff9f43', '#7ee8a8']

type ConfettiBurstProps = {
  burst: number
  reduceMotion?: boolean
}

function Piece({ burst, i, reduceMotion }: { burst: number; i: number; reduceMotion: boolean }) {
  const x = useSharedValue(0)
  const y = useSharedValue(0)
  const r = useSharedValue(0)
  const o = useSharedValue(0)
  const s = useSharedValue(0.4)

  useEffect(() => {
    if (!burst) return
    if (reduceMotion) {
      o.value = 0
      return
    }
    const dx = ((i % 11) - 5) * (10 + (i % 4) * 4)
    const peak = -90 - (i % 6) * 14
    x.value = 0
    y.value = 0
    r.value = 0
    s.value = 0.45
    o.value = 1
    x.value = withTiming(dx, { duration: 920, easing: Easing.out(Easing.quad) })
    y.value = withSequence(
      withTiming(peak, { duration: 380, easing: Easing.out(Easing.cubic) }),
      withTiming(peak + 150, { duration: 700, easing: Easing.in(Easing.quad) }),
    )
    r.value = withTiming((i % 2 === 0 ? 1 : -1) * (220 + i * 17), { duration: 980 })
    s.value = withTiming(1, { duration: 180 })
    o.value = withDelay(640, withTiming(0, { duration: 280 }))
  }, [burst, i, o, r, reduceMotion, s, x, y])

  const style = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${r.value}deg` },
      { scale: s.value },
    ],
  }))

  const color = COLORS[i % COLORS.length]
  const ribbon = i % 4 === 0

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.piece,
        {
          backgroundColor: color,
          borderRadius: ribbon ? 1 : 5,
          width: ribbon ? 5 : 8,
          height: ribbon ? 14 : 8,
        },
        style,
      ]}
    />
  )
}

export default function ConfettiBurst({ burst, reduceMotion = false }: ConfettiBurstProps) {
  const pieces = useMemo(() => Array.from({ length: 34 }, (_, i) => i), [])
  if (!burst) return null

  return (
    <View pointerEvents="none" style={styles.wrap}>
      {pieces.map((i) => (
        <Piece key={`${burst}-${i}`} i={i} burst={burst} reduceMotion={reduceMotion} />
      ))}
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
    justifyContent: 'flex-start',
    paddingTop: 8,
    zIndex: 12,
  },
  piece: {
    position: 'absolute',
    top: 36,
  },
})
