import { View, Text, Image, ActivityIndicator, TouchableOpacity, Modal } from 'react-native'
import displayCurrency from '@/utils/displayCurrency'
import IconButton from './IconButton';
import { router } from 'expo-router';
import useWalletStore from '@/store/WalletStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6, Ionicons, Octicons } from '@expo/vector-icons';
import { images } from '@/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native';

export default function BalanceCard() {

  const { wallet, balanceLoading, hideWallet, setHideWallet } = useWalletStore((state) => state);
  const [showModal, setShowModal] = useState(false)

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
          <View className='flex-row items-center gap-1 mb-2'>
            <Text className='text-yellow text-sm font-semibold tracking-widest'>
              WALLET
            </Text>
            <TouchableOpacity activeOpacity={0.8} className='items-center flex-row gap-1' onPress={() => setShowModal(true)}>
              <Ionicons name="grid-outline" size={12} color={"#D4AF37"} />
            </TouchableOpacity>
          </View>
          <Text className='text-gray text-xs'>Balance</Text>
          {balanceLoading ? (
            <View className='flex-1 items-start'>
              <ActivityIndicator size="small" color={"#fff"}/>
            </View>
          ) : 
            hideWallet === "true" ? (
              <Text className='text-white text-xl font-bold max-w-[70%]'>
                *****
              </Text>
            ) : (
              <Text className='text-white text-xl font-bold max-w-[70%]'>
                {hideWallet === "true" ? "*****" : displayCurrency(Number(wallet?.total))}
              </Text>
          )}

          <View className='flex-row gap-2 mt-2'>
            <IconButton
              title='DEPOSIT'
              handlePress={() => router.push("/(tabs)/home/Deposit")}
              textStyles='text-white'
              icon={<Octicons name="download" size={13} color="white" />}
              containerStyles='bg-red flex-1 px-2 border-[0.5px] border-red z-10'
            />
            <IconButton
              title='WITHDRAW'
              handlePress={() => router.push("/(tabs)/home/Withdraw")}
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

      <Modal
        transparent={true}
        visible={showModal}
        statusBarTranslucent={true}
        onRequestClose={() => setShowModal(false)}>
        <View className="flex-1 justify-center items-center px-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
            {/* TouchableWithoutFeedback only around the background */}
            <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
                <View className="absolute top-0 left-0 right-0 bottom-0" />
            </TouchableWithoutFeedback>

            {/* Actual modal content */}
            <View className="rounded-2xl max-h-[60%] px-4 w-full bg-charcoal-light">
                <View className='my-7 gap-5'>
                  <View>
                    <Text className="font-mmedium text-sm text-white">MAIN BALANCE</Text>
                    <Text className="font-semibold text-xl text-white">{displayCurrency(Number(wallet?.total))}</Text>
                  </View>
                  <View>
                    <Text className="font-mmedium text-sm text-white">BONUS BALANCE</Text>
                    <Text className="font-semibold text-xl text-white">{displayCurrency(Number(wallet?.bonus))}</Text>
                  </View>
                  <View>
                    <Text className="font-mmedium text-sm text-white">PLAYING BALANCE</Text>
                    <Text className="font-semibold text-xl text-white">{displayCurrency(Number(wallet?.playing))}</Text>
                  </View>
                  <View>
                    <Text className="font-mmedium text-sm text-white">WINNING BALANCE</Text>
                    <Text className="font-semibold text-xl text-white">{displayCurrency(Number(wallet?.winning))}</Text>
                  </View>
                </View>
            </View>
        </View>
        </Modal>

    </LinearGradient>
  )
}