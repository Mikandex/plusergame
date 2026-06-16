import { View, Text, Image, ImageSourcePropType } from 'react-native'
import React from 'react'

const SupportBox = ({image, label, value}: {image: ImageSourcePropType, label: string; value?: string}) => {

  return (
    <View className='w-full h-24 gap-4 rounded-xl flex-row px-4 items-center bg-charcoal-light'>
      <View className='size-[25px]'>
        <Image source={image} width={25} height={25} resizeMode='contain' className='w-full h-full'/>
      </View>
      <View className='flex-1'>
        <Text className='text-xl font-msbold text-white'>{label}</Text>
        {value && (
          <Text className='font-lg font-mmedium text-gray' numberOfLines={2}>{value}</Text>
        )}
      </View>
    </View>
  )
}

export default SupportBox