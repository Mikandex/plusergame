import { StyleSheet, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export type RpsMove = 'rock' | 'paper' | 'scissors'

type RpsSignProps = {
  move: RpsMove | 'unknown'
  size?: number
}

export default function RpsSign({ move, size = 88 }: RpsSignProps) {
  if (move === 'unknown') {
    return (
      <View style={[styles.unknown, { width: size, height: size, borderRadius: size / 5 }]}>
        <View style={styles.qDot} />
        <View style={styles.qDot} />
        <View style={styles.qDot} />
      </View>
    )
  }

  if (move === 'rock') {
    return (
      <LinearGradient
        colors={['#e8c9a0', '#b07a48', '#6e4424']}
        start={[0.2, 0]}
        end={[0.9, 1]}
        style={[styles.rock, { width: size, height: size, borderRadius: size / 2.2 }]}
      >
        <View style={[styles.knuckle, { top: size * 0.28, left: size * 0.18 }]} />
        <View style={[styles.knuckle, { top: size * 0.22, left: size * 0.4 }]} />
        <View style={[styles.knuckle, { top: size * 0.28, left: size * 0.62 }]} />
        <View style={[styles.rockShine, { width: size * 0.28, height: size * 0.16 }]} />
      </LinearGradient>
    )
  }

  if (move === 'paper') {
    return (
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.sheet, styles.sheetBack, { width: size * 0.72, height: size * 0.86 }]} />
        <LinearGradient
          colors={['#fff', '#e4eaf0']}
          style={[styles.sheet, { width: size * 0.72, height: size * 0.86 }]}
        >
          <View style={styles.line} />
          <View style={styles.line} />
          <View style={[styles.line, { width: '55%' }]} />
        </LinearGradient>
      </View>
    )
  }

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={[styles.blade, { transform: [{ rotate: '-28deg' }] }]} />
      <View style={[styles.blade, { transform: [{ rotate: '28deg' }] }]} />
      <View style={styles.handleL} />
      <View style={styles.handleR} />
    </View>
  )
}

const styles = StyleSheet.create({
  unknown: {
    backgroundColor: '#163447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.3)',
  },
  qDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9fb6c9',
  },
  rock: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,230,180,0.35)',
  },
  knuckle: {
    position: 'absolute',
    width: 14,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(80,40,16,0.35)',
  },
  rockShine: {
    position: 'absolute',
    top: 12,
    left: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  sheet: {
    borderRadius: 4,
    padding: 10,
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(20,40,60,0.15)',
  },
  sheetBack: {
    position: 'absolute',
    backgroundColor: '#c5d0da',
    transform: [{ rotate: '-8deg' }, { translateX: -6 }],
  },
  line: {
    height: 3,
    width: '80%',
    backgroundColor: '#b7c4d0',
    borderRadius: 2,
  },
  blade: {
    position: 'absolute',
    width: 54,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d8dee6',
    top: 28,
  },
  handleL: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    width: 16,
    height: 22,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#c41e3a',
  },
  handleR: {
    position: 'absolute',
    bottom: 14,
    right: 18,
    width: 16,
    height: 22,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#c41e3a',
  },
})
