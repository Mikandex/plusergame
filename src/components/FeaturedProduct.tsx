import { View, Text, FlatList, Pressable, Dimensions } from 'react-native'
import React, { useEffect, useState } from 'react'
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { Skeleton } from 'moti/skeleton';
import displayCurrency from '@/utils/displayCurrency';
import { formatEnums } from '@/utils/formatEnums';
import { data } from '@/constants';
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
let cachedFeatured: ProductType[] = [];

const FeaturedProduct = () => {

    const blurhash = 'L~I64noffQfQfQfQfQfQfQfQfQfQ';
    
    const [featured, setFeatured] = useState<ProductType[]>(data?.dummyProducts)
    const [loading, setLoading] = useState(false)
    const dummy = new Array(4).fill(null)


    const renderDeal = ({ item }: any) => (
        <Pressable className='w-40 gap-1' onPress={() => router.push({pathname: "/(routes)/ProductDetails", params: { productDetails: JSON.stringify(item) }})}>
            <View className="bg-gray-50 size-40 rounded-xl items-center justify-center">
                <ExpoImage source={{ uri: item?.image[0] }} placeholder={{ blurhash }} cachePolicy="disk" contentFit="cover" style={{width: "100%", height: "100%" }}/>
            </View>
            <View className="w-full items-start gap-1">
                <Text className="font-msbold" numberOfLines={1}>{item?.name}</Text>
                <Text numberOfLines={1}>{item?.description}</Text>
                <Text className={`text-sm font-msbold ${item.productStatus === 'in_stock' ? 'text-green-500' : item.productStatus === 'out_of_stock' ? 'text-red-500' : 'text-red-500'}`}>{formatEnums(item.productStatus)}</Text>
                <Text className="font-msbold" numberOfLines={2}>{displayCurrency(Number(item.price), item.currency)}</Text>
            </View>
        </Pressable>
    );

  return (
    <View className='py-1'>
        <Text className='font-msbold text-lg px-3 pb-2'>Handpicked for you</Text>
        {loading ? (
            <FlatList
                data={dummy}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                keyExtractor={(item, index) => index.toString()}
                ItemSeparatorComponent={() => <View className="w-2" />}
                renderItem={({ item }) => (
                    <View style={{ width: 130 }}>
                        {/* <Skeleton.Group show={loading}>
                            <Skeleton height={130} width={130} radius={10} {...skeletonProps} />
                        </Skeleton.Group> */}
                    </View>
                )}
                scrollEnabled={true}
                nestedScrollEnabled={true}
            />
        ) : (
            <FlatList
                data={featured}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12 }}
                keyExtractor={(item, index) => item?.id}
                ItemSeparatorComponent={() => <View className="w-2" />}
                renderItem={renderDeal}
                scrollEnabled={true}
                nestedScrollEnabled
                ListEmptyComponent={() => (
                    <View className="items-center justify-center px-2 py-8 bg-gray-50 rounded-md" style={{width: width - 24}}>
                        <Text className="text-xl font-extrabold">
                            No Products Found
                        </Text>
                        <Text className="text-sm text-center mt-1">
                            Popular products will show here.
                        </Text>
                    </View>
                )}
            />
        )}
    </View>
  )
}

export default FeaturedProduct