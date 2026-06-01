import { View, Text, TouchableOpacity } from 'react-native'
import React, { ReactElement } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign'
import { Ionicons } from '@expo/vector-icons';

type headerProps = {
    title: string;
    right?: ReactElement, 
    showGoBack?: boolean;
    showRight?: boolean;
    icon?: any;
    onpress?: () => void
}

export default function Header({title, right, showGoBack, showRight, icon, onpress}: headerProps) {
  return (
    <View className='flex-row items-center justify-between mt-4 pb-4 gap-1'>
      {showGoBack ? <TouchableOpacity onPress={onpress}><Ionicons name="chevron-back-circle-sharp" size={33} color="#C3C3C3" /></TouchableOpacity>
        : <Text/>
      }
      <Text className="flex-1 text-lg font-mmedium text-center" numberOfLines={1}>{title}</Text>
      {showRight ? (
        icon
      ) : (
        <View className='w-7'/>
      )}
    </View>
  )
}