import Header from '@/components/Header'
import { FlatList, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
// import Toast from 'react-native-toast-message'
import Loading from '@/components/Loading'
import { axiosClient } from '../../globalApi'
import GameHistoryCard from '@/components/GameHistoryCard'

type GameItem = {
  id: string;
  category: string;
  is_win: boolean;
  multiplier: string;
  payout: number;
  played_at: string;
  stake: number;
}

const PAGE_SIZE = 20;

export default function GamesPlayedScreen() {

  const [games, setGames] = useState<GameItem[]>([])
  const { bottom } = useSafeAreaInsets()

  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1);

  useEffect(() => {
    getGames(1, true)
  }, [])
  
  const getGames = async (pageNum: number, isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const result = await axiosClient.get(`/virtual/history?limit=${PAGE_SIZE}&page=${pageNum}`)
      const newItems: GameItem[] = result.data.histories || []

      setGames(prev => isInitial ? newItems : [...prev, ...newItems])
      setHasMore(result.data.hasMore ?? false)
      console.log(result.data)
    } catch (error: any) {
    //   Toast.show({
    //     type: 'error',
    //     text1: error.response?.data?.message || 'Something went wrong'
    //   });
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleLoadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    getGames(nextPage);
  }, [loadingMore, hasMore, page]);

  const renderGamesHistory = ({ item, index }: { item: GameItem, index: number }) => (
    <GameHistoryCard item={item} index={index}/>
  )

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View className="py-4 items-center">
        <Loading />
      </View>
    );
  };

  return (
    <View className='h-full flex-1 bg-charcoal'>
      <Header title='Game History' onpress={() => router.back()}/>
     
      <View className="flex-1 mt-4 px-4 overflow-hidden">
        {loading ? (
          <Loading/>
        ) : (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            renderItem={renderGamesHistory}
            showsVerticalScrollIndicator={false}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListFooterComponent={renderFooter}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={() => (  
              <View className="items-center justify-center py-44">
                <Text className="text-xl text-center font-msbold text-white">No Games Placed yet!</Text>
                <Text className="text-sm text-center mt-1 font-mlight text-white">
                  All your games status will show here.
                </Text>
              </View>
            )}
          />
        )}
      </View>

      <StatusBar style="light"/>
    </View>
  )
}