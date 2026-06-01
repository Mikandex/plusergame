import { View, Text, TouchableOpacity, TextInput, Pressable } from 'react-native'
import React from 'react'
import { EvilIcons, FontAwesome, Ionicons, SimpleLineIcons } from '@expo/vector-icons'

export default function HomeSearchBar() {
  return (
    <View className="flex-row items-center gap-x-2.5 mb-2 px-3">

        <Pressable className="bg-white p-2 rounded-full relative size-12 items-center justify-center shadow">
            <Text className='absolute top-1 p-1 rounded-full bg-red text-center text-white text-[10px] min-w-5 min-h-5 z-50' numberOfLines={1}>33</Text>
            <SimpleLineIcons name="bell" size={20} color="black" />
        </Pressable>

        <View className="flex-1 flex-row items-center bg-white rounded-full px-3 h-12 shadow">
            <Ionicons name="search" size={22} color={"#000"} className=' mr-1.5'/>
            <TextInput
                className="flex-1 text-base text-black"
                placeholder="Search"
                placeholderTextColor="#000"
            />
        </View>

        <Pressable className="bg-white p-2 rounded-full relative size-12 items-center justify-center shadow">
            <Text className='absolute top-1 p-1 rounded-full bg-red text-center text-white text-[10px] min-w-5 min-h-5 z-50' numberOfLines={1}>33</Text>
            <EvilIcons name="cart" size={24} color="black" />
        </Pressable>
    </View>
  )
}