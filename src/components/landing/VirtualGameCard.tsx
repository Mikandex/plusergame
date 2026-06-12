import { View, Text, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'

const VirtualGameCard = ({
  item,
  index,
}: {
  item: any;
  index: number;
}) => {

  return (
    <Pressable
      onPress={() => router.push("/(onboarding)/LogIn")}
      className="w-40 h-36 relative rounded-lg overflow-hidden bg-red-200"
    >
      <Image
        source={{ uri: item.banner }}
        style={{ width: "100%", height: "100%", position: "absolute" }}
        contentFit="cover"
        cachePolicy="disk"
      />

      {/* Overlay footer */}
      <View className="w-full bg-brown-500 absolute bottom-0">
        <Text
          className="text-center text-lg font-mmedium px-2 py-1 text-charcoal"
          numberOfLines={3}
        >
          {item.game_type}
        </Text>
      </View>
    </Pressable>
  );
}

export default VirtualGameCard
