import { Image, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useAuthStore } from '@/store/AuthStore'
import type { VirtualGame } from '@/data/virtualGames'

export const GAME_TILE_WIDTH = 148
export const GAME_TILE_GAP = 10

export default function GameTile({ item, index }: { item: VirtualGame; index: number }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isOdd = index % 2 !== 0
  const gradientColors: [string, string] = isOdd ? ['#D4AF37', '#8B1A1A'] : ['#8B1A1A', '#D4AF37']

  return (
    <LinearGradient
      colors={gradientColors}
      start={[0, 0]}
      end={[1, 0]}
      style={{ borderRadius: 14, padding: 1, width: GAME_TILE_WIDTH, marginRight: GAME_TILE_GAP }}
    >
      <View className="bg-charcoal rounded-[13px] overflow-hidden">
        <View className="h-[88px] items-center justify-center bg-charcoal-light">
          {item.image ? (
            <Image source={item.image} resizeMode="contain" style={{ width: 88, height: 80 }} />
          ) : null}
        </View>
        <View className="px-3 pt-2 pb-3">
          <Text className="text-white text-sm font-msbold" numberOfLines={1}>
            {item.title}
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push((isAuthenticated ? item.route : '/(onboarding)/LogIn') as never)}
            className="bg-red self-start py-1.5 px-3 rounded-lg mt-2"
          >
            <Text className="text-white text-xs font-msbold">Play</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  )
}
