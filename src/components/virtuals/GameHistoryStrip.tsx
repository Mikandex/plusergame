import { StyleSheet, Text, View } from 'react-native'

type GameHistoryStripProps = {
  history: boolean[]
  emptyLabel?: string
}

export default function GameHistoryStrip({
  history,
  emptyLabel = 'No rounds yet',
}: GameHistoryStripProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Last results</Text>
      <View style={styles.row}>
        {history.length <= 0 ? (
          <Text style={styles.empty}>{emptyLabel}</Text>
        ) : (
          history.map((win, index) => (
            <View
              key={`${index}-${win ? 'w' : 'l'}`}
              style={[styles.chip, win ? styles.winChip : styles.loseChip]}
            >
              <Text style={styles.chipText}>{win ? 'W' : 'L'}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    gap: 8,
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.45)',
  },
  footerText: {
    color: '#e6d59b',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  empty: {
    color: '#9fb7a9',
    fontSize: 14,
  },
  chip: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  winChip: {
    backgroundColor: 'rgba(95,212,140,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(95,212,140,0.55)',
  },
  loseChip: {
    backgroundColor: 'rgba(224,105,105,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(224,105,105,0.5)',
  },
  chipText: {
    color: '#ffeca6',
    fontSize: 12,
    fontWeight: '800',
  },
})
