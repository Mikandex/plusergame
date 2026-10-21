import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import SlotSymbol, { SLOT_ITEM, SLOT_SYMBOLS, normalizeSlotSymbol } from '@/components/virtuals/SlotSymbol'

type SlotReelProps = {
  target: string
  spinning: boolean
  stopDelay: number
  reduceMotion?: boolean
}

const STRIP = [...SLOT_SYMBOLS, ...SLOT_SYMBOLS, ...SLOT_SYMBOLS]
const N = SLOT_SYMBOLS.length
const LOOP = N * SLOT_ITEM

export default function SlotReel({ target, spinning, stopDelay, reduceMotion = false }: SlotReelProps) {
  const y = useSharedValue(-(N - 1) * SLOT_ITEM)
  const face = normalizeSlotSymbol(target)

  useEffect(() => {
    cancelAnimation(y)
    if (reduceMotion) {
      const idx = Math.max(0, SLOT_SYMBOLS.indexOf(face as (typeof SLOT_SYMBOLS)[number]))
      y.value = -((N + idx) - 1) * SLOT_ITEM
      return
    }

    if (spinning) {
      y.value = 0
      y.value = withRepeat(
        withTiming(-LOOP, { duration: 380, easing: Easing.linear }),
        -1,
        false,
      )
      return
    }

    const idx = Math.max(0, SLOT_SYMBOLS.indexOf(face as (typeof SLOT_SYMBOLS)[number]))
    const dest = -((N + idx) - 1) * SLOT_ITEM
    const t = setTimeout(() => {
      cancelAnimation(y)
      y.value = withTiming(dest, { duration: 620, easing: Easing.out(Easing.cubic) })
    }, stopDelay)
    return () => clearTimeout(t)
  }, [spinning, face, stopDelay, reduceMotion, y])

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }))

  return (
    <View style={styles.window}>
      <Animated.View style={style}>
        {STRIP.map((sym, i) => (
          <SlotSymbol key={`${sym}-${i}`} symbol={sym} />
        ))}
      </Animated.View>
      <View pointerEvents="none" style={styles.payline} />
      <View pointerEvents="none" style={styles.glassTop} />
      <View pointerEvents="none" style={styles.glassBot} />
    </View>
  )
}

const styles = StyleSheet.create({
  window: {
    width: SLOT_ITEM,
    height: SLOT_ITEM * 3,
    overflow: 'hidden',
    backgroundColor: '#0e0a14',
    borderRadius: 6,
  },
  payline: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: SLOT_ITEM,
    height: SLOT_ITEM,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(246,217,138,0.85)',
  },
  glassTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SLOT_ITEM * 0.92,
    backgroundColor: 'rgba(8,6,14,0.42)',
  },
  glassBot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SLOT_ITEM * 0.92,
    backgroundColor: 'rgba(8,6,14,0.42)',
  },
})
