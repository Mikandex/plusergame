import { View, Text, useWindowDimensions, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import Header from '@/components/Header'
import { StatusBar } from 'expo-status-bar'
import { router } from 'expo-router'
import { TabView, SceneMap } from 'react-native-tab-view';
import Games from './Games'
import Transactions from './Transactions'
import useNotificationStore from '@/store/NotificationStore'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


const NotificationScreen = () => {

    const layout = useWindowDimensions();
    const [index, setIndex] = useState(0);
    const bottom = useSafeAreaInsets().bottom
    const { setUnreadCount } = useNotificationStore();

  
    const renderScene = SceneMap({
      first: Games,
      second: Transactions
    });
  
    const routes = [
        { key: 'first', title: 'Games' },
        { key: 'second', title: 'Transactions' }
    ];

  // Render the custom tab bar
  const renderTabBar = (props: any) => {
    return (
      <View className="flex-row gap-2 px-8 mt-2 border-b border-white">
        {props.navigationState.routes.map((route: any, i: number) => {
          const isFocused = props.navigationState.index === i;
  
          return (
            <TouchableOpacity
              key={i}
              className={`flex-1 items-center pb-2 ${
                isFocused && 'border-b-4 border-red'
              }`}
              onPress={() => props.jumpTo(route.key)}
            >
              <Text
                className={`text-sm font-msbold text-white`}
              >
                {route.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const goBack = () => {
    setUnreadCount(0)
    router.back()
  }

  return (
    <View className="h-full flex-1 bg-charcoal" style={{ paddingBottom: bottom}}>
      <Header title='Notifications' onpress={goBack}/>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        renderTabBar={renderTabBar}
        initialLayout={{ width: layout.width }}
      />
      <StatusBar style={"light"} />
    </View>
  )
}

export default NotificationScreen