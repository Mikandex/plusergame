import CustomButton from '@/components/CustomButton';
import MasonryHero from '@/components/MasonryHero';
import { images } from '@/constants';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AntDesign from '@expo/vector-icons/AntDesign';

export default function Index() {

  const bottom = useSafeAreaInsets().bottom

  return (
    <View className="flex-1 w-full bg-white">
      <StatusBar style={"dark"}/>

      <MasonryHero />

      {/* Bottom Section */}
      <View className="px-6 pt-2 items-center w-full" style={{ paddingBottom: bottom + 8 }}>
        <Image
          source={images.logo}
          className="mt-auto w-32 h-20"
          resizeMode="contain"
        />

        <Text className="text-2xl font-bold text-center mb-4 mt-2">
          Welcome to Zeal Clothing
        </Text>
        <Text className="text-lg text-center mb-4">
          You don’t just shop fashion, you discover your personal style companion. Style smarter. Shop better. Wear confidence.
        </Text>

        <CustomButton title="Start Shopping" handlePress={() => router.push("/(tabs)/Home")} containerStyles="w-full" textStyles='text-white' icon={<AntDesign name="arrow-right" size={16} color="#fff" />}/>
      </View>
    </View>
  );
}