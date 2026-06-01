import { View, Text, TouchableOpacity, Pressable } from 'react-native'
import React from 'react'
import displayCurrency from '@/utils/displayCurrency';
import moment from 'moment';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import * as Clipboard from 'expo-clipboard';
import { useToast } from 'react-native-toast-notifications';
import WhiteButton from './WhiteButton';
import { Feather, Ionicons } from '@expo/vector-icons';

const OrderCard = ({item, handlePress, index}: {item: any; handlePress: () => void, index: number}) => {
  
    const toast = useToast();

    const copyOrderId = async (orderId: string) => {
      if(orderId){
        const copyCode = await Clipboard.setStringAsync(orderId);
  
        toast.show("Order ID Copied", {
            type: "success",
        });
      } 
    }

    return (
    <View className="w-full bg-gray-100 rounded-lg px-3 py-3 my-2">
        <View className="w-full">
            <View className='gap-2'>
                <View  className="items-start gap-2">
                <View className="w-full flex-row gap-2 justify-between items-center">
                    <View className={`flex items-center justify-center size-8 rounded-full bg-white`}>
                        <Ionicons name="receipt-sharp" size={16} color={"#eb4d4b"} />
                    </View>
                    <View className='flex-row items-center gap-2'>
                        <WhiteButton title="Track Order" handlePress={handlePress} containerStyles='bg-white border-black' textStyles='text-black' icon={<Feather name="truck" size={14} color="#000" />}/>
                    </View>
                </View>
                </View>
            </View>
        </View>

        <View className='gap-4'>
            <View className='w-full flex-row gap-4 border-b border-dashed border-[#b8b4b4] pb-4'>
                <View className='gap-1 mt-2'>
                    <Pressable onPress={() => copyOrderId(item?.id)} className="flex-row items-center gap-2 flex-wrap">
                        <Text className="font-msbold text-sm">{item?.id}</Text>
                        <FontAwesome6 name="copy" size={14} color="#000"/>
                    </Pressable>
                </View>
            </View>

            <View className='w-full flex-row gap-4 border-b border-dashed border-[#b8b4b4] pb-4'>
                <View className='gap-1'>
                    <Text className="font-mregular text-xs text">Date</Text>
                    <Text className="font-msbold text-sm text">{item?.date}</Text>
                    {/* <Text className="font-msbold text-sm text-blue capitalize">{moment(item?.createdAt).format('llll')}</Text> */}
                </View>
                <View className='gap-1 flex-1 overflow-auto'>
                    <Text className="font-mregular text-xs text">Delivery Date</Text>
                    <Text className="font-msbold text-sm" numberOfLines={2}>{item?.deliveryDate}</Text>
                </View>
            </View>
            
            <View className='w-full flex-row gap-4'>
                <View className='gap-1'>
                    <Text className="font-mregular text-xs">Status</Text>
                    <Text className="font-msbold text-sm">{item?.status}</Text>
                </View>

                <View className='gap-1 flex-1 overflow-auto'>
                    <Text className="font-mregular text-xs">Total</Text>
                    <Text className="font-msbold text-sm">{displayCurrency(Number(item?.totalPrice))}</Text>
                </View>
            </View>

        </View>
    </View>
  )
}

export default OrderCard