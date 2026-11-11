import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import { router } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { Feather } from '@expo/vector-icons'
import Header from '@/components/Header'
import { GAME_DETAILS, SUPPORT_LINKS, type GameKey } from '@/constants/data'
import displayCurrency from '@/utils/displayCurrency'
import openLink from '@/utils/openLink'

const GENERAL_TIPS = [
  'Check your balance at the top of each game before you play. A stake above your balance will not start.',
  'Tap the ? button in any game to read its rules again.',
  'Start with the smallest stake while you learn a game.',
]

const HelpfulTipsScreen = () => {
  const games = Object.entries(GAME_DETAILS) as [GameKey, (typeof GAME_DETAILS)[GameKey]][]

  return (
    <View className='h-full flex-1 bg-charcoal'>
      <Header title='Helpful Tips' onpress={() => router.back()} />
      <ScrollView className='flex-1 px-4' showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {SUPPORT_LINKS.tutorialVideoUrl ? (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => openLink(SUPPORT_LINKS.tutorialVideoUrl)}
            className='mt-4 flex-row items-center gap-3 rounded-xl bg-red px-4 py-4'
          >
            <Feather name='play-circle' size={26} color='#fff' />
            <Text className='flex-1 text-base font-msbold text-white'>Watch the tutorial video</Text>
            <Feather name='external-link' size={18} color='#fff' />
          </TouchableOpacity>
        ) : null}

        <View className='mt-4 rounded-xl bg-charcoal-light px-4 py-4 gap-2'>
          {GENERAL_TIPS.map((tip) => (
            <View key={tip} className='flex-row gap-2'>
              <Text className='text-yellow font-msbold'>•</Text>
              <Text className='flex-1 text-[15px] leading-6 font-mregular text-gray'>{tip}</Text>
            </View>
          ))}
        </View>

        <Text className='text-xl font-msbold mt-6 mb-3 text-white'>How each game works</Text>
        <View className='gap-3'>
          {games.map(([key, game]) => (
            <View key={key} className='rounded-xl bg-charcoal-light p-4'>
              <View className='flex-row items-center gap-3'>
                <Image source={game.image} className='size-12 rounded-lg' resizeMode='contain' />
                <View className='flex-1'>
                  <Text className='text-base font-msbold text-white'>{game.title}</Text>
                  <Text className='text-xs font-mmedium text-gray'>
                    Stake {displayCurrency(game.minStake)}–{displayCurrency(game.maxStake)}
                  </Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => router.push(`/(protected)/(routes)/GameDetails?gameKey=${key}` as any)}
                  className='rounded-lg bg-red px-4 py-2'
                >
                  <Text className='text-sm font-msbold text-white'>Play</Text>
                </TouchableOpacity>
              </View>
              <Text className='mt-3 text-[15px] leading-6 font-mregular text-gray'>{game.description}</Text>
              <Text className='mt-2 text-[14px] leading-5 font-mmedium text-yellow'>{game.rewardSummary}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <StatusBar style='light' />
    </View>
  )
}

export default HelpfulTipsScreen
