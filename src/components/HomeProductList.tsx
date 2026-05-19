import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Dimensions, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image as ExpoImage } from 'expo-image';
import { router } from "expo-router";
import displayCurrency from "@/utils/displayCurrency";
import { formatEnums } from "@/utils/formatEnums";
import { data } from "@/constants";
const width = Dimensions.get("window").width

type ProductType = {
  id: string; 
  description: string; 
  image: string[]; 
  name: string; 
  currency: "GBP" | "NGN";
  price: string; 
  productStatus: "in_stock" | "out_of_stock";
  quantity: number;
}

let hasFetched = false;
let cachedProducts: ProductType[] = [];

const HomeProductList = () => {

  const blurhash = 'L~I64noffQfQfQfQfQfQfQfQfQfQ';
    
  const [products, setProducts] = useState<ProductType[]>(data?.dummyProducts)
  const [loading, setLoading] = useState(false)
  const dummy = new Array(6).fill(null)
  const half = (width/2) - 21

  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false)
  

  return (
    <View className="px-1 py-2">
      <Text className='font-msbold text-lg px-3 pb-2'>Shop from all products</Text>

        <FlashList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item?.id}
          masonry
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: ProductType }) => (
            <TouchableOpacity
              activeOpacity={0.9}
              className="m-1"
              onPress={() => router.push({pathname: "/(protected)/(routes)/NaijaShopProductDetails", params: { productDetails: JSON.stringify(item) }})}
            >
              <View className="w-full bg-gray-50" style={{ width: "100%", height: Math.random() * 100 + 150 }}>
                <ExpoImage source={{ uri: item?.image[0] }} placeholder={{ blurhash }} cachePolicy="disk" contentFit="cover" style={{width: "100%", height: "100%" }}/>
              </View>
              <View className="w-full flex-1 items-start gap-1">
                <Text className="font-msbold" numberOfLines={2}>{item?.name}</Text>
                <Text numberOfLines={2}>{item?.description}</Text>
                <Text className={`text-sm font-msbold ${item.productStatus === 'in_stock' ? 'text-green-500' : item.productStatus === 'out_of_stock' ? 'text-red-500' : 'text-red-500'}`}>{formatEnums(item.productStatus)}</Text>
                <Text className="font-msbold">{displayCurrency(Number(item.price), item.currency)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-8 mx-3 bg-gray-50 rounded-md">
              <Text className="text-xl font-extrabold">
                No Products Found
              </Text>
              <Text className="text-sm text-center mt-1">
                All products will show here.
              </Text>
            </View>
          )}
          onEndReachedThreshold={0.4}
          ListFooterComponent={() => {
            if (isLoadingMore) {
              return (
                <View className='items-center p-4'>
                  <ActivityIndicator size="small" color="#003366" />
                  <Text className='text-blue text-amedium text-sm mt-1'>Loading more...</Text>
                </View>
              );
            }

            if (!hasMore && products.length > 19) {
              return (
                <View className='items-center p-4'>
                  <Text className='text-black text-amedium text-sm'>No more Data!</Text>
                </View>
              );
            }

            return null;
          }}
        />
    </View>
  );
};

export default HomeProductList;