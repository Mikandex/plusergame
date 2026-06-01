import { View, Text, Pressable } from 'react-native'
import React from 'react'
import { TouchableOpacity } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router } from 'expo-router'
import Octicons from '@expo/vector-icons/Octicons'

const SearchPlaceholder = ({cart, showDeleteCart, icon}: {cart: number | string; showDeleteCart?: boolean, icon?: any;}) => {
  return (
    <View className='py-3 pr-3 flex-row items-center gap-1 w-full'>
      <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} className='px-2'>
        <Ionicons name="chevron-back-outline" size={28} color="#000" />
      </TouchableOpacity>
      <View className={`flex-1 bg-white border-2 gap-2 border-white w-full h-12 px-3 rounded-full focus:border-orange-300 items-center justify-center flex-row`}>
        <TouchableOpacity>
          <Octicons name="search" size={20} color="#000" />
        </TouchableOpacity>
        <Pressable onPress={() => router.push("/(protected)/(routes)/(modals)/AmazonSearchModal")} className={`bg-white h-full flex-1 text-gray-50 font-aregular text-base justify-center`}>
          <Text>Search Products...</Text>
        </Pressable>
      </View>
      {showDeleteCart ? (
        icon
      ) : (
        <TouchableOpacity onPress={() => router.push("/(protected)/(routes)/AmazonCart")} activeOpacity={0.7} className={`flex-row rounded-md gap-2 pl-3 pr-2 min-h-[48px] justify-center items-center`}>
          <View className='relative items-center justify-center min-h-[48px]'>
            <Feather name="shopping-cart" size={22} color="#003366" />
            <Text className='absolute -right-2 top-0 bg-cyan text-center text-white text-sm min-w-6 min-h-6' numberOfLines={1}>{cart}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  )
}

export default SearchPlaceholder