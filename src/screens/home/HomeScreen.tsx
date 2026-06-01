import React from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Dimensions,
  FlatList,
} from 'react-native'
import Svg, { Defs, LinearGradient, Stop, Polygon } from 'react-native-svg'
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import HomeBanner from '@/components/HomeBanner'
import FeaturedProduct from '@/components/FeaturedProduct'
import HomeCategories from '@/components/HomeCategories'
import HomeProductList from '@/components/HomeProductList'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import HomeSearchBar from '@/components/search/HomeSearchBar'
const { width: W } = Dimensions.get('window')

const BG_H = 170   // height of the sunburst area — keeps rays compact at top

const RED   = '#eb4d4b'
const LIGHT = '#f0908e'

// Origin point — bottom-center of the SVG
const OX = W / 2
const OY = BG_H

// Ray angles in degrees, measured from straight up (0°).
// Negative = left side, positive = right side.
// Spread evenly from -80° to +80° to fan across the full width.
const RAY_ANGLES = [-63, -58, -53, -48, -43, -38, -33, -28, -23, -18, -13, -8, -3, 3, 8, 13, 18, 23, 28, 33, 38, 43, 48, 53, 58, 63]

// Width of each ray at the top edge (in degrees half-angle)
const RAY_HALF_DEG = 3

// Ray length — how far from origin to the top edge
const RAY_LEN = BG_H * 1.6

const RAYS = RAY_ANGLES.map((angleDeg, i) => ({
  id: String(i),
  angle: angleDeg,
  color: i % 2 === 0 ? RED : LIGHT,
  op: 0.55 + (i % 3) * 0.10,
}))

function degToRad(d: number) { return (d * Math.PI) / 180 }

// Given an angle from straight-up and a length, compute tip point from origin
function rayPoint(angleDeg: number, len: number) {
  const rad = degToRad(angleDeg - 90) // shift so 0° = up
  return {
    x: OX + Math.cos(rad) * len,
    y: OY + Math.sin(rad) * len,
  }
}

function DiagonalBackground() {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: BG_H }}>
      <Svg width={W} height={BG_H} style={StyleSheet.absoluteFill}>
        <Defs>
          {/* Each ray: opaque at its top tip, transparent near origin */}
          {RAYS.map(r => (
            <LinearGradient
              key={r.id}
              id={`rg${r.id}`}
              // Gradient runs from the far tip (top of ray) down to origin
              x1={String(rayPoint(r.angle, RAY_LEN).x / W)}
              y1={String(rayPoint(r.angle, RAY_LEN).y / BG_H)}
              x2={String(OX / W)}
              y2="1"
              gradientUnits="objectBoundingBox"
            >
              <Stop offset="0"    stopColor={r.color} stopOpacity={String(r.op)} />
              <Stop offset="0.65" stopColor={r.color} stopOpacity={String(r.op * 0.3)} />
              <Stop offset="1"    stopColor={r.color} stopOpacity="0" />
            </LinearGradient>
          ))}
        </Defs>

        {RAYS.map(r => {
          const left  = rayPoint(r.angle - RAY_HALF_DEG, RAY_LEN)
          const right = rayPoint(r.angle + RAY_HALF_DEG, RAY_LEN)
          return (
            <Polygon
              key={r.id}
              // Triangle: two spread points at top, tip at origin
              points={`${left.x},${left.y} ${right.x},${right.y} ${OX},${OY}`}
              fill={`url(#rg${r.id})`}
            />
          )
        })}
      </Svg>
    </View>
  )
}

export default function HomeScreen() {

  const top = useSafeAreaInsets().top

  return (
    <View className="flex-1 bg-white">
      <ExpoLinearGradient
        colors={[LIGHT, LIGHT, '#fffdfd']}
        locations={[0, 0.1, 0.5]}
        style={StyleSheet.absoluteFill}
      />

      <StatusBar style="dark"/>

      <DiagonalBackground />

      <View>
        <FlatList
          data={[]}
          renderItem={null}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={() => (
            <View>
              <HomeSearchBar/>
              <HomeBanner/>
              <HomeCategories />
              <FeaturedProduct />
              <HomeProductList />
            </View>
          )}
          contentContainerStyle={{
            paddingTop: top + 8,
            paddingBottom: 8
          }}
          nestedScrollEnabled
        />
      </View>

    </View>
  )
}