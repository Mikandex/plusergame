import { View, Text, ScrollView, Image, TouchableOpacity, useColorScheme } from 'react-native'
import React from 'react'
import { Redirect, router, useLocalSearchParams } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Octicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GAME_DETAILS, GameKey } from '@/constants/data'
import displayCurrency from '@/utils/displayCurrency'

const StatPill = ({ label, value }: { label: string; value: string }) => (
  <View className='flex-1 bg-charcoal-light rounded-xl px-3 py-3 items-center'>
    <Text className='text-gray text-xs font-mmedium mb-1 text-center'>{label}</Text>
    <Text className='text-yellow text-base font-msbold text-center'>{value}</Text>
  </View>
)

const GameDetails = () => {

  const { gameKey } = useLocalSearchParams<{ gameKey: string }>()
  const { top, bottom } = useSafeAreaInsets()
  const isDark = useColorScheme() !== 'light'

  const detail = GAME_DETAILS[gameKey as GameKey]

  if (!detail) {
    return <Redirect href="/(tabs)/home" />
  }

  const textColor = isDark ? 'text-white' : 'text-charcoal'

  const handlePlay = () => {
    router.push(`/(protected)/(routes)/${detail.route}` as any)
  }

  return (
    <View className={`flex-1 ${isDark ? 'bg-charcoal' : 'bg-gray-light'}`}>
      <View className='flex-row items-center px-4 pb-3' style={{ paddingTop: top + 8 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Octicons name="arrow-left" size={28} color={isDark ? '#fff' : '#0F1115'} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottom + 110 }}
      >
        <View className='w-full h-56 rounded-2xl bg-charcoal-light items-center justify-center overflow-hidden'>
          <Image source={detail.image} resizeMode="contain" style={{ width: '80%', height: '90%' }} />
        </View>

        <Text className={`text-3xl font-mbold mt-5 ${textColor}`}>{detail.title}</Text>

        <View className='flex-row gap-3 mt-5'>
          <StatPill label="Minimum stake" value={displayCurrency(detail.minStake, 'NGN')} />
          <StatPill label="Maximum stake" value={displayCurrency(detail.maxStake, 'NGN')} />
          <StatPill label="Multiplier" value={detail.defaultMultiplier} />
        </View>

        <Text className={`text-lg font-msbold mt-7 ${textColor}`}>What you can win</Text>
        <Text className={`text-base font-mmedium mt-2 ${isDark ? 'text-gray' : 'text-charcoal-light'}`}>
          {detail.rewardSummary}
        </Text>

        <Text className={`text-base font-mmedium mt-5 ${textColor}`}>
          Chances per play: <Text className='font-msbold text-yellow'>{detail.chancesPerPlay}</Text>
        </Text>

        <Text className={`text-base font-mregular leading-6 mt-5 ${isDark ? 'text-gray' : 'text-charcoal-light'}`}>
          {detail.description}
        </Text>
      </ScrollView>

      <View
        className={`absolute left-0 right-0 bottom-0 px-4 pt-3 ${isDark ? 'bg-charcoal' : 'bg-gray-light'}`}
        style={{ paddingBottom: bottom + 12 }}
      >
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handlePlay}
          className='h-[52px] rounded-xl items-center justify-center'
          style={{ backgroundColor: '#9A2121' }}
        >
          <Text className='text-white text-base font-msbold tracking-wide'>Play Now</Text>
        </TouchableOpacity>
      </View>

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </View>
  )
}

export default GameDetails
