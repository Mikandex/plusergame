import { View, StyleSheet, Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import React, { useCallback, memo } from 'react';
import { interpolate, useSharedValue } from 'react-native-reanimated';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { images } from '@/constants';

const { width } = Dimensions.get('window');

const sliderImages = [images.card1, images.card2, images.card3];

type CarouselItemProps = {
  source: string | number  // number for local, string for remote
};

const CarouselItem = memo(({ source }: CarouselItemProps) => {
  const blurhash = 'L~I64noffQfQfQfQfQfQfQfQfQfQ';
    
  return (
    <View style={styles.itemContainer} className='bg-charcoal'>
      <ExpoImage
        source={typeof source === 'number' ? source : { uri: source }}
        placeholder={{ blurhash }}
        cachePolicy="disk"
        contentFit="cover"
        style={{ width: "100%", height: "100%" }}
      />
    </View>
  );
});

const HomeBanner = () => {

  const scrollOffsetValue = useSharedValue<number>(0);
  const progress = useSharedValue(0);

  // Memoized renderItem for Carousel
  const renderCarouselItem = useCallback(
    ({ item, index }: { item: string | number; index: number }) => (
      <CarouselItem source={item} key={index} />  // source, not uri
    ),
    []
  );

  return (
    <View style={{ alignItems: 'center'}}>
      <Carousel
        loop
        width={width - 32}
        height={120}
        style={{ borderRadius: 16, borderWidth: 1, borderColor: "#D4AF37" }}
        autoPlay
        autoPlayInterval={4000}
        data={sliderImages}
        defaultScrollOffsetValue={scrollOffsetValue}
        customAnimation={(value) => {
          'worklet';
          const opacity = interpolate(value, [-1, 0, 1], [0, 1, 0], 'clamp');
          const zIndex = interpolate(value, [-1, 0, 1], [0, 1, 0], 'clamp');
          return {
            opacity,
            zIndex,
            transform: [],
          };
        }}
        withAnimation={{
          type: 'timing',
          config: {
            duration: 800,
          },
        }}
        onConfigurePanGesture={(panGesture) => {
          panGesture.activeOffsetX([-10, 10]);
          panGesture.failOffsetY([-5, 5]);
        }}
        onProgressChange={(_, absoluteProgress) => {
          progress.value = absoluteProgress;
        }}
        renderItem={renderCarouselItem}
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        <Pagination.Basic
          progress={progress}
          data={sliderImages}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
        />
      </View>
    </View>
  );
};

export default HomeBanner;

const styles = StyleSheet.create({
  itemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: '#F5F7FA',
  },
  activeDot: {
    backgroundColor: '#D4AF37',
  },
});
