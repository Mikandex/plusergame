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
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { useProfileStore } from '@/store/ProfileStore';

const loginSchema = z
.object({
  phoneNumber: z
    .string()
    .min(10, "Phone number is less than 10 digits")
    .max(11, "Phone number is greater than 11 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  password: z.string(),
}).refine(
    (data) => data.password.length >= 8,
    {
      message: "Password must be at least 8 characters long",
      path: ['password'],
    }
);

export default function LogIn() {

  // const [form, setForm] = useState({
  //   phoneNumber: '',
  //   pin: ''
  // });

  const [form, setForm] = useState({
    phoneNumber: '',
    password: ''
  })
  const { isLoading, setLoading } = useLoaderStore()
    const login = useAuthStore((state) => state.login);
  const setProfile = useProfileStore((state) => state.setProfile);

  const bottom = useSafeAreaInsets().bottom;

  const handleContinue  = async () => {
    
    const result = loginSchema.safeParse(form);
    

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

    const payload = { 
      phone_number: removePlusSign, 
      password: form.password 
    }

    console.log("Submitting:", payload);

    try {

      setLoading(true)

      const result = await axiosClient.post("/auth/login", payload)

      console.log(result.data)

      const user = {
        phoneNumber: result.data.user.phoneNumber || "",
        countryOfResidence: result.data.user.countryOfResidence || "",
        email: result.data.user.email || "",
        fullName:  result.data.user.fullName || "",
        profilePicture: result.data.user.profilePicture || "",
        kycVerified: false,
        gender: result.data.user.gender || "",
        dateOfBirth: result.data.user.dateOfBirth || "",
        isEmailVerified: result.data.user.isEmailVerified ?? false
      }
      const userData = JSON.stringify(user);
      await SecureStore.setItemAsync("accessToken", result.data.user.accessToken);
      await SecureStore.setItemAsync("refreshToken", result.data.user.refreshToken);
      await AsyncStorage.setItem("userProfile", userData);

      login(result.data.user.accessToken);
      setProfile(user)

      router.push('/(tabs)/home');

      setForm({
        phoneNumber: '',
        password: ''
      })

    } catch (error: any) {

      console.log("console",error.response.data)

      if(error.response.status === 400 && error.response.data.message === "Account not verified. Verification OTP sent to your phone."){
        
        Toast.show({
          type: 'error',
          text1: error.response.data.message,
        });

        router.push({
          pathname: "/(onboarding)/RegisterOTP",
          params: { user: JSON.stringify({ phone: removePlusSign }) },
        });

      } else{
        Toast.show({
          type: 'error',
          text1: error.response.data.message
        });
      }

    } finally {
      setLoading(false)
    } 
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center bg-charcoal'>
   
          <Header title="Log In" onpress={() => router.back()} />

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
                {/* <FormField title="Enter Pin" value={form.pin} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, pin: e })} otherStyles="mt-4" keyboardType='numeric'/> */}

                <FormField title="Password" value={form.password} placeholder="Password" handleChangeText={(e: any) => setForm({ ...form, password: e })} otherStyles="mt-4" labelStyle='text-white'/>

                {/* Login Link */}
                <View className="flex-row mt-4">
                  <Text className="text-white text-mmedium text-sm">
                    Don't have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(onboarding)/Register')}>
                    <Text className="text-white text-sm font-msbold">Register</Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row my-3">
                  <TouchableOpacity onPress={() => router.push('/(onboarding)/ForgotPassword')}>
                    <Text className="text-white text-sm font-msbold">Forgot Password</Text>
                  </TouchableOpacity>
                </View>

                <CustomButton title="Log In" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-4 mx-auto" textStyles='text-white'/>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

        </ImageBackground>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}