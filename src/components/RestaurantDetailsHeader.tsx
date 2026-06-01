import { EvilIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface RestaurantHeaderProps {
  scrollOffset: SharedValue<number>;
}

const SCROLL_THRESHOLD_START = 50;
const SCROLL_THRESHOLD_END = 80;

const RestaurantDetailsHeader = ({ scrollOffset }: RestaurantHeaderProps) => {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const headerStyle = useAnimatedStyle(() => {
    const backgroundOpacity = interpolate(
      scrollOffset.value,
      [SCROLL_THRESHOLD_START, SCROLL_THRESHOLD_END],
      [0, 1],
      Extrapolation.CLAMP
    );

    const shadowOpacity = interpolate(
      scrollOffset.value,
      [SCROLL_THRESHOLD_START, SCROLL_THRESHOLD_END],
      [0, 0.1],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor: `rgba(255,255,255, ${backgroundOpacity})`,
      shadowOpacity,
    };
  });

  const searchBarStyle = useAnimatedStyle(() => {
    const backgroundOpacity = interpolate(
      scrollOffset.value,
      [0, SCROLL_THRESHOLD_START],
      [0.9, 1],
      Extrapolation.CLAMP
    );

    return {
      backgroundColor: `rgba(230, 230, 230, ${backgroundOpacity})`,
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [0, SCROLL_THRESHOLD_END],
      [1, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  const buttonStyle2 = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [SCROLL_THRESHOLD_START * 0.3, SCROLL_THRESHOLD_END],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      opacity,
    };
  });

  return (
    <Animated.View style={[styles.headerContainer, headerStyle, { paddingTop: insets.top }]}>
      <View style={[styles.headerContent]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={25} />
        </TouchableOpacity>

        <Animated.View style={[styles.searchBar, searchBarStyle]}>
          <Ionicons name="search" size={20} color={"black"} />
          <TextInput
            style={{ fontSize: 15 }}
            placeholder="Search"
            placeholderTextColor={"black"}
          />
        </Animated.View>

        <View style={{ width: 44, height: 44 }} />

        <Animated.View style={[styles.iconButton, buttonStyle]}>
          <Ionicons name="heart-outline" size={24} />
        </Animated.View>

        <Animated.View style={[styles.iconButton, buttonStyle2]}>

          <View className="absolute top-1 -right-0.5 bg-red rounded-full min-w-[18px] items-center justify-center px-[4px] z-50">
              <Text
                className="text-white text-xs font-mbold"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                33
              </Text>
          </View>

          <Ionicons name="cart-outline" size={24} color="black" />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0px 4px 2px -2px rgba(0, 0, 0, 0.05)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 2px -2px rgba(0, 0, 0, 0.1)',
  },
  searchBar: {
    width: 44,
    height: 44,
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    gap: 8,
  },
  iconButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 4px 2px -2px rgba(0, 0, 0, 0.1)',
  },
});
export default RestaurantDetailsHeader;
