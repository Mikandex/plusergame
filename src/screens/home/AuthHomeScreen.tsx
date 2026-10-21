import { StatusBar } from 'expo-status-bar';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useAnimatedReaction,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import GameCard from '@/components/GameCard';
import GameHubStrip from '@/components/GameHubStrip';
import { Ionicons } from '@expo/vector-icons';
import HomeBanner from '@/components/HomeBanner';
import RecentWinnings from '@/components/landing/RecentWinnings';
import BalanceCard from '@/components/BalanceCard';
import getWallet from '@/utils/WalletApi';
import HomeHeader from '@/components/HomeHeader';
import getUnreadNotifications from '@/utils/getUnreadNotifications';
import { featuredGameOfDay } from '@/data/virtualGames';

type ListHeaderProps = {
  winningsKey: number;
  onStickySectionLayout: (y: number) => void;
};

const StickySection = memo(({ compact = false, paused = false, refreshKey = 0 }: { compact?: boolean; paused?: boolean; refreshKey?: number }) => (
    <View className='bg-charcoal'>
      <RecentWinnings compact={compact} paused={paused} refreshKey={refreshKey} />
    </View>
  ),
);

const ListHeader = memo(
  ({
    winningsKey,
    onStickySectionLayout,
  }: ListHeaderProps) => {
    const featured = useMemo(() => featuredGameOfDay(), [])
    const featuredIndex = Number(featured.id) - 1

    return (
      <View>
        <BalanceCard/>

        <View onLayout={(e) => onStickySectionLayout(e.nativeEvent.layout.y)}>
          <StickySection compact={true} refreshKey={winningsKey} />
        </View>

        <View className='mt-4'>
          <HomeBanner/>
        </View>

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
  },
);

const AuthHomeScreen = () => {

  const { top } = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  const [winningsKey, setWinningsKey] = useState(0);

  const [overlayActive, setOverlayActive] = useState(false);

  const scrollY = useSharedValue(0);
  const stickySectionOffsetY = useSharedValue(9999);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  useAnimatedReaction(
    () => scrollY.value >= stickySectionOffsetY.value,
    (isActive, prev) => {
      if (isActive !== prev) {
        runOnJS(setOverlayActive)(isActive);
      }
    },
  );

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [stickySectionOffsetY.value - 4, stickySectionOffsetY.value],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  useEffect(() => {
    getWallet(false)
    getUnreadNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      getWallet(true)
    ]);
    setWinningsKey((key) => key + 1);
    setRefreshing(false);
  }, []);

  const handleStickySectionLayout = useCallback((y: number) => {
    stickySectionOffsetY.value = y;
  }, []);

  const renderListHeader = useCallback(
    () => (
      <ListHeader
        winningsKey={winningsKey}
        onStickySectionLayout={handleStickySectionLayout}
      />
    ),
    [winningsKey, handleStickySectionLayout],
  );

  return (
    <View
    className='flex-1 bg-charcoal'
      style={{ paddingTop: top }}
    >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>

        <HomeHeader/>

        <Animated.FlatList
          data={[]}
          keyExtractor={(_, index) => String(index)}
          renderItem={null}
          ListHeaderComponent={renderListHeader}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={"#fff"}
              colors={['#EF9439']}
            />
          }
        />

        {overlayActive ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: 16,
                right: 16,
                top: 0,
                zIndex: 10,
              },
              overlayStyle,
            ]}
            pointerEvents="box-none"
          >
            <HomeHeader/>
            <StickySection compact={true} paused refreshKey={winningsKey} />
          </Animated.View>
        ) : null}

      </View>

      <StatusBar style={'light'}/>
    </View>
  );
};

export default AuthHomeScreen;
