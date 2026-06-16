import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import { images } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useAuthStore } from '@/store/AuthStore';
import { useLoaderStore } from '@/store/loaderStore';
import { Octicons } from '@expo/vector-icons';
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

// const registerSchema = z
// .object({

//   phoneNumber: z
//     .string()
//     .min(10, "Phone number is less than 10 digits")
//     .max(11,"Phone number is greater than 11 digits")
//     .regex(/^\d+$/, "Phone number must contain only digits"),

//   fullName: z
//     .string()
//     .min(1, "Fullname is required"),

//   pin: z
//   .string()
//   .length(4, "PIN must be exactly 4 digits")
//   .regex(/^\d+$/, "PIN must contain only digits"),

//   confirmPin: z
//   .string()
//   .min(1, "Please confirm your PIN"),
// })
// .refine((data) => data.pin === data.confirmPin, {
//   message: "PINs do not match",
//   path: ["confirmPin"],
// })


const registerSchema = z
.object({

  fullName: z
    .string()
    .min(1, "Fullname is required"),

  phoneNumber: z
    .string()
    .min(10, "Phone number is less than 10 digits")
    .max(11,"Phone number is greater than 11 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),

  email: z.email("Invalid email address"),
    
  referralCode: z.string().optional(),

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

type RegisterFormValues = z.infer<typeof registerSchema>

export default function Register() {

  // const [form, setForm] = useState({
  //   fullName: '',
  //   phoneNumber: '',
  //   pin: '',
  //   confirmPin: '',
  // });
  const { isLoading, setLoading } = useLoaderStore()

  const [form, setForm] = useState({
    phoneNumber: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: ''
  })

  const bottom = useSafeAreaInsets().bottom;

  const handleContinue = async () => {

    if (isLoading) return

    const result = registerSchema.safeParse(form)

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      // const field = firstIssue.path[0] as keyof RegisterFormValues;

      return Toast.show({
        type: 'info',
        text1: firstIssue.message,
        text2: "Please check your inputs.",
      });
    }

    const removeFirstZero = form.phoneNumber.startsWith("0") ? form.phoneNumber.slice(1) : form.phoneNumber;
    const phone = `+234${removeFirstZero}`;

    const removePlusSign = phone.replace("+", "");

    try {

      setLoading(true)
      
      const data ={
        country_of_residence: "nigeria",
        phone_number: removePlusSign,
        email: form.email,
        full_name: form.fullName,
        password: form.password,
        confirm_password: form.confirmPassword,
        referral_code: form.referralCode
      }

      const result = await axiosClient.post("/auth/register", data)

      console.log(result.data)
      router.push({
        pathname: "/(onboarding)/RegisterOTP",
        params: { user: JSON.stringify({ phone: result.data?.user?.phoneNumber }) },
      });

      setForm({
        phoneNumber: '',
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        referralCode: ''
      })
    } catch (error: any) {

      Toast.show({
        type: 'error',
        text1: error.response.data.message,
      });
      console.log(error.response)

      if(error.response.status === 409 && error.response.data.message === "Account exists but not verified. Please login to complete verification"){

        setTimeout(() => {
          router.replace("/(onboarding)/LogIn")
        }, 7000);

      }

    } finally {
      setLoading(false)
    } 
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className='flex-1' edges={['left', 'right']}>
        <ImageBackground source={images.splash} resizeMode="cover" className='flex-1 justify-center bg-charcoal'>
   
          <Header title="Create Account" onpress={() => router.back()} />

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

                <FormField title="Enter Full Name" value={form.fullName} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, fullName: e })} />
                <FormField title="Enter Phone Number" value={form.phoneNumber} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, phoneNumber: e })} otherStyles="mt-4" keyboardType='numeric' />
                {/* <FormField title="Create Pin" value={form.pin} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, pin: e })} otherStyles="mt-4" keyboardType='numeric'/>
                <FormField title="Confirm Pin" value={form.confirmPin} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, confirmPin: e })} otherStyles="mt-4" keyboardType='numeric'/> */}
                <FormField title="Email" value={form.email} placeholder="Email" handleChangeText={(e: any) => setForm({ ...form, email: e })} otherStyles="mt-4" keyboardType="email-address" labelStyle='text-white'/>

                <FormField title="Password" value={form.password} placeholder="Create Password" handleChangeText={(e: any) => setForm({ ...form, password: e })} otherStyles="mt-4" labelStyle='text-white'/>
                <FormField title="Confirm Password" value={form.confirmPassword} placeholder="Confirm Password" handleChangeText={(e: any) => setForm({ ...form, confirmPassword: e })} otherStyles="mt-4" labelStyle='text-white'/>
                <FormField title="Referral Code" value={form.referralCode} placeholder="Referral Code" handleChangeText={(e: any) => setForm({ ...form, referralCode: e })} otherStyles="mt-4" labelStyle='text-white'/>

                {/* Login Link */}
                <View className="flex-row my-4">
                  <Text className="text-white text-mmedium text-sm">
                    Already Have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={() => router.push('/(onboarding)/LogIn')}>
                    <Text className="text-white text-sm font-msbold">Login</Text>
                  </TouchableOpacity>
                </View>

                <CustomButton title="Continue" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-4 mx-auto" textStyles='text-white'/>

              </View>
            </ScrollView>
          </KeyboardAvoidingView>

        </ImageBackground>
      </SafeAreaView>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}