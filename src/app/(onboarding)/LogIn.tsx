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
import { getApiErrorMessage, isUnverifiedAccountMessage } from '@/utils/apiErrorMessage';
import { OTP_LENGTH, otpInputTheme } from '@/constants/otp';
import CountDown from '@/components/CountDown';
import { FontAwesome5 } from '@expo/vector-icons';
import { OtpInput } from 'react-native-otp-entry';
import { identifierSchema, identifierToPayload, type IdentifierPayload } from '@/utils/identifier';

const loginSchema = z
.object({
  identifier: identifierSchema,
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
    identifier: '',
    password: ''
  })
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationTarget, setVerificationTarget] = useState<IdentifierPayload | null>(null);
  const [otp, setOtp] = useState('');
  const [resend, setResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpKey, setOtpKey] = useState(0);
  const { isLoading, setLoading } = useLoaderStore()
    const login = useAuthStore((state) => state.login);
  const setProfile = useProfileStore((state) => state.setProfile);

  const bottom = useSafeAreaInsets().bottom;

  const openVerification = (target: IdentifierPayload, message?: string) => {
    setVerificationTarget(target);
    setNeedsVerification(true);
    setOtp('');
    setResend(false);
    setOtpKey((key) => key + 1);

    if (message) {
      Toast.show({
        type: 'info',
        text1: message,
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (isLoading || !verificationTarget) return;

    if (!otp) {
      return Toast.show({
        type: 'info',
        text1: "OTP field can't be empty",
        text2: 'Please check your inputs.',
      });
    }

    if (otp.length < OTP_LENGTH) {
      return Toast.show({
        type: 'info',
        text1: `OTP needs ${OTP_LENGTH} numbers`,
        text2: 'Please check your inputs.',
      });
    }

    try {
      setLoading(true);

      const result = await axiosClient.post("/auth/verify-account", {
        ...verificationTarget,
        verification_code: otp,
      });

      const user = {
        phoneNumber: result.data.user.phoneNumber || "",
        countryOfResidence: result.data.user.countryOfResidence || "",
        email: result.data.user.email || "",
        fullName: result.data.user.fullName || "",
        profilePicture: "",
        kycVerified: false,
        gender: "",
        dateOfBirth: "",
        isEmailVerified: false,
      };

      await SecureStore.setItemAsync("accessToken", result.data.user.accessToken);
      await SecureStore.setItemAsync("refreshToken", result.data.user.refreshToken);
      await AsyncStorage.setItem("userProfile", JSON.stringify(user));

      login(result.data.user.accessToken);
      setProfile(user);
      setNeedsVerification(false);
      setForm({ identifier: '', password: '' });
      router.push('/(tabs)/home');
    } catch (error: unknown) {
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!verificationTarget) return;
    setResendLoading(true);

    try {
      const result = await axiosClient.post("/auth/resend-otp", verificationTarget);

      Toast.show({
        type: 'success',
        text1: result.data.message || 'OTP sent successfully.',
      });
      setResend(false);
      setOtpKey((key) => key + 1);
    } catch (error: unknown) {
      Toast.show({
        type: 'error',
        text1: getApiErrorMessage(error, 'Failed to resend OTP.'),
      });
    } finally {
      setResendLoading(false);
    }
  };

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

    const target = identifierToPayload(form.identifier);
    const payload = { ...target, password: form.password }

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
        identifier: '',
        password: ''
      })

    } catch (error: unknown) {
      const message = getApiErrorMessage(error);

      if (isUnverifiedAccountMessage(message)) {
        openVerification(target, message);
      } else {
        Toast.show({
          type: 'error',
          text1: message,
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

                <FormField title="Phone Number or Email" value={form.identifier} placeholder="08010000001 or name@email.com" handleChangeText={(e: any) => setForm({ ...form, identifier: e })} keyboardType='email-address' autoCapitalize='none' autoCorrect={false} />
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

                {!needsVerification && identifierSchema.safeParse(form.identifier).success ? (
                  <TouchableOpacity
                    onPress={() => openVerification(identifierToPayload(form.identifier))}
                    className="my-2"
                  >
                    <Text className="text-yellow text-sm font-msbold text-center">
                      Account not verified? Enter verification code
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {needsVerification ? (
                  <View className="mt-4 pt-4 border-t border-charcoal">
                    <Text className="text-base text-center text-white font-mmedium">
                      Enter the 6-digit verification code sent to your {verificationTarget && 'email' in verificationTarget ? 'email' : 'phone'}
                    </Text>
                    <View className="mt-5">
                      <OtpInput
                        key={otpKey}
                        numberOfDigits={OTP_LENGTH}
                        onTextChange={setOtp}
                        theme={otpInputTheme}
                      />
                      <View className="my-4 flex-row items-center gap-1">
                        {resendLoading ? (
                          <FontAwesome5 name="circle-notch" size={20} color="#FF6600" />
                        ) : !resend ? (
                          <View className="flex-row items-center mx-auto gap-1">
                            <Text className="text-base text-yellow font-mregular">
                              Resend OTP in
                            </Text>
                            <CountDown initialSeconds={90} onFinish={() => setResend(true)} />
                          </View>
                        ) : null}
                        {resend && !resendLoading ? (
                          <TouchableOpacity onPress={handleResendOtp} className="my-2 mx-auto">
                            <Text className="text-base text-yellow font-mbold">Resend OTP</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                    <CustomButton
                      title="Verify Account"
                      handlePress={handleVerifyOtp}
                      containerStyles="w-[70%] rounded-lg mt-2 mx-auto"
                      textStyles="text-white"
                    />
                  </View>
                ) : null}

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