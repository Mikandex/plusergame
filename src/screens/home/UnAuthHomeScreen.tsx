import { StatusBar } from 'expo-status-bar';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GameCard from '@/components/GameCard';
import GameHubStrip from '@/components/GameHubStrip';
import { Ionicons } from '@expo/vector-icons';
import LandingHeader from '@/components/landing/LandingHeader';
import HomeBanner from '@/components/HomeBanner';
import RecentWinnings from '@/components/landing/RecentWinnings';
import { featuredGameOfDay } from '@/data/virtualGames';

const ListHeader = () => {
  const featured = useMemo(() => featuredGameOfDay(), [])
  const featuredIndex = Number(featured.id) - 1

  return (
    <View>
      <HomeBanner startNow />
      <RecentWinnings />
      <View className="flex-row items-center gap-1 my-3">
        <Ionicons name="game-controller" size={16} color="#D4AF37" />
        <Text className="text-white text-sm font-msbold tracking-widest">
          GAME OF THE DAY
        </Text>
      </View>
      <GameCard item={featured} index={featuredIndex} featured />
      <GameHubStrip />
    </View>
  )
}

const UnAuthHomeScreen = () => {
  const { top } = useSafeAreaInsets();

  return (
    <View className='flex-1 bg-charcoal' style={{ paddingTop: top }}>
      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <LandingHeader />

        <FlatList
          data={[]}
          keyExtractor={(_, index) => String(index)}
          renderItem={null}
          ListHeaderComponent={ListHeader}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      </View>

      <StatusBar style={'light'} />
    </View>
  );
};

export default UnAuthHomeScreen;
