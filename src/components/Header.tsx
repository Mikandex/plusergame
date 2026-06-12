import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Octicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Header({ title, showBack = true, onpress }: { title: string; showBack?: boolean; onpress: () => void }) {

    const top = useSafeAreaInsets().top;
    
  return (
    <View className="bg-charcoal flex-row justify-between gap-2 px-4 pb-4 relative"  style={{ paddingTop: top + 8 }}>
        {showBack ? (
            <TouchableOpacity onPress={onpress}>
                <Octicons name="arrow-left" size={28} color="#fff" />
            </TouchableOpacity>
        ) : (
            <View className='w-7'/>
        )}
        <Text className="text-white text-center text-lg font-msbold tracking-wide">
            {title}
        </Text>
        <View className='w-7'/>
    </View>
  )
}