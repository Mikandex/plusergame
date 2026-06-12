import { View, Text, Pressable} from 'react-native'
import React from 'react'
import moment from 'moment'
import displayCurrency from '@/utils/displayCurrency';
import { useThemeStore } from '@/store/ThemeStore';
import { FontAwesome6 } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
// import Toast from 'react-native-toast-message';

const statusColors: Record<string, string> = {
  true: 'text-green-600',
  false: 'text-red-600',
};

const GameHistoryCard = ({item, index}: {item: any; index: number}) => {
  const { theme } = useThemeStore();
  const isEven = index % 2 === 0;
  // const bgClass = isEven ? 'bg-white' : 'bg-gray-200';
  // const badgeBg = isEven ? 'bg-gray-200' : 'bg-white';

  const copyId = async (item: any) => {
    if(item?.id){
      const copyCode = await Clipboard.setStringAsync(item?.id);

      // Toast.show({
      //     type: 'success',
      //     text1: "Game ID Copied",
      //     text2: `${item?.category} game`
      // });
    } 
  }

  return (
    <View className={`w-full px-4 py-6 ${isEven ? "bg-charcoal-light" : "bg-charcoal"}`}>
      <View className='w-full mt-2 flex-1'>
         <View className="flex-1 justify-between w-full flex-row items-start gap-2">
          <View className='w-32'>
            <Text className="font-msbold text-base capitalize text-white" numberOfLines={1}>Game</Text>
          </View>
          <View className='items-end justify-end gap-2 flex-1'>
            <Text className="font-msbold text-base text-gray">{item?.category}</Text>
          </View>
        </View>
      </View>
      <View className='w-full mt-2 flex-1'>
        <View className="flex-1 justify-between w-full flex-row items-center gap-2">
          <View className='w-32'>
            <Text className="font-msbold text-base capitalize text-white" numberOfLines={1}>Multiplier</Text>
          </View>
          <View className='items-end justify-end gap-2 flex-1'>
            <View className={`rounded-full min-w-[30px] h-[30px] items-center justify-center px-[6px] ${isEven ? 'bg-charcoal' : 'bg-charcoal-light'}`}>
              <Text className="text-base font-msbold text-gray">{item?.multiplier}</Text>
            </View>
          </View>
        </View>
      </View>
      <View className='w-full mt-2 flex-1'>
        <View className="flex-1 justify-between w-full flex-row items-start gap-2">
          <View className='w-32'>
            <Text className="font-msbold text-base capitalize text-white" numberOfLines={1}>Stake</Text>
          </View>
          <View className='items-end justify-end gap-2 flex-1'>
            <Text className="font-semibold text-base text-gray">{displayCurrency(Number(item?.stake))}</Text>
          </View>
        </View>
      </View>
      <View className='w-full mt-2 flex-1'>
        <View className="flex-1 justify-between w-full flex-row items-start gap-2">
          <View className='w-32'>
            <Text className="font-msbold text-base capitalize text-white" numberOfLines={1}>Payout</Text>
          </View>
          <View className='items-end justify-end gap-2 flex-1'>
            <Text className="font-semibold text-base text-gray">{displayCurrency(Number(item?.payout))}</Text>
          </View>
        </View>
      </View>
       <View className='w-full mt-2 flex-1'>
         <View className="flex-1 justify-between w-full flex-row items-start gap-2">
          <View className='w-32'>
            <Text className="font-msbold text-base capitalize text-white" numberOfLines={1}>Status</Text>
          </View>
          <View className='items-end justify-end gap-2 flex-1'>
            <Text className={`font-msbold text-base capitalize ${statusColors[item?.is_win] ?? ''}`}>{item?.is_win ? "WON" : "LOST"}</Text>
          </View>
        </View>
      </View>
      <Text className='text-right font-mregular text-sm mt-3 text-gray'>{moment(item?.played_at).format('llll')}</Text>
      <Pressable onPress={() => copyId(item)} className="flex-row items-center mt-3 gap-2 flex-wrap self-end">
        <Text className="font-mmedium text-sm text-gray" >{item?.id}</Text>
        <FontAwesome6 name="copy" size={14} color={"#9CA3AF"} />
      </Pressable>
    </View>
  )
}

export default GameHistoryCard