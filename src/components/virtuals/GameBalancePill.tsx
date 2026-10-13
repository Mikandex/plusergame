import { View, Text, useColorScheme } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { Skeleton } from 'moti/skeleton'
import useWalletStore from '@/store/WalletStore'
import displayCurrency from '@/utils/displayCurrency'
import { useSkeletonCommonProps } from '@/utils/SkeletonProps'

const GameBalancePill = () => {

  const isDark = useColorScheme() !== 'light'
  const skeletonProps = useSkeletonCommonProps()
  const { wallet, balanceLoading, hideWallet } = useWalletStore((state) => state)

  const iconColor = isDark ? '#D4AF37' : '#0F1115'
  const textColor = isDark ? 'text-white' : 'text-charcoal'

  return (
    <View
      className={`flex-row items-center gap-2 self-end rounded-full border border-yellow px-3 py-1.5 ${isDark ? 'bg-charcoal-light' : 'bg-white'}`}
    >
      <Ionicons name="wallet-outline" size={16} color={iconColor} />
      {balanceLoading ? (
        <Skeleton {...skeletonProps} colorMode={isDark ? 'dark' : 'light'} width={64} height={14} radius={7} />
      ) : (
        <Text className={`text-sm font-msbold ${textColor}`}>
          {hideWallet === 'true' ? '****' : displayCurrency(Number(wallet?.total))}
        </Text>
      )}
    </View>
  )
}

export default GameBalancePill
