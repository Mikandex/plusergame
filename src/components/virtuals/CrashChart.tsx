import { StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg'

export type CrashPhase = 'idle' | 'flying' | 'cashed' | 'crashed'

type CrashChartProps = {
  multiplier: number
  elapsed: number
  target: number
  phase: CrashPhase
  cashedAt?: number | null
}

const HEIGHT = 250
const PAD_L = 8
const PAD_B = 22

// Growth used for the flight: m(t) = e^(RATE * t).
export const CRASH_RATE = 0.22

export default function CrashChart({ multiplier, elapsed, target, phase, cashedAt }: CrashChartProps) {
  const { width: screen } = useWindowDimensions()
  const width = screen - 24
  const plotW = width - PAD_L - 52
  const plotH = HEIGHT - PAD_B - 18

  const tMax = Math.max(6, elapsed * 1.15)
  const mMax = Math.max(2, multiplier * 1.2, phase === 'idle' ? target * 1.2 : 0)
  const x = (t: number) => PAD_L + (t / tMax) * plotW
  const y = (m: number) => 18 + plotH - ((m - 1) / (mMax - 1)) * plotH

  const steps = 48
  let d = `M ${x(0)} ${y(1)}`
  for (let i = 1; i <= steps; i += 1) {
    const t = (elapsed * i) / steps
    d += ` L ${x(t).toFixed(1)} ${y(Math.exp(CRASH_RATE * t)).toFixed(1)}`
  }
  const tipX = x(elapsed)
  const tipY = y(multiplier)
  const fill = `${d} L ${tipX} ${y(1)} L ${x(0)} ${y(1)} Z`

  const crashed = phase === 'crashed'
  const won = cashedAt != null
  const lineColor = crashed ? '#ff4d3d' : won ? '#3fe08a' : '#f5d27a'
  const targetY = y(target)
  const showTarget = target <= mMax

  const angle = elapsed > 0.05
    ? (-Math.atan2(y(Math.exp(CRASH_RATE * elapsed)) - y(Math.exp(CRASH_RATE * Math.max(0, elapsed - 0.2))), x(elapsed) - x(elapsed - 0.2)) * 180) / Math.PI
    : 20

  const gridLines = [1.5, 2, 3, 5, 10, 25, 50, 100, 250, 500, 1000].filter((m) => m < mMax).slice(-4)

  return (
    <View style={[styles.wrap, { width }]}>
      <Svg width={width} height={HEIGHT}>
        <Defs>
          <LinearGradient id="crashFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={lineColor} stopOpacity={0.35} />
            <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {gridLines.map((m) => (
          <G key={m}>
            <Line x1={PAD_L} x2={PAD_L + plotW} y1={y(m)} y2={y(m)} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
            <SvgText x={PAD_L + plotW + 6} y={y(m) + 4} fill="rgba(220,231,245,0.45)" fontSize={11}>
              {`${m}x`}
            </SvgText>
          </G>
        ))}

        {showTarget ? (
          <G>
            <Line
              x1={PAD_L}
              x2={PAD_L + plotW}
              y1={targetY}
              y2={targetY}
              stroke="#3fe08a"
              strokeWidth={1.5}
              strokeDasharray="6 6"
              opacity={0.8}
            />
            <SvgText x={PAD_L + plotW + 6} y={targetY + 4} fill="#3fe08a" fontSize={11} fontWeight="bold">
              {`${target.toFixed(2)}x`}
            </SvgText>
          </G>
        ) : null}

        {elapsed > 0 ? (
          <G>
            <Path d={fill} fill="url(#crashFill)" />
            <Path d={d} stroke={lineColor} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </G>
        ) : null}

        {crashed ? (
          <G>
            <Circle cx={tipX} cy={tipY} r={22} fill="#ff4d3d" opacity={0.25} />
            <Circle cx={tipX} cy={tipY} r={12} fill="#ff7a3d" opacity={0.6} />
            <SvgText x={tipX} y={tipY + 7} fontSize={22} textAnchor="middle">
              💥
            </SvgText>
          </G>
        ) : (
          <G transform={`translate(${tipX} ${tipY}) rotate(${-angle + 45})`}>
            <SvgText x={0} y={8} fontSize={26} textAnchor="middle">
              🚀
            </SvgText>
          </G>
        )}
      </Svg>

      <View style={styles.readout} pointerEvents="none">
        <Text style={[styles.mult, { color: lineColor }]}>{multiplier.toFixed(2)}x</Text>
        <Text style={styles.caption}>
          {phase === 'idle'
            ? 'Set your cash-out, then launch'
            : crashed
              ? won
                ? `Cashed out at ${cashedAt!.toFixed(2)}x`
                : 'Crashed'
              : won
                ? `Cashed out at ${cashedAt!.toFixed(2)}x`
                : 'Climbing…'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
    height: HEIGHT,
    borderRadius: 20,
    backgroundColor: '#0a1626',
    borderWidth: 1,
    borderColor: 'rgba(245,210,122,0.18)',
    overflow: 'hidden',
  },
  readout: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  mult: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  caption: {
    color: '#c7d6df',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
})
