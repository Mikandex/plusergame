import React from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import CustomButton from './CustomButton';
import { router } from 'expo-router';
import { useAuthStore } from '@/store/AuthStore';

import type { VirtualGame } from '@/data/virtualGames'

const GameCard = ({ item, index, featured = false }: { item: VirtualGame; index: number; featured?: boolean }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isOdd = index % 2 !== 0

  const gradientColors: [string, string] = isOdd
    ? ['#D4AF37', '#8B1A1A']
    : ['#8B1A1A', '#D4AF37']

  return (
    <LinearGradient
      colors={gradientColors}
      start={[0, 0]}
      end={[1, 0]}
      style={{ borderRadius: 14, padding: 1, marginBottom: 12 }}
    >
      <View className={`bg-charcoal rounded-[13px] gap-2 flex-row overflow-hidden ${featured ? 'min-h-[148px] max-h-[170px]' : 'min-h-[130px] max-h-[150px]'}`}>
        <View className="flex-1 p-4 justify-center">
          {featured ? (
            <View className="self-start bg-yellow/20 border border-yellow rounded-full px-2 py-0.5 mb-1">
              <Text className="text-yellow text-[10px] font-msbold tracking-widest">TODAY</Text>
            </View>
          ) : null}
          <Text className="text-white text-lg font-msbold mb-1">
            {item.title}
          </Text>
          <Text className="text-gray text-sm font-mmedium leading-[18px] mb-[14px]">
            {item.description}
          </Text>
          <CustomButton
            title="Play Now"
            handlePress={() =>
              router.push((isAuthenticated ? item.route : '/(onboarding)/LogIn') as never)
            }
            containerStyles="self-start py-2.5 px-4 rounded-lg"
            textStyles="text-white text-sm"
          />
        </View>

        <View className="w-[40%]">
          {item.image ? (
            <ImageBackground
              source={item.image}
              style={{ flex: 1 }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </View>
    </LinearGradient>
  )
}

export default GameCard;