import { useFonts } from 'expo-font';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '../global.css';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {

  const [fontsLoaded, error] = useFonts({
    "Montserrat-Black": require("../../assets/fonts/Montserrat-Black.ttf"),
    "Montserrat-Bold": require("../../assets/fonts/Montserrat-Bold.ttf"),
    "Montserrat-SemiBold": require("../../assets/fonts/Montserrat-SemiBold.ttf"),
    "Montserrat-Light": require("../../assets/fonts/Montserrat-Light.ttf"),
    "Montserrat-Medium": require("../../assets/fonts/Montserrat-Medium.ttf"),
    "Montserrat-Regular": require("../../assets/fonts/Montserrat-Regular.ttf"),
    "Montserrat-Thin": require("../../assets/fonts/Montserrat-Thin.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }
  
  return (
    <GestureHandlerRootView className='flex-1'>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
        <Toast
        config={{
          success: (props) => (
            <BaseToast
              {...props}
              text1NumberOfLines={2}
              text2NumberOfLines={2}
              style={{ 
                backgroundColor: 'white',
                borderLeftColor: 'green',
                zIndex: 9999,
                minHeight: 55,
                height: 'auto',
                paddingVertical: 10,
              }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}
              text2Style={{ fontSize: 13, color: 'black' }}
            />
          ),
          error: (props: any) => (
            <ErrorToast
              {...props}
              text1NumberOfLines={2}
              text2NumberOfLines={2}
              style={{ 
                backgroundColor: 'white',
                borderLeftColor: '#EF4734',
                zIndex: 9999,
                minHeight: 55,
                height: 'auto',
                paddingVertical: 10,
              }}
              contentContainerStyle={{ paddingHorizontal: 15 }}
              text1Style={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}
              text2Style={{ fontSize: 13, color: 'black' }}
            />
          ),
          info: (props: any) => (
            <BaseToast
              {...props}
              text1NumberOfLines={2}
              text2NumberOfLines={2}
              style={{ 
                backgroundColor: 'white',
                borderLeftColor: '#EF4734',
                zIndex: 9999,
                minHeight: 55,
                height: 'auto',
                paddingVertical: 10,
              }}
              contentContainerStyle={{ paddingHorizontal: 15}}
              text1Style={{ fontSize: 15, fontWeight: 'bold', color: 'black' }}
              text2Style={{ fontSize: 13, color: 'black' }}
            />
          ),
        }}
      />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
