import { View, Text, Pressable } from 'react-native'
import React from 'react'
import displayCurrency from '@/utils/displayCurrency';

const NotificationCard = ({item, section, handlePress}: {item: any; section: any; handlePress: () => void}) => {

  return (
    <Pressable onPress={handlePress} className="px-3 py-6 border-b relative bg-charcoal-light border-charcoal">
      {!item?.is_read && <View className='bg-yellow size-2.5 rounded-full absolute left-2 top-2'/>}
      <View className="justify-between w-full flex-row items-start gap-3">
        <View className='flex-1'>
          <Text className="font-mbold text-base capitalize text-white" numberOfLines={1}>{item?.title}</Text>
        </View>
        <View className='items-end justify-end gap-2'>
          <Text className="font-bold text-base text-white" numberOfLines={2}>{displayCurrency(Number(item?.amount))}</Text>
        </View>
      </View>
      <Text className={`font-mmedium text-sm my-1 capitalize ${item?.status === "failed" ? "text-red-600" : item?.status === "successful" ? "text-green-600" : "text-amber-600"}`} numberOfLines={1}>{item?.status}</Text>
      <View className="flex-row justify-between gap-3">
        <Text className="font-mregular text-sm flex-1 text-white" numberOfLines={1}>
          {item?.message}
        </Text>
        <Text className="font-mregular text-sm text-white">{item?.created_at}</Text>
      </View>
  </Pressable>
  )
}

export default NotificationCard