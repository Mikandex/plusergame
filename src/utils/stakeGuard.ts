import Toast from 'react-native-toast-message'
import useWalletStore from '@/store/WalletStore'

export const INSUFFICIENT_BALANCE_MESSAGE = 'User does not have enough balance'

export function hasEnoughBalance(stake: number) {
  const balance = Number(useWalletStore.getState().wallet?.total ?? 0)
  if (balance >= stake) return true
  Toast.show({ type: 'error', text1: INSUFFICIENT_BALANCE_MESSAGE })
  return false
}
