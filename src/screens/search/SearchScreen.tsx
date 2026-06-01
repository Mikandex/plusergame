import { View, Text, FlatList, Pressable, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
// import HomeShortCategory from '@/components/amazon/HomeShortCategory'
import SearchBanner from '@/components/search/AmazonBanner'
import SearchPlaceholder from '@/components/search/SearchPlaceholder'
import CategoryList from '@/components/CategoryList'
import HomeProductList from '@/components/HomeProductList'
import FeaturedProduct from '@/components/FeaturedProduct'

const SearchScreen = () => {

  const { top, bottom } = useSafeAreaInsets()

  const suggestions = ["Vintage shirts", "Jonkoso materials", "White shirts", "Trousers", "Suits", "Blazers"];

  return (
    <View className='h-full bg-cyan' style={{ paddingTop: top }}>
      <SearchPlaceholder cart={0}/>
      <View className='flex-1 bg-white'>
        <FlatList
          data={[]}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              <Pressable className='bg-cyan-light py-2 px-4'>
                <Text className='font-amedium text-base' numberOfLines={1}>Find your perfect style in our quality collection...</Text>
              </Pressable>
              <CategoryList />
              <SearchBanner/>
              <FlatList
                  data={suggestions}
                  keyExtractor={(item) => item}
                  ListHeaderComponent={() => (
                    <Text className='font-msbold text-base px-4 py-3'>Recent Searches</Text>
                  )}
                  renderItem={({ item }) => (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="py-3 px-4 border-b border-gray-100"
                      >
                        <Text>{item}</Text>
                      </TouchableOpacity>
                  )}
                /> 
                <FeaturedProduct/>
              <HomeProductList/>
            </View>
          )}
          contentContainerStyle={{
            paddingBottom: bottom + 8
          }}
          nestedScrollEnabled
        />
      </View>

      <StatusBar style='dark'/>
    </View>
  )
}

export default SearchScreen