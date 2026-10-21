import { StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

export const SLOT_SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣'] as const
export const SLOT_ITEM = 78

const FACE: Record<string, [string, string]> = {
  '🍒': ['#9b1c3a', '#4a0d1c'],
  '🍋': ['#e8d44a', '#9a7a10'],
  '🍊': ['#e0892e', '#8a430c'],
  '🍇': ['#6b3aad', '#2a145c'],
  '💎': ['#7ec8e8', '#1f5a78'],
  '7️⃣': ['#f6d98a', '#b8860b'],
}

export function normalizeSlotSymbol(raw: unknown): string {
  const s = String(raw || '').trim()
  if (SLOT_SYMBOLS.includes(s as (typeof SLOT_SYMBOLS)[number])) return s
  const lower = s.toLowerCase()
  if (lower.includes('cher')) return '🍒'
  if (lower.includes('lem')) return '🍋'
  if (lower.includes('ora')) return '🍊'
  if (lower.includes('grap')) return '🍇'
  if (lower.includes('dia') || lower.includes('gem')) return '💎'
  if (lower.includes('7') || lower.includes('sev')) return '7️⃣'
  return SLOT_SYMBOLS[0]
}

export default function SlotSymbol({ symbol, dimmed = false }: { symbol: string; dimmed?: boolean }) {
  const colors = FACE[symbol] || FACE['🍒']
  return (
    <View style={[styles.cell, dimmed && styles.dim]}>
      <LinearGradient colors={colors} start={[0.2, 0]} end={[0.9, 1]} style={styles.face}>
        <View style={styles.shine} />
        <Text style={styles.glyph}>{symbol}</Text>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  cell: {
    height: SLOT_ITEM,
    width: SLOT_ITEM - 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dim: {
    opacity: 0.38,
  },
  face: {
    width: SLOT_ITEM - 14,
    height: SLOT_ITEM - 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  shine: {
    position: 'absolute',
    top: 5,
    left: 8,
    width: 16,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  glyph: {
    fontSize: 28,
  },
})
