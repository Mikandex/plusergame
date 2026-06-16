import { StatusBar } from 'expo-status-bar';
import React, { memo, useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  useWindowDimensions,
  ListRenderItem,
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
import { Skeleton } from 'moti/skeleton';
import { Ionicons } from '@expo/vector-icons';
import { useSkeletonCommonProps } from '@/utils/SkeletonProps';
import HomeBanner from '@/components/HomeBanner';
import RecentWinnings from '@/components/landing/RecentWinnings';
import { images } from '@/constants';
import BalanceCard from '@/components/BalanceCard';
import getWallet from '@/utils/WalletApi';
import HomeHeader from '@/components/HomeHeader';
import getUnreadNotifications from '@/utils/getUnreadNotifications';

type ListHeaderProps = {
  width: number;
  itemWidth: number;
  fullWidth: number;
  loadingLeaderBoard: boolean;
  onStickySectionLayout: (y: number) => void;
};

const StickySection = memo(({ compact = false }: { compact?: boolean }) => (
    <View className='bg-charcoal'>
      <RecentWinnings compact={compact}/>
    </View>
  ),
);

const ListHeader = memo(
  ({
    width,
    itemWidth,
    fullWidth,
    loadingLeaderBoard,
    onStickySectionLayout,
  }: ListHeaderProps) => (
    <View>

      <BalanceCard/>

      {/* Inline StickySection — measures its Y within the scroll content */}
      <View onLayout={(e) => onStickySectionLayout(e.nativeEvent.layout.y)}>
        <StickySection compact={true} />
      </View>

      <View className='mt-4'>
        <HomeBanner/>
      </View>

      <View className="flex-row items-center gap-1 my-3">
        <Ionicons name="game-controller" size={16} color="#D4AF37" />
        <Text className="text-white text-sm font-msbold tracking-widest">
        VIRTUAL GAMES
        </Text>
      </View>

    </View>
  ),
);

const games: any = [
  {
    id: "1",
    title: "Dice",
    description: "Challenge luck with every roll.",
    image: images.dice,
    route: "/(protected)/(routes)/Dice"
  },
  {
    id: "2",
    title: "Lottery",
    description: "Pick your numbers and win big prizes.",
    image: images.lottery,
    route: "/(protected)/(routes)/Lottery"
  },
  {
    id: "3",
    title: "Card",
    description: "Flip the cards and test your luck.",
    image: images.card,
    route: "/(protected)/(routes)/Card"
  },
  {
    id: "4",
    title: "Coin",
    description: "Heads or tails - make your call.",
    image: images.coinPlaceholder,
    route: "/(protected)/(routes)/Coin"
  },
  {
    id: "5",
    title: "Hot Cold",
    description: "Pick a side and feel the heat.",
    image: images.hotCold,
    route: "/(protected)/(routes)/HotCold"
  },
  {
    id: "6",
    title: "Lucky Box",
    description: "Open the box and claim your prize.",
    image: images.box,
    route: "/(protected)/(routes)/LuckyBox"
  },
  {
    id: "7",
    title: "Reel Streak",
    description: "Spin the reels and match to win.",
    image: images.fruit,
    route: "/(protected)/(routes)/ReelStreak"
  },
  {
    id: "8",
    title: "RPS Bet",
    description: "Rock, paper, scissors - bet and beat.",
    image: images.betting,
    route: "/(protected)/(routes)/RPSBet"
  },
  {
    id: "9",
    title: "Spin 2 Win",
    description: "Spin the wheel and win big rewards.",
    image: images.spinToWin,
    route: "/(protected)/(routes)/SpinWheel"
  },
];

const  AuthHomeScreen = () => {

  const { top } = useSafeAreaInsets();

  const screen = useWindowDimensions();
  const fullWidth = screen.width;
  const width = fullWidth - 32;
  const itemWidth = width * 0.85;

  const skeletonProps = useSkeletonCommonProps();
  const [loadingTickets, setLoadingTickets] = useState(false);
  const loadingList = new Array(3).fill(null);
  const [loadingLeaderBoard, setLoadingLeaderBoard] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(false)

  // --- FIX: track whether overlay is active in JS state ---
  const [overlayActive, setOverlayActive] = useState(false);

  const scrollY = useSharedValue(0);
  const stickySectionOffsetY = useSharedValue(9999);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  // --- FIX: react to scroll crossing the sticky threshold ---
  useAnimatedReaction(
    () => scrollY.value >= stickySectionOffsetY.value,
    (isActive, prev) => {
      if (isActive !== prev) {
        runOnJS(setOverlayActive)(isActive);
      }
    },
  );

  // --- FIX: pointerEvents via animated style removed; only opacity remains ---
  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [stickySectionOffsetY.value - 4, stickySectionOffsetY.value],
      [0, 1],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const leaderBoard = async () => {
    setLoadingLeaderBoard(true);
    try {
      // await axiosClient.get('/result/leaderboard');
    } catch (_) {
    } finally {
      setLoadingLeaderBoard(false);
    }
  };

  useEffect(() => {
    leaderBoard();
    getWallet(false)
    getUnreadNotifications();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      getWallet(true)
    ]);
    setRefreshing(false);
  }, []);

  const handleStickySectionLayout = useCallback((y: number) => {
    stickySectionOffsetY.value = y;
  }, []);

  const renderListHeader = useCallback(
    () => (
      <ListHeader
        width={width}
        itemWidth={itemWidth}
        fullWidth={fullWidth}
        loadingLeaderBoard={loadingLeaderBoard}
        onStickySectionLayout={handleStickySectionLayout}
      />
    ),
    [width, itemWidth, fullWidth, loadingLeaderBoard, handleStickySectionLayout],
  );

  const renderItem: ListRenderItem<any> = useCallback(
    ({ item, index }) => (
      <GameCard
        item={item}
        index={index}
      />
    ),
    [],
  );

  const ListEmpty = useCallback(
    () =>
      loadingTickets ? (
        <View style={{ width: '100%', justifyContent: 'center', marginTop: 32 }}>
          <Skeleton.Group show>
            {loadingList.map((_, i) => (
              <View key={i} style={{ width: '100%', marginBottom: 16 }}>
                <Skeleton height={30} width={'100%'} {...skeletonProps} />
              </View>
            ))}
          </Skeleton.Group>
        </View>
      ) : (
        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
          <Ionicons name="ticket-outline" size={24} color="#EF9439" />
          <Text
            style={{ fontSize: 18, textAlign: 'center', marginTop: 16, color: "#fff" }}
          >
            There is no ticket games yet.
          </Text>
        </View>
      ),
    [loadingTickets, skeletonProps],
  );

  return (
    <View
    className='flex-1 bg-charcoal'
      style={{ paddingTop: top }}
    >
      <View style={{ flex: 1, paddingHorizontal: 16 }}>

        <HomeHeader/>

        <Animated.FlatList
          data={games}
          keyExtractor={(item) => item?.id}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={ListEmpty}
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
          pointerEvents={overlayActive ? 'box-none' : 'none'}
        >
          <HomeHeader/>
          <StickySection compact={true}/>
        </Animated.View>

      </View>

      <StatusBar style={'light'}/>
    </View>
  );
};

export default AuthHomeScreen;
