import RestaurantDetailsHeader from '@/components/RestaurantDetailsHeader';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Stars from "react-native-stars";
import { CategoryProductItem } from '@/components/CategoryProductItem';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 300;
const STICKY_THRESHOLD_START = 280;
const STICKY_THRESHOLD_END = 320;

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

const MOCK_STORE = {
  name: 'Vintage Shirts',
  rating: 4.8,
  minOrder: 29.99,
  deliveryFee: 0.0,
  deliveryTime: '2–4 days',
  image: { uri: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80' },
};

const MOCK_MENU = [
  {
    category: 'New Arrivals',
    subtitle: 'Fresh drops this season',
    dishes: [
      {
        id: '1',
        name: 'Linen Blazer',
        description: 'Relaxed fit, breathable linen blend. Perfect for warm evenings out.',
        price: 89.99,
        productStatus: 'in_stock',
        badge: 'POPULAR',
        image: { uri: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&q=80' },
      },
      {
        id: '2',
        name: 'Oversized Tee',
        description: '100% organic cotton, dropped shoulders, unisex sizing.',
        price: 34.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' },
      },
      {
        id: '3',
        name: 'Wide-Leg Trousers',
        description: 'High-waisted with pleated front. Available in 4 neutrals.',
        price: 64.99,
        productStatus: 'out_of_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&q=80' },
      },
    ],
  },
  {
    category: 'Tops',
    subtitle: 'Everyday essentials & statement pieces',
    dishes: [
      {
        id: '4',
        name: 'Silk Cami',
        description: 'Delicate adjustable straps, bias-cut drape, 100% silk.',
        price: 74.99,
        productStatus: 'in_stock',
        badge: 'BESTSELLER',
        image: { uri: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=400&q=80' },
      },
      {
        id: '5',
        name: 'Ribbed Tank Top',
        description: 'Slim cut, double-layered rib fabric. Seamless finish.',
        price: 22.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=80' },
      },
      {
        id: '6',
        name: 'Striped Longsleeve',
        description: 'Cotton-modal blend. Classic Breton stripe in navy.',
        price: 44.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=400&q=80' },
      },
      {
        id: '7',
        name: 'Cropped Hoodie',
        description: 'Brushed fleece interior, kangaroo pocket, zip-free design.',
        price: 59.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1578768079052-aa76e52ff62e?w=400&q=80' },
      },
    ],
  },
  {
    category: 'Bottoms',
    subtitle: 'Trousers, skirts & denim',
    dishes: [
      {
        id: '8',
        name: 'Barrel-Leg Jeans',
        description: 'Mid-rise, non-stretch denim, distressed hem detail.',
        price: 79.99,
        productStatus: 'in_stock',
        badge: 'TRENDING',
        image: { uri: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80' },
      },
      {
        id: '9',
        name: 'Pleated Mini Skirt',
        description: 'Recycled polyester, permanent pleats, elasticated waist.',
        price: 49.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=400&q=80' },
      },
      {
        id: '10',
        name: 'Cargo Shorts',
        description: '6-pocket utility design, water-resistant ripstop fabric.',
        price: 54.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1591195853828-11db59a44f43?w=400&q=80' },
      },
    ],
  },
  {
    category: 'Outerwear',
    subtitle: 'Coats, jackets & layers',
    dishes: [
      {
        id: '11',
        name: 'Trench Coat',
        description: 'Classic double-breasted silhouette, storm flap, belt included.',
        price: 189.99,
        productStatus: 'in_stock',
        badge: 'LIMITED',
        image: { uri: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&q=80' },
      },
      {
        id: '12',
        name: 'Puffer Vest',
        description: 'Recycled down filling, minimal quilting, hidden side pockets.',
        price: 94.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&q=80' },
      },
      {
        id: '13',
        name: 'Denim Jacket',
        description: 'Washed indigo, patch pockets, relaxed boxy fit.',
        price: 109.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=400&q=80' },
      },
    ],
  },
  {
    category: 'Accessories',
    subtitle: 'Bags, scarves & finishing touches',
    dishes: [
      {
        id: '14',
        name: 'Canvas Tote',
        description: 'Natural canvas, reinforced stitching, inner zip pocket.',
        price: 39.99,
        productStatus: 'in_stock',
        badge: 'BESTSELLER',
        image: { uri: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&q=80' },
      },
      {
        id: '15',
        name: 'Wool Scarf',
        description: 'Merino wool, fringed ends, 190×30cm. Wraps twice.',
        price: 54.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&q=80' },
      },
      {
        id: '16',
        name: 'Leather Belt',
        description: 'Full-grain leather, polished gunmetal buckle, 3cm width.',
        price: 44.99,
        productStatus: 'in_stock',
        badge: null,
        image: { uri: 'https://images.unsplash.com/photo-1624222247344-550fb60fe8ff?w=400&q=80' },
      },
    ],
  },
];

const CategoryProductScreen = () => {

  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeCategory, setActiveCategory] = useState(0);
  const sectionListRef = useRef<any>(null);
  const categoryScrollRef = useRef<FlatList>(null);
  const scrollOffset = useSharedValue(0);
  const insets = useSafeAreaInsets();

  const store = MOCK_STORE;
  const menu = MOCK_MENU;
  const storeLoading = false;
  const menuLoading = false;

  const sections =
    menu?.map((category) => ({
      title: category.category,
      subtitle: category.subtitle,
      data: category.dishes,
    })) || [];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const parallaxStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollOffset.value, [-100, 0], [1.5, 1], Extrapolation.CLAMP);
    const translateY = interpolate(scrollOffset.value, [0, 400], [0, -150], Extrapolation.CLAMP);
    return {
      transform: [{ scale }, { translateY }],
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(scrollOffset.value, [0, 70], [0, 1], Extrapolation.CLAMP);
    return { opacity };
  });

  const handleCategoryPress = (index: number) => {
    setActiveCategory(index);
    sectionListRef.current?.scrollToLocation({
      sectionIndex: index,
      itemIndex: 0,
      animated: true,
      viewOffset: insets.top + 100,
    });
    scrollCategoryTabIntoView(index);
  };

  const scrollCategoryTabIntoView = (index: number) => {
    categoryScrollRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.5, // centers the active tab
    });
  };

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: any) => {
      if (viewableItems.length > 0) {
        const firstVisibleSection = viewableItems[0].section;
        const sectionIndex = sections.findIndex((s) => s.title === firstVisibleSection.title);
        if (sectionIndex !== -1 && sectionIndex !== activeCategory) {
          setActiveCategory(sectionIndex);
          scrollCategoryTabIntoView(sectionIndex);
        }
      }
    },
    [sections, activeCategory]
  );

  const stickyTabsStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollOffset.value,
      [STICKY_THRESHOLD_START, STICKY_THRESHOLD_END],
      [0, 1],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  if (storeLoading || menuLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (!store) {
    return (
      <View style={styles.centered}>
        <Text>Store not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Parallax hero image */}
      <Animated.Image
        style={[styles.backgroundImage, parallaxStyle]}
        resizeMode="cover"
        source={store.image}
      />

      {/* White overlay fade on scroll */}
      <Animated.View style={[styles.whiteOverlay, overlayStyle]} />

      {/* Top bar (back, search, heart) */}
      <View style={{ zIndex: 10 }}>
        <RestaurantDetailsHeader scrollOffset={scrollOffset} />
      </View>

      {/* Sticky category tabs — fade in after STICKY_THRESHOLD_START */}
      <Animated.View style={[styles.stickyTabsOverlay, stickyTabsStyle, { top: insets.top + 64 }]}>
        <View style={styles.categoryTabsContainer}>
          <FlatList
            ref={categoryScrollRef}
            data={menu}
            horizontal
            keyExtractor={(_, index) => `sticky-${index}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryTabs}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                categoryScrollRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              }, 200);
            }}
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => handleCategoryPress(index)}
                style={[styles.categoryTab, activeCategory === index && styles.categoryTabActive]}>
                <Text
                  style={[
                    styles.categoryTabText,
                    activeCategory === index && styles.categoryTabTextActive,
                  ]}>
                  {item.category}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </Animated.View>

      {/* Main scrollable list */}
      <AnimatedSectionList
        ref={sectionListRef}
        sections={sections}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        onViewableItemsChanged={onViewableItemsChanged}
        contentContainerStyle={{ paddingBottom: insets.bottom + 8 }}
        keyExtractor={(item: any) => item.id}
        renderSectionHeader={({ section }: { section: any }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.subtitle && (
              <Text style={styles.sectionSubtitle}>{section.subtitle}</Text>
            )}
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <CategoryProductItem
            item={item}
            isLast={index === section?.data?.length - 1}
          />
        )}
        ListHeaderComponent={
          <>
            {/* Spacer so list starts below hero */}
            <View style={styles.imageSpacer} />

            <View style={styles.whiteContentContainer}>
              {/* Concave curve — dips up into the hero image */}
              <Svg
                height={30}
                width={width}
                viewBox={`0 0 ${width} 30`}
                style={{ position: 'absolute', top: -29, left: 0 }}>
                <Path
                  d={`M 0,30 Q ${width / 2},0 ${width},30 L ${width},30 L 0,30 Z`}
                  fill="#fff"
                />
              </Svg>

              {/* Store logo */}
              <View style={styles.logoContainer}>
                <Image source={store.image} style={styles.logo} />
              </View>

              {/* Store info */}
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>Vintage Shirts</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoText}>Free delivery upto 50 items within Nigeria</Text>
                </View>
              </View>

              {/* Delivery row */}
              <View style={styles.deliveryInfo}>
                <TouchableOpacity style={styles.deliveryButton}>
                  <Feather name="truck" size={16} color="#009de0" />
                  <Text style={styles.deliveryText}>Delivery {store.deliveryTime}</Text>
                  <Ionicons name="chevron-down" size={16} color="#009de0" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButtonSmall}>
                  <Feather name="user-plus" size={20} color="#009de0" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButtonSmall}>
                  <Ionicons name="share-social-outline" size={20} color="#009de0" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width,
    height: IMAGE_HEIGHT,
  },
  whiteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width,
    height: IMAGE_HEIGHT,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  imageSpacer: {
    height: IMAGE_HEIGHT - 60,
  },
  whiteContentContainer: {
    backgroundColor: '#fff',
    marginTop: -30,
    paddingTop: 30,
    overflow: 'visible',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: -60,
    marginBottom: 12,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  storeInfo: {
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  infoDot: {
    fontSize: 14,
    color: '#999',
  },
  moreLink: {
    fontSize: 14,
    color: '#009de0',
    fontWeight: '600',
  },
  deliveryInfo: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  deliveryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  deliveryText: {
    fontSize: 14,
    color: '#009de0',
    fontWeight: '600',
  },
  iconButtonSmall: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stickyTabsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: '#fff',
  },
  categoryTabsContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 3,
  },
  categoryTabs: {
    paddingTop: 12,
    paddingHorizontal: 16,
    gap: 20,
  },
  categoryTab: {
    paddingBottom: 12,
  },
  categoryTabActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#009de0',
  },
  categoryTabText: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  categoryTabTextActive: {
    color: '#009de0',
    fontWeight: '600',
  },
});

export default CategoryProductScreen;