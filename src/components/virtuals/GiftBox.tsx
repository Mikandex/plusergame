import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  cancelAnimation,
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import ConfettiBurst from '@/components/virtuals/ConfettiBurst'

type GiftBoxProps = {
  index: number
  revealed: boolean
  prize: boolean
  shaking?: boolean
  disabled?: boolean
  reduceMotion?: boolean
  onPress: (index: number) => void
}

const THEMES = [
  {
    front: ['#9b2d5b', '#5c1636'] as [string, string],
    side: ['#6e1d40', '#3a0e22'] as [string, string],
    top: ['#c44a78', '#7a2348'] as [string, string],
  },
  {
    front: ['#4b3aad', '#241a68'] as [string, string],
    side: ['#32277a', '#160e42'] as [string, string],
    top: ['#6d5cd6', '#3a2c96'] as [string, string],
  },
  {
    front: ['#c47a22', '#7a430c'] as [string, string],
    side: ['#8a5110', '#4a2a08'] as [string, string],
    top: ['#e8a63a', '#a86412'] as [string, string],
  },
]

export default function GiftBox({
  index,
  revealed,
  prize,
  shaking = false,
  disabled = false,
  reduceMotion = false,
  onPress,
}: GiftBoxProps) {
  const open = useSharedValue(0)
  const wobble = useSharedValue(0)
  const idle = useSharedValue(0)

  useEffect(() => {
    cancelAnimation(idle)
    if (!revealed && !shaking && !reduceMotion) {
      idle.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      )
    } else {
      idle.value = withTiming(0, { duration: 160 })
    }
  }, [revealed, shaking, reduceMotion, idle])

  useEffect(() => {
    cancelAnimation(wobble)
    if (shaking && !revealed && !reduceMotion) {
      wobble.value = withRepeat(
        withSequence(withTiming(-6, { duration: 55 }), withTiming(6, { duration: 55 })),
        -1,
        true,
      )
    } else {
      wobble.value = withTiming(0, { duration: 100 })
    }
  }, [shaking, revealed, reduceMotion, wobble])

  useEffect(() => {
    if (revealed) {
      open.value = reduceMotion ? 1 : withSpring(1, { damping: 13, stiffness: 120 })
    } else {
      open.value = withTiming(0, { duration: 240 })
    }
  }, [revealed, prize, reduceMotion, open])

  const stageStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${wobble.value}deg` }, { translateY: interpolate(idle.value, [0, 1], [0, -5]) }],
  }))

  const lidStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(open.value, [0, 1], [0, -46]) },
      { translateX: interpolate(open.value, [0, 1], [0, 18]) },
      { rotateZ: `${interpolate(open.value, [0, 1], [0, -28])}deg` },
      { scaleY: interpolate(open.value, [0, 1], [1, 0.72]) },
    ],
  }))

  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 1], [0.45, 0.18]),
    transform: [{ scaleX: interpolate(open.value, [0, 1], [1, 0.82]) }],
  }))

  const cavityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(open.value, [0, 0.35, 1], [0, 0.4, 1]),
  }))

  const theme = THEMES[index % THEMES.length]

  return (
    <Pressable
      onPress={() => {
        if (!disabled) onPress(index)
      }}
      disabled={disabled}
      style={styles.press}
    >
      <Animated.View style={[styles.stage, stageStyle]}>
        {prize && revealed ? <ConfettiBurst burst={index + 10} reduceMotion={reduceMotion} /> : null}

        <Animated.View style={[styles.shadow, shadowStyle]} />

        <View style={styles.iso}>
          <LinearGradient colors={theme.side} start={[0, 0]} end={[1, 1]} style={styles.side}>
            <View style={styles.sideRibbon} />
          </LinearGradient>

          <LinearGradient colors={theme.front} start={[0.15, 0]} end={[0.9, 1]} style={styles.front}>
            <View style={styles.frontShine} />
            <View style={styles.ribbonV} />
            <View style={styles.ribbonH} />
            <Animated.View style={[styles.cavity, cavityStyle]}>
              {prize ? (
                <LinearGradient colors={['#fff6c8', '#f0c14a', '#b8860b']} style={styles.gem}>
                  <View style={styles.gemShine} />
                </LinearGradient>
              ) : (
                <View style={styles.empty} />
              )}
            </Animated.View>
          </LinearGradient>

          <Animated.View style={[styles.lidGroup, lidStyle]}>
            <LinearGradient colors={['#ffe9a8', '#d4af37', '#9a7210']} start={[0, 0]} end={[1, 1]} style={styles.lidTop}>
              <View style={styles.lidTopRibbon} />
              <View style={styles.bowLeft} />
              <View style={styles.bowRight} />
              <View style={styles.bowKnot} />
            </LinearGradient>
            <LinearGradient colors={['#e8c547', '#c9a227']} start={[0, 0]} end={[0, 1]} style={styles.lidFront}>
              <View style={styles.lidFrontRibbon} />
            </LinearGradient>
            <View style={styles.lidSide} />
          </Animated.View>
        </View>
      </Animated.View>
      <Text style={styles.caption}>{index + 1}</Text>
    </Pressable>
  )
}

const FRONT_W = 78
const FRONT_H = 64
const DEPTH = 22

const styles = StyleSheet.create({
  press: {
    alignItems: 'center',
    width: 118,
  },
  stage: {
    width: 118,
    height: 150,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  shadow: {
    position: 'absolute',
    bottom: 6,
    width: 86,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000',
  },
  iso: {
    width: FRONT_W + DEPTH,
    height: FRONT_H + DEPTH + 28,
    marginBottom: 10,
  },
  front: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: FRONT_W,
    height: FRONT_H,
    overflow: 'hidden',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,220,140,0.22)',
  },
  frontShine: {
    position: 'absolute',
    left: 6,
    top: 0,
    bottom: 0,
    width: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  side: {
    position: 'absolute',
    left: FRONT_W,
    bottom: 11,
    width: DEPTH,
    height: FRONT_H,
    transform: [{ skewY: '-28deg' }],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  sideRibbon: {
    position: 'absolute',
    top: 26,
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: '#f6d98a',
  },
  ribbonV: {
    position: 'absolute',
    left: FRONT_W / 2 - 8,
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: '#f6d98a',
  },
  ribbonH: {
    position: 'absolute',
    top: FRONT_H / 2 - 7,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: '#f6d98a',
  },
  cavity: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(8,4,16,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gem: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  gemShine: {
    marginTop: 5,
    width: 10,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  empty: {
    width: 22,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  lidGroup: {
    position: 'absolute',
    left: 0,
    bottom: FRONT_H - 6,
    width: FRONT_W + DEPTH,
    height: DEPTH + 20,
    zIndex: 5,
  },
  lidTop: {
    position: 'absolute',
    left: DEPTH / 2 - 2,
    top: 0,
    width: FRONT_W,
    height: DEPTH,
    transform: [{ skewX: '-28deg' }],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,240,180,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lidTopRibbon: {
    position: 'absolute',
    left: FRONT_W / 2 - 8,
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: '#c45a33',
    opacity: 0.9,
  },
  bowLeft: {
    position: 'absolute',
    left: FRONT_W / 2 - 18,
    width: 16,
    height: 10,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
  },
  bowRight: {
    position: 'absolute',
    left: FRONT_W / 2 + 2,
    width: 16,
    height: 10,
    borderRadius: 8,
    backgroundColor: '#ff6b6b',
  },
  bowKnot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f6d98a',
    zIndex: 2,
  },
  lidFront: {
    position: 'absolute',
    left: 0,
    top: DEPTH - 4,
    width: FRONT_W,
    height: 16,
    overflow: 'hidden',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  lidFrontRibbon: {
    position: 'absolute',
    left: FRONT_W / 2 - 8,
    top: 0,
    bottom: 0,
    width: 16,
    backgroundColor: '#c45a33',
  },
  lidSide: {
    position: 'absolute',
    left: FRONT_W,
    top: DEPTH - 12,
    width: DEPTH,
    height: 16,
    backgroundColor: '#8a6a14',
    transform: [{ skewY: '-28deg' }],
  },
  caption: {
    marginTop: 2,
    color: '#e5dcff',
    fontWeight: '800',
    fontSize: 13,
  },
})
