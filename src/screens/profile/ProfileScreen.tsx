import Header from '@/components/Header';
import { images } from '@/constants';
import { axiosClient } from '@/globalApi';
import { useAuthStore } from '@/store/AuthStore';
import { useProfileStore } from '@/store/ProfileStore';
import { FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export default function ProfileScreen() {

  const [logoutToken, setLogoutToken] = useState<any>("")
  const logout = useAuthStore(state => state.logout);
  const clearProfile = useProfileStore(state => state.clearProfile);
  const userProfile = useProfileStore(state => state.userProfile);

   useEffect(() => {
    const handleToken = async () => {
      const token = await SecureStore.getItemAsync("accessToken")
      setLogoutToken(token);
    };

    handleToken()
  }, [])

  const handleLogout = async () => {

    await SecureStore.deleteItemAsync("accessToken");
    await SecureStore.deleteItemAsync("refreshToken");
    await AsyncStorage.removeItem('userProfile');
    
    logout();
    clearProfile();
    
    axiosClient.post("/auth/logout", {}, {
      headers: {
        Authorization: `Bearer ${logoutToken}`,
      }
    })
    
    router.replace("/(onboarding)/LogIn");
      
  }

  const menuItems = [
    { label: 'Edit Profile', icon: <Ionicons name="person-outline" size={22} color="#9CA3AF" />, onPress: () => { router.push("/(tabs)/profile/EditProfile") } },
    { label: 'Change Pin', icon: <MaterialCommunityIcons name="shield-lock-outline" size={22} color="#9CA3AF" />, onPress: () => { router.push("/(protected)/(routes)/ChangePin") } },
    { label: 'Transactions', icon: <MaterialCommunityIcons name="bank-outline" size={22} color="#9CA3AF" />, onPress: () => router.push('/(tabs)/Transactions') },
    { label: 'Support', icon: <Ionicons name="headset-outline" size={22} color="#9CA3AF" />, onPress: () => router.push("/(tabs)/profile/Support") },
    { label: 'Logout', icon: <MaterialIcons name="logout" size={22} color="#ef4444" />, onPress: handleLogout, danger: true },
  ];

  return (
    <View className='flex-1 bg-charcoal'>
      <Header title="Profile" showBack={false} onpress={() => router.back()} />
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-4 flex-1"
        keyboardShouldPersistTaps="handled"
      >

        {/* User Info */}
        <View className='flex-row items-center gap-4 mb-6 mt-4'>
          <View className='p-1 rounded-full border-2 border-yellow bg-charcoal'>
            <Image
              source={images.avatar}
              className='w-20 h-20 rounded-full'
            />
          </View>
          <View className='flex-1'>
            <Text className='text-white text-base font-msbold' numberOfLines={2}>{userProfile?.fullName}</Text>
            <Text className='text-gray-400 text-sm font-mmedium'>+{userProfile?.phoneNumber}</Text>
          </View>
        </View>

        {/* Menu Card */}
        <View className='bg-charcoal-light rounded-2xl px-4 py-2'>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.onPress}
              className={`flex-row items-center gap-4 py-4 ${index !== menuItems.length - 1 ? 'border-b border-charcoal' : ''}`}
            >
              {item.icon}
              <Text className={`text-base font-mmedium ${item.danger ? 'text-red-500' : 'text-white'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Footer Text */}
          <Text className='text-gray-400 text-xs mt-3 mb-1'>
            Read the{' '}
            <Text className='underline'>Privacy Policy</Text>,{' '}
            <Text className='underline'>Terms of Service</Text>{' '}
            and{' '}
            <Text className='underline'>Game Policy</Text>{' '}
            to for Responsible Gaming Activities.
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}