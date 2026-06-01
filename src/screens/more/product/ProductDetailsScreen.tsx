import ImageDetailCarousel from "@/components/ImageDetailCarousel";
import { Entypo, EvilIcons, Feather, FontAwesome, Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Dimensions, FlatList, Image, Pressable, Share, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import displayCurrency from "@/utils/displayCurrency";
import Stars from "react-native-stars";
import { useToast } from "react-native-toast-notifications";
import { BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import CustomButtomSheet from "@/components/CustomButtomSheet";
import CustomButton from "@/components/CustomButton";
import CartIncrementBtn from "@/components/CartIncrementBtn";

const { width } = Dimensions.get("window");
const HEADER_HEIGHT = 420;
const CARD_WIDTH = (width - 44) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionItem =
  | { type: "details" }
  | { type: "sizeColor" }
  | { type: "description" }
  | { type: "reviews" }
  | { type: "recommended_header" }
  | { type: "recommended_grid"; products: RecommendedProduct[] };

interface RecommendedProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  badge?: string;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const carouselImages = [
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&fit=crop",
  "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&fit=crop",
  "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1200&fit=crop",
  "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1200&fit=crop",
];

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

const COLORS = [
  { label: "Midnight", hex: "#1a1a2e" },
  { label: "Crimson", hex: "#c0392b" },
  { label: "Slate", hex: "#7f8c8d" },
  { label: "Olive", hex: "#6d6833" },
  { label: "Cream", hex: "#f5f0e8" },
];

const RECOMMENDED: RecommendedProduct[] = [
  {
    id: "r1",
    name: "Air Max Pulse",
    price: 89000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&fit=crop",
    rating: 4.8,
    badge: "New",
  },
  {
    id: "r2",
    name: "Classic Runner",
    price: 65000,
    image: "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600&fit=crop",
    rating: 4.3,
  },
  {
    id: "r3",
    name: "Urban Stride",
    price: 72000,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&fit=crop",
    rating: 4.6,
    badge: "Hot",
  },
  {
    id: "r4",
    name: "Sport Lite",
    price: 55000,
    image: "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=600&fit=crop",
    rating: 4.1,
  },
];

const SECTIONS: SectionItem[] = [
  { type: "details" },
  { type: "sizeColor" },
  { type: "description" },
  { type: "reviews" },
  { type: "recommended_header" },
  { type: "recommended_grid", products: RECOMMENDED },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const SizeColorSection = () => {
  const [selectedSize, setSelectedSize] = useState<string>("M");
  const [selectedColor, setSelectedColor] = useState<string>("Midnight");

  return (
    <View className="px-4 pt-4 pb-2">
      {/* Size Selector */}
      <View className="mb-5">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-msbold text-base text-black">Select Size</Text>
          <Pressable>
            <Text className="text-xs font-mregular text-gray-500 underline">Size Guide</Text>
          </Pressable>
        </View>
        <View className="flex-row gap-2 flex-wrap">
          {SIZES.map((size) => {
            const active = selectedSize === size;
            return (
              <Pressable
                key={size}
                onPress={() => setSelectedSize(size)}
                className={`w-12 h-10 rounded-[10px] items-center justify-center border-[1.5px] ${
                  active ? "bg-black border-black" : "bg-white border-[#E0E0E0]"
                }`}
              >
                <Text className={`text-[13px] font-msbold ${active ? "text-white" : "text-[#333]"}`}>
                  {size}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Color Selector */}
      <View>
        <Text className="font-msbold text-base text-black mb-3">
          Color: <Text className="font-mregular text-gray-500">{selectedColor}</Text>
        </Text>
        <View className="flex-row gap-3">
          {COLORS.map((color) => {
            const active = selectedColor === color.label;
            return (
              <Pressable
                key={color.label}
                onPress={() => setSelectedColor(color.label)}
                style={[
                  { backgroundColor: color.hex, width: 30, height: 30, borderRadius: 15 },
                  active && { borderWidth: 3, borderColor: "#000", transform: [{ scale: 1.15 }] },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

// DetailsSection receives handlers + quantity as props so it can use them
interface DetailsSectionProps {
  quantity: number;
  onOpenQuantitySheet: () => void;
  onAddToCart: () => void;
  onBuyNow: () => void;
}

const DetailsSection = () => (
  <View className="px-4 pt-5 pb-2">
    <View className="flex-row items-center gap-2 mb-2">
      <View className="bg-black self-start px-3 py-1 rounded-md">
        <Text className="text-white text-[10px] font-bold uppercase tracking-wider">Nike</Text>
      </View>
      <View className="bg-gray-100 self-start px-3 py-1 rounded-md">
        <Text className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Footwear</Text>
      </View>
    </View>

    <Text className="text-2xl font-msbold text-black mb-1">Air Force 1 '07 LV8</Text>
    <Text className="text-gray-500 font-mregular text-sm mb-3">SKU: NK-AF1-LV8-007</Text>

    <View className="flex-row items-center gap-2 mb-4">
      <Stars
        display={4.5}
        spacing={2}
        count={5}
        starSize={14}
        fullStar={<FontAwesome name="star" size={14} color="#FFA41C" />}
        emptyStar={<FontAwesome name="star-o" size={14} color="#D5DBDB" />}
        halfStar={<FontAwesome name="star-half-o" size={14} color="#FFA41C" />}
      />
      <Text className="font-mregular text-sm text-gray-500">4.5  •  238 Reviews</Text>
    </View>

    <View className="flex-row items-center gap-2">
      <View className="w-2 h-2 rounded-full bg-green-500" />
      <Text className="font-mregular text-sm text-green-600">
        In Stock  •  Free delivery on orders over ₦50,000
      </Text>
    </View>

    <View className="mt-4">
      <Text className="font-msbold text-2xl">{displayCurrency(Number(3000))}</Text>
    </View>
  </View>
);

const DescriptionSection = ({ quantity, onOpenQuantitySheet, onAddToCart, onBuyNow }: DetailsSectionProps) => {
  const [expanded, setExpanded] = useState(false);
  const desc =
    "The Nike Air Force 1 '07 LV8 brings a bold remix to the classic silhouette. Built with premium leather and textile uppers, it delivers all-day comfort with a durable rubber outsole. The iconic Air-Sole unit provides lightweight cushioning, while the perforated toe box ensures breathability for every step.";

  return (
    <View className="px-4 pt-4 pb-2">
      <Text className="font-msbold text-base mb-2">About This Product</Text>
      <Text className="font-mregular leading-6 text-gray-700" numberOfLines={expanded ? undefined : 4}>
        {desc}
      </Text>
      <Pressable onPress={() => setExpanded(!expanded)}>
        <Text className="text-black font-msbold text-sm mt-1">
          {expanded ? "Show less" : "Read more"}
        </Text>
      </Pressable>

      <View className="mt-4 gap-2">
        {[
          "Premium leather & textile upper",
          "Air-Sole cushioning unit",
          "Perforated toe box for breathability",
          "Rubber outsole for durability",
        ].map((feat, i) => (
          <View key={i} className="flex-row items-center gap-2">
            <View className="w-1.5 h-1.5 rounded-full bg-black" />
            <Text className="font-mregular text-sm text-gray-700">{feat}</Text>
          </View>
        ))}
      </View>

        <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenQuantitySheet}
            className="flex-row items-center justify-between border border-gray-200 px-4 gap-2 rounded-full min-h-[48px] w-full mt-3"
        >
            <View className="flex-row gap-2 items-center">
                <Text className="text-lg font-mmedium text-black" numberOfLines={1}>
                    Quantity: {quantity}
                </Text>
            </View>
            <Entypo name="chevron-down" size={22} color="#003366" />
        </TouchableOpacity>

        <CustomButton title="Add to Cart" handlePress={onAddToCart} containerStyles="w-full mt-2" textStyles="text-white"/>
        <CustomButton title="Buy Now" handlePress={onBuyNow} containerStyles="w-full mt-2" bgColor="bg-black" textStyles="text-white" />

    </View>
  );
};

const ReviewsSection = () => (
  <View className="px-4 pt-4 pb-2">
    <Text className="font-msbold text-base">Customer Reviews</Text>
    
    <Pressable className="flex-row gap-2 bg-green-100 rounded-lg p-2 my-2">
        <View className="w-5 h-5 rounded-full bg-green-700 items-center justify-center shrink-0 mt-1">
            <MaterialCommunityIcons name="shield-account" size={10} color="#fff" />
        </View>
        <Text className="flex-1 text-[10px] font-medium text-green-700 leading-5">
            All reviews are from verified purchases. See what customers are saying about their experience with this product.
        </Text>
    </Pressable>

    <View className="bg-gray-50 rounded-2xl p-4 mb-3">
      <View className="flex-row items-center gap-3 mb-2">
        <Image
          source={{ uri: "https://i.pravatar.cc/150?u=tunde" }}
          className="w-8 h-8 rounded-full bg-gray-200"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text className="font-msbold text-xs">Tunde Adeleke</Text>
          <Text className="font-mregular text-[10px] text-gray-500">Lagos, Nigeria</Text>
        </View>
        <Text className="font-mregular text-xs text-gray-400">2 weeks ago</Text>
      </View>
      <View className="flex-row items-center gap-1 mb-2">
        <Stars
          display={5}
          spacing={2}
          count={5}
          starSize={12}
          fullStar={<FontAwesome name="star" size={12} color="#FFA41C" />}
          emptyStar={<FontAwesome name="star-o" size={12} color="#D5DBDB" />}
          halfStar={<FontAwesome name="star-half-o" size={12} color="#FFA41C" />}
        />
      </View>
      <Text className="font-mregular text-xs leading-5 text-gray-700">
        Absolute quality! The fit is true to size and the leather feels premium.
        Wore them straight out the box — zero break-in needed. Highly recommended.
      </Text>
    </View>

    <Pressable className="my-2">
      <Text className="text-black font-msbold text-sm">See all (238) Reviews</Text>
    </Pressable>
  </View>
);

const RecommendedHeader = () => (
  <View className="px-4 pt-2 pb-2">
    <Text className="font-msbold text-lg">You May Also Like</Text>
  </View>
);

const RecommendedGrid = ({ products }: { products: RecommendedProduct[] }) => (
  <View className="px-4">
    <FlatList
      data={products}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={{ marginBottom: 12, justifyContent: "space-between" }}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: product }) => (
        <Pressable
          style={{ width: CARD_WIDTH }}
          className="bg-white rounded-2xl overflow-hidden border border-gray-100"
          onPress={() => {}}
        >
          <View className="w-full h-[180px] relative">
            <Image
              source={{ uri: product.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
            {product.badge && (
              <View
                className={`absolute top-2 left-2 px-2 py-0.5 rounded-md ${
                  product.badge === "New" ? "bg-[#111]" : "bg-[#c0392b]"
                }`}
              >
                <Text className="text-white text-[10px] font-mbold uppercase">
                  {product.badge}
                </Text>
              </View>
            )}
            <Pressable className="absolute top-2 right-2 w-[30px] h-[30px] rounded-full bg-white/85 items-center justify-center">
              <Ionicons name="heart-outline" size={16} color="#333" />
            </Pressable>
          </View>
          <View className="p-2">
            <Text className="font-msbold text-sm" numberOfLines={1}>{product.name}</Text>
            <View className="flex-row items-center gap-1 mt-0.5">
              <FontAwesome name="star" size={10} color="#FFA41C" />
              <Text className="font-mregular text-xs text-gray-500">{product.rating}</Text>
            </View>
            <Text className="font-msbold text-sm mt-1">{displayCurrency(product.price)}</Text>
          </View>
        </Pressable>
      )}
    />
  </View>
);

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ProductDetailsScreen() {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const showBottomBar = useSharedValue(1);
  const lastScrollY = useSharedValue(0);
  const toast = useToast();
  const [bottomBarHeight, setBottomBarHeight] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);

  const snapPoints = useMemo(() => ["70%"], []);
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const availableQuantity = Array.from({ length: 30 }, (_, i) => i + 1);

  const handleQuantity = (qty: number) => {
    setQuantity(qty);
    handleCloseModalPress();
  };

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleCloseModalPress = useCallback(() => {
    bottomSheetModalRef.current?.dismiss();
  }, []);

  const addToCart = () => {
    toast.show("Added to cart!", { type: "success" });
  };

  const buyNow = () => {
    // handle buy now
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    const currentOffset = event.contentOffset.y;
    const contentHeight = event.contentSize.height;
    const layoutHeight = event.layoutMeasurement.height;
    const isAtBottom = layoutHeight + currentOffset >= contentHeight - 100;

    if (isAtBottom) {
      showBottomBar.value = withTiming(1);
    } else {
      if (currentOffset > lastScrollY.value && currentOffset > 50) {
        showBottomBar.value = withTiming(0);
      } else if (currentOffset < lastScrollY.value) {
        showBottomBar.value = withTiming(1);
      }
    }
    lastScrollY.value = currentOffset;
    scrollY.value = currentOffset;
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
          [-HEADER_HEIGHT / 2, 0, HEADER_HEIGHT * 0.75]
        ),
      },
      {
        scale: interpolate(scrollY.value, [-HEADER_HEIGHT, 0], [2, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT / 2], [1, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, HEADER_HEIGHT / 2],
          [0, -20],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const bottomBarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(showBottomBar.value, [0, 1], [100, 0]) }],
    opacity: showBottomBar.value,
  }));

  const shareLink = async () => {
    await Share.share(
      {
        message: `Check out this product on Zeal collection 🛍️\nNike Air Force 1 '07 LV8\nhttps://zealcollection.com`,
        title: "Shop on Zeal Collection",
      },
      { dialogTitle: "Share Product" }
    );
  };

  const renderItem = useCallback(
    ({ item }: { item: SectionItem }) => {
      switch (item.type) {
        case "details":
          return <DetailsSection/>;
        case "sizeColor":          return <SizeColorSection />;
        case "description":        
            return (
                <DescriptionSection 
                    quantity={quantity}
                    onOpenQuantitySheet={handlePresentModalPress}
                    onAddToCart={addToCart}
                    onBuyNow={buyNow}
                />
            );
        case "reviews":            return <ReviewsSection />;
        case "recommended_header": return <RecommendedHeader />;
        case "recommended_grid":   return <RecommendedGrid products={item.products} />;
        default:                   return null;
      }
    },
    [quantity, handlePresentModalPress]
  );

  const loadCart = () => {

  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* TOP ICONS */}
      <Animated.View
        className="absolute left-5 right-5 z-50 flex-row justify-between items-center"
        style={[iconAnimatedStyle, { top: insets.top + 10 }]}
      >
        <Pressable
          className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
          onPress={() => router.back()}
        >
          <Octicons name="chevron-left" size={24} color="white" />
        </Pressable>

        <View className="flex-row items-center gap-3">
          <Pressable
            className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
            onPress={() => setWishlisted((v) => !v)}
          >
            <Ionicons
              name={wishlisted ? "heart" : "heart-outline"}
              size={20}
              color={wishlisted ? "#ff4d4d" : "white"}
            />
          </Pressable>
          <Pressable
            className="w-10 h-10 rounded-full bg-black/30 items-center justify-center"
            onPress={shareLink}
          >
            <Ionicons name="share-social-outline" size={22} color="white" />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomBarHeight + 16 }}
      >
        {/* Hero parallax header */}
        <Animated.View style={[{ height: HEADER_HEIGHT, width }, headerStyle]}>
          <ImageDetailCarousel images={carouselImages} />
        </Animated.View>

        {/* Content card overlap */}
        <View className="bg-white rounded-t-[20px] pt-1" style={{ marginTop: -20 }}>
          <FlatList
            data={SECTIONS}
            renderItem={renderItem}
            keyExtractor={(item) => item.type}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Animated.ScrollView>

      {/* STICKY BOTTOM BAR */}
      <Animated.View
        onLayout={(e) => setBottomBarHeight(e.nativeEvent.layout.height)}
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-[#F2F2F2]"
        style={[{ paddingBottom: insets.bottom }, bottomBarStyle]}
      >

        <View className='w-full items-center justify-center gap-2 pb-1 pt-4 px-4'>
            <View className='flex-row justify-between items-center'>
                {false ? (
                    <CartIncrementBtn id={"1"} handleLoadCart={loadCart} showCheckout={true} otherStyles='min-w-40'/>
                ) : (
                    <View className='w-full flex-row justify-between items-center gap-4'>
                        <CustomButton title="Add to cart" handlePress={() => addToCart()} containerStyles="flex-1" textStyles='text-white' disableButton={false}/>
                        <TouchableOpacity onPress={() => router.push("/(protected)/(routes)/StoreCart")} activeOpacity={0.7} className={`flex-row rounded-md gap-2 min-h-[48px] justify-center items-center`}>
                            <View className='relative items-center justify-center bg-gray-200 rounded-full min-h-[48px] px-4 py-2'>
                                <EvilIcons name="cart" size={26} color="black" />
                                <Text className='absolute top-1 p-1 rounded-full bg-red text-center text-white text-[10px] min-w-5 min-h-5' numberOfLines={1}>33</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                )}
               
            </View>
        </View>

      </Animated.View>

      {/* QUANTITY BOTTOM SHEET */}
      <CustomButtomSheet
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        enablePenDown={false}
        dynamicSizing={false}
        scrollable
      >
        <View className="h-full">
          <View className="flex-row w-full items-center justify-between gap-1 mb-3">
            <View className="w-8" />
            <Text className="text-sm text-center text-gray-100 font-abold">Select quantity</Text>
            <TouchableOpacity onPress={handleCloseModalPress}>
              <Ionicons name="close-circle"  size={32} color="#d1d5db" />
            </TouchableOpacity>
          </View>

          <View className="bg-gray-100 border mb-3 gap-2 border-gray-200 w-full h-14 px-3 rounded-md focus:border-red items-center justify-center flex-row">
            <Text>Quantity :</Text>
            <BottomSheetTextInput
              className="bg-gray-100 flex-1 text-black font-aregular text-base"
              placeholder="Please enter your quantity"
              placeholderTextColor="#ccc"
              keyboardType="decimal-pad"
              onChangeText={(e) => setQuantity(Number(e))}
            />
          </View>

          <BottomSheetFlatList
            data={availableQuantity}
            keyExtractor={(_, index) => index.toString()}
            renderItem={({ item }) => (
              <Pressable onPress={() => handleQuantity(item)} className="py-3 border-b border-gray-100">
                <Text className="text-xl">{item}</Text>
              </Pressable>
            )}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </CustomButtomSheet>
    </View>
  );
}