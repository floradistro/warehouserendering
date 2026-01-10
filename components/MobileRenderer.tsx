'use client'

import React, { Suspense, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'
import { MAIN_WAREHOUSE_MODEL } from '@/lib/warehouse-models'

// Ultra-simple mobile 3D renderer - minimal features for stability
export default function MobileRenderer() {
  const { currentFloorplan, loadCurrentModel } = useAppStore()

  // Load the warehouse model on mount
  useEffect(() => {
    if (!currentFloorplan) {
      loadCurrentModel()
    }
  }, [currentFloorplan, loadCurrentModel])

  // Use the warehouse model directly as fallback
  const floorplan = currentFloorplan || MAIN_WAREHOUSE_MODEL

  return (
    <div className="w-full h-full bg-gray-800 touch-none">
      <Canvas
        camera={{
          position: [100, 150, 200],
          fov: 60,
          near: 1,
          far: 1000
        }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: false,
        }}
        dpr={1}
        shadows={false}
        frameloop="demand"
        style={{ touchAction: 'none' }}
      >
        <Suspense fallback={null}>
          <SimpleScene floorplan={floorplan} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Minimal scene with just basic shapes
function SimpleScene({ floorplan }: { floorplan: any }) {
  const controlsRef = useRef<any>()

  return (
    <>
      {/* Simple lighting - just ambient and one directional */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[50, 80, 50]} intensity={0.8} />

      {/* Ground plane - simple gray */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[floorplan.dimensions.width / 2, -0.1, floorplan.dimensions.height / 2]}>
        <planeGeometry args={[floorplan.dimensions.width + 50, floorplan.dimensions.height + 50]} />
        <meshBasicMaterial color="#404040" />
      </mesh>

      {/* Simple grid */}
      <gridHelper
        args={[300, 30, '#555555', '#333333']}
        position={[floorplan.dimensions.width / 2, 0, floorplan.dimensions.height / 2]}
      />

      {/* Render all wall elements as simple boxes */}
      {floorplan.elements
        .filter((el: any) => el.type === 'wall')
        .map((element: any) => (
          <SimpleWall key={element.id} element={element} />
        ))}

      {/* Simple orbit controls for touch */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[floorplan.dimensions.width / 2, 0, floorplan.dimensions.height / 2]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={20}
        maxDistance={400}
        zoomSpeed={0.8}
        rotateSpeed={0.5}
        panSpeed={0.8}
        enableDamping={true}
        dampingFactor={0.1}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN
        }}
      />
    </>
  )
}

// Simple wall component - just a colored box
function SimpleWall({ element }: { element: any }) {
  const { width, height, depth = 8 } = element.dimensions
  const isExterior = element.metadata?.category === 'exterior' || element.material === 'brick'

  // Calculate position - Three.js uses center-based positioning
  const position: [number, number, number] = [
    element.position.x + width / 2,
    (depth || 8) / 2,
    element.position.y + height / 2
  ]

  // Handle rotation
  const rotation = element.rotation || 0
  const isVertical = Math.abs(rotation) === 90 || Math.abs(rotation) === 270

  return (
    <mesh position={position} rotation={[0, (rotation * Math.PI) / 180, 0]}>
      <boxGeometry args={isVertical ? [height, depth || 8, width] : [width, depth || 8, height]} />
      <meshBasicMaterial color={isExterior ? '#8B7355' : '#a0a0a0'} />
    </mesh>
  )
}
