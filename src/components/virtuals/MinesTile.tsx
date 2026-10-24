import { useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg'

export type TileState = 'hidden' | 'gem' | 'mine' | 'hit' | 'gem-faded' | 'mine-faded'

export function GemIcon({ size }: { size: number }) {
  return (
    <Svg width={size} height={size} viewBox="-50 -50 100 100">
      <Defs>
        <LinearGradient id="gemFill" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#c9ffdc" />
          <Stop offset="0.5" stopColor="#22d36b" />
          <Stop offset="1" stopColor="#0b7a3a" />
        </LinearGradient>
      </Defs>
      <Path d="M-38 -12 L-22 -34 L22 -34 L38 -12 L0 40 Z" fill="url(#gemFill)" stroke="#065f2c" strokeWidth={3} />
      <Path d="M-38 -12 L38 -12 M-22 -34 L-10 -12 L0 40 L10 -12 L22 -34" stroke="#eafff2" strokeWidth={2} fill="none" opacity={0.75} />
      <Path d="M-14 -28 L-4 -28 L-10 -16 Z" fill="#ffffff" opacity={0.8} />
    </Svg>
  )
}

export function MineIcon({ size }: { size: number }) {
  const spikes = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <Svg width={size} height={size} viewBox="-50 -50 100 100">
      <Defs>
        <RadialGradient id="mineFill" cx="0.35" cy="0.3" r="0.8">
          <Stop offset="0" stopColor="#7b8494" />
          <Stop offset="0.5" stopColor="#262b36" />
          <Stop offset="1" stopColor="#07080b" />
        </RadialGradient>
      </Defs>
      <G>
        {spikes.map((a) => {
          const r = (a * Math.PI) / 180
          return (
            <Line
              key={a}
              x1={Math.cos(r) * 26}
              y1={Math.sin(r) * 26}
              x2={Math.cos(r) * 40}
              y2={Math.sin(r) * 40}
              stroke="#262b36"
              strokeWidth={9}
              strokeLinecap="round"
            />
          )
        })}
      </G>
      <Circle r={30} fill="url(#mineFill)" stroke="#000" strokeWidth={2} />
      <Ellipse cx={-10} cy={-12} rx={9} ry={6} fill="#ffffff" opacity={0.55} />
    </Svg>
  )
}

type MinesTileProps = {
  state: TileState
  size: number
  disabled: boolean
  onPress: () => void
}

export default function MinesTile({ state, size, disabled, onPress }: MinesTileProps) {
  const flip = useSharedValue(state === 'hidden' ? 0 : 1)
  const pop = useSharedValue(1)
  const shake = useSharedValue(0)

  useEffect(() => {
    if (state === 'hidden') {
      flip.value = 0
      return
    }
    flip.value = withTiming(1, { duration: 260 })
    if (state === 'gem') {
      pop.value = withSequence(withTiming(1.12, { duration: 140 }), withSpring(1, { damping: 7 }))
    }
    if (state === 'hit') {
      shake.value = withSequence(
        withTiming(-6, { duration: 50 }),
        withTiming(6, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      )
    }
  }, [state, flip, pop, shake])

  const style = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateY: `${(1 - flip.value) * 90}deg` },
      { scale: pop.value },
      { translateX: shake.value },
    ],
  }))

  const hidden = state === 'hidden'
  const faded = state === 'gem-faded' || state === 'mine-faded'
  const icon = Math.round(size * 0.62)

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || !hidden}
      style={({ pressed }) => [{ width: size, height: size }, pressed && hidden && !disabled && { transform: [{ scale: 0.94 }] }]}
      accessibilityRole="button"
      accessibilityLabel={hidden ? 'Hidden tile' : state.startsWith('gem') ? 'Gem' : 'Mine'}
    >
      {hidden ? (
        <View style={[styles.tile, styles.hidden, disabled && styles.idle]}>
          <View style={styles.shine} />
        </View>
      ) : (
        <Animated.View
          style={[
            styles.tile,
            styles.open,
            state === 'gem' && styles.gemGlow,
            state === 'hit' && styles.hit,
            faded && styles.faded,
            style,
          ]}
        >
          {state.startsWith('gem') ? <GemIcon size={icon} /> : <MineIcon size={icon} />}
        </Animated.View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  hidden: {
    backgroundColor: '#2b3a5c',
    borderWidth: 1,
    borderColor: '#4a5d86',
    borderBottomWidth: 4,
    borderBottomColor: '#1a243b',
  },
  idle: {
    opacity: 0.7,
  },
  shine: {
    position: 'absolute',
    top: 4,
    left: 6,
    right: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  open: {
    backgroundColor: '#0d1830',
    borderWidth: 1,
    borderColor: '#24365c',
  },
  gemGlow: {
    borderColor: '#3fe08a',
    backgroundColor: '#0f2a22',
  },
  hit: {
    borderColor: '#ff4d3d',
    backgroundColor: '#3a1414',
  },
  faded: {
    opacity: 0.4,
  },
})
