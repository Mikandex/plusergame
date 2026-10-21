import GiftBox from '@/components/virtuals/GiftBox'

type AnimatedBoxProps = {
  box: { revealed: boolean; prize: boolean }
  index: number
  onPress: (index: number) => void
  disabled: boolean
  loading: boolean
}

export default function AnimatedBox({ box, index, onPress, disabled, loading }: AnimatedBoxProps) {
  return (
    <GiftBox
      index={index}
      revealed={box.revealed}
      prize={box.prize}
      shaking={loading && !box.revealed}
      disabled={disabled || loading}
      onPress={onPress}
    />
  )
}
