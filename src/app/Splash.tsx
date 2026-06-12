import { View, ImageBackground } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay } from 'react-native-reanimated';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { images } from "../constants";
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

const ZOOM_STAGES = [
  { width: 55,  height: 62  },  // small
  { width: 100, height: 108 },  // bigger
  { width: 140, height: 150 },  // biggest
];

export default function Splash() {
  const logoWidth  = useSharedValue(ZOOM_STAGES[0].width);
  const logoHeight = useSharedValue(ZOOM_STAGES[0].height);

  useEffect(() => {
    logoWidth.value = withSequence(
      withDelay(600, withTiming(ZOOM_STAGES[1].width,  { duration: 0 })),
      withDelay(600, withTiming(ZOOM_STAGES[2].width,  { duration: 0 })),
    );
    logoHeight.value = withSequence(
      withDelay(600, withTiming(ZOOM_STAGES[1].height, { duration: 0 })),
      withDelay(600, withTiming(ZOOM_STAGES[2].height, { duration: 0 })),
    );

    const navTimer = setTimeout(() => router.replace("/(tabs)/Home"), 3200);
    return () => clearTimeout(navTimer);
  }, []);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    width:  logoWidth.value,
    height: logoHeight.value,
  }));

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center'>
          <View className="justify-center items-center">
            <Animated.Image
              source={images.logo}
              style={animatedLogoStyle}
              resizeMode="contain"
            />
          </View>
        </ImageBackground>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}