import { View, Text, Pressable } from 'react-native'
import displayCurrency from '@/utils/displayCurrency';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Image as ExpoImage } from 'expo-image';
import { FontAwesome, SimpleLineIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { RefObject, useRef } from 'react';

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

const CartCard = ({item, index, loadCart, total, updateItem, openSwipeable}: {
  item: ProductType;
  index: number;
  loadCart: () => void;
  total: () => void;
  updateItem: any;
  openSwipeable: RefObject<any>;
}) => {

  const blurhash = 'L~I64noffQfQfQfQfQfQfQfQfQfQ';

    const swipeableRef = useRef<any>(null);

  const increase = (id: string) => {}
  const decrease = (id: string) => {}
  const remove = (id: string) => {}

    const renderRightActions = () => (
        <Pressable
            onPress={() => remove(item.id)}
            className="bg-red w-20 items-center justify-center gap-1"
        >
            <SimpleLineIcons name="trash" size={22} color="#fff"  />
            <Text className="text-white text-xs font-msbold">Remove</Text>
        </Pressable>
    );

  return (
    <View className="border-b border-gray-100">
        <Swipeable 
            renderRightActions={renderRightActions}
            ref={swipeableRef}
            overshootRight={false}
            onSwipeableWillOpen={() => {
            // close the previously open one
            if (openSwipeable.current && openSwipeable.current !== swipeableRef.current) {
                openSwipeable.current.close();
            }
            // set this one as the open one
            openSwipeable.current = swipeableRef.current;
            }}
        >
            <View className="w-full p-4">
                <View className="w-full flex-row items-start">
                    <Pressable className="relative w-[30%] min-h-20 rounded-lg overflow-hidden bg-gray-100 items-center justify-center">
                        <Pressable onPress={() => remove(item.id)} className="absolute p-1 top-0 left-0 z-20 bg-red rounded-sm">
                            <AntDesign name="close" size={18} color="#fff" />
                        </Pressable>
                        <ExpoImage
                            source={{ uri: item.image[0] || "" }}
                            placeholder={{ blurhash }}
                            cachePolicy="disk"
                            contentFit="cover"
                            style={{ width: "100%", height: 140 }}
                        />
                    </Pressable>
                    <View className="w-full flex-1 items-start gap-1 px-2">
                        <Text className="font-msbold text-sm" numberOfLines={1}>{item?.name}</Text>
                        <Text className="font-mmedium text-xs" numberOfLines={1}>{item?.description}</Text>
                        <Text className="font-mmedium text-sm" numberOfLines={1}>
                            {displayCurrency(Number(item?.price), item?.currency)}
                        </Text>
                        <View className='flex-row gap-1'>
                            <Text className="text-sm">Subtotal:</Text>
                            <Text className='flex-1 text-sm font-mbold'>
                            {displayCurrency(item.quantity * Number(item?.price), item?.currency)}
                            </Text>
                        </View>
                        {item?.productStatus === 'out_of_stock' && (
                            <Text className="text-red-500 text-xs font-mmedium">Out of stock</Text>
                        )}
                        <View className="flex-row px-2 items-center justify-between min-h-[40px] rounded-lg border border-black min-w-36">
                            {item?.quantity > 1 ? (
                                <Pressable onPress={() => decrease(item.id)}>
                                <AntDesign name="minus" size={20} color="#000" />
                                </Pressable>
                            ) : (
                                <Pressable onPress={() => remove(item.id)}>
                                <FontAwesome name="trash" size={20} color="#000" />
                                </Pressable>
                            )}
                            <Pressable className='px-4'>
                                <Text className='font-mmedium text-xl'>{item?.quantity}</Text>
                            </Pressable>
                            <Pressable onPress={() => increase(item.id)}>
                                <AntDesign name="plus" size={20} color="#000" />
                            </Pressable>
                        </View>
                    </View>
                </View>
            </View>
        </Swipeable>
    </View>
  )
}

export default CartCard