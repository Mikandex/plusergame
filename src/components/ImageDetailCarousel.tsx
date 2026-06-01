import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import ImageView from "react-native-image-viewing";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

type Props = {
  images: string[];
  animatedStyle?: any;
};

export default function ImageDetailCarousel({ images, animatedStyle }: Props) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setIsVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const modalImages = images.map((img) => ({ uri: img }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: 0,
          width,
          height: "100%",
        },
        animatedStyle,
      ]}
    >
      <Animated.FlatList
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => {
              setSelectedIndex(index);
              setIsVisible(true);
            }}
            style={{ width, height: "100%" }}
          >
            <Image
              source={{ uri: item }}
              style={styles.image}
              resizeMode={"cover"}
            />
          </Pressable>
        )}
      />

      <View style={styles.paginationContainer}>
        <Text className="text-white font-msbold">
          {currentIndex + 1}/{images.length}
        </Text>
      </View>

      <ImageView
        images={modalImages}
        presentationStyle="overFullScreen"
        imageIndex={selectedIndex}
        visible={visible}
        onRequestClose={() => setIsVisible(false)}
        HeaderComponent={() => (
          <View style={{ paddingTop: insets.top + 8, paddingRight: 16, alignItems: "flex-end" }}>
            <Pressable
              onPress={() => setIsVisible(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(0,0,0,0.4)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="close" size={26} color="#fff" />
            </Pressable>
          </View>
        )}
        FooterComponent={({ imageIndex }) => (
          <View style={[styles.pagination, { bottom: insets.bottom + 10 }]}>
            <Text className="text-white font-mbold text-lg">
              {`${imageIndex + 1}/${modalImages.length}`}
            </Text>
          </View>
        )}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: "100%",
    height: "100%",
    // backgroundColor: "#0553",
  },
  pagination: {
    position: "absolute",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 30,
    right: 16,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  paginationTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
