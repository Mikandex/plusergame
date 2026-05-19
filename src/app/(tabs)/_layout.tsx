import { Feather, FontAwesome, FontAwesome5, Fontisto, Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons, SimpleLineIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {

  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "Home") {
            return (
              <SimpleLineIcons
                name="home"
                size={size}
                color={color}
              />
            );
          }

          if (route.name === "Search") {
            return (
              <Ionicons
                name="search-outline"
                size={size}
                color={color}
              />
            );
          }

          if (route.name === "Cart") {
            return (
              <Ionicons 
                name="cart-outline"
                size={size}
                color={color}
              />
            );
          }

          if (route.name === "Orders") {
            return (
              <Ionicons 
                name="bag-handle-outline"
                size={size}
                color={color}
              />
            );
          }

          if (route.name === "Profile") {
            return (
              <Ionicons
                name="person-outline"
                size={size}
                color={color}
              />
            );
          }

          return <Ionicons name="ellipse-outline" size={size} color={color} />;
        },
        tabBarActiveTintColor: '#eb4d4b',
        tabBarInactiveTintColor: "gray",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopColor: "#DDDDDD",
          borderTopWidth: 1,
          paddingTop: 2,
          height: 55 + insets.bottom,
          paddingBottom: insets.bottom,
          position: "relative",
          elevation: 0,
        },
        tabBarBadgeStyle: {
          backgroundColor: "#eb4d4b",
          color: "#fff"
        }
      })}
    >
      <Tabs.Screen name="Home" options={{ title: "Home" }} />
      <Tabs.Screen name="Search" options={{ title: "Search" }} />
      <Tabs.Screen name="Cart" options={{ title: "Cart", tabBarBadge: 2 }} />
      <Tabs.Screen name="Orders" options={{ title: "Orders" }} />
      <Tabs.Screen name="Profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}