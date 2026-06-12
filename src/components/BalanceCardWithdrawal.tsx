import { View, Text, Image } from 'react-native'
import displayCurrency from '@/utils/displayCurrency'
import useWalletStore from '@/store/WalletStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { images } from '@/constants';

export default function BalanceCardWithdrawal() {

  const { wallet, hideWallet } = useWalletStore((state) => state);

  return (
    <View className='w-full rounded-2xl p-4 overflow-hidden flex-row items-center bg-charcoal-light'>

      {/* Left side */}
      <View className='flex-1'>
        <Text className='text-yellow text-sm font-semibold tracking-widest mb-2'>
          WALLET
        </Text>
        <Text className='text-gray text-xs'>Balance</Text>
        <Text className='text-white text-xl font-bold max-w-[70%]'>
          {hideWallet === "true" ? "*****" : displayCurrency(Number(wallet?.total))}
        </Text>
      </View>

      {/* Wallet image — absolute, bottom-right, peeking out */}
      <View style={{
        shadowColor: '#D4AF37',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
      }}>
        <Image
          source={images.wallet}
          className='opacity-95 size-14'
          resizeMode="contain"
        />
      </View>
    </View>
  )
}