import { View, FlatList, Text, ActivityIndicator } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { Pressable } from 'react-native'
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { Dimensions } from 'react-native';
import { images } from '@/constants';
const width = Dimensions.get("window").width

type vendorType = {
  label: string;
  logo: string;
}

const categories = [
  { img: images.product1, label: "Vintage" },
  { img: images.product2, label: "Senators" },
  { img: images.product3, label: "T-shirt" },
  { img: images.product4, label: "Materials" },
  { img: images.product5, label: "Trousers" },
  { img: images.product6, label: "Kints" },
  { img: images.product3, label: "Men" },
  { img: images.product2, label: "Female" }
];

const HomeCategories = () => {

 const blurhash = 'L~I64noffQfQfQfQfQfQfQfQfQfQ';
    
  const [vendors, setVendors] = useState<vendorType[]>([])
  const [loading, setLoading] = useState(true)
  const dummy = new Array(4).fill(null)

  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false)
    
  const gotToVendorProduct = (id: string) => {
 
  }

  return (
    <View className='py-2'>
      <Text className='font-msbold px-3 pb-1 text-lg'>Categories</Text>
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 4, paddingHorizontal: 10 }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Pressable className='p-2 items-center max-w-28' onPress={() => router.push("/(modal)/CategoriesProducts")}>
            <View className='w-20 h-20 rounded-full overflow-hidden'>
              <ExpoImage 
                source={item?.img} 
                placeholder={{ blurhash }} 
                cachePolicy="disk" 
                contentFit="contain" 
                style={{ width: '100%', height: '100%' }}
              />
            </View>
            <Text className='text-base mt-1 text-center font-mmedium' numberOfLines={2}>{item?.label}</Text>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View className="items-center justify-center px-2 py-8 bg-gray-50 rounded-md" style={{width: width - 24}}>
            <Text className="text-xl font-extrabold">
                No Categories Found
            </Text>
            <Text className="text-sm text-center mt-1">
                All categories will show here.
            </Text>
          </View>
        )}
        scrollEnabled={true}
        nestedScrollEnabled={true}
      />
    </View>
  )
}

export default HomeCategories
