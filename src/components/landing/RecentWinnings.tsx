import { FontAwesome5 } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

const ITEM_HEIGHT = 64;
const SCROLL_INTERVAL = 2000;
const SCROLL_DURATION = 500;
const VISIBLE_ITEMS = 3;

const winners = [
  { id: '1', name: 'RiskyMines', phone: '+23478563****', bet: '₦200', won: '₦4,500' },
  { id: '2', name: 'SilverWest', phone: '+23478563****', bet: '₦200', won: '₦1,300' },
  { id: '3', name: 'Johnny',     phone: '+23478563****', bet: '₦100', won: '₦1,600' },
  { id: '4', name: 'GoldRush99', phone: '+23471234****', bet: '₦500', won: '₦8,200' },
  { id: '5', name: 'LuckyAce',   phone: '+23479876****', bet: '₦150', won: '₦2,750' },
];

const DOUBLED = [...winners, ...winners];

const SPARK_POSITIONS = [
  { angle: 0,   radius: 28, size: 16 },
  { angle: 72,  radius: 28, size: 18 },
  { angle: 144, radius: 28, size: 16 },
  { angle: 216, radius: 28, size: 18 },
  { angle: 288, radius: 28, size: 16 },
  { angle: 36,  radius: 46, size: 24 },
  { angle: 108, radius: 46, size: 28 },
  { angle: 180, radius: 46, size: 22 },
  { angle: 252, radius: 46, size: 26 },
  { angle: 324, radius: 46, size: 24 },
];

// ─── Spark ────────────────────────────────────────────────────────────────────
function Spark({ delay, angle, radius, size }: { delay: number; angle: number; radius: number; size: number }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const rad = (angle * Math.PI) / 180;
  const x = radius * Math.cos(rad);
  const y = radius * Math.sin(rad);

  useEffect(() => {
    const loop = () => {
      scale.value = 0;
      opacity.value = 0;
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 180 }),
          withTiming(0, { duration: 520, easing: Easing.out(Easing.ease) }),
        ),
      );
      scale.value = withDelay(delay, withSpring(1, { damping: 4, stiffness: 120 }));
    };
    loop();
    const interval = setInterval(loop, SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text
      style={[{ position: 'absolute', fontSize: size, left: 60 + x - size / 2, top: 60 + y - size / 2 },
        animStyle,
      ]}
    >
      ✨
    </Animated.Text>
  );
}

// ─── AnimatedCup ──────────────────────────────────────────────────────────────
function AnimatedCup() {
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 480, easing: Easing.inOut(Easing.sin) }),
        withTiming(5, { duration: 480, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-0.15, { duration: 400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.15, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 550, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) }),
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 300, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);

  const cupStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotate.value}rad` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[{ fontSize: 12 }, cupStyle]}>🏆</Animated.Text>
  );
}

// ─── SparkBurst ───────────────────────────────────────────────────────────────
function SparkBurst() {
  const BURST_SIZE = 120;
  return (
    <View
      style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center' }}
      pointerEvents="none"
    >
      <View style={{ width: BURST_SIZE, height: BURST_SIZE }}>
        {SPARK_POSITIONS.map((pos, i) => (
          <Spark key={i} angle={pos.angle} radius={pos.radius} size={pos.size} delay={i * 60} />
        ))}
        <View style={{ position: 'absolute', top: 60 - 12, left: 60 - 12, width: 24, height: 24, alignItems: 'center', justifyContent: 'center' }}>
          <AnimatedCup />
        </View>
      </View>
    </View>
  );
}

// ─── WinnerRow ────────────────────────────────────────────────────────────────
function WinnerRow({ item, compact }: { item: typeof winners[number]; compact: boolean }) {
  const wonAmount = parseInt(item.won.replace(/[₦,]/g, ''), 10);
  const isBigWin = wonAmount >= 5000;

  return (
    <View
      className={`relative flex-row items-center gap-3 ${!compact && 'border-b border-charcoal'}`}
      style={{ height: ITEM_HEIGHT, overflow: 'visible' }}
    >
      <View className="w-10 h-10 rounded-full border border-charcoal items-center justify-center">
        <FontAwesome5 name="user-alt" size={14} color="#9A2121" />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-mmedium">{item.name}</Text>
        <Text className="text-gray text-xs mt-0.5">{item.phone}</Text>
      </View>
      {isBigWin && <SparkBurst />}
      <View style={{ alignItems: 'flex-end' }}>
        <Text className="text-gray text-xs">Bet Placed: {item.bet}</Text>
        <Text className="text-gray text-sm font-mmedium mt-0.5">
          Won: <Text className="text-yellow">{item.won}</Text>
        </Text>
      </View>
    </View>
  );
}

// ─── RecentWinnings ───────────────────────────────────────────────────────────
// compact=true → shows only 1 row (for sticky header); compact=false → shows 3 rows (default)
export default function RecentWinnings({ compact = false }: { compact?: boolean }) {
  const visibleRows = compact ? 1 : VISIBLE_ITEMS;
  const translateY = useSharedValue(0);
  const currentIndex = { value: 0 };

  useEffect(() => {
    const interval = setInterval(() => {
      currentIndex.value += 1;

      if (currentIndex.value >= winners.length) {
        currentIndex.value = 0;
        translateY.value = 0;
        return;
      }

      translateY.value = withTiming(-(currentIndex.value * ITEM_HEIGHT), {
        duration: SCROLL_DURATION,
        easing: Easing.inOut(Easing.ease),
      });
    }, SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View>
      <View className="flex-row items-center gap-1 my-3">
        <Text className="text-sm">🏆</Text>
        <Text className="text-white text-sm font-msbold tracking-widest">
          RECENT WINNINGS
        </Text>
      </View>

      <View
        className="bg-charcoal-light rounded-xl px-4"
        style={{ height: ITEM_HEIGHT * visibleRows, overflow: 'hidden' }}
      >
        <Animated.View style={animStyle}>
          {DOUBLED.map((item, index) => (
            <WinnerRow key={`${item.id}-${index}`} item={item} compact={compact}/>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}