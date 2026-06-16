import { Modal, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Image, Pressable } from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import { StatusBar } from 'expo-status-bar';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchInput from '../SearchInput';
import { axiosClient } from '@/globalApi';
import Toast from 'react-native-toast-message';

type bankType = {
    code: string; 
    logo: string; 
    name: string; 
}[]

// const data = [
//   { "code": "044", "name": "Access Bank", "logo": "https://nigerianbanks.xyz/logo/access-bank.png" },
//   { "code": "023", "name": "Citibank Nigeria", "logo": "https://nigerianbanks.xyz/logo/citibank.png" },
//   { "code": "050", "name": "EcoBank Nigeria", "logo": "https://nigerianbanks.xyz/logo/ecobank-nigeria.png" },
//   { "code": "070", "name": "Fidelity Bank", "logo": "https://nigerianbanks.xyz/logo/fidelity-bank.png" },
//   { "code": "011", "name": "First Bank of Nigeria", "logo": "https://nigerianbanks.xyz/logo/first-bank-of-nigeria.png" },
//   { "code": "214", "name": "First City Monument Bank", "logo": "https://nigerianbanks.xyz/logo/first-city-monument-bank.png" },
//   { "code": "058", "name": "Guaranty Trust Bank", "logo": "https://nigerianbanks.xyz/logo/guaranty-trust-bank.png" },
//   { "code": "030", "name": "Heritage Bank", "logo": "https://nigerianbanks.xyz/logo/heritage-bank.png" },
//   { "code": "301", "name": "Jaiz Bank", "logo": "https://nigerianbanks.xyz/logo/jaiz-bank.png" },
//   { "code": "082", "name": "Keystone Bank", "logo": "https://nigerianbanks.xyz/logo/keystone-bank.png" },
//   { "code": "526", "name": "Moniepoint MFB", "logo": "https://nigerianbanks.xyz/logo/moniepoint-microfinance-bank.png" },
//   { "code": "076", "name": "Polaris Bank", "logo": "https://nigerianbanks.xyz/logo/polaris-bank.png" },
//   { "code": "101", "name": "ProvidusBank", "logo": "https://nigerianbanks.xyz/logo/providus-bank.png" },
//   { "code": "221", "name": "Stanbic IBTC Bank", "logo": "https://nigerianbanks.xyz/logo/stanbic-ibtc-bank.png" },
//   { "code": "068", "name": "Standard Chartered Bank", "logo": "https://nigerianbanks.xyz/logo/standard-chartered-bank.png" },
//   { "code": "232", "name": "Sterling Bank", "logo": "https://nigerianbanks.xyz/logo/sterling-bank.png" },
//   { "code": "100", "name": "Suntrust Bank", "logo": "https://nigerianbanks.xyz/logo/suntrust-bank.png" },
//   { "code": "032", "name": "Union Bank of Nigeria", "logo": "https://nigerianbanks.xyz/logo/union-bank-of-nigeria.png" },
//   { "code": "033", "name": "United Bank for Africa", "logo": "https://nigerianbanks.xyz/logo/united-bank-for-africa.png" },
//   { "code": "215", "name": "Unity Bank", "logo": "https://nigerianbanks.xyz/logo/unity-bank.png" },
//   { "code": "035", "name": "Wema Bank", "logo": "https://nigerianbanks.xyz/logo/wema-bank.png" },
//   { "code": "057", "name": "Zenith Bank", "logo": "https://nigerianbanks.xyz/logo/zenith-bank.png" },
//   { "code": "000026", "name": "Taj Bank", "logo": "https://nigerianbanks.xyz/logo/taj-bank.png" },
//   { "code": "000027", "name": "Globus Bank", "logo": "https://nigerianbanks.xyz/logo/globus-bank.png" },
//   { "code": "000029", "name": "Lotus Bank", "logo": "https://nigerianbanks.xyz/logo/lotus-bank.png" },
//   { "code": "565", "name": "Carbon", "logo": "https://nigerianbanks.xyz/logo/carbon.png" },
//   { "code": "090115", "name": "TCF MFB", "logo": "" },
//   { "code": "50211", "name": "Kuda MFB", "logo": "https://nigerianbanks.xyz/logo/kuda-bank.png" },
//   { "code": "000025", "name": "Opay", "logo": "https://nigerianbanks.xyz/logo/opay.png" },
//   { "code": "000023", "name": "PalmPay", "logo": "https://nigerianbanks.xyz/logo/palmpay.png" }
// ]

const NgnBankModal = ({placeholder, header, showModal, close, selectedValue, title, handlePress, handleShowModal}: {placeholder: string; header: string; showModal: boolean; close: () => void; selectedValue: string; title: string; handlePress: (bank: any) => void, handleShowModal: () => void}) => {

    const { top, bottom } = useSafeAreaInsets()
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<bankType>([])
    const [allBanks, setAllBanks] = useState<bankType>([])
    const [query, setQuery] = useState('');

   const data = async () => {
    
        setLoading(true)
    
        try {
            
            const result = await axiosClient.get("/withdrawal/list-banks")
    
            console.log("d", result.data)
            setItems(result.data || [])
            setAllBanks(result.data || [])
    
    
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: error.response.data.message
            });
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        data()
    }, [])

    const filteredBanks = useMemo(() => {
        return query
            ? allBanks.filter(bank =>
                bank.name.toLowerCase().includes(query.toLowerCase()) ||
                bank.code.includes(query)
            )
            : allBanks;
    }, [query, allBanks]);

    useEffect(() => {
        setItems(filteredBanks);
    }, [filteredBanks]);

  return (
    <View className='flex-1 items-center justify-center'>
        <View className='flex-1 items-center justify-center'>
            <Modal animationType='slide' statusBarTranslucent transparent={false} visible={showModal} onRequestClose={handleShowModal}>
                <View className='px-4 flex-1 bg-charcoal' style={{ paddingTop: top, paddingBottom: bottom }}>
                    <View className='flex-row items-center justify-between gap-2 py-2'>
                        <Text className='font-bold text-lg text-white'>{header}</Text>
                        <TouchableOpacity onPress={() => close()}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    {
                        loading ? (
                            <ActivityIndicator size="large" color="#fff"/>
                        ) : (
                            <View className='w-full flex-1'>
                                <View className='w-full my-2'>
                                    <SearchInput value={query} handleChangeText={(text) => setQuery(text)} placeholder="Search Banks..."/>
                                </View>
                                <FlatList
                                    nestedScrollEnabled={true}
                                    scrollEnabled={true}
                                    data={items}
                                    keyExtractor={(item, index) => index.toString()}
                                    renderItem={({item, index}) => (
                                        <TouchableOpacity key={index} onPress={() => handlePress(item)} className='my-3 flex-row items-center gap-2 w-full'>
                                            {item?.logo ? (
                                                <Image source={{ uri: item.logo }} style={{ width: 30, height: 30 }}/>
                                            ) : (
                                                <FontAwesome name="bank" size={20} color="#fff" />
                                            )}
                                            <Text className='text-lg text-white font-mmedium'>{item.name}</Text>
                                        </TouchableOpacity>
                                    )}
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={{paddingBottom: 30}}
                                    ListEmptyComponent={() => (
                                        <View className='h-[70vh]'>
                                            <View className="w-full items-center mx-auto justify-center my-6 mt-16 max-w-60 flex-1">
                                                <View className='flex items-center justify-center size-16 rounded-full bg-orangeLight'>
                                                    <Entypo name="list" size={32} color="#FF6600"/>
                                                </View>
                                                <Text className="text-xl text-cente mt-4 font-msbold">{query ? "No Results Found" : "Something went wrong"}</Text>
                                                <Text className="text-sm text-cente py-2 font-mregular">{query ? "Check your input" : "Please try again"}</Text>
                                                {!query && (
                                                    <Pressable>
                                                        <SimpleLineIcons name="refresh" size={24} color="black" />
                                                    </Pressable>
                                                )}
                                            </View>
                                        </View>
                                    )}
                                />
                            </View>
                        )
                    }        
                </View>
            </Modal>
            <View className='bg-charcoal-light mt-4'>
                <Text className={`text-base text-white font-mregular pb-2`}>{title}</Text>
                <TouchableOpacity className='border bg-gray w-full h-[46px] px-4 rounded-lg items-center gap-1 flex-row' onPress={handleShowModal}>
                    <Text className='flex-1 text-charcoal font-mregular text-base' numberOfLines={1}>{selectedValue ? selectedValue : placeholder}</Text>
                    <Ionicons name="chevron-down-circle-sharp" size={24} color="#0F1115" />
                </TouchableOpacity>
            </View>
        </View>
        <StatusBar style={"light"}/>
    </View>
  )
}

export default NgnBankModal