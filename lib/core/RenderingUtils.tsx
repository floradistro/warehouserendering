'use client'

import React, { useMemo } from 'react'
import { useLoader } from '@react-three/fiber'
import * as THREE from 'three'

// Background 3D Grid
interface Background3DGridProps {
  centerX: number
  centerY: number
  size?: number
}

export function Background3DGrid({ centerX, centerY, size = 500 }: Background3DGridProps) {
  const grid = useMemo(() => {
    const group = new THREE.Group()
    const horizontalMaterial = new THREE.LineBasicMaterial({ 
      color: '#404040',
      opacity: 0.3,
      transparent: true 
    })
    const verticalMaterial = new THREE.LineBasicMaterial({ 
      color: '#404040',
      opacity: 0.3,
      transparent: true 
    })

    // Major grid lines every 10 feet
    const majorStep = 10
    const minorStep = 1
    const halfSize = size / 2

    // Major horizontal lines (running east-west)
    for (let y = -halfSize; y <= halfSize; y += majorStep) {
      const points = [
        new THREE.Vector3(centerX - halfSize, centerY + y, 0),
        new THREE.Vector3(centerX + halfSize, centerY + y, 0)
      ]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, horizontalMaterial)
      group.add(line)
    }

    // Major vertical lines (running north-south)
    for (let x = -halfSize; x <= halfSize; x += majorStep) {
      const points = [
        new THREE.Vector3(centerX + x, centerY - halfSize, 0),
        new THREE.Vector3(centerX + x, centerY + halfSize, 0)
      ]
      const geometry = new THREE.BufferGeometry().setFromPoints(points)
      const line = new THREE.Line(geometry, verticalMaterial)
      group.add(line)
    }

    return group
  }, [centerX, centerY, size])

  return <primitive object={grid} />
}

// Ground Plane
interface GroundPlaneProps {
  width: number
  height: number
  isMobile?: boolean
}

// Tiny 1x1 pixel data URL for mobile
const MOBILE_CONCRETE_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOsr6+vBwAERgHBpBGqHAAAAABJRU5ErkJggg=='

export function GroundPlane({ width, height, isMobile = false }: GroundPlaneProps) {
  // On mobile, use tiny placeholder to avoid loading large texture
  const concreteTexture = useLoader(
    THREE.TextureLoader,
    isMobile ? MOBILE_CONCRETE_URL : '/textures/materials/concrete/Textured Dark Concrete Surface.png'
  )

  // Configure texture (only for desktop)
  useMemo(() => {
    if (concreteTexture && !isMobile) {
      concreteTexture.wrapS = THREE.RepeatWrapping
      concreteTexture.wrapT = THREE.RepeatWrapping
      concreteTexture.repeat.set(width / 20, height / 20)
    }
  }, [concreteTexture, width, height, isMobile])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow={!isMobile}>
      <planeGeometry args={[width, height]} />
      <meshLambertMaterial
        map={isMobile ? null : concreteTexture}
        color={isMobile ? '#555555' : '#cccccc'}
      />
    </mesh>
  )
}

// Room Floor
interface RoomFloorProps {
  position: [number, number, number]
  width: number
  height: number
  color?: string
  opacity?: number
}

export function RoomFloor({ 
  position, 
  width, 
  height, 
  color = '#f0f0f0',
  opacity = 0.8
}: RoomFloorProps) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[width, height]} />
      <meshLambertMaterial 
        color={color} 
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  )
}

// Arrow Head for dimension lines
interface ArrowHeadProps {
  position: [number, number, number]
  rotation: [number, number, number]
  color?: string
}

export function ArrowHead({ position, rotation, color = '#ffffff' }: ArrowHeadProps) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.3, 1.0]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// Performance optimized instanced rendering for repeated elements
interface InstancedMeshProps {
  geometry: THREE.BufferGeometry
  material: THREE.Material
  instances: Array<{
    position: THREE.Vector3
    rotation?: THREE.Euler
    scale?: THREE.Vector3
  }>
}

export function InstancedMesh({ geometry, material, instances }: InstancedMeshProps) {
  const meshRef = React.useRef<THREE.InstancedMesh>(null)

  React.useEffect(() => {
    if (!meshRef.current) return

    const mesh = meshRef.current
    const matrix = new THREE.Matrix4()

    instances.forEach((instance, i) => {
      matrix.compose(
        instance.position,
        new THREE.Quaternion().setFromEuler(instance.rotation || new THREE.Euler()),
        instance.scale || new THREE.Vector3(1, 1, 1)
      )
      mesh.setMatrixAt(i, matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  }, [instances])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
    />
  )
}
