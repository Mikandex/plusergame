import CustomButton from '@/components/CustomButton';
import FormField from '@/components/FormField';
import Header from '@/components/Header';
import Picker from '@/components/Picker';
import { data, images } from '@/constants';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, {  useState } from 'react';
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';

export default function EditProfileScreen() {

    const [form, setForm] = useState({
        fullName: '',
        nickName: '',
        email: '',
        gender: '',
    });

  const handleContinue = () => {
    // router.push('/(tabs)/Home');
  };

  const pickImage = () => {

  }

  return (
    <View className='flex-1 bg-charcoal'>
          <Header title="Edit Profile" onpress={() => router.back()} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 30 : 0}
            className="flex-1"
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1 }}
              className="p-4"
              keyboardShouldPersistTaps="handled"
            >

                <View className='flex-row items-center justify-center gap-4 mb-6 mt-4'>
                    <View className='p-1 relative rounded-full border-2 border-yellow bg-charcoal'>
                        <Image
                            source={images.avatar}
                            className='w-28 h-28 rounded-full'
                        />
                        <TouchableOpacity activeOpacity={0.9} className='absolute -right-1 bottom-2 z-50' onPress={pickImage}>
                            <View className={`flex items-center justify-center size-10 rounded-full bg-yellow`}>
                                <Entypo name="camera" size={18} color="#ffffff"  />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="bg-charcoal-light rounded-3xl p-6 mb-4">

                    <FormField title="Change Name" value={form.fullName} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, fullName: e })} />
                    <FormField title="Enter Nickname" value={form.nickName} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, nickName: e })} otherStyles="mt-4" />
                    <FormField title="Enter Email" value={form.email} placeholder="Enter here" handleChangeText={(e: any) => setForm({ ...form, email: e })} otherStyles="mt-4" />
                    <Picker title='Select gender' value={form.gender} placeholder="Select gender" handleChangeText={(e: any) => setForm({ ...form, gender: e.value })} data={data.gender}/>

                    <CustomButton title="Save changes" handlePress={handleContinue} containerStyles="w-[70%] rounded-lg mt-7 mx-auto" textStyles='text-white'/>

                </View>

            </ScrollView>
          </KeyboardAvoidingView>

        <StatusBar style="light" />
    </View>
  );
}