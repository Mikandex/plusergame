import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import React from 'react'
import Header from '@/components/Header'
import { router } from 'expo-router'
import { FontAwesome, FontAwesome5, FontAwesome6 } from '@expo/vector-icons'
import { images } from '@/constants'
import { SUPPORT_LINKS } from '@/constants/data'
import openLink from '@/utils/openLink'
import { StatusBar } from 'expo-status-bar'
import SupportBox from '@/components/SupportBox'

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', url: SUPPORT_LINKS.social.facebook, icon: <FontAwesome5 name="facebook" size={40} color="#9CA3AF" /> },
  { key: 'instagram', label: 'Instagram', url: SUPPORT_LINKS.social.instagram, icon: <FontAwesome6 name="square-instagram" size={40} color="#9CA3AF" /> },
  { key: 'x', label: 'X', url: SUPPORT_LINKS.social.x, icon: <FontAwesome6 name="square-x-twitter" size={40} color="#9CA3AF" /> },
  { key: 'linkedin', label: 'LinkedIn', url: SUPPORT_LINKS.social.linkedin, icon: <FontAwesome name="linkedin-square" size={40} color="#9CA3AF" /> },
  { key: 'tiktok', label: 'TikTok', url: SUPPORT_LINKS.social.tiktok, icon: <FontAwesome5 name="tiktok" size={35} color="#9CA3AF" /> },
]

const SupportScreen = () => {
  const socials = SOCIALS.filter((item) => item.url)
  const hasContact = Boolean(SUPPORT_LINKS.supportPhone || SUPPORT_LINKS.supportEmail)

  return (
    <View className='h-full flex-1 bg-charcoal'>
      <Header title='Help and Support' onpress={() => router.back()}/>
      <View className='flex-1 px-4 w-full'>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className='mt-8 gap-4'>
            <SupportBox image={images.faq} label='FAQ' onPress={() => router.push('/(tabs)/profile/Faq' as any)}/>
            <SupportBox image={images.tip} label='Helpful Tips' onPress={() => router.push('/(tabs)/profile/HelpfulTips' as any)}/>
          </View>
          {hasContact ? (
            <>
              <Text className='text-xl font-msbold mt-8 mb-4 text-white'>Contact Us</Text>
              <View className='gap-4'>
                {SUPPORT_LINKS.supportPhone ? (
                  <SupportBox image={images.phone} label='Phone' value={SUPPORT_LINKS.supportPhone} onPress={() => openLink('tel:' + SUPPORT_LINKS.supportPhone)}/>
                ) : null}
                {SUPPORT_LINKS.supportEmail ? (
                  <SupportBox image={images.mail} label='Email' value={SUPPORT_LINKS.supportEmail} onPress={() => openLink('mailto:' + SUPPORT_LINKS.supportEmail + '?subject=Pluser%20Games%20Support')}/>
                ) : null}
              </View>
            </>
          ) : null}
          {socials.length ? (
            <>
              <Text className='text-xl font-msbold mt-8 mb-4 text-white'>Follow Us On</Text>
              <View className='w-full flex-row items-center gap-4'>
                {socials.map((item) => (
                  <TouchableOpacity key={item.key} onPress={() => openLink(item.url)} accessibilityLabel={item.label}>
                    {item.icon}
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
      <StatusBar style={"light"}/>
    </View>
  )
}

export default SupportScreen