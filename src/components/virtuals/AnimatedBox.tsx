import React, { useEffect } from 'react'
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withSpring,
  cancelAnimation
} from 'react-native-reanimated'

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

const AnimatedBox = ({ box, index, onPress, disabled, loading }: { box: { revealed: boolean, prize: boolean} , index: number, onPress: (index: number) => void, disabled: boolean, loading: boolean }) => {
  const scale = useSharedValue(1)

  useEffect(() => {
    // STOP everything when loading
    if (loading) {
      cancelAnimation(scale)
      scale.value = withTiming(1) // reset to normal size
      return
    }

    // normal pulse when active
    if (!box.revealed) {
        scale.value = withRepeat(
        withSequence(
            withTiming(1.08, { duration: 500 }),
            withTiming(1, { duration: 500 })
        ),
        -1,
        true
        )
    } else {
        cancelAnimation(scale)
        scale.value = withSpring(1)
    }
    }, [box.revealed, loading])

  // press animation
  const handlePress = () => {
    if (loading || disabled) return
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withSpring(1)
    )

    onPress(index)
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  return (
    <AnimatedTouchable
      style={[styles.box, animatedStyle, disabled && { opacity: 0.8 }]}
      onPress={handlePress}
      disabled={loading || disabled}
      activeOpacity={0.8}
    >
      <Text style={styles.boxEmoji}>
        {box?.revealed ? (box?.prize ? "💰" : "😞") : "🎁"}
      </Text>

      <View style={styles.boxNumber}>
        <Text style={styles.boxNumberText}>
          {box?.revealed ? (box?.prize ? "WIN" : "LOSE") : index + 1}
        </Text>
      </View>
    </AnimatedTouchable>
  )
}

export default AnimatedBox


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
    backgroundColor: '#6c4bb8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },

  title: {
    color: '#e5dcff',
    fontSize: 20
  },

  balanceBox: {
    backgroundColor: '#2d214a',
    padding: 14,
    borderRadius: 20
  },

  small: {
    fontSize: 10,
    color: '#b9a7e6'
  },

  gold: {
    color: '#f6d98a',
    fontSize: 18,
    fontWeight: 'bold'
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  stakeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2d214a',
    padding: 10,
    borderRadius: 25
  },

  stakeLabel: {
    color: '#c7bff0',
    marginRight: 10
  },

  stakeValueBox: {
    backgroundColor: '#1a1230',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20
  },

  stakeValue: {
    color: '#f6d98a',
    fontWeight: 'bold'
  },

  multiplierBtn: {
    backgroundColor: '#b18cff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 20
  },

  multiplierText: {
    fontWeight: 'bold',
    fontSize: 18
  },

  optionRow: {
    flexDirection: 'row',
    gap: 15,
    justifyContent: 'flex-end'
  },

  optionBtn: {
    backgroundColor: '#6b56a5',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20
  },

  boxRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10
  },

  box: {
    width: 110,
    height: 140,
    borderRadius: 25,
    backgroundColor: '#d2b48c',
    justifyContent: 'center',
    alignItems: 'center'
  },

  boxEmoji: {
    fontSize: 40
  },

  boxNumber: {
    marginTop: 10,
    backgroundColor: '#3b2b5a',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 15
  },

  boxNumberText: {
    color: '#fff'
  },

  pickBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#2d214a',
    padding: 20,
    borderRadius: 30
  },

  pickText: {
    color: '#e5dcff',
    fontSize: 18
  },

  multiplierResult: {
    backgroundColor: '#f6d98a',
    paddingHorizontal: 20,
    borderRadius: 20
  },

  multiplierResultText: {
    fontWeight: 'bold'
  },

  openBtn: {
    backgroundColor: '#5a4a7d',
    padding: 20,
    borderRadius: 30,
    alignItems: 'center'
  },

  openText: {
    fontSize: 20,
    fontWeight: 'bold'
  },

  footer: {
    backgroundColor: '#2d214a',
    padding: 20,
    borderRadius: 30
  },

  footerText: {
    color: '#c7bff0'
  },

  footerHint: {
    marginTop: 10,
    color: '#b9a7e6',
    fontStyle: 'italic'
  }
})
