import { StyleSheet, Text, TextInput, View } from 'react-native'

type GameStatsRowProps = {
  stake: string
  onStakeChange: (value: string) => void
  payout: string | number
  multiplier: string
  stakeEditable?: boolean
}

export default function GameStatsRow({
  stake,
  onStakeChange,
  payout,
  multiplier,
  stakeEditable = true,
}: GameStatsRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.controlPill}>
        <Text style={styles.controlLabel}>Stake</Text>
        <TextInput
          value={stake}
          onChangeText={onStakeChange}
          editable={stakeEditable}
          keyboardType="numeric"
          placeholder="Enter stake"
          placeholderTextColor="#9fb7a9"
          cursorColor="white"
          style={[styles.input, !stakeEditable && styles.inputLocked]}
        />
      </View>

      <View style={styles.stats}>
        <View>
          <Text style={styles.statLabel}>Payout</Text>
          <Text style={styles.statValue}>{payout}</Text>
        </View>
        <View>
          <Text style={styles.statLabel}>Multiplier</Text>
          <Text style={styles.statValue}>{multiplier}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
  controlPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 14,
  },
  controlLabel: {
    fontSize: 11,
    color: '#9fb7a9',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#caa85e',
    padding: 8,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  inputLocked: {
    opacity: 0.55,
  },
  stats: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    borderRadius: 20,
  },
  statLabel: {
    color: '#9fb7a9',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statValue: {
    color: '#e6d59b',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
})
