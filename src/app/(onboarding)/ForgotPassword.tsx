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
import { getApiErrorMessage } from '@/utils/apiErrorMessage';
import { identifierSchema, identifierToPayload } from '@/utils/identifier';

const forgotSchema = z.object({
  identifier: identifierSchema,
})

export default function ForgotPassword() {

  const { isLoading, setLoading } = useLoaderStore()
  const [form, setForm] = useState({
    identifier: ''
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

    const payload = identifierToPayload(form.identifier);

    try {

      setLoading(true)

      await axiosClient.post("/auth/forgot-password", payload)

      router.push({
        pathname: "/(onboarding)/ResetPasswordOTP",
        params: { target: JSON.stringify(payload) },
      })

    } catch (error: unknown) {

      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error)
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

                <FormField title="Phone Number or Email" value={form.identifier} placeholder="08010000001 or name@email.com" handleChangeText={(e: any) => setForm({ ...form, identifier: e })} keyboardType='email-address' autoCapitalize='none' autoCorrect={false} />

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