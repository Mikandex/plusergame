import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import { images } from '@/constants';
import { useAuthStore } from '@/store/AuthStore';
import { Octicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ImageBackground,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Register() {

  const [form, setForm] = useState({
    fullName: '',
    phoneNumber: '',
    pin: '',
    confirmPin: '',
  });

  const bottom = useSafeAreaInsets().bottom;
  const { login } = useAuthStore()

  const handleContinue = () => {
    login("hi")
    router.push('/(tabs)/Home');
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
                <FormField title="Create Pin" value={form.pin} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, pin: e })} otherStyles="mt-4" keyboardType='numeric'/>
                <FormField title="Confirm Pin" value={form.confirmPin} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, confirmPin: e })} otherStyles="mt-4" keyboardType='numeric'/>

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