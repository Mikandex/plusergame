import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export type Heat = 'hit' | 'hot' | 'warm' | 'cold'

export function heatOf(guess: number, house: number, max: number): Heat {
  const gap = Math.abs(guess - house)
  if (gap === 0) return 'hit'
  const hotBand = Math.max(1, Math.floor(max / 10))
  const warmBand = Math.max(hotBand + 1, Math.floor(max / 5))
  if (gap <= hotBand) return 'hot'
  if (gap <= warmBand) return 'warm'
  return 'cold'
}

const COPY: Record<Heat, { title: string; detail: string; colors: [string, string] }> = {
  hit: { title: 'On the number', detail: 'Exact hit. That’s the only payout.', colors: ['#3ecf78', '#157a3e'] },
  hot: { title: 'Hot', detail: 'Close — but close does not pay.', colors: ['#f0a43a', '#c45b12'] },
  warm: { title: 'Warm', detail: 'In the neighbourhood. Still a miss.', colors: ['#e3a843', '#8a6a20'] },
  cold: { title: 'Cold', detail: 'A long way from the house number.', colors: ['#4fa3d1', '#1b4a5f'] },
}

type HotColdMeterProps = {
  guess: number
  house: number
  max: number
}

export default function HotColdMeter({ guess, house, max }: HotColdMeterProps) {
  const heat = heatOf(guess, house, max)
  const copy = COPY[heat]
  const gap = Math.abs(guess - house)
  const guessPct = ((guess - 1) / Math.max(1, max - 1)) * 100
  const housePct = ((house - 1) / Math.max(1, max - 1)) * 100

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={copy.colors} start={[0, 0.5]} end={[1, 0.5]} style={styles.badge}>
        <Text style={styles.badgeText}>{copy.title}</Text>
      </LinearGradient>
      <Text style={styles.detail}>
        You picked {guess}. House was {house}
        {gap ? ` · ${gap} away` : ''}. {copy.detail}
      </Text>
      <View style={styles.track}>
        <LinearGradient
          colors={['#4fa3d1', '#e3a843', '#c45b12']}
          start={[0, 0.5]}
          end={[1, 0.5]}
          style={styles.bar}
        />
        <View style={[styles.pin, styles.guessPin, { left: `${guessPct}%` }]} />
        <View style={[styles.pin, styles.housePin, { left: `${housePct}%` }]} />
      </View>
      <View style={styles.legend}>
        <Text style={styles.legendGuess}>Your pick</Text>
        <Text style={styles.legendHouse}>House</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(8, 28, 40, 0.9)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.28)',
    gap: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 13,
  },
  detail: {
    color: '#e6e1c5',
    fontSize: 14,
    lineHeight: 20,
  },
  track: {
    height: 14,
    justifyContent: 'center',
    marginTop: 4,
  },
  bar: {
    height: 8,
    borderRadius: 4,
  },
  pin: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    top: 1,
    borderWidth: 2,
    borderColor: '#061c26',
  },
  guessPin: {
    backgroundColor: '#e3a843',
  },
  housePin: {
    backgroundColor: '#4fa3d1',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendGuess: {
    color: '#e3a843',
    fontSize: 11,
    fontWeight: '700',
  },
  legendHouse: {
    color: '#4fa3d1',
    fontSize: 11,
    fontWeight: '700',
  },
})
