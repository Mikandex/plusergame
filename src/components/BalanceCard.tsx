import { View, Text, Image } from 'react-native'
import displayCurrency from '@/utils/displayCurrency'
import IconButton from './IconButton';
import { router } from 'expo-router';
import useWalletStore from '@/store/WalletStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6, Octicons } from '@expo/vector-icons';
import { images } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';

export default function BalanceCard() {

  const { wallet, hideWallet } = useWalletStore((state) => state);

  return (
    <LinearGradient
      colors={['#D4AF37','#8B1A1A']}
      start={[0, 0]}
      end={[1, 0]}
      style={{ borderRadius: 14, padding: 1, marginBottom: 8 }}
    >
      <View className='w-full rounded-2xl p-4 overflow-hidden flex-row items-center bg-charcoal'>

        {/* Left side */}
        <View className='flex-1'>
          <Text className='text-yellow text-sm font-semibold tracking-widest mb-2'>
            WALLET
          </Text>
          <Text className='text-gray text-xs'>Balance</Text>
          <Text className='text-white text-xl font-bold max-w-[70%]'>
            {hideWallet === "true" ? "*****" : displayCurrency(Number(wallet?.total))}
          </Text>

          <View className='flex-row gap-2 mt-2'>
            <IconButton
              title='DEPOSIT'
              handlePress={() => router.push("/(tabs)/profile/Deposit")}
              textStyles='text-white'
              icon={<Octicons name="download" size={13} color="white" />}
              containerStyles='bg-red flex-1 px-2 border-[0.5px] border-red z-10'
            />
            <IconButton
              title='WITHDRAW'
              handlePress={() => router.push("/(tabs)/profile/Withdraw")}
              textStyles='text-yellow'
              icon={<FontAwesome6 name="arrow-up-from-bracket" size={11} color="#D4AF37" />}
              containerStyles='bg-charcoal-light flex-1 px-2 border-[0.5px] border-yellow z-10'
            />
          </View>
        </View>

        {/* Wallet image — absolute, bottom-right, peeking out */}
        <View style={{
          position: 'absolute',
          bottom: 12,
          right: 20,
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 20,
        }}>
          <Image
            source={images.wallet}
            className='opacity-95'
            resizeMode="contain"
          />
        </View>
      </View>
    </LinearGradient>
  )
}