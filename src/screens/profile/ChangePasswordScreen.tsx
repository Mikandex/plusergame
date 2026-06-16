import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import { images } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useLoaderStore } from '@/store/loaderStore';
import { router } from 'expo-router';
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

const passwordSchema = z
.object({
  currentPassword: z
    .string()
    .min(1, "Current password is required"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character")
    .meta({ description: "Password must be strong and secure" }),

  confirmNewPassword: z
    .string()
    .min(1, "Please confirm your new password"),
})
.refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New Passwords do not match",
  path: ["confirmNewPassword"],
});


export default function ChangePasswordScreen() {

  const { isLoading, setLoading } = useLoaderStore()

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  })

  const bottom = useSafeAreaInsets().bottom;

  const handleContinue = async () => {
    if (isLoading) return

    const result = passwordSchema.safeParse(form)
            
    if (!result.success) {
      const firstIssue = result.error.issues[0];

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your inputs.",
      });
    }

    console.log(form)
    try {

      setLoading(true)
  
      const result = await axiosClient.patch("/auth/change-password", {
        current_password: form.currentPassword,
        new_password: form.newPassword,
        confirm_new_password: form.confirmNewPassword
      })

      Toast.show({
        type: 'success',
        text1: result.data.message,
        text2: "Password Updated",
      });

      setForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      })

    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: error.response.data.message || "Please try again later"
      });
      console.log(error.response?.data)

    } finally {
      setLoading(false)
    } 
  } 

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center bg-charcoal'>
   
          <Header title="Change Password" onpress={() => router.back()} />

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

                <FormField title="Current Password" value={form.currentPassword} placeholder="Current Password" handleChangeText={(e: any) => setForm({ ...form, currentPassword: e })} otherStyles="mt-7" labelStyle='text-white'/>
                <FormField title="New Password" value={form.newPassword} placeholder="New Password" handleChangeText={(e: any) => setForm({ ...form, newPassword: e })} otherStyles="mt-7" labelStyle='text-white'/>
                <FormField title="Confirm New Password" value={form.confirmNewPassword} placeholder="Confirm New Password" handleChangeText={(e: any) => setForm({ ...form, confirmNewPassword: e })} otherStyles="mt-7" labelStyle='text-white'/>

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