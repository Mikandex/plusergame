import { View, Text, Image, FlatList, ScrollView, Pressable } from 'react-native'
import React, { useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import Header from '@/components/Header'
import CustomButton from '@/components/CustomButton'
import { router } from 'expo-router'
import { data, images } from '@/constants'
import { TouchableOpacity } from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import displayCurrency from '@/utils/displayCurrency'
import CartCard from '@/components/CartCard'

export default function CartScreen() {

  const [products, setProducts] = useState(data.dummyProducts);
  const openSwipeable = useRef<any>(null);

  const loadCart = () => {
    // const cart = AmazonGetItems();
    // setCartItems(cart);
  };
  
  const renderCart = ({item, index}: {item: any, index: number}) => {
    return (
      <CartCard item={item} openSwipeable={openSwipeable} index={index} total={() => { return 2000 }} loadCart={loadCart} updateItem={(updatedItem: any) => {
        // const newCart = cartItems.map(ci =>
        //   ci.asin === updatedItem.asin ? updatedItem : ci
        // );
        // setCartItems(newCart); // triggers FlatList re-render
      }}/>
    )
  }

  const clearCart = () => {

  }

    const icon = () => (
      <TouchableOpacity onPress={clearCart}>
        <MaterialCommunityIcons name="delete-forever" size={30} color="#000" />
      </TouchableOpacity>
    )

  return (
    <SafeAreaView className="bg-white flex-1">
      <View className='px-4'>
        <Header title={`Cart (20)`} showGoBack={true} onpress={() => router.back()} showRight={true} icon={icon()}/>
      </View>

      <FlatList
        style={{ flex: 1 }}
        nestedScrollEnabled={true}
        scrollEnabled={true}
        data={products}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderCart}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <Pressable className='mx-4 border border-gray-200 rounded-md p-2 flex-row items-center justify-between gap-2 flex-wrap'>
            <Text className="text-sm font-mmedium text-green-600">Free delivery upto 15 items</Text>
            <Text className="text-xs font-mregular text-gray-600">Limited-time</Text>
          </Pressable>
        )}
        ListEmptyComponent={() => (
          <View>
            <View className="w-full items-center mx-auto justify-center my-6 mt-8 max-w-64 flex-1">
              <Image source={images.shoppingCart1} className='size-36' resizeMode='contain'/>
              <Text className="text-2xl text-center text-blue mt-4 font-mbold">Your cart is empty!</Text>
              <Text className="text-sm text-center text-gray-600 mt-1 font-mmedium">All your orders will show here when you start using the Store feature</Text>
              <TouchableOpacity 
                onPress={() => router.replace("/(tabs)/Home")}
                className="mt-6 px-6 py-2 bg-red rounded-full border border-red"
              >
                <Text className="text-white text-sm font-mmedium">Start Shopping</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {products.length > 0 && (
        <View className='w-full justify-center pt-1 px-4 gap-2 bg-white'>
          <Text className='text-center font-semibold text-lg'>{`${displayCurrency(Number(1000))}`}</Text>
          <CustomButton title="Checkout" handlePress={() => router.push("/(protected)/Checkout")} containerStyles="w-full" textStyles='text-white'/>
        </View>
      )}

    <StatusBar style='dark'/>
  </SafeAreaView>
  )
}
