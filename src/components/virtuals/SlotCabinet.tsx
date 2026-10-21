import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import SlotReel from '@/components/virtuals/SlotReel'
import ConfettiBurst from '@/components/virtuals/ConfettiBurst'

type SlotCabinetProps = {
  reels: [string, string, string]
  spinning: boolean
  win: boolean
  reduceMotion?: boolean
}

export default function SlotCabinet({ reels, spinning, win, reduceMotion = false }: SlotCabinetProps) {
  return (
    <LinearGradient colors={['#3a0f18', '#1a050a', '#2a0c14']} style={styles.cabinet}>
      <LinearGradient colors={['#f6d98a', '#c9a227', '#8a6a14']} style={styles.marquee}>
        <Text style={styles.seven}>777</Text>
        <Text style={styles.marqueeTitle}>REEL STREAK</Text>
        <Text style={styles.seven}>777</Text>
      </LinearGradient>

      <View style={styles.bezel}>
        <LinearGradient colors={['#e8d48a', '#9a7a28', '#e8d48a']} style={styles.chrome}>
          <View style={styles.glass}>
            {win && !spinning ? <ConfettiBurst burst={7} reduceMotion={reduceMotion} /> : null}
            <View style={styles.reelRow}>
              {reels.map((sym, i) => (
                <View key={i} style={styles.col}>
                  <SlotReel
                    target={sym}
                    spinning={spinning}
                    stopDelay={i * 380}
                    reduceMotion={reduceMotion}
                  />
                </View>
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.tray}>
        <Text style={styles.trayText}>PAYLINE · CENTER</Text>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  cabinet: {
    borderRadius: 22,
    padding: 12,
    borderWidth: 2,
    borderColor: '#c9a227',
    overflow: 'hidden',
  },
  marquee: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  seven: {
    color: '#6b0000',
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: 1,
  },
  marqueeTitle: {
    color: '#3a0f18',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 2,
  },
  bezel: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  chrome: {
    padding: 8,
  },
  glass: {
    backgroundColor: '#140810',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    overflow: 'hidden',
  },
  reelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  col: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#08060c',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(246,217,138,0.25)',
    overflow: 'hidden',
  },
  tray: {
    marginTop: 10,
    alignItems: 'center',
  },
  trayText: {
    color: '#f6d98a',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
})
