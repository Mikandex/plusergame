import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl'
import * as THREE from 'three'

type DiceTableProps = {
  left: number
  right: number
  rolling: boolean
  reduceMotion?: boolean
}

type DieState = {
  mesh: THREE.Mesh
  omega: THREE.Vector3
  landing: boolean
  from: THREE.Quaternion
  to: THREE.Quaternion
  t: number
}

type World = {
  gl: ExpoWebGLRenderingContext
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  dice: [DieState, DieState]
  textures: THREE.DataTexture[]
  raf: number
  last: number
  disposed: boolean
}

const AXIS_X = new THREE.Vector3(1, 0, 0)
const AXIS_Y = new THREE.Vector3(0, 1, 0)
const AXIS_Z = new THREE.Vector3(0, 0, 1)

const FACE_NORMAL: Record<number, [number, number, number]> = {
  1: [0, 0, 1],
  2: [0, 1, 0],
  3: [1, 0, 0],
  4: [-1, 0, 0],
  5: [0, -1, 0],
  6: [0, 0, -1],
}

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [1, 0], [2, 0], [0, 2], [1, 2], [2, 2]],
}

function clampFace(value: number) {
  return Math.min(6, Math.max(1, Math.round(value) || 1))
}

function makePipTexture(value: number) {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i += 1) {
    data[i * 4] = 248
    data[i * 4 + 1] = 240
    data[i * 4 + 2] = 220
    data[i * 4 + 3] = 255
  }

  const paintCircle = (cx: number, cy: number, radius: number) => {
    const r2 = radius * radius
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const dx = x - cx
        const dy = y - cy
        if (dx * dx + dy * dy <= r2) {
          const i = (y * size + x) * 4
          data[i] = 28
          data[i + 1] = 22
          data[i + 2] = 16
          data[i + 3] = 255
        }
      }
    }
  }

  const cells = [16, 32, 48]
  PIPS[value].forEach(([row, col]) => {
    paintCircle(cells[col], cells[row], 6)
  })

  const texture = new THREE.DataTexture(data, size, size)
  texture.needsUpdate = true
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearFilter
  return texture
}

function dieMaterials(textures: THREE.DataTexture[]) {
  const map = [3, 4, 2, 5, 1, 6].map((face) => textures[face - 1])
  return map.map(
    (tex) =>
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.38,
        metalness: 0.04,
      }),
  )
}

function makeGeometry() {
  try {
    const { RoundedBoxGeometry } = require('three/examples/jsm/geometries/RoundedBoxGeometry.js') as {
      RoundedBoxGeometry: new (w: number, h: number, d: number, s: number, r: number) => THREE.BufferGeometry
    }
    return new RoundedBoxGeometry(1, 1, 1, 5, 0.16)
  } catch {
    return new THREE.BoxGeometry(1, 1, 1)
  }
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
  renderer.setClearColor(0x071820, 1)
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace
  } else {
    (renderer as unknown as { outputEncoding: number }).outputEncoding = THREE.sRGBEncoding
  }
  return renderer
}

function targetQuat(value: number, mesh: THREE.Mesh, camera: THREE.PerspectiveCamera) {
  const n = FACE_NORMAL[clampFace(value)]
  const normal = new THREE.Vector3(n[0], n[1], n[2])
  const toCam = camera.position.clone().sub(mesh.position).normalize()
  return new THREE.Quaternion().setFromUnitVectors(normal, toCam)
}

export default function DiceTable({ left, right, rolling, reduceMotion = false }: DiceTableProps) {
  const propsRef = useRef({ left, right, rolling, reduceMotion })
  propsRef.current = { left, right, rolling, reduceMotion }
  const worldRef = useRef<World | null>(null)
  const wasRolling = useRef(false)

  useEffect(() => {
    return () => {
      const world = worldRef.current
      if (!world) return
      world.disposed = true
      cancelAnimationFrame(world.raf)
      world.textures.forEach((tex) => tex.dispose())
      world.dice.forEach((die) => {
        die.mesh.geometry.dispose()
        const mats = die.mesh.material
        if (Array.isArray(mats)) mats.forEach((m) => m.dispose())
        else mats.dispose()
      })
      world.renderer.dispose()
      worldRef.current = null
    }
  }, [])

  const setupScene = async (gl: ExpoWebGLRenderingContext) => {
    if (worldRef.current) {
      worldRef.current.disposed = true
      cancelAnimationFrame(worldRef.current.raf)
    }
    const renderer = createRenderer(gl)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      32,
      gl.drawingBufferWidth / gl.drawingBufferHeight,
      0.1,
      40,
    )
    camera.position.set(0, 2.6, 6.2)
    camera.lookAt(0, 0.2, 0)

    scene.add(new THREE.HemisphereLight(0xf2efe6, 0x1a3038, 1.05))
    const key = new THREE.DirectionalLight(0xfff4d6, 1.35)
    key.position.set(-3, 6, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0x88a0b8, 0.35)
    fill.position.set(4, 2, 2)
    scene.add(fill)

    const table = new THREE.Mesh(
      new THREE.CircleGeometry(4.2, 48),
      new THREE.MeshStandardMaterial({ color: 0x0b2a32, roughness: 0.9, metalness: 0 }),
    )
    table.rotation.x = -Math.PI / 2
    table.position.y = 0
    scene.add(table)

    const textures = [1, 2, 3, 4, 5, 6].map(makePipTexture)
    const geometry = makeGeometry()

    const makeDie = (x: number): DieState => {
      const mesh = new THREE.Mesh(geometry, dieMaterials(textures))
      mesh.position.set(x, 0.58, 0)
      scene.add(mesh)
      return {
        mesh,
        omega: new THREE.Vector3(),
        landing: false,
        from: new THREE.Quaternion(),
        to: new THREE.Quaternion(),
        t: 1,
      }
    }

    const dice: [DieState, DieState] = [makeDie(-1.15), makeDie(1.15)]
    const snap = (die: DieState, value: number) => {
      die.mesh.quaternion.copy(targetQuat(value, die.mesh, camera))
      die.landing = false
      die.t = 1
    }
    snap(dice[0], clampFace(propsRef.current.left))
    snap(dice[1], clampFace(propsRef.current.right))

    const world: World = {
      gl,
      renderer,
      scene,
      camera,
      dice,
      textures,
      raf: 0,
      last: 0,
      disposed: false,
    }
    worldRef.current = world

    const tick = (now: number) => {
      if (world.disposed) return
      const dt = world.last ? Math.min(0.04, (now - world.last) / 1000) : 0.016
      world.last = now
      const props = propsRef.current

      if (props.rolling && !wasRolling.current) {
        dice.forEach((die, i) => {
          die.landing = false
          die.omega.set(
            (i ? 9.5 : 11.2) * (Math.random() > 0.5 ? 1 : -1),
            (i ? 13.4 : 10.1) * (Math.random() > 0.5 ? 1 : -1),
            (i ? 7.8 : 8.6) * (Math.random() > 0.5 ? 1 : -1),
          )
        })
      }

      if (!props.rolling && wasRolling.current) {
        const values = [clampFace(props.left), clampFace(props.right)]
        dice.forEach((die, i) => {
          if (props.reduceMotion) {
            snap(die, values[i])
            return
          }
          die.from.copy(die.mesh.quaternion)
          die.to.copy(targetQuat(values[i], die.mesh, camera))
          die.landing = true
          die.t = 0
        })
      }

      wasRolling.current = props.rolling

      dice.forEach((die) => {
        if (props.rolling && !props.reduceMotion) {
          die.mesh.rotateOnWorldAxis(AXIS_X, die.omega.x * dt)
          die.mesh.rotateOnWorldAxis(AXIS_Y, die.omega.y * dt)
          die.mesh.rotateOnWorldAxis(AXIS_Z, die.omega.z * dt)
        } else if (die.landing) {
          die.t = Math.min(1, die.t + dt / 0.72)
          const k = 1 - (1 - die.t) ** 3
          die.mesh.quaternion.slerpQuaternions(die.from, die.to, k)
          if (die.t >= 1) die.landing = false
        }
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

  const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
  return (
    <View style={styles.wrap}>
      {glFailed ? (
        <View style={styles.fallback}>
          <Text style={[styles.fallbackDie, rolling && { opacity: 0.5 }]}>{DIE_FACES[clampFace(left) - 1]}</Text>
          <Text style={[styles.fallbackDie, rolling && { opacity: 0.5 }]}>{DIE_FACES[clampFace(right) - 1]}</Text>
        </View>
      ) : (
        <GLView style={styles.gl} onContextCreate={onContextCreate} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    height: 240,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
  },
  gl: {
    flex: 1,
  },
  fallback: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  fallbackDie: {
    fontSize: 96,
    color: '#f8f0dc',
  },
})
