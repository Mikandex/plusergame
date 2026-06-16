import { View, Text, Pressable, Image } from 'react-native'
import { router } from 'expo-router';
import { formatCount } from '@/utils/formatCount';
import images from '@/constants/images';
import { Octicons } from '@expo/vector-icons';
import useNotificationStore from '@/store/NotificationStore';

export default function HomeHeader() {

  const { unreadCount } = useNotificationStore();

  const goToNotification =  () => {
    router.push("/(protected)/(routes)/Notifications")
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
            {!!unreadCount && ( 
              <Text className="absolute -top-1 -right-1 bg-red rounded-full text-white text-[8px] min-w-5 min-h-5 text-center items-center justify-center font-mbold p-1 z-50">{formatCount(unreadCount)}</Text>
            )} 
          </Pressable>
        </View>
      </View>
     
    </>
  )
}