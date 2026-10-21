import { FlatList, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { VIRTUAL_GAMES } from '@/data/virtualGames'
import GameTile, { GAME_TILE_GAP, GAME_TILE_WIDTH } from '@/components/GameTile'

export default function GameHubStrip() {
  return (
    <View>
      <View className="flex-row items-center gap-1 mb-3 mt-1">
        <Ionicons name="grid-outline" size={15} color="#D4AF37" />
        <Text className="text-white text-sm font-msbold tracking-widest">ALL GAMES</Text>
      </View>
      <FlatList
        horizontal
        data={VIRTUAL_GAMES}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <GameTile item={item} index={index} />}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        snapToInterval={GAME_TILE_WIDTH + GAME_TILE_GAP}
        decelerationRate="fast"
        contentContainerStyle={{ paddingRight: 8, paddingBottom: 12 }}
      />
    </View>
  )
}
