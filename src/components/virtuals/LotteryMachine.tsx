import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import LotteryBall from '@/components/virtuals/LotteryBall'

type LotteryMachineProps = {
  drawing: boolean
  drawn: number[]
  matched: number[]
  revealed: number
  bingoNumber?: number
  reduceMotion?: boolean
}

function HopperBall({ index, active, reduceMotion }: { index: number; active: boolean; reduceMotion: boolean }) {
  const x = useSharedValue((index % 5) * 18 - 36)
  const y = useSharedValue(8 + (index % 3) * 10)

  useEffect(() => {
    if (reduceMotion || !active) {
      x.value = (index % 5) * 18 - 36
      y.value = 8 + (index % 3) * 10
      return
    }
    const dx = 10 + (index % 4) * 4
    const dy = 14 + (index % 3) * 5
    x.value = withDelay(
      index * 40,
      withRepeat(withTiming((index % 5) * 18 - 36 + dx, { duration: 240 + index * 18, easing: Easing.inOut(Easing.quad) }), -1, true),
    )
    y.value = withDelay(
      index * 30,
      withRepeat(
        withSequence(
          withTiming(-dy, { duration: 180 + index * 12 }),
          withTiming(dy * 0.4, { duration: 200 + index * 10 }),
        ),
        -1,
        true,
      ),
    )
  }, [active, index, reduceMotion, x, y])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }))

  return (
    <Animated.View style={[styles.hopperBall, style]}>
      <LotteryBall n={((index * 7) % 40) + 1} size={22} tone="idle" />
    </Animated.View>
  )
}

function DrawnBall({ n, hit, bingo }: { n: number; hit: boolean; bingo: boolean }) {
  const scale = useSharedValue(0.2)

  useEffect(() => {
    scale.value = withSpring(1, { damping: 11, stiffness: 190 })
  }, [scale])

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={style}>
      <LotteryBall n={n} size={46} tone={bingo ? 'bingo' : hit ? 'hit' : 'drawn'} />
    </Animated.View>
  )
}

export default function LotteryMachine({
  drawing,
  drawn,
  matched,
  revealed,
  bingoNumber = 0,
  reduceMotion = false,
}: LotteryMachineProps) {
  const shown = drawn.slice(0, revealed)
  const label = drawing
    ? 'Balls in the hopper…'
    : shown.length
      ? `${shown.length} drawn`
      : 'Pick 5, then draw'

  return (
    <LinearGradient colors={['#071820', '#0c3340', '#08141c']} start={[0.5, 0]} end={[0.5, 1]} style={styles.stage}>
      <View style={styles.cage}>
        <View style={styles.rim} />
        {drawing ? (
          <View style={styles.hopper}>
            {Array.from({ length: 8 }).map((_, i) => (
              <HopperBall key={i} index={i} active={drawing} reduceMotion={reduceMotion} />
            ))}
          </View>
        ) : (
          <Text style={styles.idleHint}>The draw lands here</Text>
        )}
      </View>

      <View style={styles.rail}>
        {shown.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => (
            <View key={`slot-${i}`} style={styles.emptySlot} />
          ))
        ) : (
          shown.map((n, i) => (
            <DrawnBall
              key={`d-${i}-${n}`}
              n={n}
              hit={matched.includes(n)}
              bingo={bingoNumber > 0 && n === bingoNumber}
            />
          ))
        )}
      </View>
      <Text style={styles.label}>{label}</Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  stage: {
    borderRadius: 28,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.28)',
    minHeight: 232,
  },
  cage: {
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(8,28,36,0.9)',
    borderWidth: 3,
    borderColor: 'rgba(180,210,220,0.18)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rim: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 56,
    borderWidth: 8,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  hopper: {
    width: 180,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hopperBall: {
    position: 'absolute',
  },
  idleHint: {
    color: '#6f8794',
    fontSize: 13,
    fontWeight: '600',
  },
  rail: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    minHeight: 46,
  },
  emptySlot: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(159,183,169,0.35)',
  },
  label: {
    marginTop: 12,
    textAlign: 'center',
    color: '#e6e1c5',
    fontSize: 15,
    fontWeight: '700',
  },
})
