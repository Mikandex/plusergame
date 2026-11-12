import { axiosClient } from '@/globalApi';
import displayCurrency from '@/utils/displayCurrency';
import { FontAwesome5 } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const ITEM_HEIGHT = 68;
const HOLD_MS = 2600;
const SLIDE_MS = 420;
const SPARKLE_ANGLES = [20, 80, 140, 200, 260, 320].map((deg) => (deg * Math.PI) / 180);

type Winner = {
  id: string;
  name: string;
  game: string;
  avatar?: string;
  bet: string;
  won: string;
  payout: number;
};

function WinnerRow({ item }: { item: Winner }) {
  const isBigWin = item.payout >= 5000;

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isBigWin && styles.avatarGold]}>
        {item.avatar ? (
          <ExpoImage
            source={{ uri: `${process.env.EXPO_PUBLIC_IMAGE_URI}${item.avatar}` }}
            cachePolicy="disk"
            contentFit="cover"
            style={{ width: 36, height: 36, borderRadius: 18 }}
          />
        ) : (
          <FontAwesome5 name="user-alt" size={13} color={isBigWin ? '#D4AF37' : '#9A2121'} />
        )}
      </View>
      <View style={styles.meta}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {item.name}
          </Text>
          {isBigWin ? <Text style={styles.cup}>🏆</Text> : null}
        </View>
        {item.game ? <Text style={styles.phone}>{item.game}</Text> : null}
      </View>
      <View style={styles.amounts}>
        <Text style={styles.bet}>Bet Placed: {item.bet}</Text>
        <Text style={styles.wonLabel}>
          Won: <Text style={styles.won}>{item.won}</Text>
        </Text>
      </View>
    </View>
  );
}

function Sparkle({ progress, angle, color }: { progress: Animated.SharedValue<number>; angle: number; color: string }) {
  const style = useAnimatedStyle(() => {
    const distance = interpolate(progress.value, [0, 1], [8, 52]);
    return {
      opacity: interpolate(progress.value, [0, 0.15, 0.7, 1], [0, 1, 0.7, 0]),
      transform: [
        { translateX: Math.cos(angle) * distance },
        { translateY: Math.sin(angle) * distance },
        { scale: interpolate(progress.value, [0, 0.35, 1], [0.4, 1, 0.2]) },
      ],
    };
  });

  return <Animated.View pointerEvents="none" style={[styles.sparkle, { backgroundColor: color }, style]} />;
}

function CrownSplash({ burst }: { burst: number }) {
  const crownScale = useSharedValue(0.2);
  const crownOpacity = useSharedValue(0);
  const crownRotate = useSharedValue(-18);
  const ringScale = useSharedValue(0.3);
  const ringOpacity = useSharedValue(0);
  const sparkleProgress = useSharedValue(0);

  useEffect(() => {
    if (burst <= 0) return;

    cancelAnimation(crownScale);
    cancelAnimation(crownOpacity);
    cancelAnimation(crownRotate);
    cancelAnimation(ringScale);
    cancelAnimation(ringOpacity);
    cancelAnimation(sparkleProgress);

    crownOpacity.value = 1;
    crownScale.value = 0.15;
    crownRotate.value = -22;
    ringScale.value = 0.25;
    ringOpacity.value = 0.9;
    sparkleProgress.value = 0;

    crownScale.value = withSequence(
      withTiming(1.28, { duration: 320, easing: Easing.out(Easing.back(1.6)) }),
      withTiming(1, { duration: 160 }),
      withDelay(380, withTiming(0.7, { duration: 220 })),
    );
    crownRotate.value = withSequence(
      withTiming(8, { duration: 280, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 180 }),
    );
    crownOpacity.value = withSequence(
      withTiming(1, { duration: 80 }),
      withDelay(720, withTiming(0, { duration: 260 })),
    );
    ringScale.value = withTiming(1.85, { duration: 720, easing: Easing.out(Easing.cubic) });
    ringOpacity.value = withTiming(0, { duration: 720 });
    sparkleProgress.value = withTiming(1, { duration: 820, easing: Easing.out(Easing.cubic) });
  }, [burst, crownOpacity, crownRotate, crownScale, ringOpacity, ringScale, sparkleProgress]);

  const crownStyle = useAnimatedStyle(() => ({
    opacity: crownOpacity.value,
    transform: [{ scale: crownScale.value }, { rotate: `${crownRotate.value}deg` }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <View pointerEvents="none" style={styles.splashLayer}>
      <Animated.View style={[styles.ring, ringStyle]} />
      {SPARKLE_ANGLES.map((angle, index) => (
        <Sparkle
          key={angle}
          progress={sparkleProgress}
          angle={angle}
          color={index % 2 === 0 ? '#D4AF37' : '#FFD76A'}
        />
      ))}
      <Animated.View style={crownStyle}>
        <FontAwesome5 name="crown" size={28} color="#D4AF37" />
      </Animated.View>
    </View>
  );
}

type RecentWinningsProps = {
  compact?: boolean;
  paused?: boolean;
  refreshKey?: number;
};

function LiveDot({ reduceMotion }: { reduceMotion: boolean }) {
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1
      return
    }
    opacity.value = withRepeat(withTiming(0.25, { duration: 800, easing: Easing.inOut(Easing.quad) }), -1, true)
    return () => {
      cancelAnimation(opacity)
    }
  }, [opacity, reduceMotion])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <View style={styles.live}>
      <Animated.View style={[styles.liveDot, style]} />
      <Text style={styles.liveText}>LIVE</Text>
    </View>
  )
}

export default function RecentWinnings({ compact = false, paused = false, refreshKey = 0 }: RecentWinningsProps) {
  const visibleRows = compact ? 2 : 3;
  const translateY = useSharedValue(0);
  const indexRef = useRef(0);
  const winnersRef = useRef<Winner[]>([]);
  const [burst, setBurst] = useState(0);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);
  const [reduceMotion, setReduceMotion] = useState(false);
  const isFocused = useIsFocused();
  const shouldAnimate = isFocused && !paused && winners.length > 1;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduceMotion)
      .catch(() => setReduceMotion(false))
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion)
    return () => {
      sub?.remove?.()
    }
  }, [])

  // Real wins from all players, names already masked by the server. Public, so guests see it too.
  const loadWinnings = useCallback(async () => {
    try {
      const result = await axiosClient.get('/virtual/recent-wins?limit=15');
      const wins = Array.isArray(result.data?.wins) ? result.data.wins : [];
      const mapped: Winner[] = wins.map(
        (item: { id: string; name: string; game: string; avatar?: string; stake: number; payout: number; multiplier?: string }) => ({
          id: item.id,
          name: item.name,
          avatar: item.avatar || undefined,
          game: item.multiplier ? `${item.game} · ${item.multiplier}` : item.game,
          bet: displayCurrency(Number(item.stake)),
          won: displayCurrency(Number(item.payout)),
          payout: Number(item.payout) || 0,
        }),
      );
      setWinners(mapped);
    } catch {
      setWinners([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWinnings();
    }, [loadWinnings, refreshKey]),
  );

  useEffect(() => {
    winnersRef.current = winners;
  }, [winners]);

  useEffect(() => {
    if (!shouldAnimate) {
      cancelAnimation(translateY);
      translateY.value = 0;
      indexRef.current = 0;
      return;
    }

    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | undefined;
    let reduceMotion = false;

    const resetLoop = () => {
      indexRef.current = 0;
      translateY.value = 0;
    };

    const celebrate = (nextIndex: number) => {
      const list = winnersRef.current;
      if (!list.length) return;
      const item = list[nextIndex % list.length];
      if (item.payout >= 4000 || nextIndex % 2 === 0) {
        setBurst((n) => n + 1);
      }
    };

    const step = () => {
      if (reduceMotion) return;
      const list = winnersRef.current;
      if (list.length < 2) return;
      const next = indexRef.current + 1;
      indexRef.current = next;
      translateY.value = withTiming(
        -next * ITEM_HEIGHT,
        { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (!finished) return;
          runOnJS(celebrate)(next % list.length);
          if (next >= list.length) {
            runOnJS(resetLoop)();
          }
        },
      );
    };

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (cancelled) return;
        reduceMotion = enabled;
        if (!enabled) {
          interval = setInterval(step, HOLD_MS);
          setTimeout(() => {
            if (!cancelled) setBurst((n) => n + 1);
          }, 700);
        }
      })
      .catch(() => {
        if (cancelled) return;
        interval = setInterval(step, HOLD_MS);
        setTimeout(() => {
          if (!cancelled) setBurst((n) => n + 1);
        }, 700);
      });

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      cancelAnimation(translateY);
    };
  }, [shouldAnimate, translateY, winners.length]);

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const loop = winners.length > 1 ? [...winners, winners[0]] : winners;

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🏆</Text>
        <Text style={styles.headerTitle}>RECENT WINNINGS</Text>
        {winners.length > 0 ? <LiveDot reduceMotion={reduceMotion} /> : null}
      </View>

      <View style={[styles.viewport, { height: ITEM_HEIGHT * visibleRows }]}>
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator color="#D4AF37" />
          </View>
        ) : winners.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No wins yet</Text>
            <Text style={styles.emptyCopy}>Real wins from real rounds are listed here. Play a game to be the first.</Text>
          </View>
        ) : (
          <>
            <Animated.View style={trackStyle}>
              {loop.map((item, index) => (
                <WinnerRow key={`${item.id}-${index}`} item={item} />
              ))}
            </Animated.View>
            {shouldAnimate ? <CrownSplash burst={burst} /> : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 12,
  },
  headerIcon: {
    fontSize: 13,
  },
  headerTitle: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginLeft: 4,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#9A2121',
  },
  liveText: {
    color: '#9A2121',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
  },
  viewport: {
    backgroundColor: '#1B1F27',
    borderRadius: 14,
    paddingHorizontal: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.28)',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptyCopy: {
    color: '#9AA0A6',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  splashLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(212,175,55,0.85)',
  },
  sparkle: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  row: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#2A303A',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#12151C',
  },
  avatarGold: {
    borderColor: 'rgba(212,175,55,0.7)',
  },
  meta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  cup: {
    fontSize: 11,
  },
  phone: {
    color: '#9AA0A6',
    fontSize: 12,
    marginTop: 2,
  },
  amounts: {
    alignItems: 'flex-end',
  },
  bet: {
    color: '#9AA0A6',
    fontSize: 11,
  },
  wonLabel: {
    color: '#9AA0A6',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  won: {
    color: '#D4AF37',
  },
});
