import { View, Pressable, Image } from 'react-native'
import { router } from 'expo-router';
import images from '@/constants/images';
import { Octicons } from '@expo/vector-icons';

export default function LandingHeader() {

  const goToNotification =  () => {
    router.push("/(onboarding)")
  }

  return (
    <>
      <View className='py-2'>
        <View className='flex-row items-center justify-between gap-2'>
          <View className='flex-row gap-2 items-center'>
            <Image
              source={images.logo}
              resizeMode="contain"
              className='w-11 h-12'
            />
          </View>
          <Pressable onPress={goToNotification} className="relative items-center justify-center">
            <Octicons name="bell-fill" size={22} color="#D4AF37" />
          </Pressable>
        </View>
      </View>
     
    </>
  )
}