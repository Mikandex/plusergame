import { View, Text, Pressable } from 'react-native'
import React, { useEffect, useState } from 'react'
import AntDesign from '@expo/vector-icons/AntDesign'
import CustomButton from './CustomButton'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'

const CartIncrementBtn = ({id, handleLoadCart, showCheckout, otherStyles}: {id: string; handleLoadCart: () => void; showCheckout?: boolean; otherStyles?: string}) => {
    const [product, setProduct] = useState<any>([])

    const getProduct = () => {
    }

    useEffect(() => {
        getProduct()
    }, [])

    const increase = (id: string) => {
    }

    const decrease = (id: string) => {
    }

    const remove = (id: string) => {
        
    }


  return (
    <View className='flex-row gap-3 w-full'>
        <View className={`flex-row px-4 items-center justify-between min-h-[48px] rounded-full bg-gray-200 ${otherStyles}`}>
            {
                product?.quantity > 1 ? (
                    <Pressable onPress={() => decrease(id)} className=''>
                        <AntDesign name="minus" size={22} color="#000" />
                    </Pressable>
                ) : (
                    <Pressable onPress={() => remove(id)} className=''>
                        <Ionicons name="trash-outline" size={22} color="#000" />
                    </Pressable>
                )
            }
            
            <Pressable className='px-6'>
                <Text className='text-blue font-mmedium text-xl'>{2}</Text>
            </Pressable>
            <Pressable onPress={() => increase(id)}>
                <AntDesign name="plus" size={22} color="#000" />
            </Pressable>
        </View>
        {showCheckout && (
            <CustomButton title="Go to Cart" handlePress={() => router.push("/(protected)/(routes)/StoreCart")} containerStyles="flex-1" textStyles='text-white'/>
        )}
    </View>
  )
}

export default CartIncrementBtn