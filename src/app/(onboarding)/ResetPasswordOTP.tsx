import CountDown from '@/components/CountDown';
import CustomButton from '@/components/CustomButton';
import Header from '@/components/Header';
import { images } from '@/constants';
import { axiosClient } from '@/globalApi';
import { FontAwesome5 } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLoaderStore } from '@/store/loaderStore';
import Toast from 'react-native-toast-message';

export default function ResetPasswordOTP() {

  const bottom = useSafeAreaInsets().bottom;
   const { isLoading, setLoading } = useLoaderStore()

  const [otp, setOtp] = useState('')
  const { phone } = useLocalSearchParams() as any;
  const parsedPhone = phone ? JSON.parse(phone) : null

  const [resendLoading, setResendLoading] = useState(false)
  const [resend, setResend] = useState(false)
  const [emailKey, setEmailKey] = useState(0);

  const handleContinue = async () => {
    
    if (isLoading) return

    if(!otp){
        return Toast.show({
            type: 'info',
            text1: "OTP fields can't be empty",
            text2: "Please check your inputs.",
        });
    }

    if(otp.length < 4){
        return Toast.show({
            type: 'info',
            text1: "OTP needs 4 numbers",
            text2: "Please check your inputs.",
        });
    }

    try {
      
      setLoading(true)

      const data = {
        phone_number: parsedPhone.phone,
        verification_code: otp
      }

      const result = await axiosClient.post("/auth/verify-reset-password-otp", data)

      console.log("otp-result", result.data)

      router.replace({
        pathname: "/(onboarding)/NewResetPassword",
        params: { token: result.data.reset_token }
      })

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || error.response?.data?.error?.message || "Something went wrong.",
      });
    } finally {
      setLoading(false)
    }

  }

  const resendOtp = async () => {

    setResendLoading(true)

    try {
      const data = {
        phone_number: parsedPhone.phone,
      }
      
      const result = await axiosClient.post("/auth/forgot-password", data)

      console.log(result.data)

      Toast.show({
        type: 'success',
        text1: result.data.message,
      });

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response?.data?.message || error.response?.data?.error?.message || "Failed to resend OTP.",
      });
      console.log(error.response?.data?.message)
    } finally {
      setResendLoading(false)
    }

  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center bg-charcoal'>
   
          <Header title="Enter OTP" onpress={() => router.back()} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              className="p-4"
              keyboardShouldPersistTaps="handled"
            >

              {/* Form Card */}
              <View className="bg-charcoal-light rounded-3xl p-6" style={{ marginBottom: bottom + 16 }}>

                <Text className="text-base text-center text-white mt-1 font-mmedium">Enter the 4 digits OTP code sent to your phone number</Text>
                <View className='mt-7'>
                    <OtpInput
                        key={emailKey}
                        numberOfDigits={4}
                        onTextChange={(code) => setOtp(code)}
                        theme={{
                            containerStyle: styles.container,
                            pinCodeContainerStyle: styles.pinCodeContainer,
                            pinCodeTextStyle: styles.pinCodeText,
                            focusStickStyle: styles.focusStick,
                            focusedPinCodeContainerStyle: styles.activePinCodeContainer,
                            placeholderTextStyle: styles.placeholderText,
                            filledPinCodeContainerStyle: styles.filledPinCodeContainer,
                            disabledPinCodeContainerStyle: styles.disabledPinCodeContainer,
                        }}
                    />
                    <View className="my-4 flex-row items-center gap-1">
                        {resendLoading ? ( 
                            <FontAwesome5 name="circle-notch" size={20} color="#FF6600" className='animate-spin'/>
                        ) : !resend ? (
                        <View className='flex-row items-center mx-auto gap-1'>
                            <Text className="text-base text-yellow font-mregular">Resend OTP in</Text>
                            <CountDown
                                initialSeconds={90}
                                onFinish={() => setResend(true)}
                            />
                        </View>
                        
                        ) : ""}
                        {(resend && !resendLoading) &&
                        <TouchableOpacity onPress={resendOtp} className='my-2 mx-auto'>
                            <Text className='text-base text-yellow font-mbold'>Resend OTP</Text>
                        </TouchableOpacity>
                        }
                    </View>
                </View>

                <CustomButton title="Verify" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-4 mx-auto" textStyles='text-white'/>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

        </ImageBackground>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    width: "100%",
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 8
  },
  pinCodeContainer: {
    backgroundColor: "#9CA3AF",
    borderColor: "#9CA3AF",
    borderWidth: 1,
    borderRadius: 6,
    width: 45,
    height: 45,
    color: "#0F1115",
    fontSize: 16,
    textAlign: "center"
  },
  pinCodeText: {
    color: '#0F1115',
    fontSize: 18,
    fontWeight: 'bold',
  },
  focusStick: {
    backgroundColor: '#9A2121',
  },
  activePinCodeContainer: {
    borderColor: '#9A2121',
    borderWidth: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  filledPinCodeContainer: {
    backgroundColor: '#9CA3AF',
    borderColor: '#9CA3AF',
  },
  disabledPinCodeContainer: {
    backgroundColor: '#9CA3AF',
  },
});