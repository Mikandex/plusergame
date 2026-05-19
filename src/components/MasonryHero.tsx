import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useRef } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    ImageSourcePropType,
    ListRenderItemInfo,
    StyleSheet,
    View,
} from 'react-native';

const { width: SCREEN_W } = Dimensions.get('window');

const COLS    = 3;
const GAP     = 6;
const H_PAD   = 6;
const COL_W   = (SCREEN_W - H_PAD * 2 - GAP * (COLS - 1)) / COLS;
const HERO_H  = 420;
const RADIUS  = 12;
const REPEAT  = 40;

const SHORT_H = Math.round(COL_W * 1.05);
const TALL_H  = Math.round(COL_W * 1.6);

const SPEEDS = [0.60, 0.50, 0.70];

// Visual stagger between columns (col 2 sits upper, col 3 flush)
const OFFSETS = [0, -28, 0];

// How far into content each column starts — eliminates the top gap.
// Col 1 starts at 0 (flush), col 2 is already pushed down by OFFSETS so
// no pre-scroll needed, col 3 starts a bit in so it fills the top.
const START_POS = [0, 0, 40];

interface Item {
    id: string;
    image: ImageSourcePropType;
    tall?: boolean;
}

const SOURCE: Item[] = [
    { id: 'a', image: { uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300' }, tall: true },
    { id: 'b', image: { uri: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300' } },
    { id: 'c', image: { uri: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300' }, tall: true },
    { id: 'd', image: { uri: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300' } },
    { id: 'e', image: { uri: 'https://images.unsplash.com/photo-1434493651957-4ec10c840679?w=300' } },
    { id: 'f', image: { uri: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=300' }, tall: true },
    { id: 'g', image: { uri: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300' } },
    { id: 'h', image: { uri: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=300' } },
    { id: 'i', image: { uri: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=300' }, tall: true },
    { id: 'j', image: { uri: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300' } },
    { id: 'k', image: { uri: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300' }, tall: true },
    { id: 'l', image: { uri: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=300' } },
];

function splitColumns(items: Item[], n: number): Item[][] {
    const cols: Item[][] = Array.from({ length: n }, () => []);
    items.forEach((item, i) => cols[i % n].push(item));
    return cols;
}

function buildData(source: Item[], times: number): Item[] {
    const out: Item[] = [];
    for (let t = 0; t < times; t++) {
        source.forEach((item) => out.push({ ...item, id: `${item.id}_${t}` }));
    }
    return out;
}

function passHeight(source: Item[]): number {
    return source.reduce((sum, item) => sum + (item.tall ? TALL_H : SHORT_H) + GAP, 0);
}

interface ColProps {
    source: Item[];
    speed: number;
    offsetY: number;
    startPos: number;
}

const ScrollingColumn: React.FC<ColProps> = ({ source, speed, offsetY, startPos }) => {
    const listRef = useRef<FlatList<Item>>(null);
    const posRef  = useRef(startPos);   // ← start pre-scrolled, not at 0
    const rafRef  = useRef<number>(0);
    const onePass = useRef(passHeight(source)).current;

    const layoutMap = useRef<{ offset: number; length: number }[]>((() => {
        const map: { offset: number; length: number }[] = [];
        let off = 0;
        const totalItems = source.length * REPEAT;
        for (let i = 0; i < totalItems; i++) {
            const h = (source[i % source.length].tall ? TALL_H : SHORT_H) + GAP;
            map.push({ offset: off, length: h });
            off += h;
        }
        return map;
    })()).current;

    const data = useRef(buildData(source, REPEAT)).current;

    const getItemLayout = useCallback(
        (_: ArrayLike<Item> | null | undefined, index: number) => ({
            length: layoutMap[index]?.length ?? SHORT_H + GAP,
            offset: layoutMap[index]?.offset ?? 0,
            index,
        }),
        [layoutMap]
    );

    const keyExtractor = useCallback((item: Item) => item.id, []);

    const renderItem = useCallback(
        ({ item }: ListRenderItemInfo<Item>) => (
            <View style={[styles.card, item.tall ? styles.cardTall : styles.cardShort]}>
                <Image
                    source={item.image}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                />
            </View>
        ),
        []
    );

    useEffect(() => {
        const safeMax = onePass * (REPEAT - 5);

        const tick = () => {
            posRef.current += speed;
            if (posRef.current >= safeMax) {
                posRef.current = posRef.current % onePass;
            }
            listRef.current?.scrollToOffset({ offset: posRef.current, animated: false });
            rafRef.current = requestAnimationFrame(tick);
        };

        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [speed, onePass]);

    return (
        <View style={[styles.colWrapper, { marginTop: offsetY }]}>
            <FlatList
                ref={listRef}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                getItemLayout={getItemLayout}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={8}
                removeClippedSubviews={false}
                contentContainerStyle={{ gap: GAP }}
            />
        </View>
    );
};

const MasonryHero: React.FC = () => {
    const columns = splitColumns(SOURCE, COLS);

    return (
        <View style={styles.hero}>
            {/* No paddingTop on grid — columns flush to top edge */}
            <View style={styles.grid}>
                {columns.map((col, i) => (
                    <ScrollingColumn
                        key={i}
                        source={col}
                        speed={SPEEDS[i]}
                        offsetY={OFFSETS[i]}
                        startPos={START_POS[i]}
                    />
                ))}
            </View>

            <LinearGradient
                colors={['transparent', 'rgba(255,255,255,0.3)', '#ffffff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.fade}
                pointerEvents="none"
            />
        </View>
    );
};

export default MasonryHero;

const styles = StyleSheet.create({
    hero: {
        flex: 1,
        width: SCREEN_W,
        height: HERO_H,
        overflow: 'hidden',
        backgroundColor: '#f4f4f4',
    },
    grid: {
        flex: 1,
        flexDirection: 'row',
        gap: GAP,
        paddingHorizontal: H_PAD,
        // ← paddingTop removed — was creating the top gap on column 1
    },
    colWrapper: {
        flex: 1,
        overflow: 'hidden',
    },
    card: {
        width: COL_W,
        borderRadius: RADIUS,
        overflow: 'hidden',
        backgroundColor: '#e8e8e8',
    },
    cardShort: {
        height: SHORT_H,
    },
    cardTall: {
        height: TALL_H,
    },
    fade: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 210,
    },
});