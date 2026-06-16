import { useAuthStore } from "@/store/AuthStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {

  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuthStore();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          if (route.name === "home") {
            return (
              <Ionicons
                name="home-outline"
                size={size}
                color={color}
              />
            );
          }

          if (route.name === "GamesPlayed") {
            return (
              <Ionicons
                name="game-controller-outline"
                size={size}
                color={color}
              />
            );
          }

          if (route.name === "Transactions") {
            return (
              <MaterialCommunityIcons
                name="bank-outline"
                size={size}
                color={color}
              />
            );
          }

          if (route.name === "profile") {
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
        tabBarActiveTintColor: '#9A2121',
        tabBarInactiveTintColor: "#9CA3AF",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#1B1F27",
          borderTopWidth: 0,
          borderTopColor: "transparent",
          paddingTop: 2,
          height: 55 + insets.bottom,
          paddingBottom: insets.bottom,
          position: "relative",
          elevation: 0,
        }
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="GamesPlayed" options={{ title: "Games Played" }} 
        listeners={() => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              router.push('/(onboarding)/Index');
            }
          }
        })}
      />
      <Tabs.Screen name="Transactions" options={{ title: "Transactions" }} 
        listeners={() => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              router.push('/(onboarding)/Index');
            }
          }
        })}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} 
        listeners={() => ({
          tabPress: (e) => {
            if (!isAuthenticated) {
              e.preventDefault();
              router.push('/(onboarding)/Index');
            }
          }
        })}
      />
      
    </Tabs>
  );
}