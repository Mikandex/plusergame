import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import Header from '@/components/Header'
import { router } from 'expo-router'
import { FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons'
import { images } from '@/constants'
import { StatusBar } from 'expo-status-bar'
import SupportBox from '@/components/SupportBox'

const SupportScreen = () => {

  return (
    <View className='h-full flex-1 bg-charcoal'>
      <Header title='Help and Support' onpress={() => router.back()}/>
      <View className='flex-1 px-4 w-full'>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className='mt-8 gap-4'>
            <SupportBox image={images.faq} label='FAQ'/>
            <SupportBox image={images.tip} label='Helpful Tips'/>
          </View>
          <Text className='text-xl font-msbold mt-8 mb-4 text-white'>Contact Us</Text>
          <View className='gap-4'>
            <SupportBox image={images.phone} label='Phone' value='+234 9128384948'/>
            <SupportBox image={images.mail} label='Email' value='frankzeal33@gmail.com'/>
          </View>
          <Text className='text-xl font-msbold mt-8 mb-4 text-white'>Follow Us On</Text>
          <View className='w-full flex-row items-center gap-4'>
            <TouchableOpacity>
              <FontAwesome5 name="facebook" size={40} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome6 name="square-instagram" size={40} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome6 name="square-x-twitter" size={40} color={"#9CA3AF"} />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="linkedin-square" size={40} color="#9CA3AF" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome5 name="tiktok" size={35} color={"#9CA3AF"} />
            </TouchableOpacity>

          </View> 
        </ScrollView>
      </View>
      <StatusBar style={"light"}/>
    </View>
  )
}

export default SupportScreen