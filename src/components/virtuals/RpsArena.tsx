import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import RpsSign, { type RpsMove } from '@/components/virtuals/RpsSign'
import ConfettiBurst from '@/components/virtuals/ConfettiBurst'

type RpsArenaProps = {
  you: RpsMove | 'unknown'
  house: RpsMove | 'unknown'
  clashing: boolean
  winner: 'user' | 'ai' | 'draw' | null
  reduceMotion?: boolean
}

export default function RpsArena({ you, house, clashing, winner, reduceMotion = false }: RpsArenaProps) {
  const slam = useSharedValue(0)
  const bounce = useSharedValue(0)

  useEffect(() => {
    if (clashing && !reduceMotion) {
      bounce.value = withRepeat(
        withSequence(
          withTiming(-16, { duration: 90 }),
          withTiming(10, { duration: 90 }),
        ),
        -1,
        true,
      )
      slam.value = withTiming(0.35, { duration: 180 })
      return
    }
    bounce.value = withTiming(0, { duration: 120 })
    slam.value = winner
      ? withSpring(1, { damping: 12, stiffness: 160 })
      : withTiming(0, { duration: 200 })
  }, [clashing, winner, reduceMotion, bounce, slam])

  const youStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(slam.value, [0, 1], [0, 10]) + bounce.value },
      { rotateZ: `${interpolate(slam.value, [0, 1], [-6, -2])}deg` },
      { scale: winner === 'ai' ? 0.9 : 1 },
    ],
    opacity: winner === 'ai' ? 0.55 : 1,
  }))

  const houseStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(slam.value, [0, 1], [0, -10]) - bounce.value },
      { rotateZ: `${interpolate(slam.value, [0, 1], [6, 2])}deg` },
      { scale: winner === 'user' ? 0.9 : 1 },
    ],
    opacity: winner === 'user' ? 0.55 : 1,
  }))

  const vsStyle = useAnimatedStyle(() => ({
    transform: [{ scale: clashing ? interpolate(bounce.value, [-16, 10], [0.86, 1.12]) : 1 }],
  }))

  return (
    <LinearGradient colors={['#0a2433', '#071821']} style={styles.stage}>
      {winner === 'user' ? <ConfettiBurst burst={3} reduceMotion={reduceMotion} /> : null}
      <View style={styles.row}>
        <Animated.View style={[styles.pad, winner === 'user' && styles.padWin, youStyle]}>
          <Text style={styles.label}>YOU</Text>
          <RpsSign move={clashing ? 'rock' : you} size={92} />
        </Animated.View>

        <Animated.View style={[styles.vsWrap, vsStyle]}>
          <Text style={styles.vs}>VS</Text>
        </Animated.View>

        <Animated.View style={[styles.pad, winner === 'ai' && styles.padWin, houseStyle]}>
          <Text style={styles.label}>AI</Text>
          <RpsSign move={clashing ? 'rock' : house} size={92} />
        </Animated.View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  stage: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.4)',
    overflow: 'hidden',
    minHeight: 200,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pad: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(22,52,71,0.85)',
    borderRadius: 20,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(159,182,201,0.35)',
  },
  padWin: {
    borderColor: '#f5d27a',
    shadowColor: '#f5d27a',
    shadowOpacity: 0.55,
    shadowRadius: 12,
  },
  label: {
    color: '#9fb6c9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 8,
  },
  vsWrap: {
    width: 52,
    alignItems: 'center',
  },
  vs: {
    color: '#f5d27a',
    fontSize: 18,
    fontWeight: '900',
  },
})
