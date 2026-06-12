import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PulsingButton from './PulsingButton';
import { router } from 'expo-router';

const GameCard = ({ item, index }: { item: any; index: number }) => {
  const isOdd = index % 2 !== 0;

  const gradientColors: [string, string] = isOdd
    ? ['#D4AF37', '#8B1A1A']
    : ['#8B1A1A', '#D4AF37'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={[0, 0]}
      end={[1, 0]}
      style={{ borderRadius: 14, padding: 1, marginBottom: 12 }}
    >
      <View className="bg-charcoal rounded-[13px] gap-2 flex-row overflow-hidden min-h-[130px] max-h-[150px]">
        {/* Left: Text content */}
        <View className="flex-1 p-4 justify-center">
          <Text className="text-white text-lg font-msbold mb-1">
            {item?.title}
          </Text>
          <Text className="text-gray text-sm font-mmedium leading-[18px] mb-[14px]">
            {item?.description}
          </Text>
          <PulsingButton handlePress={() => router.push(item?.route)} />
        </View>

        {/* Right: Image */}
        <View className="w-[40%]">
          {item?.image && (
            <ImageBackground
              source={item.image}
              style={{ flex: 1, }}
              resizeMode="contain"
            />
          )}
        </View>

      </View>
    </LinearGradient>
  );
};

export default GameCard;