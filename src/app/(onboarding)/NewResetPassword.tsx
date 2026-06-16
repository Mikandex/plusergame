import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import { images } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useAuthStore } from '@/store/AuthStore';
import { useLoaderStore } from '@/store/loaderStore';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import z from 'zod';
import { useProfileStore } from '@/store/ProfileStore';

const newPasswpordSchema = z
.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .meta({ description: "Password must be strong and secure" }),

  confirmPassword: z
    .string()
    .min(1, "Please confirm your password"),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function NewResetPassword() {

  const { token } = useLocalSearchParams() as any

  const [form, setForm] = useState({
    password: '',
    confirmPassword: ''
  })

  const { isLoading, setLoading } = useLoaderStore()
  const login = useAuthStore((state) => state.login);
  const setProfile = useProfileStore((state) => state.setProfile);

  const bottom = useSafeAreaInsets().bottom;

  const handleContinue  = async () => {
    
    const result = newPasswpordSchema.safeParse(form)
                
    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
          type: 'info',
          text1: firstIssue.message,
          text2: "Please check your inputs.",
      });
    }

    const data = {
      reset_token: token,
      new_password: form.password,
      confirm_new_password: form.confirmPassword
    }

    try {

      setLoading(true)

      const result = await axiosClient.put("/auth/reset-password", data)

        console.log(result.data)
        Toast.show({
          type: 'success',
          text1: result.data.message,
          text2: "Successful",
        });
        router.replace("/(onboarding)/LogIn")

        setForm({
          password: '',
          confirmPassword: ''
        })

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response.data.message || "Please try again later"
      }); 
    } finally {
      setLoading(false)
    } 
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center bg-charcoal'>
   
          <Header title="New Password" onpress={() => router.back()} />

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

                <FormField title="New Password" value={form.password} placeholder="Enter Your New Password" handleChangeText={(e: any) => setForm({ ...form, password: e })} otherStyles="mt-7" labelStyle='text-white'/>
                <FormField title="Confirm New Password" value={form.confirmPassword} placeholder="Confirm New Password" handleChangeText={(e: any) => setForm({ ...form, confirmPassword: e })} otherStyles="mt-7" labelStyle='text-white'/>

                <CustomButton title="Reset" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-4 mx-auto" textStyles='text-white'/>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

        </ImageBackground>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}