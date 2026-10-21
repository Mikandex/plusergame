import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export type LotteryBallTone = 'idle' | 'picked' | 'drawn' | 'hit' | 'ghost' | 'bingo'

type LotteryBallProps = {
  n?: number
  size?: number
  tone?: LotteryBallTone
}

const TONES: Record<LotteryBallTone, [string, string, string]> = {
  idle: ['#fff8ea', '#e4dcc8', '#b9b09a'],
  picked: ['#ffe9a8', '#e3b34a', '#b07a18'],
  drawn: ['#f3f7fb', '#b7c9d6', '#6f8798'],
  hit: ['#c8ffd8', '#3ecf78', '#157a3e'],
  ghost: ['#1d3a48', '#122833', '#0b1820'],
  bingo: ['#fff1c2', '#f0a43a', '#c45b12'],
}

export default function LotteryBall({ n, size = 48, tone = 'idle' }: LotteryBallProps) {
  const colors = TONES[tone]
  const radius = size / 2

  return (
    <LinearGradient
      colors={colors}
      start={[0.15, 0]}
      end={[0.85, 1]}
      style={[
        styles.ball,
        {
          width: size,
          height: size,
          borderRadius: radius,
        },
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.shine,
          {
            width: size * 0.42,
            height: size * 0.22,
            borderRadius: size,
            top: size * 0.12,
            left: size * 0.16,
          },
        ]}
      />
      {n != null ? (
        <Text
          style={[
            styles.n,
            { fontSize: size * 0.38 },
            (tone === 'ghost' || tone === 'hit') && styles.nOnDark,
            tone === 'ghost' && styles.nGhost,
          ]}
        >
          {n}
        </Text>
      ) : null}
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  ball: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  n: {
    fontWeight: '800',
    color: '#1b2a34',
  },
  nOnDark: {
    color: '#0c2416',
  },
  nGhost: {
    color: '#5d7a88',
  },
})
