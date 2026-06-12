import { useEffect } from 'react';
import { TouchableOpacity, Text, Platform, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const PulsingButton = ({ handlePress }: { handlePress: () => void }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 700 }),
        withTiming(1, { duration: 700 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          alignSelf: 'flex-start',
          borderRadius: 8,
          // iOS shadow
          shadowColor: '#D4AF37',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          // Android shadow
          elevation: 12,
        },
      ]}
    >
      <TouchableOpacity
        onPress={handlePress}
        className="bg-red py-2.5 px-4 rounded-lg"
      >
        <Text className="text-white text-sm font-msbold">Play Now</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default PulsingButton;