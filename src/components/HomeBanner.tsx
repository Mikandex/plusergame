import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { images } from '@/constants';

const { width } = Dimensions.get('window');

type HomeBannerProps = {
  /** Show a Start Now button that takes a guest to Create Account / Log In. */
  startNow?: boolean;
};

const HomeBanner = ({ startNow = false }: HomeBannerProps) => {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={styles.banner}
        className="bg-charcoal overflow-hidden"
      >
        <Image
          source={images.card1}
          resizeMode="cover"
          style={styles.image}
        />
        {startNow ? (
          <TouchableOpacity
            testID="start-now-button"
            accessibilityRole="button"
            accessibilityLabel="Start Now"
            activeOpacity={0.85}
            onPress={() => router.push('/(onboarding)')}
            style={styles.startNow}
          >
            <Text style={styles.startNowText}>Start Now</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

export default HomeBanner;

const styles = StyleSheet.create({
  banner: {
    width: width - 32,
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  startNow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    backgroundColor: '#D4AF37',
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 9,
  },
  startNowText: {
    color: '#0F1115',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
