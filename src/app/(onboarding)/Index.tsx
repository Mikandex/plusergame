import { View, ImageBackground, Image, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { images } from '@/constants';
import CustomButton from '@/components/CustomButton';
import { router } from 'expo-router';
import { AntDesign, Octicons } from '@expo/vector-icons';
import { use } from 'react';

export default function Index() {

  const top = useSafeAreaInsets().top;

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center'>
          <Pressable
            style={{ position: 'absolute', top: top + 12, left: 16, zIndex: 10 }}
            onPress={() => router.back()}
          >
            <Octicons name="arrow-left" size={28} color="#fff" />
          </Pressable>
          <View className="justify-center items-center">
            <Image
              source={images.logo}
              resizeMode="contain"
              style={{ width: 100, height: 110 }}
            />
            <CustomButton title="Create Account" handlePress={() => router.push('/(onboarding)/Register')} containerStyles="w-[80%] mt-8 border border-yellow" textStyles='text-white'/>
            <CustomButton title="Log In" handlePress={() => router.push('/(onboarding)/LogIn')} containerStyles="w-[80%] mt-6 border border-yellow" textStyles='text-white' bgColor='transparent'/>
          </View>
        </ImageBackground>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}