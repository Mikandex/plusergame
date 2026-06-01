import { View, StyleSheet, Dimensions } from 'react-native';
import React, { useCallback, memo } from 'react';
import { useSharedValue } from 'react-native-reanimated';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');

// Image URLs
const defaultDataWith6Colors = [
  "https://img.etimg.com/thumb/msid-93051525,width-1070,height-580,imgsize-2243475,overlay-economictimes/photo.jpg",
  "https://images-eu.ssl-images-amazon.com/images/G/31/img22/Wireless/devjyoti/PD23/Launches/Updated_ingress1242x550_3.gif",
  "https://images-eu.ssl-images-amazon.com/images/G/31/img23/Books/BB/JULY/1242x550_Header-BB-Jul23.jpg"
];

// Memoized Carousel Item
type CarouselItemProps = {
  uri: string
};

const CarouselItem = memo(({ uri }: CarouselItemProps) => {

  const blurhash = 'L~I64noffQfQfQfQfQfQfQfQfQfQ';

  return (
    <View style={styles.itemContainer}>
      <ExpoImage source={{ uri }} placeholder={{ blurhash }} cachePolicy="disk" contentFit="cover" style={{ width: "100%", height: "100%" }}/>
    </View>
  );
});

const SearchBanner = () => {
  const scrollOffsetValue = useSharedValue<number>(0);
  const progress = useSharedValue(0);

  // Memoized renderItem for Carousel
  const renderCarouselItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <CarouselItem uri={item} key={index} />
    ),
    []
  );

  return (
    <View style={{ alignItems: 'center' }} className='bg-gray-100'>
      <Carousel
        loop
        width={width}
        height={250}
        snapEnabled
        autoPlay
        autoPlayInterval={4000}
        pagingEnabled
        data={defaultDataWith6Colors}
        defaultScrollOffsetValue={scrollOffsetValue}
        mode="horizontal-stack"
        modeConfig={{
          snapDirection: 'left',
          stackInterval: 0,
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
          data={defaultDataWith6Colors}
          dotStyle={styles.dot}
          activeDotStyle={styles.activeDot}
        />
      </View>
    </View>
  );
};

export default SearchBanner;

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
    backgroundColor: '#fff',
  },
  activeDot: {
    backgroundColor: '#000',
  },
});
