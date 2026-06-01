import { View, ScrollView, Pressable, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Header from '@/components/Header'
import CustomButton from '@/components/CustomButton'
import { router } from 'expo-router'
import { Entypo, Feather, SimpleLineIcons } from '@expo/vector-icons'
import Details from '@/components/Details'
import displayCurrency from '@/utils/displayCurrency'
import { useState } from 'react'

export default function CheckoutScreen() {

  const [selectedPayment, setSelectedPayment] = useState<'online' | 'payForMe'>('online')

  return (
    <SafeAreaView className="bg-white flex-1 px-4">
      <Header title={`Checkout (20)`} showGoBack={true} onpress={() => router.back()}/>

      <ScrollView className='flex-1' showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 16}}>
        <Pressable className='border border-gray-200 rounded-md p-2 flex-row items-center justify-between gap-2 flex-wrap'>
          <Text className="text-sm font-mmedium text-green-600">Free delivery upto 15 items</Text>
          <Text className="text-xs font-mregular text-gray-600">Limited-time</Text>
        </Pressable>

        <Text className="text-base font-msbold my-2">Delivery Address</Text>

        <Pressable 
          className="justify-between w-full flex-row items-center bg-white pb-4 border-b border-gray-200"
        >
          <View className="flex-1 w-full flex-row items-start gap-1">
            <SimpleLineIcons name="location-pin" size={14} color="black" className='mt-1'/>
            <View className='gap-1'>
              <Text 
                className="font-msbold text-blue flex-1"
              >
                Ojiego Franklin <Text className='font-mmedium text-xs'>+234 7054545454</Text>
              </Text>
              <Text 
                className={`font-msbold text-sm text-red`}
              >
                No 12, Franklin Street, GRA, Benin City, Edo State, Nigeria
              </Text>
            </View>
          </View>

          <Entypo name="chevron-small-right" size={24} color="#000" />
        </Pressable>

        <View
          className="justify-between w-full flex-row items-center bg-white py-4"
        >
          <View className="flex-1 w-full flex-row items-start gap-1">
            <View className='gap-1'>
              <Text 
                className="font-msbold text-blue flex-1"
              >
                Drop a note for us
              </Text>
              <Text 
                className={`font-mregular text-xs text-gray-500`}
              >
                (Optional)
              </Text>
            </View>
          </View>

          <Pressable className='px-3 py-2 rounded-full bg-gray-200'>
            <Text className='font-msbold text-xs'>Add</Text>
          </Pressable>
        </View>

        <View className='w-full rounded-lg bg-gray-200 p-4'>
          <Text className='font-msbold text-base'>Payment Summary</Text>
        </View>

        <Pressable 
          className="justify-between w-full flex-row items-center bg-white py-4 border-b border-gray-200"
        >
          <View className="flex-1 w-full flex-row items-start gap-1">
            <View className='gap-1'>
              <Text 
                className="font-msbold text-blue flex-1"
              >
                Apply coupon code
              </Text>
            </View>
          </View>

          <Entypo name="chevron-small-right" size={24} color="#000" />
        </Pressable>

        <View className="justify-between w-full flex-row gap-10 items-start pt-2">
          <View className="items-center flex-row gap-1">
            <Text className="font-mmedium text-sm">Items total</Text>
          </View>

          <Text className={`font-mmedium text-base text-right flex-1 capitalize line-through`}>{displayCurrency(Number(3000))}</Text>
        </View>
        <View className="justify-between w-full flex-row gap-10 items-start pt-1">
          <View className="items-center flex-row gap-1">
            <Text className="font-mmedium text-sm">Items discount</Text>
          </View>

          <Text className={`font-mmedium text-base text-right flex-1 capitalize text-red`}>-{displayCurrency(Number(1000))}</Text>
        </View>
        <Details title='Subtotal' value={displayCurrency(Number(2000))}/>
        <Details title='Delivery Fee' value={displayCurrency(Number(200))}/>
        <View className="justify-between w-full flex-row gap-10 items-start py-2">
          <View className="items-center flex-row gap-1">
            <Text className="font-mmedium text-sm">Order Total</Text>
          </View>

          <Text className={`font-mmedium text-base text-right flex-1 capitalize text-green-600`} numberOfLines={3}>{displayCurrency(Number(1200))}</Text>
        </View>

        <View className='w-full rounded-lg bg-gray-200 p-4'>
          <Text className='font-msbold text-base'>Payment Method</Text>
        </View>

        {/* Pay Online */}
        <Pressable
          onPress={() => setSelectedPayment('online')}
          className='w-full flex-row items-center justify-between gap-4 py-4 border-b border-gray-200'
        >
          <View className='flex-1 w-full flex-row items-center gap-3'>
            <Feather name="globe" size={20} color="black" />
            <View className='flex-1'>
              <Text className='font-msbold text-sm'>Pay online</Text>
              <Text className='font-mregular text-[9px] text-gray-500'>Pay securely via card, bank transfer, opay, or USSD</Text>
            </View>
          </View>
          <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedPayment === 'online' ? 'border-green-600' : 'border-gray-300'}`}>
            {selectedPayment === 'online' && <View className='w-2.5 h-2.5 rounded-full bg-green-600' />}
          </View>
        </Pressable>

        {/* Pay for me */}
        <Pressable
          onPress={() => setSelectedPayment('payForMe')}
          className='w-full flex-row items-center justify-between gap-4 py-4 border-b border-gray-200'
        >
          <View className='flex-1 w-full flex-row items-center gap-3'>
            <Feather name="users" size={20} color="black" />
            <View className='flex-1'>
              <Text className='font-msbold text-sm'>Pay for me</Text>
              <Text className='font-mregular text-[9px] text-gray-500'>Share a payment link with friends and loved ones for them to pay on your behalf</Text>
            </View>
          </View>
          <View className={`w-5 h-5 rounded-full border-2 items-center justify-center ${selectedPayment === 'payForMe' ? 'border-green-600' : 'border-gray-300'}`}>
            {selectedPayment === 'payForMe' && <View className='w-2.5 h-2.5 rounded-full bg-green-600' />}
          </View>
        </Pressable>

      </ScrollView>

      <View className='w-full justify-center pt-2 gap-2 bg-white'>
        <CustomButton title={selectedPayment === 'online' ? 'Make Payment' : 'Generate Payment Link'} containerStyles="w-full" textStyles='text-white'/>
      </View>

      <StatusBar style='dark'/>
    </SafeAreaView>
  )
}
