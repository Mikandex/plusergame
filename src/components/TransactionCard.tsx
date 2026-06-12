import { View, Text, Pressable } from 'react-native'
import React from 'react'
import moment from 'moment'
import displayCurrency from '@/utils/displayCurrency';
import Feather from '@expo/vector-icons/Feather';
import { useThemeStore } from '@/store/ThemeStore';
import { transactionsType } from '../../types/types';

const TransactionCard = ({item, handlePress, index}: {item: transactionsType; handlePress: () => void, index: number}) => {

  const { theme } = useThemeStore();

  return (
    <Pressable onPress={handlePress} className='border-b w-full h-28 bg-charcoal-light border-charcoal'>
        <View className="flex-1 justify-between w-full flex-row items-start gap-2 rounded-lg px-4 py-2 my-1">
          <View className="items-start flex-row gap-2 flex-1">
            <View className={`flex items-center justify-center`}>
              <Feather name={item?.payment_status === "successful" ? "arrow-down-right" : item?.payment_status === "failed" ? "arrow-up-right" : "minus"} color={item?.payment_status === "successful" ? "#22c55e" : item?.payment_status === "failed" ? "#ef4444" : "#f59e0b"} size={24}/>
            </View>
            <View className='flex-1'>
              <Text className="font-mbold text-base capitalize text-white" numberOfLines={1}>{item?.category} -</Text>
              <Text className="font-mregular text-sm my-1 text-gray" numberOfLines={1}>{moment(item?.paid_at).format('llll')}</Text>
              <Text className="font-mmedium text-base text-gray" numberOfLines={1}>{item?.transaction_reference}</Text>
            </View>
          </View>

          <View className='items-end justify-end'>
            <Text className="font-bold text-base text-white">{displayCurrency(Number(item?.amount))}</Text>
          </View>
        </View>
    </Pressable >
  )
}

export default TransactionCard