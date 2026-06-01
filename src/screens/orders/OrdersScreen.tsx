import { StatusBar } from 'expo-status-bar'
import React, { useState } from 'react'
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { SceneMap, TabView } from 'react-native-tab-view'
import Header from '@/components/Header'
import Ongoing from './Ongoing'
import Completed from './Completed'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const OrdersScreen = () => {

  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const top = useSafeAreaInsets().top;

  
  const renderScene = SceneMap({
    first: Ongoing,
    second: Completed
  });
  
  const routes = [
    { key: 'first', title: 'Ongoing' },
    { key: 'second', title: 'Completed' }
  ];

  // Render the custom tab bar
  const renderTabBar = (props: any) => {
    const { routes, index } = props.navigationState;

    return (
      <View className="bg-gray-200 rounded-md mx-4 p-2">
        <View className="flex-row">
          {routes.map((route: any, i: number) => {
            const isFocused = index === i;

            return (
              <TouchableOpacity
                key={route.key}
                className={`flex-1 items-center py-3
                  ${isFocused && "bg-black/90 rounded-md"}
                `}
                onPress={() => props.jumpTo(route.key)}
              >
                <Text
                  className={`text-base font-msbold ${
                    isFocused ? "text-white" : "text-black"
                  }`}
                >
                  {route.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: top }}>
      <View className='px-4'>
        <Header title="Orders" showGoBack={true} onpress={() => router.back()}/>
      </View>
      <View className='flex-1'>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          renderTabBar={renderTabBar}
          initialLayout={{ width: layout.width }}
        />
      </View>
      <StatusBar style='dark'/>
    </View>
  )
}

export default OrdersScreen
