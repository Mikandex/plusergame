import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { images } from '@/constants';

const { width } = Dimensions.get('window');

const HomeBanner = () => {
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
});
