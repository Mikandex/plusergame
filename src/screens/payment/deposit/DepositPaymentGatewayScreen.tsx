import { ActivityIndicator, Dimensions, Text, TouchableOpacity, View } from 'react-native'
import React, { useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { WebView } from "react-native-webview"
import { AntDesign, Octicons } from '@expo/vector-icons'

const { height, width} = Dimensions.get("window")

const DepositPaymentGatewayScreen = () => {

  const { paylink } = useLocalSearchParams() as any;

  const [visible, setVisible] = useState(false)

  const webview = useRef<WebView>(null);

  const handleWebViewNavigationStateChange = (newNavState: any) => {
    // newNavState looks something like this:
    // {
    //   url?: string;
    //   title?: string;
    //   loading?: boolean;
    //   canGoBack?: boolean;
    //   canGoForward?: boolean;
    // }
    const { url } = newNavState;
    console.log("url",url)
    if (!url) return;

    // if(url.includes('?orderId')) {
    //   getWallet(true)
    //   router.dismissAll()
    // }

  };

  return (
    <SafeAreaView className='h-full flex-1 bg-white'>

      <View className="flex-row justify-between gap-2 px-4 pb-4 py-2 relative">
        <TouchableOpacity  onPress={() => router.back()}>
          <Octicons name="arrow-left" size={28} color="#0F1115" />
        </TouchableOpacity>
        <Text className="text-charcoal text-center text-lg font-msbold tracking-wide">
          Fund Wallet
        </Text>
        <View className='w-7'/>
      </View>

      <WebView
       ref={webview}
        source={{uri: paylink }}
        onLoadStart={() => setVisible(true)}
        onLoadEnd={() => setVisible(false)}
        onNavigationStateChange={handleWebViewNavigationStateChange}
      />

      {
        visible && (
          <ActivityIndicator size="large" color="#111625" style={{position:"absolute", top: height/2, left: width/2}}/>
        )
      }

    </SafeAreaView>
  )
}

export default DepositPaymentGatewayScreen
