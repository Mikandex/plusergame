import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import { images } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useAuthStore } from '@/store/AuthStore';
import { useLoaderStore } from '@/store/loaderStore';
import { router } from 'expo-router';
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
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import z from 'zod';

const forgotSchema = z
.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number is less than 10 digits")
    .max(11, "Phone number is greater than 11 digits")
    .regex(/^\d+$/, "Phone number must contain only digits")
})

export default function ForgotPassword() {

  const { isLoading, setLoading } = useLoaderStore()
  const [form, setForm] = useState({
    phoneNumber: ''
  })

  const bottom = useSafeAreaInsets().bottom;

  const handleContinue  = async () => {
    
    const result = forgotSchema.safeParse(form);
    

    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your inputs",
      });
    }

    const removeFirstZero = form.phoneNumber.startsWith("0") ? form.phoneNumber.slice(1) : form.phoneNumber;
    const phone = `+234${removeFirstZero}`;

    const removePlusSign = phone.replace("+", "");

    try {

      setLoading(true)

      const payload = { phone_number: removePlusSign }

      const result = await axiosClient.post("/auth/forgot-password", payload)
  
      router.push("/(onboarding)/ResetPasswordOTP")
      
    } catch (error: any) {

      Toast.show({
        type: 'error',
        text1: error.response.data.message
      });

    } finally {
      setLoading(false)
    } 
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center bg-charcoal'>
   
          <Header title="Reset Password" onpress={() => router.back()} />

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

                <FormField title="Enter Phone Number" value={form.phoneNumber} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, phoneNumber: e })} keyboardType='numeric' />

                <CustomButton title="Continue" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-8 mx-auto" textStyles='text-white'/>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

        </ImageBackground>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}