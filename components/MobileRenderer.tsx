'use client'

import React, { Suspense, useRef, useEffect, useMemo } from 'react'
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

  // Use the warehouse model directly - ALWAYS fall back to main model
  const floorplan = useMemo(() => {
    const model = currentFloorplan || MAIN_WAREHOUSE_MODEL
    console.log('📱 MobileRenderer floorplan:', model?.name, 'elements:', model?.elements?.length)
    return model
  }, [currentFloorplan])

  // Center point for the model
  const centerX = floorplan.dimensions.width / 2
  const centerZ = floorplan.dimensions.height / 2

  return (
    <div className="w-full h-full bg-gray-800 touch-none">
      <Canvas
        camera={{
          position: [centerX + 50, 100, centerZ + 100],
          fov: 60,
          near: 0.1,
          far: 2000
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
          <SimpleScene floorplan={floorplan} centerX={centerX} centerZ={centerZ} />
        </Suspense>
      </Canvas>
    </div>
  )
}

// Minimal scene with just basic shapes
function SimpleScene({ floorplan, centerX, centerZ }: { floorplan: any; centerX: number; centerZ: number }) {
  const controlsRef = useRef<any>()

  // Get elements safely
  const { walls, beams } = useMemo(() => {
    const elements = floorplan?.elements || []
    const wallElements = elements.filter((el: any) => el.type === 'wall')
    // Only get I-beams (skip small plumbing fixtures for performance)
    const beamElements = elements.filter((el: any) =>
      el.type === 'fixture' && el.metadata?.beam_type === 'I-beam'
    )
    console.log('📱 SimpleScene walls:', wallElements.length, 'beams:', beamElements.length, 'of', elements.length, 'total')
    return { walls: wallElements, beams: beamElements }
  }, [floorplan])

  return (
    <>
      {/* Simple lighting - just ambient and one directional */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[centerX, 100, centerZ]} intensity={0.6} />

      {/* Ground plane - simple gray */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.1, centerZ]}>
        <planeGeometry args={[floorplan.dimensions.width + 100, floorplan.dimensions.height + 100]} />
        <meshBasicMaterial color="#505050" />
      </mesh>

      {/* Simple grid */}
      <gridHelper
        args={[Math.max(floorplan.dimensions.width, floorplan.dimensions.height) + 50, 30, '#666666', '#444444']}
        position={[centerX, 0.01, centerZ]}
      />

      {/* Render all wall elements as simple boxes */}
      {walls.map((element: any) => (
        <SimpleWall key={element.id} element={element} />
      ))}

      {/* Render steel I-beams */}
      {beams.map((element: any) => (
        <SimpleBeam key={element.id} element={element} />
      ))}

      {/* Simple orbit controls for touch */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        target={[centerX, 5, centerZ]}
        maxPolarAngle={Math.PI / 2.1}
        minDistance={10}
        maxDistance={500}
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
  const { width = 1, height = 1, depth = 12 } = element.dimensions || {}
  const wallHeight = depth // The vertical height of the wall (e.g., 12 feet)
  const isExterior = element.metadata?.category === 'exterior' || element.material === 'brick'

  // Determine if this is a vertical wall (running along Z axis)
  // In the model: width < height means wall runs along Y (which is Z in 3D)
  const isVerticalWall = height > width

  // Calculate 3D position from 2D coordinates
  // 2D X,Y -> 3D X,Z with Y being vertical height
  let posX: number, posZ: number
  let boxWidth: number, boxDepth: number

  if (isVerticalWall) {
    // Wall runs along Z axis (north-south in 2D)
    posX = element.position.x + width / 2
    posZ = element.position.y + height / 2
    boxWidth = width   // Thin in X
    boxDepth = height  // Long in Z
  } else {
    // Wall runs along X axis (east-west in 2D)
    posX = element.position.x + width / 2
    posZ = element.position.y + height / 2
    boxWidth = width   // Long in X
    boxDepth = height  // Thin in Z
  }

  const position: [number, number, number] = [
    posX,
    wallHeight / 2, // Center vertically (bottom at Y=0)
    posZ
  ]

  // Handle explicit rotation if any
  const rotation = element.rotation || 0

  return (
    <mesh position={position} rotation={[0, (rotation * Math.PI) / 180, 0]}>
      <boxGeometry args={[boxWidth, wallHeight, boxDepth]} />
      <meshBasicMaterial color={isExterior ? '#A0522D' : '#808080'} />
    </mesh>
  )
}

// Simple beam component - steel I-beams rendered as vertical columns
function SimpleBeam({ element }: { element: any }) {
  const { width = 0.67, height = 0.67, depth = 14 } = element.dimensions || {}

  // Beams are vertical columns
  // - width/height = cross-section dimensions (~8" = 0.67')
  // - depth = vertical height (~14 feet)
  const posX = element.position.x
  const posZ = element.position.y
  const verticalHeight = depth
  const posY = verticalHeight / 2 // Center vertically, base at Y=0

  const position: [number, number, number] = [posX, posY, posZ]

  return (
    <mesh position={position}>
      {/* Box: X=width, Y=vertical height, Z=height (cross-section) */}
      <boxGeometry args={[width, verticalHeight, height]} />
      <meshBasicMaterial color="#4A5568" /> {/* Dark steel gray */}
    </mesh>
  )
}
