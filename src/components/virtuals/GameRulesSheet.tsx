import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type GameRulesSheetProps = {
  visible: boolean
  title: string
  steps: string[]
  onClose: () => void
}

export default function GameRulesSheet({ visible, title, steps, onClose }: GameRulesSheetProps) {
  const { bottom } = useSafeAreaInsets()

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: bottom + 16 }]} onPress={() => {}}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          {steps.map((step, index) => (
            <View key={step} style={styles.row}>
              <View style={styles.index}>
                <Text style={styles.indexText}>{index + 1}</Text>
              </View>
              <Text style={styles.step}>{step}</Text>
            </View>
          ))}
          <Pressable onPress={onClose} style={styles.cta}>
            <Text style={styles.ctaText}>Got it</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#12241c',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(202,168,94,0.35)',
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(230,225,197,0.35)',
    marginBottom: 14,
  },
  title: {
    color: '#e6e1c5',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  index: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(202,168,94,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  indexText: {
    color: '#caa85e',
    fontSize: 12,
    fontWeight: '700',
  },
  step: {
    flex: 1,
    color: '#c9d6ce',
    fontSize: 15,
    lineHeight: 22,
  },
  cta: {
    marginTop: 8,
    backgroundColor: '#caa85e',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    color: '#0f3b2e',
    fontSize: 16,
    fontWeight: '700',
  },
})
