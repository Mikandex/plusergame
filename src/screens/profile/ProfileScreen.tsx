import { View, Text, Image, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Dimensions } from 'react-native'
import { StatusBar } from 'expo-status-bar';
import WhiteButton from '@/components/WhiteButton';
import { images } from '@/constants';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Fontisto from '@expo/vector-icons/Fontisto';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Entypo from '@expo/vector-icons/Entypo';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { router } from 'expo-router';
import Constants from 'expo-constants';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import SpaceBetween from '@/components/SpaceBetween';

const height = Dimensions.get('window').height;

export default function ProfileScreen() {
    
  const { top } = useSafeAreaInsets()

  return (
    <View className="h-full bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <View  style={{ paddingTop: top }} className={`w-full ${height >= 640 ? "h-52" : "h-44"} bg-blue-dark px-4 relative`}>
            <View className='flex-row items-center justify-end mt-4 pb-4'>
              <WhiteButton title='Sign Out' containerStyles='bg-red/20 border-red' loadingColor="#ef4444" loadingText='Logging Out' textStyles='text-red'/>
            </View>
            <View className='flex-row gap-4 items-start absolute -bottom-10 left-4'>
              <View className='size-[100px] rounded-full border border-gray-100 z-10 bg-blue-dark'>
                <Image source={images.user} resizeMode='cover' className='w-full h-full rounded-full overflow-hidden'/>
              </View>
              <View className='flex-1'>
                <View className='flex-row items-center gap-1 pr-4'>
                  <Text className="text-sm text-white font-mmedium" numberOfLines={1}>Ojiego Franklin</Text>
                  <MaterialIcons name="verified" size={16} color="#eb4d4b" />
                </View>
                <Text className="text-sm text-white font-mregular" numberOfLines={1}>franklinojiego1@gmail.com</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='pt-12 pb-7 px-4'>
          <SpaceBetween onpress={() => router.push("/(protected)/(routes)/UserProfile")} title='User Profile' desc='Manage your personal details and preferences.' descStyle='text-[9px]' lefticon={<FontAwesome name="user" color={"#eb4d4b"} size={20}/>}/>
          <SpaceBetween onpress={() => router.push("/(protected)/(routes)/Orders")} title='Orders' desc='Check your orders and its status.' descStyle='text-[9px]' lefticon={<MaterialCommunityIcons name="shopping" size={20} color={"#eb4d4b"} />}/>
          <SpaceBetween onpress={() => router.push("/(protected)/(routes)/Security")} title='Security' desc='Protect your account with security features.' descStyle='text-[9px]' lefticon={<Fontisto name="locked" size={17} color={"#eb4d4b"} />}/>
          <SpaceBetween onpress={() => router.push("/(protected)/(routes)/Refer")} title='Refer and Earn' desc='Invite friends, earn rewards!' descStyle='text-[9px]' lefticon={<FontAwesome6 name="gift" size={16} color={"#eb4d4b"} />}/>
          <SpaceBetween onpress={() => router.push("/(protected)/(routes)/About")} title='About Navo' desc='Get help and find answers to your questions.' descStyle='text-[9px]' lefticon={<Entypo name="info" size={18} color={"#eb4d4b"} />}/>
          <SpaceBetween onpress={() => router.push("/(protected)/(routes)/Support")} title='Support' desc='Get help and find answers to your questions.' descStyle='text-[9px]' lefticon={<FontAwesome5 name="headphones" size={18} color={"#eb4d4b"} />}/>

          <Text className="text-base text-gray-500 font-amedium mt-5">V {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </ScrollView>

      <StatusBar style='light'/>
    </View>
  )
}