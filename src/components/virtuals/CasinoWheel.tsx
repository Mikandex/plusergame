import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl'
import * as THREE from 'three'

export type WheelSegment = {
  caption: string
  spin_value: number
  fill: string
  shade: string
  ink: string
}

export const WHEEL_SEGMENTS: WheelSegment[] = [
  { caption: 'MISS', spin_value: 0, fill: '#2a2a2e', shade: '#161618', ink: '#f0d9a0' },
  { caption: '2x', spin_value: 2, fill: '#c41e3a', shade: '#6e1028', ink: '#fff4d0' },
  { caption: '2.5x', spin_value: 2.5, fill: '#e8c547', shade: '#9a7314', ink: '#2a1a06' },
  { caption: '3x', spin_value: 3, fill: '#8e1a38', shade: '#4e0d1c', ink: '#fff4d0' },
  { caption: 'MISS', spin_value: 0, fill: '#1a1a1e', shade: '#0e0e10', ink: '#f0d9a0' },
  { caption: '5x', spin_value: 5, fill: '#147a5c', shade: '#0a4634', ink: '#fff4d0' },
  { caption: '7x', spin_value: 7, fill: '#f0c14a', shade: '#b8860b', ink: '#2a1a06' },
  { caption: '10x', spin_value: 10, fill: '#1f5ad0', shade: '#12347a', ink: '#fff4d0' },
]

export const WHEEL_SLICE = 360 / WHEEL_SEGMENTS.length

type CasinoWheelProps = {
  spinning: boolean
  targetIndex: number | null
  reduceMotion?: boolean
  onSettled?: () => void
}

type World = {
  gl: ExpoWebGLRenderingContext
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  wheel: THREE.Group
  pointer: THREE.Group
  bulbs: THREE.Mesh[]
  textures: THREE.Texture[]
  disposables: Array<{ dispose: () => void }>
  angle: number
  mode: 'idle' | 'spin' | 'land'
  landFrom: number
  landTo: number
  landT: number
  landDur: number
  settled: boolean
  raf: number
  last: number
  disposed: boolean
  time: number
}

const DEG = Math.PI / 180
const SPIN_SPEED = 540
const FACE_SIZE = 512

const GLYPHS: Record<string, string[]> = {
  '0': ['###', '# #', '# #', '# #', '###'],
  '1': [' # ', '## ', ' # ', ' # ', '###'],
  '2': ['###', '  #', '###', '#  ', '###'],
  '3': ['###', '  #', '###', '  #', '###'],
  '4': ['# #', '# #', '###', '  #', '  #'],
  '5': ['###', '#  ', '###', '  #', '###'],
  '6': ['###', '#  ', '###', '# #', '###'],
  '7': ['###', '  #', '  #', ' # ', ' # '],
  '8': ['###', '# #', '###', '# #', '###'],
  '9': ['###', '# #', '###', '  #', '###'],
  x: ['# #', ' # ', '# #', '   ', '   '],
  X: ['# #', ' # ', '# #', '   ', '   '],
  M: ['# #', '###', '# #', '# #', '# #'],
  I: ['###', ' # ', ' # ', ' # ', '###'],
  S: ['###', '#  ', '###', '  #', '###'],
  '.': ['   ', '   ', '   ', '   ', ' # '],
}

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function landingCss(index: number, current: number, extra: number) {
  const mid = index * WHEEL_SLICE + WHEEL_SLICE / 2
  const landingOffset = 270 - mid
  const start = ((current % 360) + 360) % 360
  return current - start + extra + ((landingOffset % 360) + 360) % 360
}

function setPx(data: Uint8Array, size: number, x: number, y: number, r: number, g: number, b: number) {
  if (x < 0 || y < 0 || x >= size || y >= size) return
  const i = (y * size + x) * 4
  data[i] = r
  data[i + 1] = g
  data[i + 2] = b
  data[i + 3] = 255
}

function blitGlyph(
  data: Uint8Array,
  size: number,
  ch: string,
  ox: number,
  oy: number,
  rot: number,
  scale: number,
  rgb: [number, number, number],
) {
  const glyph = GLYPHS[ch]
  if (!glyph) return
  const cos = Math.cos(rot)
  const sin = Math.sin(rot)
  const gh = glyph.length
  const gw = glyph[0].length
  const paint = (px: number, py: number, color: [number, number, number]) => {
    const x = Math.round(ox + px * cos - py * sin)
    const y = Math.round(oy + px * sin + py * cos)
    setPx(data, size, x, y, color[0], color[1], color[2])
    setPx(data, size, x + 1, y, color[0], color[1], color[2])
    setPx(data, size, x, y + 1, color[0], color[1], color[2])
  }
  for (let gy = 0; gy < gh; gy += 1) {
    for (let gx = 0; gx < gw; gx += 1) {
      if (glyph[gy][gx] !== '#') continue
      for (let py = 0; py < scale; py += 1) {
        for (let px = 0; px < scale; px += 1) {
          const lx = (gx - gw / 2) * scale + px
          const ly = (gy - gh / 2) * scale + py
          paint(lx, ly, [18, 10, 8])
          paint(lx + 1, ly, [18, 10, 8])
          paint(lx, ly + 1, [18, 10, 8])
          paint(lx, ly, rgb)
        }
      }
    }
  }
}

function blitLabel(
  data: Uint8Array,
  size: number,
  text: string,
  radius: number,
  mid: number,
  rgb: [number, number, number],
  scale: number,
) {
  const cx = size / 2 + radius * Math.cos(mid)
  const cy = size / 2 + radius * Math.sin(mid)
  const rot = mid + Math.PI / 2
  const step = 3.4 * scale
  const start = -((text.length - 1) * step) / 2
  text.split('').forEach((ch, i) => {
    const lx = start + i * step
    blitGlyph(data, size, ch, cx + lx * Math.cos(rot), cy + lx * Math.sin(rot), rot, scale, rgb)
  })
}

function makeFaceTexture() {
  const size = FACE_SIZE
  const data = new Uint8Array(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const outer = size * 0.48
  const inner = size * 0.09
  const slice = (2 * Math.PI) / WHEEL_SEGMENTS.length

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - cx
      const dy = y - cy
      const dist = Math.hypot(dx, dy)
      const i = (y * size + x) * 4
      if (dist > outer) {
        data[i] = 201
        data[i + 1] = 162
        data[i + 2] = 39
        data[i + 3] = 255
        continue
      }
      if (dist < inner) {
        data[i] = 42
        data[i + 1] = 18
        data[i + 2] = 22
        data[i + 3] = 255
        continue
      }
      let ang = Math.atan2(dy, dx)
      if (ang < 0) ang += Math.PI * 2
      const idx = Math.min(WHEEL_SEGMENTS.length - 1, Math.floor(ang / slice))
      const seg = WHEEL_SEGMENTS[idx]
      const edge = Math.abs(((ang % slice) / slice) * 2 - 1)
      const [r, g, b] = hexRgb(dist > outer * 0.72 && edge > 0.82 ? seg.shade : seg.fill)
      const shade = 0.78 + (dist / outer) * 0.22
      data[i] = Math.min(255, r * shade)
      data[i + 1] = Math.min(255, g * shade)
      data[i + 2] = Math.min(255, b * shade)
      data[i + 3] = 255
      if (edge > 0.965) {
        data[i] = 246
        data[i + 1] = 217
        data[i + 2] = 138
      }
    }
  }

  WHEEL_SEGMENTS.forEach((seg, i) => {
    const mid = i * slice + slice / 2
    const rgb = hexRgb(seg.ink)
    blitLabel(data, size, seg.caption, outer * 0.62, mid, rgb, seg.caption === 'MISS' ? 3 : 4)
  })

  const texture = new THREE.DataTexture(data, size, size)
  texture.needsUpdate = true
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  texture.flipY = true
  if ('colorSpace' in texture) {
    texture.colorSpace = THREE.SRGBColorSpace
  }
  return texture
}

function createRenderer(gl: ExpoWebGLRenderingContext) {
  const { drawingBufferWidth: width, drawingBufferHeight: height } = gl
  const renderer = new THREE.WebGLRenderer({
    canvas: {
      width,
      height,
      style: {},
      addEventListener: () => {},
      removeEventListener: () => {},
      clientHeight: height,
      clientWidth: width,
    } as unknown as HTMLCanvasElement,
    context: gl as unknown as WebGLRenderingContext,
  })
  renderer.setSize(width, height)
  renderer.setClearColor(0x120608, 1)
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace
  } else {
    ;(renderer as unknown as { outputEncoding: number }).outputEncoding = THREE.sRGBEncoding
  }
  return renderer
}

function goldMat(color: number, extras: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.88,
    roughness: 0.22,
    ...extras,
  })
}

export default function CasinoWheel({
  spinning,
  targetIndex,
  reduceMotion = false,
  onSettled,
}: CasinoWheelProps) {
  const propsRef = useRef({ spinning, targetIndex, reduceMotion, onSettled })
  propsRef.current = { spinning, targetIndex, reduceMotion, onSettled }
  const worldRef = useRef<World | null>(null)

  useEffect(() => {
    return () => {
      const world = worldRef.current
      if (!world) return
      world.disposed = true
      cancelAnimationFrame(world.raf)
      world.textures.forEach((tex) => tex.dispose())
      world.disposables.forEach((item) => item.dispose())
      world.renderer.dispose()
      worldRef.current = null
    }
  }, [])

  const setupScene = (gl: ExpoWebGLRenderingContext) => {
    if (worldRef.current) {
      worldRef.current.disposed = true
      cancelAnimationFrame(worldRef.current.raf)
    }

    const renderer = createRenderer(gl)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 40)
    camera.position.set(0, 0.22, 6.35)
    camera.lookAt(0, -0.06, 0)

    scene.add(new THREE.HemisphereLight(0xfff1d0, 0x1a080c, 0.95))
    const key = new THREE.DirectionalLight(0xfff4d6, 1.55)
    key.position.set(-2.4, 3.6, 4.2)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0xffc14a, 0.55)
    rim.position.set(3.2, -1.2, 2.4)
    scene.add(rim)
    const spark = new THREE.PointLight(0xffe9a8, 1.1, 8)
    spark.position.set(0, 0.2, 2.2)
    scene.add(spark)

    const disposables: Array<{ dispose: () => void }> = []
    const track = <T extends { dispose: () => void }>(item: T) => {
      disposables.push(item)
      return item
    }

    const felt = new THREE.Mesh(
      track(new THREE.CircleGeometry(2.4, 64)),
      track(new THREE.MeshStandardMaterial({ color: 0x14080a, roughness: 0.95, metalness: 0 })),
    )
    felt.position.z = -0.28
    scene.add(felt)

    const housing = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.68, 0.1, 14, 72)),
      track(goldMat(0xe0b03a, { emissive: 0x3a2a08, emissiveIntensity: 0.25 })),
    )
    scene.add(housing)

    const housingInner = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.55, 0.03, 10, 64)),
      track(goldMat(0x6b4e10)),
    )
    housingInner.position.z = 0.02
    scene.add(housingInner)

    const bulbs: THREE.Mesh[] = []
    const bulbGeo = track(new THREE.SphereGeometry(0.05, 12, 12))
    for (let i = 0; i < 20; i += 1) {
      const a = (i / 20) * Math.PI * 2 - Math.PI / 2
      const mat = track(
        new THREE.MeshStandardMaterial({
          color: 0xffe9a8,
          emissive: 0xffd36a,
          emissiveIntensity: 0.9,
          roughness: 0.3,
          metalness: 0.2,
        }),
      )
      const bulb = new THREE.Mesh(bulbGeo, mat)
      bulb.position.set(Math.cos(a) * 1.68, Math.sin(a) * 1.68, 0.12)
      scene.add(bulb)
      bulbs.push(bulb)
    }

    const faceTex = makeFaceTexture()
    const wheel = new THREE.Group()
    const faceMat = track(new THREE.MeshStandardMaterial({ map: faceTex, roughness: 0.32, metalness: 0.18 }))
    const face = new THREE.Mesh(track(new THREE.CircleGeometry(1.42, 72)), faceMat)
    face.position.z = 0.16
    wheel.add(face)

    const back = new THREE.Mesh(
      track(new THREE.CircleGeometry(1.42, 72)),
      track(new THREE.MeshStandardMaterial({ color: 0x3a2408, roughness: 0.6, metalness: 0.4 })),
    )
    back.rotation.y = Math.PI
    back.position.z = -0.16
    wheel.add(back)

    const body = new THREE.Mesh(
      track(new THREE.CylinderGeometry(1.42, 1.42, 0.32, 72, 1, true)),
      track(goldMat(0x8a6410)),
    )
    body.rotation.x = Math.PI / 2
    wheel.add(body)

    const rimRing = new THREE.Mesh(
      track(new THREE.TorusGeometry(1.42, 0.07, 12, 72)),
      track(goldMat(0xf3d27a, { emissive: 0x5a4010, emissiveIntensity: 0.2 })),
    )
    rimRing.position.z = 0.16
    wheel.add(rimRing)

    const pegGeo = track(new THREE.SphereGeometry(0.045, 10, 10))
    const pegMat = track(goldMat(0xffe9a8, { emissive: 0xc9a227, emissiveIntensity: 0.45 }))
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2
      const peg = new THREE.Mesh(pegGeo, pegMat)
      peg.position.set(Math.cos(a) * 1.42, Math.sin(a) * 1.42, 0.2)
      wheel.add(peg)
    }

    const hub = new THREE.Mesh(track(new THREE.CylinderGeometry(0.42, 0.42, 0.18, 32)), [
      track(goldMat(0xc9a227)),
      track(goldMat(0xfff1c2)),
      track(goldMat(0x6b4e10)),
    ])
    hub.rotation.x = Math.PI / 2
    hub.position.z = 0.2
    wheel.add(hub)

    const hubCap = new THREE.Mesh(
      track(new THREE.SphereGeometry(0.16, 20, 16, 0, Math.PI * 2, 0, Math.PI / 2)),
      track(goldMat(0xfff6d6, { emissive: 0x8a6a14, emissiveIntensity: 0.2 })),
    )
    hubCap.rotation.x = Math.PI / 2
    hubCap.position.z = 0.3
    wheel.add(hubCap)

    const hubHole = new THREE.Mesh(
      track(new THREE.CircleGeometry(0.12, 24)),
      track(new THREE.MeshStandardMaterial({ color: 0x2a0c14, roughness: 0.5, metalness: 0.2 })),
    )
    hubHole.position.z = 0.31
    wheel.add(hubHole)
    wheel.rotation.z = -landingCss(1, 0, 0) * DEG
    scene.add(wheel)

    const pointer = new THREE.Group()
    const bracket = new THREE.Mesh(
      track(new THREE.BoxGeometry(0.34, 0.16, 0.12)),
      track(goldMat(0xe8c547)),
    )
    bracket.position.set(0, 1.88, 0.3)
    pointer.add(bracket)
    const cone = new THREE.Mesh(
      track(new THREE.ConeGeometry(0.12, 0.38, 5)),
      track(
        new THREE.MeshStandardMaterial({
          color: 0xc41e3a,
          metalness: 0.35,
          roughness: 0.28,
          emissive: 0x5a1020,
          emissiveIntensity: 0.35,
        }),
      ),
    )
    cone.rotation.x = Math.PI
    cone.position.set(0, 1.62, 0.34)
    pointer.add(cone)
    const tip = new THREE.Mesh(track(new THREE.SphereGeometry(0.032, 10, 10)), track(goldMat(0xfff1c2)))
    tip.position.set(0, 1.42, 0.34)
    pointer.add(tip)
    scene.add(pointer)

    const world: World = {
      gl,
      renderer,
      scene,
      camera,
      wheel,
      pointer,
      bulbs,
      textures: [faceTex],
      disposables,
      angle: landingCss(1, 0, 0),
      mode: 'idle',
      landFrom: 0,
      landTo: 0,
      landT: 1,
      landDur: 4.2,
      settled: true,
      raf: 0,
      last: 0,
      disposed: false,
      time: 0,
    }
    worldRef.current = world
    let wasSpinning = false

    const tick = (now: number) => {
      if (world.disposed) return
      const dt = world.last ? Math.min(0.04, (now - world.last) / 1000) : 0.016
      world.last = now
      world.time += dt
      const props = propsRef.current

      if (props.spinning && !wasSpinning) {
        world.mode = 'spin'
        world.settled = false
      }
      if (!props.spinning) {
        world.mode = 'idle'
      }
      wasSpinning = props.spinning

      if (world.mode === 'spin' && props.targetIndex != null) {
        const extra = props.reduceMotion ? 360 : 5 * 360
        world.landFrom = world.angle
        world.landTo = landingCss(props.targetIndex, world.angle, extra)
        world.landT = 0
        world.landDur = props.reduceMotion ? 0.2 : 4.2
        world.mode = 'land'
        if (props.reduceMotion) {
          world.angle = world.landTo
          world.landT = 1
        }
      }

      if (world.mode === 'spin') {
        world.angle += SPIN_SPEED * dt
      } else if (world.mode === 'land') {
        world.landT = Math.min(1, world.landT + dt / world.landDur)
        const k = 1 - (1 - world.landT) ** 3
        world.angle = world.landFrom + (world.landTo - world.landFrom) * k
        if (world.landT >= 1 && !world.settled) {
          world.settled = true
          props.onSettled?.()
        }
      }

      world.wheel.rotation.z = -world.angle * DEG
      world.pointer.rotation.z = world.mode === 'spin' ? Math.sin(world.time * 42) * 0.08 : 0

      world.bulbs.forEach((bulb, i) => {
        const mat = bulb.material as THREE.MeshStandardMaterial
        const pulse = world.mode === 'spin' || world.mode === 'land' ? 0.55 + 0.45 * Math.sin(world.time * 10 + i) : 0.75
        mat.emissiveIntensity = pulse
      })

      renderer.render(scene, camera)
      gl.endFrameEXP()
      world.raf = requestAnimationFrame(tick)
    }

    world.raf = requestAnimationFrame(tick)
  }


  const [glFailed, setGlFailed] = useState(false)
  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    const fail = (error: unknown) => {
      console.warn('3D view unavailable, showing 2D fallback', error)
      setGlFailed(true)
    }
    try {
      void Promise.resolve(setupScene(gl)).catch(fail)
    } catch (error) {
      fail(error)
    }
  }

  // The Spin screen only shows its result once the wheel settles, so the fallback settles too.
  useEffect(() => {
    if (!glFailed || !spinning || targetIndex === null) return
    const timer = setTimeout(() => propsRef.current.onSettled?.(), reduceMotion ? 0 : 900)
    return () => clearTimeout(timer)
  }, [glFailed, spinning, targetIndex, reduceMotion])

  const landed = targetIndex !== null ? WHEEL_SEGMENTS[targetIndex] : null
  return (
    <View style={styles.stage}>
      {glFailed ? (
        <View style={styles.fallback}>
          <Text style={styles.fallbackIcon}>🎡</Text>
          <Text style={styles.fallbackText}>{spinning ? 'Spinning…' : landed ? landed.caption : 'Tap spin'}</Text>
        </View>
      ) : (
        <GLView style={styles.gl} onContextCreate={onContextCreate} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  stage: {
    width: '100%',
    height: 340,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#120608',
  },
  gl: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fallbackIcon: {
    fontSize: 96,
  },
  fallbackText: {
    color: '#f0d9a0',
    fontSize: 26,
    fontWeight: '800',
  },
})
