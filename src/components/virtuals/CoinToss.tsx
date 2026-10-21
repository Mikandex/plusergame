import { useEffect, useRef } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Asset } from 'expo-asset'
import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl'
import * as THREE from 'three'
import { images } from '@/constants'

export type CoinFace = 'heads' | 'tails' | 'edge'

type CoinTossProps = {
  face: CoinFace
  tossing: boolean
  reduceMotion?: boolean
}

type World = {
  gl: ExpoWebGLRenderingContext
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  mesh: THREE.Mesh
  textures: THREE.Texture[]
  omega: THREE.Vector3
  landing: boolean
  from: THREE.Quaternion
  to: THREE.Quaternion
  t: number
  hop: number
  tossing: boolean
  raf: number
  last: number
  disposed: boolean
}

const AXIS_X = new THREE.Vector3(1, 0, 0)
const AXIS_Y = new THREE.Vector3(0, 1, 0)
const AXIS_Z = new THREE.Vector3(0, 0, 1)
const RADIUS = 0.7
const REST_Y = RADIUS + 0.02

function createRenderer(gl: ExpoWebGLRenderingContext, clear: number) {
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
  renderer.setClearColor(clear, 1)
  if ('outputColorSpace' in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace
  } else {
    ;(renderer as unknown as { outputEncoding: number }).outputEncoding = THREE.sRGBEncoding
  }
  return renderer
}

function reedTexture() {
  const w = 8
  const h = 64
  const data = new Uint8Array(w * h * 4)
  for (let y = 0; y < h; y += 1) {
    const stripe = y % 4 < 2
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4
      data[i] = stripe ? 210 : 168
      data[i + 1] = stripe ? 168 : 122
      data[i + 2] = stripe ? 58 : 36
      data[i + 3] = 255
    }
  }
  const tex = new THREE.DataTexture(data, w, h)
  tex.needsUpdate = true
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.magFilter = THREE.NearestFilter
  return tex
}

async function textureFromModule(mod: number) {
  const asset = Asset.fromModule(mod)
  await asset.downloadAsync()
  const uri = asset.localUri || asset.uri
  const size = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject)
  })
  const texture = new THREE.Texture()
  texture.image = { data: asset, width: size.width, height: size.height }
  ;(texture as unknown as { isDataTexture: boolean }).isDataTexture = true
  texture.needsUpdate = true
  texture.flipY = true
  if ('colorSpace' in texture) {
    texture.colorSpace = THREE.SRGBColorSpace
  }
  return texture
}

function goldFace() {
  return new THREE.MeshStandardMaterial({
    color: 0xc9a227,
    metalness: 0.72,
    roughness: 0.28,
  })
}

function restQuat(face: CoinFace) {
  const euler = new THREE.Euler()
  if (face === 'heads') euler.set(Math.PI / 2, 0, 0)
  else if (face === 'tails') euler.set(-Math.PI / 2, 0, 0)
  else euler.set(0, 0, Math.PI / 2)
  return new THREE.Quaternion().setFromEuler(euler)
}

function kickOmega(omega: THREE.Vector3) {
  omega.set(
    (11 + Math.random() * 6) * (Math.random() > 0.5 ? 1 : -1),
    (14 + Math.random() * 7) * (Math.random() > 0.5 ? 1 : -1),
    (4 + Math.random() * 4) * (Math.random() > 0.5 ? 1 : -1),
  )
}

export default function CoinToss({ face, tossing, reduceMotion = false }: CoinTossProps) {
  const propsRef = useRef({ face, tossing, reduceMotion })
  propsRef.current = { face, tossing, reduceMotion }
  const worldRef = useRef<World | null>(null)

  useEffect(() => {
    return () => {
      const world = worldRef.current
      if (!world) return
      world.disposed = true
      cancelAnimationFrame(world.raf)
      world.textures.forEach((tex) => tex.dispose())
      world.mesh.geometry.dispose()
      const mats = world.mesh.material
      if (Array.isArray(mats)) mats.forEach((m) => m.dispose())
      else mats.dispose()
      world.renderer.dispose()
      worldRef.current = null
    }
  }, [])

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    if (worldRef.current) {
      worldRef.current.disposed = true
      cancelAnimationFrame(worldRef.current.raf)
    }

    const renderer = createRenderer(gl, 0x0a2a22)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(
      32,
      gl.drawingBufferWidth / Math.max(1, gl.drawingBufferHeight),
      0.1,
      40,
    )
    camera.position.set(0, 0.82, 4.15)
    camera.lookAt(0, 0.7, 0)

    scene.add(new THREE.HemisphereLight(0xfff3d6, 0x143028, 1.1))
    const key = new THREE.DirectionalLight(0xffe7a8, 1.55)
    key.position.set(-2.4, 5.2, 4.2)
    scene.add(key)
    const rim = new THREE.DirectionalLight(0x88c4a8, 0.45)
    rim.position.set(3.2, 1.4, 2)
    scene.add(rim)

    const table = new THREE.Mesh(
      new THREE.CircleGeometry(2.1, 48),
      new THREE.MeshStandardMaterial({ color: 0x0c3328, roughness: 0.92, metalness: 0 }),
    )
    table.rotation.x = -Math.PI / 2
    table.position.y = 0
    scene.add(table)

    const reed = reedTexture()
    const side = new THREE.MeshStandardMaterial({
      map: reed,
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.22,
    })
    const headsMat = goldFace()
    const tailsMat = goldFace()

    const geometry = new THREE.CylinderGeometry(RADIUS, RADIUS, 0.11, 64)
    const mesh = new THREE.Mesh(geometry, [side, headsMat, tailsMat])
    mesh.position.set(0, REST_Y, 0)
    scene.add(mesh)

    const world: World = {
      gl,
      renderer,
      scene,
      camera,
      mesh,
      textures: [reed],
      omega: new THREE.Vector3(),
      landing: false,
      from: new THREE.Quaternion(),
      to: new THREE.Quaternion(),
      t: 1,
      hop: 0,
      tossing: false,
      raf: 0,
      last: 0,
      disposed: false,
    }

    const snap = (next: CoinFace) => {
      mesh.quaternion.copy(restQuat(next))
      mesh.position.y = REST_Y
      world.landing = false
      world.t = 1
      world.hop = 0
      world.omega.set(0, 0, 0)
    }
    snap(propsRef.current.face)
    worldRef.current = world

    const tick = (now: number) => {
      if (world.disposed) return
      const dt = world.last ? Math.min(0.04, (now - world.last) / 1000) : 0.016
      world.last = now
      const props = propsRef.current

      if (props.tossing && !world.tossing) {
        world.landing = false
        world.hop = 0
        kickOmega(world.omega)
      }

      if (!props.tossing && world.tossing) {
        if (props.reduceMotion) {
          snap(props.face)
        } else {
          world.from.copy(mesh.quaternion)
          world.to.copy(restQuat(props.face))
          world.landing = true
          world.t = 0
        }
      }

      world.tossing = props.tossing

      if (props.tossing && !props.reduceMotion) {
        if (world.omega.lengthSq() < 0.01) kickOmega(world.omega)
        world.hop += dt
        mesh.position.y = REST_Y + Math.abs(Math.sin(world.hop * 6.4)) * 0.7
        mesh.rotateOnWorldAxis(AXIS_X, world.omega.x * dt)
        mesh.rotateOnWorldAxis(AXIS_Y, world.omega.y * dt)
        mesh.rotateOnWorldAxis(AXIS_Z, world.omega.z * dt)
      } else if (world.landing) {
        world.t = Math.min(1, world.t + dt / 0.7)
        const k = 1 - (1 - world.t) ** 3
        mesh.quaternion.slerpQuaternions(world.from, world.to, k)
        mesh.position.y = REST_Y + (1 - k) * 0.35
        if (world.t >= 1) world.landing = false
      }

      renderer.render(scene, camera)
      gl.endFrameEXP()
      world.raf = requestAnimationFrame(tick)
    }

    world.raf = requestAnimationFrame(tick)

    void (async () => {
      try {
        const [headsMap, tailsMap] = await Promise.all([
          textureFromModule(images.coin as unknown as number),
          textureFromModule(images.coinTail as unknown as number),
        ])
        if (world.disposed) {
          headsMap.dispose()
          tailsMap.dispose()
          return
        }
        headsMat.map = headsMap
        headsMat.needsUpdate = true
        tailsMat.map = tailsMap
        tailsMat.needsUpdate = true
        world.textures.push(headsMap, tailsMap)
      } catch {
        // gold faces already render
      }
    })()
  }

  return (
    <View style={styles.wrap}>
      <GLView style={styles.gl} onContextCreate={onContextCreate} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    height: 228,
    width: '100%',
    backgroundColor: '#0a2a22',
  },
  gl: {
    flex: 1,
  },
})
