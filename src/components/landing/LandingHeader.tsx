import { View, Text, Pressable, Image } from 'react-native'
import { router } from 'expo-router';
import { formatCount } from '@/utils/formatCount';
import images from '@/constants/images';
import { Octicons } from '@expo/vector-icons';

type headerProps = {
  title?: string;
  titleColor?: string;
  icon?: boolean;
  action?: string;
  home?: boolean;
  profile?: boolean;
  notificationCount?: number;
  onpress?: () => void
}

export default function LandingHeader({title, titleColor, home, profile, action, notificationCount = 0, icon = false, onpress}: headerProps) {

  const goToNotification =  () => {
    router.push("/(onboarding)/LogIn")
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
            {/* {!!notificationCount && (  */}
              <Text className="absolute -top-1 -right-1 bg-red rounded-full text-white text-[8px] min-w-5 min-h-5 text-center items-center justify-center font-mbold p-1 z-50">{formatCount(33)}</Text>
            {/* )} */}
          </Pressable>
        </View>
      </View>
     
    </>
  )
}