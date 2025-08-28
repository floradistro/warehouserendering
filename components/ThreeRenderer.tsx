'use client'

import React from 'react'
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { Suspense, useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { FloorplanData, FloorplanElement, useAppStore } from '@/lib/store'
import { IntelligentWallSystem } from '@/lib/intelligent-wall-system'
import { MAIN_WAREHOUSE_MODEL } from '@/lib/warehouse-models'
import { createDetailedIBCTote, createSimpleIBCTote } from '@/lib/ibc-tote-model'
import { createDetailedSpiralFeederTank, createSimpleSpiralFeederTank } from '@/lib/spiral-feeder-tank-model'
import { createDetailedNorwescoTank, createSimpleNorwescoTank } from '@/lib/norwesco-tank-model'
import FirstPersonControls from './FirstPersonControls'
import SnapIndicators from './SnapIndicators'
import EnhancedLighting from './EnhancedLighting'

// WASD-enabled Orbit Controls
function WASDOrbitControls({ target, ...props }: any) {
  const orbitRef = useRef<any>()
  const keysPressed = useRef<Set<string>>(new Set())
  const panSpeed = 2.0
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.code)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      keysPressed.current.clear()
    }
  }, [])

  useFrame((state, delta) => {
    if (!orbitRef.current) return

    const controls = orbitRef.current
    const camera = state.camera
    
    // Get camera's right and forward vectors
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0 // Keep movement on horizontal plane
    forward.normalize()
    
    const right = new THREE.Vector3()
    right.crossVectors(forward, camera.up).normalize()
    
    const movement = new THREE.Vector3()
    const moveDistance = panSpeed * delta * 60 // Normalize for 60fps

    // WASD movement
    if (keysPressed.current.has('KeyW')) {
      movement.add(forward.clone().multiplyScalar(moveDistance))
    }
    if (keysPressed.current.has('KeyS')) {
      movement.add(forward.clone().multiplyScalar(-moveDistance))
    }
    if (keysPressed.current.has('KeyA')) {
      movement.add(right.clone().multiplyScalar(-moveDistance))
    }
    if (keysPressed.current.has('KeyD')) {
      movement.add(right.clone().multiplyScalar(moveDistance))
    }

    // Apply movement to both camera and target
    if (movement.length() > 0) {
      camera.position.add(movement)
      controls.target.add(movement)
      controls.update()
    }
  })

  return (
    <OrbitControls
      ref={orbitRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={10}
      maxDistance={400}
      target={target}
      makeDefault
      {...props}
    />
  )
}

// Helper function to convert decimal feet to feet, inches, and fractions
// Selection box component for highlighting selected elements
function SelectionBox({ dimensions, color = '#ff0000' }: { dimensions: { width: number; height: number; depth?: number }, color?: string }) {
  const { width, height, depth = 1 } = dimensions
  
  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(width, depth, height)]} />
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  )
}

function formatMeasurement(decimalFeet: number): string {
  const feet = Math.floor(decimalFeet)
  const remainingFeet = decimalFeet - feet
  const totalInches = remainingFeet * 12
  const inches = Math.floor(totalInches)
  const remainingInches = totalInches - inches
  
  // Convert to 16ths
  const sixteenths = Math.round(remainingInches * 16)
  
  if (sixteenths === 0) {
    if (inches === 0) {
      return `${feet}'`
    }
    return `${feet}' ${inches}"`
  }
  
  // Simplify fraction
  let numerator = sixteenths
  let denominator = 16
  
  // Find GCD to simplify fraction
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b)
  const commonDivisor = gcd(numerator, denominator)
  numerator /= commonDivisor
  denominator /= commonDivisor
  
  if (inches === 0) {
    return `${feet}' ${numerator}/${denominator}"`
  }
  
  return `${feet}' ${inches} ${numerator}/${denominator}"`
}

// Helper function to get center position of an element
function getElementCenter(element: FloorplanElement): [number, number, number] {
  const { x, y, z = 0 } = element.position
  
  // Special positioning for I-beams (they're vertical columns from ground up)
  if (element.material === 'steel' && element.type === 'fixture') {
    return [x, element.dimensions.depth! / 2, y] // Center height of I-beam
  }
  
  // Standard positioning for other elements
  const { depth = 8 } = element.dimensions
  return [x + element.dimensions.width / 2, depth / 2, y + element.dimensions.height / 2]
}

interface FloorplanElementProps {
  element: FloorplanElement
  isSelected: boolean
  onSelect: (id: string) => void
  showMeasurements: boolean
  measurementMode: boolean
  selectedObjectsForMeasurement: [string | null, string | null]
  onMeasurementSelect: (id: string) => void
  onStartEdit: (element: FloorplanElement) => void
  onStartDrag: (element: FloorplanElement, worldPosition: { x: number; y: number; z: number }) => void
  isEditing: boolean
  selectedElements: string[]
  isDragging: boolean
}

function FloorplanElementMesh({ 
  element, 
  isSelected, 
  onSelect, 
  showMeasurements, 
  measurementMode,
  selectedObjectsForMeasurement,
  onMeasurementSelect,
  onStartEdit,
  onStartDrag,
  isEditing,
  selectedElements,
  isDragging
}: FloorplanElementProps) {
  // Load brick texture for walls
  const brickTexture = useLoader(THREE.TextureLoader, '/textures/materials/concrete/Brick/bricktexture.jpg')

  const isPreview = element.metadata?.isPreview === true

  const { geometry, material } = useMemo(() => {
    const { width, height, depth = 8 } = element.dimensions
    
    // Special handling for steel I-beams
    if (element.material === 'steel' && element.type === 'fixture') {
      // Create single-layer I-beam geometry
      const iBeamGroup = new THREE.Group()
      
      // Create steel material
      const steelMaterial = new THREE.MeshStandardMaterial({
        color: isPreview ? new THREE.Color('#4ade80') : new THREE.Color('#2c3e50'),
        metalness: 0.8,
        roughness: 0.2,
        transparent: isPreview,
        opacity: isPreview ? 0.6 : 1,
      })

      // Get beam configuration from metadata
      const beamLayers = element.metadata?.beam_layers || 1
      const beamSize = element.metadata?.beam_size || '8_inch'
      
      // Single-layer I-beam dimensions (8 inch beam)
      const flangeWidth = 0.67  // 8 inches
      const flangeThickness = 0.04  // ~0.5 inches
      const webThickness = 0.025   // ~0.3 inches
      const beamHeight = depth

      if (beamLayers === 1) {
        // Single-layer I-beam - create as one continuous piece
        
        // Top flange - full width, thin
        const topFlange = new THREE.BoxGeometry(flangeWidth, flangeWidth, flangeThickness)
        const topFlangeMesh = new THREE.Mesh(topFlange, steelMaterial)
        topFlangeMesh.position.set(0, 0, beamHeight - flangeThickness/2)
        iBeamGroup.add(topFlangeMesh)
        
        // Bottom flange - full width, thin
        const bottomFlange = new THREE.BoxGeometry(flangeWidth, flangeWidth, flangeThickness)
        const bottomFlangeMesh = new THREE.Mesh(bottomFlange, steelMaterial)
        bottomFlangeMesh.position.set(0, 0, flangeThickness/2)
        iBeamGroup.add(bottomFlangeMesh)
        
        // Web (vertical connector) - thin vertical plate
        const webHeight = beamHeight - (2 * flangeThickness)
        const web = new THREE.BoxGeometry(webThickness, flangeWidth, webHeight)
        const webMesh = new THREE.Mesh(web, steelMaterial)
        webMesh.position.set(0, 0, beamHeight/2)
        iBeamGroup.add(webMesh)
        
      } else {
        // Multi-layer I-beam (for future expansion)
        for (let layer = 0; layer < beamLayers; layer++) {
          const layerOffset = layer * 0.1 // Small offset between layers
          
          // Top flange
          const topFlange = new THREE.BoxGeometry(flangeWidth, flangeWidth, flangeThickness)
          const topFlangeMesh = new THREE.Mesh(topFlange, steelMaterial)
          topFlangeMesh.position.set(layerOffset, 0, beamHeight - flangeThickness/2)
          iBeamGroup.add(topFlangeMesh)
          
          // Bottom flange
          const bottomFlange = new THREE.BoxGeometry(flangeWidth, flangeWidth, flangeThickness)
          const bottomFlangeMesh = new THREE.Mesh(bottomFlange, steelMaterial)
          bottomFlangeMesh.position.set(layerOffset, 0, flangeThickness/2)
          iBeamGroup.add(bottomFlangeMesh)
          
          // Web
          const webHeight = beamHeight - (2 * flangeThickness)
          const web = new THREE.BoxGeometry(webThickness, flangeWidth, webHeight)
          const webMesh = new THREE.Mesh(web, steelMaterial)
          webMesh.position.set(layerOffset, 0, beamHeight/2)
          iBeamGroup.add(webMesh)
        }
      }
      
      return {
        geometry: null, // We'll use the group instead
        material: null,
        iBeamGroup
      }
    }
    
    // Standard geometry for other elements
    // For walls: width = length along X, height = thickness along Z, depth = height along Y
    const standardGeometry = new THREE.BoxGeometry(width, depth, height)
    let standardMaterial
    
    console.log(`Creating geometry for ${element.id}: width=${width}, height=${height}, depth=${depth}, rotation=${element.rotation || 0}`)
    
    if (element.type === 'wall') {
      // Check if this is an exterior wall (perimeter walls)
      const isExteriorWall = element.metadata?.category === 'exterior' || 
                             ['wall-bottom', 'wall-top', 'wall-left', 'wall-right', 'wall-bottom-left', 'wall-bottom-right'].includes(element.id)
      
      if (isExteriorWall) {
        // Configure brick texture for exterior walls
        brickTexture.wrapS = brickTexture.wrapT = THREE.RepeatWrapping
        brickTexture.repeat.set(element.dimensions.width / 4, element.dimensions.height / 4)
        
        standardMaterial = new THREE.MeshStandardMaterial({
          map: isPreview ? null : brickTexture,
          color: isPreview ? new THREE.Color('#4ade80') : new THREE.Color('#8B7355'),
          roughness: 0.9,
          metalness: 0.1,
          transparent: isPreview,
          opacity: isPreview ? 0.6 : 1,
        })
      } else {
        // Off-white drywall for interior walls
        standardMaterial = new THREE.MeshStandardMaterial({
          color: isPreview ? new THREE.Color('#4ade80') : new THREE.Color('#f8f8f8'),
          roughness: 0.7,
          metalness: 0.0,
          transparent: isPreview,
          opacity: isPreview ? 0.6 : 1,
        })
      }
    } else if (element.material === 'wood') {
      // Wood material for doors
      standardMaterial = new THREE.MeshStandardMaterial({
        color: isPreview ? new THREE.Color('#4ade80') : new THREE.Color(element.color || '#8B4513'),
        roughness: 0.9,
        metalness: 0.0,
        transparent: isPreview,
        opacity: isPreview ? 0.6 : 1,
      })
    } else {
      // Default material with fallback color
      const defaultColor = '#95A5A6' // Light gray fallback
      const color = isPreview ? '#4ade80' : (element.color || defaultColor)
      const opacity = isPreview ? 0.6 : (element.type === 'room' ? 0.7 : 1.0)
      
      standardMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        transparent: element.type === 'room' || isPreview,
        opacity,
        roughness: 0.8,
        metalness: 0.1,
      })
    }
    
    return {
      geometry: standardGeometry,
      material: standardMaterial,
      iBeamGroup: null
    }
  }, [element, brickTexture])

  const position = useMemo(() => {
    const { x, y, z = 0 } = element.position
    
    // Special positioning for structural trusses (they span across the building at exact coordinates)
    // Check this BEFORE general steel fixtures to avoid incorrect positioning
    if (element.metadata?.category === 'structural' && element.metadata?.truss_type === 'support_truss') {
      // Trusses span the full building width, positioned at their starting X and centered on their Y
      // The BOTTOM of the truss connects to the TOP of the I-beam at center (14.046875')
      // The bottom curves down to 12' at the exterior walls
      // Position the group at 12' (exterior wall height where bottom of truss meets wall)
      return [x + element.dimensions.width / 2, 12, y] as [number, number, number] // Position at exterior height
    }
    
    // Special positioning for longitudinal trusses (run along walls, north-south)
    if (element.metadata?.category === 'structural' && element.metadata?.truss_type === 'longitudinal_truss') {
      // Longitudinal trusses run along the walls at 12' height, flat (no curve)
      // They connect all the cross trusses at their ends
      return [x, 12, y + element.dimensions.height / 2] as [number, number, number] // Centered along length
    }
    
    // Special positioning for I-beams (they're vertical columns from ground up)
    if (element.material === 'steel' && element.type === 'fixture') {
      return [x, 0, y] as [number, number, number] // Base at ground level (y=0)
    }
    
    // Special positioning for doors (wood fixtures) - 8' tall doors from ground up
    if (element.material === 'wood' && element.type === 'fixture') {
      // Position doors from ground up (0) to 8' height, centered horizontally and depth-wise
      const { depth = 8 } = element.dimensions
      return [x + element.dimensions.width / 2, depth / 2, y + element.dimensions.height / 2] as [number, number, number] // Height 4 = center of 8' door
    }
    
    // Special positioning for wall sections above doors (identified by 'door-top-wall' in ID)
    if (element.type === 'wall' && element.id.includes('door-top-wall')) {
      // Position wall sections above doors: z=8 means start at 8' height, depth=4 means 4' tall
      // So center should be at 8 + (4/2) = 10' height
      const { depth = 4 } = element.dimensions
      return [x + element.dimensions.width / 2, z + depth / 2, y + element.dimensions.height / 2] as [number, number, number]
    }
    
    // Special positioning for ceiling elements (identified by 'ceiling' category in metadata)
    if (element.metadata?.category === 'ceiling' || element.metadata?.is_ceiling) {
      // Position ceiling at the specified height (z coordinate = height in feet)
      // Center the ceiling horizontally and depth-wise
      return [x + element.dimensions.width / 2, z, y + element.dimensions.height / 2] as [number, number, number]
    }
    
    // Standard positioning for other elements (walls, etc.)
    const { depth = 8 } = element.dimensions
    return [x + element.dimensions.width / 2, depth / 2, y + element.dimensions.height / 2] as [number, number, number]
  }, [element.position, element.dimensions, element.material, element.type])

  // Check if this element is selected for measurement
  const isSelectedForMeasurement = selectedObjectsForMeasurement.includes(element.id)
  const isMeasurementFirstSelection = selectedObjectsForMeasurement[0] === element.id
  const isMeasurementSecondSelection = selectedObjectsForMeasurement[1] === element.id

  // Handle click events based on mode
  const handleClick = (e: any) => {
    if (measurementMode) {
      // In measurement mode, ignore object clicks and let them pass through to ground plane
      console.log('🚫 Ignoring object click in measurement mode:', element.id)
      return // Don't stop propagation - let it go to ground plane
    }
    
    e.stopPropagation()
    console.log(`Clicked ${element.id}`)
    onSelect(element.id)
  }

  // Handle double-click for editing or measurement
  const handleDoubleClick = (e: any) => {
    e.stopPropagation()
    
    if (measurementMode) {
      console.log(`Double-clicked ${element.id} for measurement`)
      onMeasurementSelect(element.id)
    } else {
      console.log('🔧 Double-clicked element for editing:', element.id, 'type:', element.type)
      onStartEdit(element)
    }
  }

  // Handle drag functionality for walls and elements
  const handlePointerDown = (e: any) => {
    e.stopPropagation()
    
    // Only allow dragging in edit mode or when element is selected
    if (!isEditing && !selectedElements.includes(element.id)) {
      return
    }
    
    // Convert screen coordinates to world coordinates
    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2()
    const rect = e.nativeEvent.target.getBoundingClientRect()
    
    mouse.x = ((e.nativeEvent.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.nativeEvent.clientY - rect.top) / rect.height) * 2 + 1
    
    // Get camera from the canvas context
    const camera = e.nativeEvent.target.__r3f?.camera
    if (!camera) return
    
    raycaster.setFromCamera(mouse, camera)
    
    // Create a plane at y=0 to intersect with
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const intersectionPoint = new THREE.Vector3()
    
    if (raycaster.ray.intersectPlane(plane, intersectionPoint)) {
      // Start drag with world position
      onStartDrag(element, {
        x: intersectionPoint.x,
        y: intersectionPoint.z, // Note: in our coordinate system, y is the ground plane
        z: intersectionPoint.y
      })
    }
  }

  // Handle steel fixtures (I-beams and support trusses) rendering differently
  if (element.material === 'steel' && element.type === 'fixture') {
    // Support Truss rendering (cross trusses)
    if (element.metadata?.truss_type === 'support_truss') {
      return (
        <group 
          position={position}
          rotation={[0, element.rotation || 0, 0]}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={(e) => {
            e.stopPropagation()
            if (isEditing || selectedElements.includes(element.id)) {
              document.body.style.cursor = 'move'
            } else {
              document.body.style.cursor = 'pointer'
            }
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          {/* Support Truss - Curved from 12' exterior to 14.046875' center */}
          <SupportTruss 
            position={[0, 0, 0]}
            width={element.dimensions.width}
            height={element.dimensions.height}
            depth={element.dimensions.depth || 0.67}
            centerHeight={element.metadata?.center_height || 14.046875}
            exteriorHeight={element.metadata?.exterior_height || 12}
            isCurved={element.metadata?.curved_profile || true}
          />
          
          {(isSelected || isSelectedForMeasurement) && (
            <SelectionBox dimensions={element.dimensions} color={isSelectedForMeasurement ? '#ffff00' : '#ff0000'} />
          )}
        </group>
      )
    }
    
    // Longitudinal Truss rendering (along walls)
    if (element.metadata?.truss_type === 'longitudinal_truss') {
      return (
        <group 
          position={position}
          rotation={[0, Math.PI / 2, 0]} // Rotate 90 degrees to run north-south
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={(e) => {
            e.stopPropagation()
            if (isEditing || selectedElements.includes(element.id)) {
              document.body.style.cursor = 'move'
            } else {
              document.body.style.cursor = 'pointer'
            }
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          {/* Longitudinal Truss - Flat, runs along wall */}
          <SupportTruss 
            position={[0, 0, 0]}
            width={element.dimensions.height} // Use height as width since rotated
            height={element.dimensions.depth || 4.8438} // Use depth as height (default to standard truss height)
            depth={element.dimensions.width || 1} // Use width as depth
            centerHeight={12} // Flat at 12'
            exteriorHeight={12} // Flat at 12'
            isCurved={false} // No curve for longitudinal trusses
          />
          
          {(isSelected || isSelectedForMeasurement) && (
            <SelectionBox dimensions={element.dimensions} color={isSelectedForMeasurement ? '#ffff00' : '#ff0000'} />
          )}
        </group>
      )
    }
    
    // I-beam rendering
    if (element.metadata?.beam_type === 'I-beam') {
      return (
        <group 
          position={position}
          rotation={[0, element.rotation || 0, 0]}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={(e) => {
            e.stopPropagation()
            // Show different cursor based on interaction mode
            if (isEditing || selectedElements.includes(element.id)) {
              document.body.style.cursor = 'move'
            } else {
              document.body.style.cursor = 'pointer'
            }
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'auto'
          }}
        >
          {/* I-beam components - vertical standing column */}
          {/* Top flange (horizontal plate at top) */}
          <mesh position={[0, element.dimensions.depth! - 0.075, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.15, 0.6]} />
            <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Bottom flange (horizontal plate at bottom) */}
          <mesh position={[0, 0.075, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.0, 0.15, 0.6]} />
            <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Web (vertical connector between flanges) */}
          <mesh position={[0, element.dimensions.depth! / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.15, element.dimensions.depth! - 0.3, 0.6]} />
            <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
          </mesh>
        
        {(isSelected || isSelectedForMeasurement) && (
          <mesh position={[0, element.dimensions.depth! / 2, 0]}>
            <boxGeometry args={[1.4, element.dimensions.depth! + 0.2, 1.0]} />
            <meshBasicMaterial
              color={
                measurementMode && isSelectedForMeasurement
                  ? isMeasurementFirstSelection
                    ? "#00ff00" // Green for first selection
                    : "#ff6600" // Orange for second selection
                  : "#ffff00" // Yellow for regular selection
              }
              transparent
              opacity={0.4}
              depthTest={false}
            />
          </mesh>
        )}
        
        {/* Removed beam measurements to clean up view */}
      </group>
    )
    }
  }

  // Handle IBC Tote rendering
  if (element.material === 'composite' || element.material === 'ibc_tote' || 
      (element.metadata?.equipment_type === 'ibc_tote')) {
    
    const ibcToteModel = useMemo(() => {
      // Use detailed model for 3D view, simple for 2D (for now always use detailed)
      const is2D = false // viewMode not available in this component yet
      
      if (is2D) {
        return createSimpleIBCTote()
      } else {
        return createDetailedIBCTote({
          showLiquid: element.metadata?.liquid_level ? element.metadata.liquid_level > 0 : false,
          liquidLevel: element.metadata?.liquid_level || 0,
          weathered: element.metadata?.weathered || false,
          labelText: element.metadata?.label || '330 GAL'
        })
      }
    }, [element.metadata])
    
    return (
      <group 
        position={[
          element.position.x + 2, // Center of 4' width
          element.position.z || 0, // Use z position for stacking height
          element.position.y + 1.665 // Center of 3.33' height
        ]}
        rotation={[0, (element.rotation || 0) * Math.PI / 180, 0]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (isEditing || selectedElements.includes(element.id)) {
            document.body.style.cursor = 'move'
          } else {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <primitive object={ibcToteModel} />
        
        {(isSelected || isSelectedForMeasurement) && (
          <mesh position={[0, 1.915, 0]}> {/* Center at half height (3.83/2) */}
            <boxGeometry args={[4.2, 4.03, 3.53]} /> {/* Slightly larger than actual */}
            <meshBasicMaterial
              color={
                measurementMode && isSelectedForMeasurement
                  ? isMeasurementFirstSelection
                    ? "#00ff00" // Green for first selection
                    : "#ff6600" // Orange for second selection
                  : "#ffff00" // Yellow for regular selection
              }
              transparent
              opacity={0.4}
              depthTest={false}
            />
          </mesh>
        )}
      </group>
    )
  }

  // Handle Spiral Feeder Tank rendering
  if (element.material === 'spiral_feeder_tank' || 
      (element.metadata?.equipment_type === 'spiral_feeder_tank')) {
    
    const tankModel = useMemo(() => {
      // Use detailed model for 3D view, simple for 2D (for now always use detailed)
      const is2D = false // viewMode not available in this component yet
      
      if (is2D) {
        return createSimpleSpiralFeederTank()
      } else {
        return createDetailedSpiralFeederTank({
          showFillLevel: element.metadata?.fill_level ? element.metadata.fill_level > 0 : false,
          fillLevel: element.metadata?.fill_level || 0,
          weathered: element.metadata?.weathered || false,
          labelText: element.metadata?.label || '1000 GAL'
        })
      }
    }, [element.metadata])
    
    return (
      <group 
        position={[
          element.position.x + 3, // Center of 6' diameter
          element.position.z || 0, // Use z position for elevation if provided
          element.position.y + 3 // Center of 6' diameter
        ]}
        rotation={[0, (element.rotation || 0) * Math.PI / 180, 0]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (isEditing || selectedElements.includes(element.id)) {
            document.body.style.cursor = 'move'
          } else {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <primitive object={tankModel} />
        
        {(isSelected || isSelectedForMeasurement) && (
          <mesh position={[0, 5.335, 0]}> {/* Center at half height (10.67/2) */}
            <cylinderGeometry args={[3.2, 3.2, 11, 16]} /> {/* Slightly larger than actual */}
            <meshBasicMaterial
              color={
                measurementMode && isSelectedForMeasurement
                  ? isMeasurementFirstSelection
                    ? "#00ff00" // Green for first selection
                    : "#ff6600" // Orange for second selection
                  : "#ffff00" // Yellow for regular selection
              }
              transparent
              opacity={0.4}
              depthTest={false}
              wireframe
            />
          </mesh>
        )}
      </group>
    )
  }

  // Handle Norwesco Tank rendering
  if (element.material === 'norwesco_tank' || 
      (element.metadata?.equipment_type === 'norwesco_tank')) {
    
    const norwescoModel = useMemo(() => {
      // Use detailed model for 3D view, simple for 2D
      const is2D = false // viewMode not available in this component yet
      
      if (is2D) {
        return createSimpleNorwescoTank()
      } else {
        return createDetailedNorwescoTank({
          showLiquid: element.metadata?.liquid_level ? element.metadata.liquid_level > 0 : false,
          liquidLevel: element.metadata?.liquid_level || 0
        })
      }
    }, [element.metadata])
    
    return (
      <group 
        position={[
          element.position.x + element.dimensions.width / 2, // Center of tank
          element.position.z || 0, // Use z position for elevation if provided
          element.position.y + element.dimensions.height / 2 // Center of tank
        ]}
        rotation={[0, (element.rotation || 0) * Math.PI / 180, 0]}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation()
          if (isEditing || selectedElements.includes(element.id)) {
            document.body.style.cursor = 'move'
          } else {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <primitive object={norwescoModel} />
        
        {(isSelected || isSelectedForMeasurement) && (
          <mesh position={[0, 3.335, 0]}> {/* Center at half height (6.67/2) */}
            <cylinderGeometry args={[2.8, 2.8, 7, 16]} /> {/* Slightly larger than actual */}
            <meshBasicMaterial
              color={
                measurementMode && isSelectedForMeasurement
                  ? isMeasurementFirstSelection
                    ? '#00ff00' // Green for first selected
                    : '#ff00ff' // Magenta for second selected
                  : '#00ff00' // Green for normal selection
              }
              transparent
              opacity={0.4}
              depthTest={false}
              wireframe
            />
          </mesh>
        )}
      </group>
    )
  }

  // Standard mesh rendering for walls and other elements
  if (!geometry || !material) {
    return null
  }

  // Debug rotation
  // console.log(`Element ${element.id} rotation:`, element.rotation, 'radians =', ((element.rotation || 0) * 180 / Math.PI).toFixed(1), 'degrees')

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        position={position}
        rotation={[0, element.rotation || 0, 0]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e) => {
          e.stopPropagation()
          // Show different cursor based on interaction mode
          if (isEditing || selectedElements.includes(element.id)) {
            document.body.style.cursor = 'move'
          } else {
            document.body.style.cursor = 'pointer'
          }
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        {(isSelected || isSelectedForMeasurement) && (
          <meshBasicMaterial
            color={
              measurementMode && isSelectedForMeasurement
                ? isMeasurementFirstSelection
                  ? "#00ff00" // Green for first selection
                  : "#ff6600" // Orange for second selection
                : "#ffff00" // Yellow for regular selection
            }
            transparent
            opacity={0.5}
            depthTest={false}
          />
        )}
        
        {/* Dragging visual feedback */}
        {isDragging && selectedElements.includes(element.id) && (
          <meshBasicMaterial
            color="#4ade80" // Green for dragging
            transparent
            opacity={0.7}
            depthTest={false}
          />
        )}
      </mesh>
      
      {/* Removed individual element measurements to clean up view */}
    </group>
  )
}



function Background3DGrid({ centerX, centerY, size = 500 }: { centerX: number; centerY: number; size?: number }) {
  const grid = useMemo(() => {
    const group = new THREE.Group()
    const horizontalMaterial = new THREE.LineBasicMaterial({ 
      color: 0x718096, 
      opacity: 0.2, 
      transparent: true 
    })
    const verticalMaterial = new THREE.LineBasicMaterial({ 
      color: 0x5a6a7a, 
      opacity: 0.12, 
      transparent: true 
    })
    
    const gridSize = size
    const step = 10 // 10 foot increments for smaller workspace
    const startX = centerX - gridSize / 2
    const endX = centerX + gridSize / 2
    const startZ = centerY - gridSize / 2
    const endZ = centerY + gridSize / 2
    const maxHeight = 30 // Maximum height for vertical grid lines
    
    // Horizontal grid (X-Z plane at ground level)
    // Vertical lines (parallel to Z axis)
    for (let x = startX; x <= endX; x += step) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x, -1, startZ),
        new THREE.Vector3(x, -1, endZ)
      ])
      const line = new THREE.Line(geometry, horizontalMaterial)
      line.renderOrder = -2 // Render behind other objects
      group.add(line)
    }
    
    // Horizontal lines (parallel to X axis)
    for (let z = startZ; z <= endZ; z += step) {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(startX, -1, z),
        new THREE.Vector3(endX, -1, z)
      ])
      const line = new THREE.Line(geometry, horizontalMaterial)
      line.renderOrder = -2 // Render behind other objects
      group.add(line)
    }
    
    // Vertical grid lines (every 20 feet for subtlety)
    const verticalStep = 20
    for (let x = startX; x <= endX; x += verticalStep) {
      for (let z = startZ; z <= endZ; z += verticalStep) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(x, -1, z),
          new THREE.Vector3(x, maxHeight, z)
        ])
        const line = new THREE.Line(geometry, verticalMaterial)
        line.renderOrder = -3 // Render furthest behind
        group.add(line)
      }
    }
    
    return group
  }, [centerX, centerY, size])

  return <primitive object={grid} />
}

function GroundPlane({ width, height }: { width: number; height: number }) {
  // Load concrete texture
  const concreteTexture = useLoader(THREE.TextureLoader, '/textures/materials/concrete/Textured Dark Concrete Surface.png')
  
  const material = useMemo(() => {
    // Configure texture tiling
    concreteTexture.wrapS = concreteTexture.wrapT = THREE.RepeatWrapping
    concreteTexture.repeat.set(width / 10, height / 10) // Tile every 10 feet
    
    return new THREE.MeshStandardMaterial({
      map: concreteTexture,
      roughness: 0.8,
      metalness: 0.1,
    })
  }, [concreteTexture, width, height])
  
  return (
    <mesh
      position={[width / 2, -0.1, height / 2]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      renderOrder={-1}
    >
      <planeGeometry args={[width + 20, height + 20]} />
      <primitive object={material} />
    </mesh>
  )
}

function ArrowHead({ position, rotation, color = '#ffffff' }: { position: [number, number, number]; rotation: [number, number, number]; color?: string }) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[0.3, 1.0]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

function DimensionLine({ 
  start, 
  end, 
  offset, 
  label, 
  color = '#ffffff' 
}: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  offset: number;
  label: string;
  color?: string;
}) {
  const lines = useMemo(() => {
    const [x1, y1, z1] = start
    const [x2, y2, z2] = end
    
    // Create dimension line with offset
    const lineY = Math.max(y1, y2) + offset
    
    // For measurements between beams, minimize extension lines
    const extensionHeight = offset < 0 ? 0.2 : 1
    
    return {
      // Short extension line from start point
      extensionLine1: [
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(x1, lineY + extensionHeight, z1)
      ],
      // Main dimension line
      mainLine: [
        new THREE.Vector3(x1, lineY, z1),
        new THREE.Vector3(x2, lineY, z2)
      ],
      // Short extension line to end point
      extensionLine2: [
        new THREE.Vector3(x2, y2, z2),
        new THREE.Vector3(x2, lineY + extensionHeight, z2)
      ]
    }
  }, [start, end, offset])

  const midPoint: [number, number, number] = useMemo(() => [
    (start[0] + end[0]) / 2,
    Math.max(start[1], end[1]) + offset,
    (start[2] + end[2]) / 2
  ], [start, end, offset])

  return (
    <group>
      {/* Extension line 1 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lines.extensionLine1.length}
            array={new Float32Array(lines.extensionLine1.flatMap(v => [v.x, v.y, v.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.6} transparent />
      </line>
      
      {/* Main dimension line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lines.mainLine.length}
            array={new Float32Array(lines.mainLine.flatMap(v => [v.x, v.y, v.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.8} transparent />
      </line>
      
      {/* Extension line 2 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={lines.extensionLine2.length}
            array={new Float32Array(lines.extensionLine2.flatMap(v => [v.x, v.y, v.z]))}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} opacity={0.6} transparent />
      </line>
      
      {/* Arrow heads */}
      <ArrowHead 
        position={[start[0], Math.max(start[1], end[1]) + offset, start[2]]} 
        rotation={[0, 0, Math.PI / 2]} 
        color={color}
      />
      <ArrowHead 
        position={[end[0], Math.max(start[1], end[1]) + offset, end[2]]} 
        rotation={[0, 0, -Math.PI / 2]} 
        color={color}
      />
      
      {/* Label */}
      <Html position={midPoint}>
        <div className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs font-light border border-gray-700 shadow-md pointer-events-none whitespace-nowrap">
          {label}
        </div>
      </Html>
    </group>
  )
}

function SimpleMeasurementLine({ 
  selectedObjects,
  distance,
  floorplan,
  measurementType 
}: { 
  selectedObjects: [string | null, string | null];
  distance: number | null;
  floorplan: FloorplanData;
  measurementType: 'horizontal' | 'vertical' | 'height' | 'direct';
}) {
  const [firstObjectId, secondObjectId] = selectedObjects
  
  if (!firstObjectId || !secondObjectId || distance === null) return null
  
  const firstElement = floorplan.elements.find(el => el.id === firstObjectId)
  const secondElement = floorplan.elements.find(el => el.id === secondObjectId)
  
  if (!firstElement || !secondElement) return null
  
  // Calculate object bounds for edge-to-edge measurements
  const firstBounds = {
    minX: firstElement.position.x,
    maxX: firstElement.position.x + firstElement.dimensions.width,
    minY: firstElement.position.y,
    maxY: firstElement.position.y + firstElement.dimensions.height,
    minZ: firstElement.position.z || 0,
    maxZ: (firstElement.position.z || 0) + (firstElement.dimensions.depth || 0)
  }
  
  const secondBounds = {
    minX: secondElement.position.x,
    maxX: secondElement.position.x + secondElement.dimensions.width,
    minY: secondElement.position.y,
    maxY: secondElement.position.y + secondElement.dimensions.height,
    minZ: secondElement.position.z || 0,
    maxZ: (secondElement.position.z || 0) + (secondElement.dimensions.depth || 0)
  }
  
  // Calculate center positions for reference
  const firstCenter = {
    x: firstElement.position.x + firstElement.dimensions.width / 2,
    y: firstElement.position.y + firstElement.dimensions.height / 2,
    z: (firstElement.position.z || 0) + (firstElement.dimensions.depth || 0) / 2
  }
  const secondCenter = {
    x: secondElement.position.x + secondElement.dimensions.width / 2,
    y: secondElement.position.y + secondElement.dimensions.height / 2,
    z: (secondElement.position.z || 0) + (secondElement.dimensions.depth || 0) / 2
  }
  
  // Calculate closest edge points for each measurement type
  let firstEdgePoint: [number, number, number]
  let secondEdgePoint: [number, number, number]
  
  switch (measurementType) {
    case 'horizontal':
      // Find closest X edges
      if (firstCenter.x < secondCenter.x) {
        firstEdgePoint = [firstBounds.maxX, firstCenter.y, firstCenter.z]
        secondEdgePoint = [secondBounds.minX, secondCenter.y, secondCenter.z]
      } else {
        firstEdgePoint = [firstBounds.minX, firstCenter.y, firstCenter.z]
        secondEdgePoint = [secondBounds.maxX, secondCenter.y, secondCenter.z]
      }
      break
      
    case 'vertical':
      // Find closest Y edges
      if (firstCenter.y < secondCenter.y) {
        firstEdgePoint = [firstCenter.x, firstBounds.maxY, firstCenter.z]
        secondEdgePoint = [secondCenter.x, secondBounds.minY, secondCenter.z]
      } else {
        firstEdgePoint = [firstCenter.x, firstBounds.minY, firstCenter.z]
        secondEdgePoint = [secondCenter.x, secondBounds.maxY, secondCenter.z]
      }
      break
      
    case 'height':
      // Find closest Z edges
      if (firstCenter.z < secondCenter.z) {
        firstEdgePoint = [firstCenter.x, firstBounds.maxZ, firstCenter.y]
        secondEdgePoint = [secondCenter.x, secondBounds.minZ, secondCenter.y]
      } else {
        firstEdgePoint = [firstCenter.x, firstBounds.minZ, firstCenter.y]
        secondEdgePoint = [secondCenter.x, secondBounds.maxZ, secondCenter.y]
      }
      break
      
    default:
      // For direct measurement, use centers
      firstEdgePoint = [firstCenter.x, firstCenter.z, firstCenter.y]
      secondEdgePoint = [secondCenter.x, secondCenter.z, secondCenter.y]
      break
  }
  
  // Calculate measurement line positions - keep it simple and clean
  let start: [number, number, number]
  let end: [number, number, number]
  let color: string
  let label: string
  
  const heightOffset = 4
  
  switch (measurementType) {
    case 'horizontal':
      // Horizontal line - between closest X edges
      const midY = (firstEdgePoint[1] + secondEdgePoint[1]) / 2
      start = [firstEdgePoint[0], heightOffset, midY]
      end = [secondEdgePoint[0], heightOffset, midY]
      color = '#00ffff' // Cyan for horizontal
      label = 'H'
      break
      
    case 'vertical':
      // Vertical line - between closest Y edges
      const midX = (firstEdgePoint[0] + secondEdgePoint[0]) / 2
      start = [midX, heightOffset, firstEdgePoint[2]]
      end = [midX, heightOffset, secondEdgePoint[2]]
      color = '#00ff66' // Green for vertical
      label = 'V'
      break
      
    case 'height':
      // Height line - between closest Z edges
      const heightMidX = (firstEdgePoint[0] + secondEdgePoint[0]) / 2
      const heightMidY = (firstEdgePoint[2] + secondEdgePoint[2]) / 2
      start = [heightMidX, firstEdgePoint[1], heightMidY]
      end = [heightMidX, secondEdgePoint[1], heightMidY]
      color = '#ff6600' // Orange for height
      label = 'Z'
      break
      
    case 'direct':
    default:
      // Direct 3D line - diagonal measurement
      start = [firstCenter.x, firstCenter.z + heightOffset, firstCenter.y]
      end = [secondCenter.x, secondCenter.z + heightOffset, secondCenter.y]
      color = '#ffffff' // White for direct
      label = 'D'
      break
  }
  
  const distanceFormatted = `${distance.toFixed(1)}ft`
  
  return (
    <group>
      {/* Main measurement line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([...start, ...end])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={4} />
      </line>
      
      {/* Distance label at midpoint */}
      <Html position={[
        (start[0] + end[0]) / 2,
        (start[1] + end[1]) / 2 + 1,
        (start[2] + end[2]) / 2
      ]}>
        <div 
          className={`px-4 py-2 rounded-lg text-xl font-bold border-2 shadow-xl whitespace-nowrap pointer-events-none ${
            measurementType === 'horizontal' ? 'bg-cyan-900 text-cyan-100 border-cyan-400' :
            measurementType === 'vertical' ? 'bg-green-900 text-green-100 border-green-400' :
            measurementType === 'height' ? 'bg-orange-900 text-orange-100 border-orange-400' :
            'bg-gray-900 text-white border-white'
          }`}
        >
          📏 {label}: {distanceFormatted}
        </div>
      </Html>
      
      {/* Clean extension lines showing the measurement relationship */}
      {measurementType !== 'direct' && (
        <>
          {/* Extension line from first object edge to measurement line */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  firstEdgePoint[0], firstEdgePoint[1], firstEdgePoint[2],
                  start[0], start[1], start[2]
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={color} opacity={0.6} transparent linewidth={1} />
          </line>
          
          {/* Extension line from second object edge to measurement line */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([
                  secondEdgePoint[0], secondEdgePoint[1], secondEdgePoint[2],
                  end[0], end[1], end[2]
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={color} opacity={0.6} transparent linewidth={1} />
          </line>
        </>
      )}
      
      {/* Measurement line endpoint markers */}
      <mesh position={start}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      <mesh position={end}>
        <sphereGeometry args={[0.15]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}


function SimpleGuideLines({ guides, bounds }: { 
  guides: Array<{
    type: 'horizontal' | 'vertical'
    position: number
    color: string
    elements: string[]
  }>,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
}) {
  if (guides.length === 0) return null
  
  return (
    <group>
      {guides.map((guide, index) => (
        <line key={index}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array(
                guide.type === 'vertical' 
                  ? [guide.position, 0.5, bounds.minY - 10, guide.position, 0.5, bounds.maxY + 10]
                  : [bounds.minX - 10, 0.5, guide.position, bounds.maxX + 10, 0.5, guide.position]
              )}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial 
            color={guide.color} 
            opacity={0.6} 
            transparent 
            linewidth={1}
          />
        </line>
      ))}
    </group>
  )
}

function BeamMeasurements({ floorplan }: { floorplan: FloorplanData }) {
  // Get all steel I-beams and sort by X position
  const beams = floorplan.elements
    .filter(el => el.material === 'steel' && el.type === 'fixture')
    .sort((a, b) => a.position.x - b.position.x)
  
  // Get wall positions
  const officeWall = floorplan.elements.find(el => el.id === 'wall-left')
  const farWall = floorplan.elements.find(el => el.id === 'wall-right')
  
  if (beams.length === 0) return null
  
  const firstBeam = beams[0]
  const lastBeam = beams[beams.length - 1]
  
  return (
    <group>
      {/* Office wall to first beam measurement */}
      {officeWall && firstBeam && (() => {
        const wallX = officeWall.position.x + officeWall.dimensions.width
        const beamCenter = getElementCenter(firstBeam)
        const distance = formatMeasurement(Math.abs(beamCenter[0] - wallX))
        const measurementY = beamCenter[1] + 5
        const midX = (wallX + beamCenter[0]) / 2
        
        return (
          <group key="office-wall-measurement">
            {/* Main measurement line */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    wallX, measurementY, beamCenter[2],
                    beamCenter[0], measurementY, beamCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#00ff00" linewidth={2} />
            </line>
            
            {/* Extension lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    wallX, 0, beamCenter[2],
                    wallX, measurementY + 0.5, beamCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#00ff00" opacity={0.6} transparent />
            </line>
            
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    beamCenter[0], beamCenter[1], beamCenter[2],
                    beamCenter[0], measurementY + 0.5, beamCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#00ff00" opacity={0.6} transparent />
            </line>
            
            {/* Arrow heads */}
            <mesh 
              position={[wallX, measurementY, beamCenter[2]]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <coneGeometry args={[0.2, 0.8]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            
            <mesh 
              position={[beamCenter[0], measurementY, beamCenter[2]]}
              rotation={[0, 0, -Math.PI / 2]}
            >
              <coneGeometry args={[0.2, 0.8]} />
              <meshBasicMaterial color="#00ff00" />
            </mesh>
            
            {/* Distance label */}
            <Html position={[midX, measurementY + 1, beamCenter[2]]}>
              <div className="bg-gray-800 text-green-300 px-2 py-0.5 rounded text-xs font-light border border-gray-700 shadow-md whitespace-nowrap">
                {distance}
              </div>
            </Html>
          </group>
        )
      })()}
      
      {/* Last beam to far wall measurement */}
      {farWall && lastBeam && (() => {
        const wallX = farWall.position.x
        const beamCenter = getElementCenter(lastBeam)
        const distance = formatMeasurement(Math.abs(wallX - beamCenter[0]))
        const measurementY = beamCenter[1] + 5
        const midX = (beamCenter[0] + wallX) / 2
        
        return (
          <group key="far-wall-measurement">
            {/* Main measurement line */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    beamCenter[0], measurementY, beamCenter[2],
                    wallX, measurementY, beamCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ff6600" linewidth={2} />
            </line>
            
            {/* Extension lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    beamCenter[0], beamCenter[1], beamCenter[2],
                    beamCenter[0], measurementY + 0.5, beamCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ff6600" opacity={0.6} transparent />
            </line>
            
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    wallX, 0, beamCenter[2],
                    wallX, measurementY + 0.5, beamCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ff6600" opacity={0.6} transparent />
            </line>
            
            {/* Arrow heads */}
            <mesh 
              position={[beamCenter[0], measurementY, beamCenter[2]]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <coneGeometry args={[0.2, 0.8]} />
              <meshBasicMaterial color="#ff6600" />
            </mesh>
            
            <mesh 
              position={[wallX, measurementY, beamCenter[2]]}
              rotation={[0, 0, -Math.PI / 2]}
            >
              <coneGeometry args={[0.2, 0.8]} />
              <meshBasicMaterial color="#ff6600" />
            </mesh>
            
            {/* Distance label */}
            <Html position={[midX, measurementY + 1, beamCenter[2]]}>
              <div className="bg-gray-800 text-orange-300 px-2 py-0.5 rounded text-xs font-light border border-gray-700 shadow-md whitespace-nowrap">
                {distance}
              </div>
            </Html>
          </group>
        )
      })()}
      
      {/* Beam-to-beam measurements */}
      {beams.length >= 2 && beams.slice(0, -1).map((beam, index) => {
        const nextBeam = beams[index + 1]
        const currentCenter = getElementCenter(beam)
        const nextCenter = getElementCenter(nextBeam)
        
        // Calculate distance between beam centers
        const distance = formatMeasurement(Math.abs(nextCenter[0] - currentCenter[0]))
        
        // Position measurement line above the beams
        const measurementY = Math.max(currentCenter[1], nextCenter[1]) + 3
        const midX = (currentCenter[0] + nextCenter[0]) / 2
        
        return (
          <group key={`beam-measurement-${index}`}>
            {/* Main measurement line */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    currentCenter[0], measurementY, currentCenter[2],
                    nextCenter[0], measurementY, nextCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" linewidth={2} />
            </line>
            
            {/* Extension lines */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    currentCenter[0], currentCenter[1], currentCenter[2],
                    currentCenter[0], measurementY + 0.5, currentCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </line>
            
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    nextCenter[0], nextCenter[1], nextCenter[2],
                    nextCenter[0], measurementY + 0.5, nextCenter[2]
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" opacity={0.6} transparent />
            </line>
            
            {/* Arrow heads */}
            <mesh 
              position={[currentCenter[0], measurementY, currentCenter[2]]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <coneGeometry args={[0.2, 0.8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            
            <mesh 
              position={[nextCenter[0], measurementY, nextCenter[2]]}
              rotation={[0, 0, -Math.PI / 2]}
            >
              <coneGeometry args={[0.2, 0.8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            
            {/* Distance label */}
            <Html position={[midX, measurementY + 1, currentCenter[2]]}>
              <div className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded text-xs font-light border border-gray-700 shadow-md whitespace-nowrap">
                {distance}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

function WallLabels3D({ floorplan }: { floorplan: FloorplanData }) {
  // Find the actual building walls
  const walls = floorplan.elements.filter(el => el.type === 'wall' && el.metadata?.category === 'exterior')
  
  if (walls.length === 0) return null
  
  const leftWall = walls.find(w => w.id === 'wall-left')
  const rightWall = walls.find(w => w.id === 'wall-right')
  const topWall = walls.find(w => w.id === 'wall-top')
  
  // Handle split bottom wall - find both segments
  const bottomWallLeft = walls.find(w => w.id === 'wall-bottom-left')
  const bottomWallRight = walls.find(w => w.id === 'wall-bottom-right')
  const bottomWall = walls.find(w => w.id === 'wall-bottom') // Fallback for unified bottom wall
  
  if (!leftWall || !rightWall || !topWall || (!bottomWall && (!bottomWallLeft || !bottomWallRight))) return null
  
  const buildingWidth = rightWall.position.x - leftWall.position.x + rightWall.dimensions.width
  
  // Calculate bottom wall position - use unified wall or leftmost segment of split wall
  const effectiveBottomWall = bottomWall || bottomWallLeft || bottomWallRight
  if (!effectiveBottomWall) return null
  
  const buildingHeight = topWall.position.y - effectiveBottomWall.position.y + topWall.dimensions.height
  const centerX = leftWall.position.x + buildingWidth / 2
  const centerY = effectiveBottomWall.position.y + buildingHeight / 2
  
  // Prominent directional labels positioned around the building
  // Building is now rotated: 88' 7/8" wide (East-West) x 198' long (North-South)
  // NORTH is where the dry room is located
  return (
    <>
      {/* NORTH - On the long side (198' long) - top end (DRY ROOM SIDE) */}
      <Html position={[centerX, 5, topWall.position.y + 25]}>
        <div className="text-white text-2xl font-bold pointer-events-none select-none opacity-90 drop-shadow-lg bg-gray-900 px-3 py-1 rounded">
          NORTH
        </div>
      </Html>
      
      {/* SOUTH - On the long side (198' long) - bottom end */}
      <Html position={[centerX, 5, effectiveBottomWall.position.y - 25]}>
        <div className="text-white text-2xl font-bold pointer-events-none select-none opacity-90 drop-shadow-lg bg-gray-900 px-3 py-1 rounded">
          SOUTH
        </div>
      </Html>
      
      {/* EAST - On the short side (88' 7/8" wide) - right side */}
      <Html position={[rightWall.position.x + 25, 5, centerY]}>
        <div className="text-white text-2xl font-bold pointer-events-none select-none opacity-90 drop-shadow-lg bg-gray-900 px-3 py-1 rounded">
          EAST
        </div>
      </Html>
      
      {/* WEST - On the short side (88' 7/8" wide) - left side */}
      <Html position={[leftWall.position.x - 25, 5, centerY]}>
        <div className="text-white text-2xl font-bold pointer-events-none select-none opacity-90 drop-shadow-lg bg-gray-900 px-3 py-1 rounded">
          WEST
        </div>
      </Html>
    </>
  )
}

function DimensionLabels({ floorplan }: { floorplan: FloorplanData }) {
  // Find the actual building walls to get real dimensions
  const walls = floorplan.elements.filter(el => el.type === 'wall' && el.metadata?.category === 'exterior')
  
  if (walls.length === 0) return null
  
  // Calculate actual building dimensions from wall positions
  const leftWall = walls.find(w => w.id === 'wall-left')
  const rightWall = walls.find(w => w.id === 'wall-right')
  const topWall = walls.find(w => w.id === 'wall-top')
  
  // Handle split bottom wall - find both segments
  const bottomWallLeft = walls.find(w => w.id === 'wall-bottom-left')
  const bottomWallRight = walls.find(w => w.id === 'wall-bottom-right')
  const bottomWall = walls.find(w => w.id === 'wall-bottom') // Fallback for unified bottom wall
  
  if (!leftWall || !rightWall || !topWall || (!bottomWall && (!bottomWallLeft || !bottomWallRight))) return null
  
  const buildingWidth = rightWall.position.x - leftWall.position.x + rightWall.dimensions.width
  
  // Calculate bottom wall position - use unified wall or leftmost segment of split wall
  const effectiveBottomWall = bottomWall || bottomWallLeft || bottomWallRight
  if (!effectiveBottomWall) return null
  
  const buildingHeight = topWall.position.y - effectiveBottomWall.position.y + topWall.dimensions.height
  const centerX = leftWall.position.x + buildingWidth / 2
  const centerY = effectiveBottomWall.position.y + buildingHeight / 2
  
  return (
    <>
      {/* Overall building dimensions - shows actual building size */}
      <Html position={[centerX, 15, centerY - 60]}>
        <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded text-sm font-medium border border-gray-700 shadow-md pointer-events-none whitespace-nowrap">
          Building: 198' × 88' 7/8" (12' walls)
        </div>
      </Html>
      

    </>
  )
}

function RoomLabels({ floorplan }: { floorplan: FloorplanData }) {
  // Find the room walls to determine room positions
  const roomWalls = floorplan.elements.filter(e => 
    e.type === 'wall' && 
    e.metadata?.category === 'room-walls' &&
    e.id.startsWith('room-wall-')
  )
  
  const hallwayWalls = floorplan.elements.filter(e =>
    e.type === 'wall' &&
    e.metadata?.category === 'room-walls' &&
    (e.id === 'hallway-wall-north' || e.id === 'hallway-wall-south')
  )
  
  // Check for room 1 divider walls
  const room1DividerWall = floorplan.elements.find(e =>
    e.type === 'wall' &&
    e.id === 'room-1-divider-wall'
  )
  
  const room1SecondDividerWall = floorplan.elements.find(e =>
    e.type === 'wall' &&
    e.id === 'room-1-second-divider-wall'
  )
  
  if (roomWalls.length === 0 || hallwayWalls.length === 0) return null
  
  const northHallwayWall = hallwayWalls.find(w => w.id === 'hallway-wall-north')
  const southHallwayWall = hallwayWalls.find(w => w.id === 'hallway-wall-south')
  
  if (!northHallwayWall || !southHallwayWall) return null
  
  // Get all walls that separate rooms (including firewall and regular room walls)
  const allSeparatorWalls = floorplan.elements.filter(e =>
    e.type === 'wall' && 
    (e.metadata?.category === 'room-walls' || e.metadata?.category === 'fire-safety') &&
    e.id.startsWith('room-wall-')
  ).sort((a, b) => b.position.y - a.position.y) // Sort north to south
  
  // Calculate room center positions
  const roomPositions = []
  
  // Handle North Side Dry Rooms - check for the two 10x33.5 dry rooms
  // Find the south dry room walls (dry-room-south)
  const southDryRoomWalls = floorplan.elements.filter(e =>
    e.type === 'wall' &&
    (e.metadata?.room_west === 'dry-room-south' || 
     e.metadata?.room_east === 'dry-room-south' ||
     e.metadata?.room_north === 'dry-room-south')
  )
  
  // Find the north dry room walls (dry-room-north)
  const northDryRoomWalls = floorplan.elements.filter(e =>
    e.type === 'wall' &&
    (e.metadata?.room_east === 'dry-room-north' ||
     e.metadata?.room_north === 'dry-room-north')
  )
  
  if (southDryRoomWalls.length > 0 && northDryRoomWalls.length > 0) {
    // We have the two dry rooms - label them as Dry 1 and Dry 2
    
    // Dry 1 (South dry room) - between y=198.0417 and y=208.5209
    const dry1CenterY = 198.0417 + (10.4792 / 2) // Center of the 10.4792' wide room
    const dry1CenterX = 76.875 + (33.5 / 2) // Center of the 33.5' long room
    roomPositions.push({ roomNumber: 'Dry 1', centerY: dry1CenterY, centerX: dry1CenterX })
    
    // Dry 2 (North dry room) - between y=211.5209 and y=222
    const dry2CenterY = 211.5209 + (10.4791 / 2) // Center of the 10.4791' wide room
    const dry2CenterX = 76.875 + (33.5 / 2) // Center of the 33.5' long room
    roomPositions.push({ roomNumber: 'Dry 2', centerY: dry2CenterY, centerX: dry2CenterX })
    
  } else if (room1DividerWall) {
    // Fallback to old logic if room divider walls exist
    const room1CenterY = (northHallwayWall.position.y + allSeparatorWalls[0].position.y) / 2
    const leftWall = floorplan.elements.find(e => e.id === 'longways-wall-left')
    const dividerX = room1DividerWall.position.x
    
    if (leftWall) {
      // Dry 1 (west side) - between left wall and first divider
      const dry1CenterX = (leftWall.position.x + leftWall.dimensions.width/2 + dividerX) / 2
      roomPositions.push({ roomNumber: 'Dry 1', centerY: room1CenterY, centerX: dry1CenterX })
      
      // Dry 2 positioning depends on whether there's a second divider wall
      if (room1SecondDividerWall) {
        // Dry 2 (middle section) - between first divider and second divider
        const secondDividerX = room1SecondDividerWall.position.x
        const dry2CenterX = (dividerX + secondDividerX) / 2
        roomPositions.push({ roomNumber: 'Dry 2', centerY: room1CenterY, centerX: dry2CenterX })
      } else {
        // Dry 2 (east side) - between divider and shortened north wall end
        const northWallEnd = northHallwayWall.position.x + northHallwayWall.dimensions.width
        const dry2CenterX = (dividerX + northWallEnd) / 2
        roomPositions.push({ roomNumber: 'Dry 2', centerY: room1CenterY, centerX: dry2CenterX })
      }
    }
  } else {
    // No dry rooms found - check if Room 1 exists as a single room
    const room1CenterY = (northHallwayWall.position.y + allSeparatorWalls[0].position.y) / 2
    roomPositions.push({ roomNumber: 'Room 1', centerY: room1CenterY })
  }
  
  // Rooms 2-7 - between consecutive separator walls
  for (let i = 0; i < allSeparatorWalls.length - 1; i++) {
    const centerY = (allSeparatorWalls[i].position.y + allSeparatorWalls[i + 1].position.y) / 2
    roomPositions.push({ roomNumber: i + 2, centerY })
  }
  
  // Room 8 (southernmost) - between last separator wall and south hallway wall
  const room8CenterY = (allSeparatorWalls[allSeparatorWalls.length - 1].position.y + southHallwayWall.position.y) / 2
  roomPositions.push({ roomNumber: 8, centerY: room8CenterY })
  
  // Default center X position (middle of the room area)
  const defaultRoomCenterX = 69.375 // Center of building width, same as I-beams
  
  return (
    <>
      {roomPositions.map((room, index) => {
        const centerX = room.centerX || defaultRoomCenterX
        return (
          <Html key={`room-${room.roomNumber}-${index}`} position={[centerX, 8, room.centerY]}>
            <div className="text-gray-300 text-2xl font-bold pointer-events-none select-none opacity-40 drop-shadow-lg">
              {room.roomNumber}
            </div>
          </Html>
        )
      })}
    </>
  )
}

function FirewallLabels({ floorplan }: { floorplan: FloorplanData }) {
  // Find firewall elements
  const firewalls = floorplan.elements.filter(e =>
    e.type === 'wall' && 
    e.metadata?.category === 'fire-safety' &&
    e.metadata?.firewall_marking === 'subtle'
  )
  
  if (firewalls.length === 0) return null
  
  return (
    <>
      {firewalls.map((firewall) => {
        // Position the label at the center of the firewall
        const centerX = firewall.position.x + firewall.dimensions.width / 2
        const centerY = firewall.position.y
        const centerZ = (firewall.dimensions.depth || 0) / 2 + 1 // Slightly above the wall
        
        return (
          <Html key={`firewall-${firewall.id}`} position={[centerX, centerZ, centerY]}>
            <div className="text-red-300 text-sm font-medium pointer-events-none select-none opacity-50 tracking-wider">
              FIREWALL
            </div>
          </Html>
        )
      })}
    </>
  )
}

// Support Truss Component for spanning east-west across building
function SupportTruss({ 
  position, 
  width, 
  height, 
  depth = 0.67,
  centerHeight = 14.046875, 
  exteriorHeight = 12,
  isCurved = true 
}: { 
  position: [number, number, number]; 
  width: number; 
  height: number; 
  depth?: number;
  centerHeight?: number;
  exteriorHeight?: number;
  isCurved?: boolean;
}) {
  
  // Calculate curve parameters
  const heightDrop = centerHeight - exteriorHeight // 2.046875'
  const beamThickness = depth // 8" thick beams
  
  // Create curved geometry for top and bottom chords
  // Trusses span east-west (X direction) and are positioned north-south (Z direction)
  // Heights are relative to the group position (0 = at group height)
  // BOTTOM chord connects to I-beam top at center, curves down to walls
  // TOP chord is parallel, maintaining truss height above bottom chord
  const createCurvedGeometry = (yOffset: number) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-width/2, 0 + yOffset, 0),  // Exterior height (relative to group at 12')
      new THREE.Vector3(-width/4, heightDrop * 0.75 + yOffset, 0),  // Mid-curve point
      new THREE.Vector3(0, heightDrop + yOffset, 0),  // Center peak (at I-beam top when yOffset=0)
      new THREE.Vector3(width/4, heightDrop * 0.75 + yOffset, 0),  // Mid-curve point
      new THREE.Vector3(width/2, 0 + yOffset, 0),  // Exterior height (relative to group at 12')
    ])
    return curve
  }
  
  const bottomCurve = createCurvedGeometry(0)  // Bottom chord follows the curve from 12' to 14.046875'
  const topCurve = createCurvedGeometry(height) // Top chord is height above bottom chord
  
  // Cross-member positions for cross pattern
  const crossMemberCount = 8
  const crossMembers: { position: [number, number, number]; height: number }[] = []
  
  for (let i = 0; i < crossMemberCount; i++) {
    const t = i / (crossMemberCount - 1)
    const x = -width/2 + t * width
    // Heights are now relative to group position
    // Bottom chord follows the curve, top chord is height above it
    const bottomY = isCurved ? heightDrop * (1 - 4 * Math.pow(t - 0.5, 2)) : heightDrop
    const topY = bottomY + height
    
    crossMembers.push({
      position: [x, (topY + bottomY) / 2, 0],
      height: Math.abs(topY - bottomY)
    })
  }
  
  return (
    <group position={position}>
      {/* Top chord - curved beam */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[topCurve, 32, beamThickness/2, 8, false]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Bottom chord - curved beam */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[bottomCurve, 32, beamThickness/2, 8, false]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Vertical web members */}
      {crossMembers.map((member, i) => (
        <mesh key={`vertical-${i}`} position={member.position as [number, number, number]} castShadow receiveShadow>
          <boxGeometry args={[0.15, member.height, 0.15]} />
          <meshStandardMaterial color="#34495e" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      
      {/* Cross-pattern diagonal members */}
      {crossMembers.slice(0, -1).map((member, i) => {
        const nextMember = crossMembers[i + 1]
        const startPos = member.position as [number, number, number]
        const endPos = nextMember.position as [number, number, number]
        
        // Calculate diagonal positions and rotations
        const midX = (startPos[0] + endPos[0]) / 2
        const midY = (startPos[1] + endPos[1]) / 2
        const length = Math.sqrt(Math.pow(endPos[0] - startPos[0], 2) + Math.pow(member.height, 2))
        const angle = Math.atan2(member.height, endPos[0] - startPos[0])
        
        return (
          <group key={`cross-${i}`}>
            {/* Diagonal up */}
            <mesh 
              position={[midX, midY, 0]} 
              rotation={[0, 0, angle]}
              castShadow receiveShadow
            >
              <boxGeometry args={[length, 0.1, 0.1]} />
              <meshStandardMaterial color="#7f1d1d" metalness={0.8} roughness={0.2} />
            </mesh>
            
            {/* Diagonal down */}
            <mesh 
              position={[midX, midY, 0]} 
              rotation={[0, 0, -angle]}
              castShadow receiveShadow
            >
              <boxGeometry args={[length, 0.1, 0.1]} />
              <meshStandardMaterial color="#7f1d1d" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        )
      })}
      
      {/* End connection plates - connect at bottom chord position (wall height) */}
      <mesh position={[-width/2, height/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, height + 0.5, 0.5]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[width/2, height/2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, height + 0.5, 0.5]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

function SteelTruss({ position, width, height, isCurved = true }: { position: [number, number, number]; width: number; height: number; isCurved?: boolean }) {
  // Create steel I-beam trusses - curved for main spans, straight for side walls
  const centerHeight = 0 // Position height at truss location
  const endHeightDrop = isCurved ? -2 : 0 // Drop 2' for curved trusses, 0 for straight
  
  // Create curved path maintaining 5' truss height throughout
  const createCurvedGeometry = (yOffset: number) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, centerHeight + yOffset, -width/2),
      new THREE.Vector3(0, centerHeight + yOffset, -width/4),  
      new THREE.Vector3(0, centerHeight + yOffset, 0),
      new THREE.Vector3(0, centerHeight + yOffset, width/4),
      new THREE.Vector3(0, centerHeight + yOffset, width/2)
    ], false, 'centripetal')
    
    // Apply curve only if curved truss, otherwise keep straight
    const points = curve.getPoints(50)
    const curvedPoints = isCurved ? points.map((point, i) => {
      const t = (i / (points.length - 1)) * 2 - 1 // -1 to 1
      const dropAmount = endHeightDrop * t * t // Parabolic curve
      return new THREE.Vector3(point.x, centerHeight + yOffset + dropAmount, point.z)
    }) : points.map(point => new THREE.Vector3(point.x, centerHeight + yOffset, point.z))
    
    return new THREE.CatmullRomCurve3(curvedPoints, false, 'centripetal')
  }
  
  // Create I-beam cross section shape
  const createIBeamShape = () => {
    const shape = new THREE.Shape()
    // Top flange
    shape.moveTo(-0.5, 0.4)
    shape.lineTo(0.5, 0.4)
    shape.lineTo(0.5, 0.2)
    shape.lineTo(0.1, 0.2)
    // Web
    shape.lineTo(0.1, -0.2)
    shape.lineTo(0.5, -0.2)
    // Bottom flange
    shape.lineTo(0.5, -0.4)
    shape.lineTo(-0.5, -0.4)
    shape.lineTo(-0.5, -0.2)
    shape.lineTo(-0.1, -0.2)
    // Complete web
    shape.lineTo(-0.1, 0.2)
    shape.lineTo(-0.5, 0.2)
    shape.closePath()
    return shape
  }
  
  const topCurve = createCurvedGeometry(0)
  const bottomCurve = createCurvedGeometry(-5) // Bottom chord maintains 5' truss height
  const iBeamShape = createIBeamShape()
  
  // Create extruded I-beam geometry along curves
  const extrudeSettings = {
    steps: 50,
    bevelEnabled: false,
    extrudePath: topCurve
  }
  
  const bottomExtrudeSettings = {
    steps: 50,
    bevelEnabled: false, 
    extrudePath: bottomCurve
  }
  
  return (
    <group position={position}>
      {/* Top curved I-beam chord */}
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[iBeamShape, extrudeSettings]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Bottom curved I-beam chord */}
      <mesh castShadow receiveShadow>
        <extrudeGeometry args={[iBeamShape, bottomExtrudeSettings]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Vertical web members at regular intervals */}
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i / 8) * 2 - 1 // -1 to 1
        const z = (t * width) / 2
        const dropAmount = isCurved ? endHeightDrop * t * t : 0
        const topY = centerHeight + dropAmount
        const bottomY = centerHeight - 5 + dropAmount // Maintain 5' truss height
        const webHeight = Math.abs(topY - bottomY)
        
        return (
          <mesh key={`web-${i}`} position={[0, (topY + bottomY) / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[0.2, webHeight, 0.2]} />
            <meshStandardMaterial color="#b91c1c" metalness={0.8} roughness={0.2} />
          </mesh>
        )
      })}
      
      {/* End mounting plates */}
      <mesh position={[0, (isCurved ? endHeightDrop : 0) - 2.25, -width/2]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.5, 1]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
      </mesh>
      
      <mesh position={[0, (isCurved ? endHeightDrop : 0) - 2.25, width/2]} castShadow receiveShadow>
        <boxGeometry args={[1, 0.5, 1]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Center mounting plate */}
      <mesh position={[0, -2.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.5, 2]} />
        <meshStandardMaterial color="#dc2626" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Legacy sample floorplan (kept for fallback compatibility)
const sampleFloorplan = MAIN_WAREHOUSE_MODEL

function Scene({ onCameraReady, snapPointsCache }: { onCameraReady: (camera: THREE.Camera) => void, snapPointsCache: any[] }) {
  const {
    currentFloorplan,
    selectedElements,
    toggleElementSelection,
    showMeasurements,
    measurementMode,
    selectedObjectsForMeasurement,
    measurementDistance,
    measurementType,
    selectObjectForMeasurement,
    dragGuides,
    firstPersonMode,
    isPlacing,
    placementTemplate,
    previewElement,
    snapPoints,
    activeSnapPoint,
    showSnapIndicators,
    loadCurrentModel,
    finalizePlacement,
    cancelPlacement,
    updatePreview,
    startElementEdit,
    isEditing,
    isDragging,
    startDrag,
    
    // Layer visibility
    isLayerVisible,
    updateLayerGroups,
    selectElementGroup
  } = useAppStore()

  // Initialize model on first render
  React.useEffect(() => {
    if (!currentFloorplan) {
      loadCurrentModel()
    }
  }, [currentFloorplan, loadCurrentModel])

  // ESC key handling moved to main ThreeRenderer component

  // Use sample data if no floorplan exists (fallback)
  const floorplan = currentFloorplan || sampleFloorplan
  
  // Combine real elements with preview element
  const allElements = React.useMemo(() => {
    const elements = [...floorplan.elements]
    if (previewElement) {
      elements.push(previewElement)
    }
    return elements
  }, [floorplan.elements, previewElement])

  return (
    <>
      {/* Camera capture for raycasting */}
      <CameraCapture onCameraReady={onCameraReady} />

      {/* Background 3D Grid */}
      <Background3DGrid 
        centerX={floorplan.dimensions.width / 2} 
        centerY={floorplan.dimensions.height / 2}
        size={300} // Smaller grid for smaller workspace
      />

      {/* Enhanced Lighting System for Realistic Rendering */}
      <EnhancedLighting 
        enableShadows={true} 
        quality="high" 
      />

      {/* Ground plane with concrete texture */}
      <GroundPlane 
        width={floorplan.dimensions.width} 
        height={floorplan.dimensions.height} 
      />



      {/* Floorplan elements */}
      {allElements.map((element) => {
        const isPreview = element.metadata?.isPreview === true
        const isSelected = selectedElements.includes(element.id) && !isPreview
        
        // Check if element should be visible based on layer visibility
        const shouldRender = (() => {
          // Always render preview elements
          if (isPreview) return true
          
          // Check if I-beam layer is hidden
          if (element.material === 'steel' && element.metadata?.beam_type === 'I-beam') {
            const visible = isLayerVisible('steel-ibeams')
            console.log(`🔍 I-beam ${element.id} visibility check: ${visible}`)
            return visible
          }
          
          // Check if Support Trusses layer is hidden
          if (element.material === 'steel' && element.metadata?.truss_type === 'support_truss') {
            const visible = isLayerVisible('support-trusses')
            console.log(`🔍 Support truss ${element.id} visibility check: ${visible}`)
            return visible
          }
          
          // Check if Room Walls layer is hidden
          if (element.metadata?.category === 'room-walls') {
            const visible = isLayerVisible('room-walls')
            console.log(`🔍 Room wall ${element.id} visibility check: ${visible}`)
            return visible
          }
          
          // Check category-based visibility
          const category = element.metadata?.category
          if (category && !isLayerVisible(`category-${category}`)) {
            console.log(`🔍 Element ${element.id} hidden by category-${category}`)
            return false
          }
          
          // Check type-based visibility
          if (!isLayerVisible(`type-${element.type}`)) {
            console.log(`🔍 Element ${element.id} hidden by type-${element.type}`)
            return false
          }
          
          return true
        })()
        
        if (!shouldRender) return null
        
        const handleSelect = () => {
          if (isPreview) return
          
          if (!measurementMode) {
            // Use group selection for I-beams, normal selection for others
            if (element.material === 'steel' && element.metadata?.beam_type === 'I-beam') {
              selectElementGroup(element.id)
            } else {
              toggleElementSelection(element.id)
            }
          } else {
            selectObjectForMeasurement(element.id)
          }
        }
        
        return (
        <FloorplanElementMesh
          key={element.id}
          element={element}
            isSelected={isSelected}
            onSelect={handleSelect}
          showMeasurements={showMeasurements}
            measurementMode={measurementMode && !isPreview}
          selectedObjectsForMeasurement={selectedObjectsForMeasurement}
          onMeasurementSelect={selectObjectForMeasurement}
          onStartEdit={startElementEdit}
          onStartDrag={startDrag}
          isEditing={isEditing}
          selectedElements={selectedElements}
          isDragging={isDragging}
        />
        )
      })}

      {/* Enhanced Snap Indicators - Using cached snap points for performance */}
      {isPlacing && (
        <SnapIndicators 
          snapPoints={snapPointsCache.map(sp => ({
            position: new THREE.Vector3(sp.position.x, sp.position.y || 0, sp.position.z),
            type: sp.type as any,
            confidence: sp.confidence,
            description: sp.description
          }))}
          activeSnapPoint={activeSnapPoint ? {
            position: new THREE.Vector3(activeSnapPoint.position.x, activeSnapPoint.position.y || 0, activeSnapPoint.position.z),
            type: activeSnapPoint.type as any,
            confidence: activeSnapPoint.confidence,
            description: activeSnapPoint.description
          } : null}
          showIndicators={showSnapIndicators && isPlacing}
        />
      )}

      {/* Trusses removed - building structure ready for custom additions */}

      {/* Dimension labels */}
      {showMeasurements && <DimensionLabels floorplan={floorplan} />}
      
      {/* 3D Wall Labels - Always visible */}
      <WallLabels3D floorplan={floorplan} />
      
      {/* Backup directional indicators using 3D text */}
      <group>
        {/* North indicator */}
        <mesh position={[69.375, 8, 247]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 5]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
        </mesh>
        <Html position={[69.375, 8, 247]}>
          <div className="text-white text-3xl font-bold pointer-events-none select-none">
            ↑ NORTH (DRY ROOM)
          </div>
        </Html>
        
        {/* South indicator */}
        <mesh position={[69.375, 8, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 5]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
        </mesh>
        <Html position={[69.375, 8, 1]}>
          <div className="text-white text-3xl font-bold pointer-events-none select-none">
            ↓ SOUTH
          </div>
        </Html>
        
        {/* East indicator */}
        <mesh position={[137.75, 8, 124]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 5]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
        </mesh>
        <Html position={[137.75, 8, 124]}>
          <div className="text-white text-3xl font-bold pointer-events-none select-none">
            → EAST
          </div>
        </Html>
        
        {/* West indicator */}
        <mesh position={[1, 8, 124]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 5]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
        </mesh>
        <Html position={[1, 8, 124]}>
          <div className="text-white text-3xl font-bold pointer-events-none select-none">
            ← WEST
          </div>
        </Html>
      </group>
      
      {/* Room number labels */}
      <RoomLabels floorplan={floorplan} />
      
      {/* Firewall labels */}
      <FirewallLabels floorplan={floorplan} />

      {/* Removed beam-to-beam measurements to clean up view */}

      {/* Simple measurement system */}
      {measurementMode && (
        <SimpleMeasurementLine 
          selectedObjects={selectedObjectsForMeasurement}
          distance={measurementDistance}
          floorplan={floorplan}
          measurementType={measurementType}
        />
      )}
      
      {/* Simple guide lines during drag */}
      {isDragging && dragGuides.length > 0 && (
        <SimpleGuideLines 
          guides={dragGuides}
          bounds={{
            minX: Math.min(...floorplan.elements.map(el => el.position.x)) - 20,
            maxX: Math.max(...floorplan.elements.map(el => el.position.x + el.dimensions.width)) + 20,
            minY: Math.min(...floorplan.elements.map(el => el.position.y)) - 20,
            maxY: Math.max(...floorplan.elements.map(el => el.position.y + el.dimensions.height)) + 20
          }}
        />
      )}
      

      {/* Camera controls - centered on rotated building */}
      {firstPersonMode ? (
        <FirstPersonControls 
          enabled={true}
          movementSpeed={25}
          mouseSensitivity={0.002}
          initialPosition={[69.375, 6, 124]} // Center of the rotated pad
          initialTarget={[69.375, 6, 124]}
        />
      ) : (
        <WASDOrbitControls
          target={[69.375, 0, 124]} // Center of the rotated pad (138.75/2, 248/2)
        />
      )}

      {/* Enhanced snap point indicators with alignment guides */}
      {isPlacing && showSnapIndicators && activeSnapPoint && (
        <group>
          <SnapPointIndicator
            position={[activeSnapPoint.position.x, 0.1, activeSnapPoint.position.z]}
            type={activeSnapPoint.type}
            isActive={true}
            confidence={activeSnapPoint.confidence}
          />
          
          {/* Alignment cross for precise positioning */}
          <group position={[activeSnapPoint.position.x, 0.05, activeSnapPoint.position.z]}>
            <mesh>
              <boxGeometry args={[3, 0.05, 0.1]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.6} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.1, 0.05, 3]} />
              <meshBasicMaterial color="#ef4444" transparent opacity={0.6} />
            </mesh>
          </group>
          
          {/* Connection line to target wall for perpendicular snaps */}
          {activeSnapPoint.type === 'wall-perpendicular' && activeSnapPoint.suggestedRotation !== undefined && (
            <mesh 
              position={[activeSnapPoint.position.x, 0.05, activeSnapPoint.position.z]}
              rotation={[0, activeSnapPoint.suggestedRotation, 0]}
            >
              <boxGeometry args={[2, 0.05, 0.05]} />
              <meshBasicMaterial color="#8b5cf6" transparent opacity={0.7} />
            </mesh>
          )}
        </group>
      )}
    </>
  )
}

// Optimized Snap Point Indicator Component
function SnapPointIndicator({ 
  position, 
  type, 
  isActive, 
  confidence 
}: { 
  position: [number, number, number]
  type: string
  isActive: boolean
  confidence: number
}) {
  // Use bright, crisp colors for better visibility
  const colors = {
    'wall-start': '#00ff00',        // Bright green
    'wall-end': '#00ff00',          // Bright green  
    'wall-middle': '#ffff00',       // Yellow for doors/windows
    'wall-gap': '#ff00ff',          // Magenta for intelligent gap filling
    'wall-perpendicular': '#00ffff', // Cyan for perpendicular connections
    'corner': '#ff8800',            // Orange for corner connections
    'grid': '#ffffff'               // White for grid
  }
  
  const color = colors[type as keyof typeof colors] || '#00ff00'
  const scale = type === 'wall-gap' ? 2.2 : 1.8 // Larger for gap filling
  
  return (
    <group position={position}>
      {/* Main snap indicator */}
      <mesh>
        <sphereGeometry args={[0.3 * scale, 16, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.9}
          depthTest={false}
        />
      </mesh>
      
      {/* Pulsing ring effect */}
      <mesh>
        <ringGeometry args={[0.4 * scale, 0.6 * scale, 16]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.4}
          depthTest={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Type-specific indicator */}
      {type.includes('wall') && (
        <mesh position={[0, 0.8, 0]}>
          <boxGeometry args={[0.1, 1.2, 0.1]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.6} 
            depthTest={false}
          />
        </mesh>
      )}
    </group>
  )
}

// Camera capture component to get camera reference
function CameraCapture({ onCameraReady }: { onCameraReady: (camera: THREE.Camera) => void }) {
  const { camera } = useThree()
  
  React.useEffect(() => {
    if (camera) {
      onCameraReady(camera)
    }
  }, [camera, onCameraReady])
  
  return null
}

export default function ThreeRenderer() {
  const { 
    isPlacing, 
    placementTemplate,
    placementRotation,
    placementDimensions,
    isRotationLocked,
    snapPoints,
    activeSnapPoint,
    showSnapIndicators,
    snapTolerance,
    finalizePlacement, 
    cancelPlacement, 
    updatePreview,
    updateSnapPoints,
    rotatePlacementElement,
    expandPlacementWall,
    currentFloorplan,
    selectedElements,
    copyElements,
    cutElements,
    pasteElements,
    hasClipboard,
    isEditing,
    editingElement,
    startElementEdit,
    updateElementEdit,
    finalizeElementEdit,
    cancelElementEdit,
    isDragging,
    dragStartPosition,
    dragCurrentPosition,
    updateDrag,
    finalizeDrag,
    cancelDrag,
    updateElement,
    startDrag,
    measurementMode,
    selectedObjectsForMeasurement,
    measurementDistance,
    measurementType,
    selectObjectForMeasurement,
    
    // Layer visibility
    hiddenLayers,
    layerGroups,
    isLayerVisible,
    updateLayerGroups,
    selectElementGroup
  } = useAppStore()

  // Refs for saving functionality
  const canvasRef = React.useRef<HTMLCanvasElement>()
  
  // Update layer groups when floorplan changes
  React.useEffect(() => {
    updateLayerGroups()
  }, [currentFloorplan, updateLayerGroups])
  
  // Screenshot and export functions
  const captureScreenshot = React.useCallback((
    filename: string = 'warehouse-render', 
    format: 'png' | 'jpeg' = 'png',
    quality: number = 1.0,
    width?: number,
    height?: number
  ) => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas not found for screenshot')
      return
    }

    try {
      // Create a temporary canvas for high-resolution export if needed
      let exportCanvas = canvas
      if (width && height && (width !== canvas.width || height !== canvas.height)) {
        exportCanvas = document.createElement('canvas')
        exportCanvas.width = width
        exportCanvas.height = height
        const ctx = exportCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, width, height)
        }
      }

      // Convert to blob and download
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create image blob')
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log(`📸 Screenshot saved: ${filename}.${format}`)
      }, mimeType, quality)
    } catch (error) {
      console.error('Screenshot capture failed:', error)
    }
  }, [])

  const exportModelAsJSON = React.useCallback((filename: string = 'warehouse-model') => {
    if (!currentFloorplan) {
      console.error('No floorplan to export')
      return
    }

    try {
      const exportData = {
        ...currentFloorplan,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        metadata: {
          exportSource: 'WarehouseCAD',
          totalElements: currentFloorplan.elements.length
        }
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`💾 Model exported: ${filename}.json`)
    } catch (error) {
      console.error('Model export failed:', error)
    }
  }, [currentFloorplan])

  // Expose functions globally for toolbar access
  React.useEffect(() => {
    (window as any).warehouseCAD = {
      captureScreenshot,
      exportModelAsJSON,
      editElement: startElementEdit
    }
  }, [captureScreenshot, exportModelAsJSON, startElementEdit])

  // Advanced placement manager
  const placementManagerRef = React.useRef<any>(null)

  // Callback to capture camera reference
  const handleCameraReady = React.useCallback((camera: THREE.Camera) => {
    cameraRef.current = camera
  }, [])

  // Initialize placement manager
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/lib/advanced-placement').then(({ AdvancedPlacementManager }) => {
        // We'll initialize this when we have camera and scene references
        placementManagerRef.current = AdvancedPlacementManager
      })
    }
  }, [])

  // Handle keyboard controls for placement and clipboard
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      console.log('Key pressed:', event.key, 'isPlacing:', isPlacing)
      
      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      // Handle clipboard operations first (work in any mode)
      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'c':
            if (selectedElements.length > 0) {
              event.preventDefault()
              event.stopPropagation()
              copyElements()
            }
            break
          case 'x':
            if (selectedElements.length > 0) {
              event.preventDefault()
              event.stopPropagation()
              cutElements()
            }
            break
          case 'v':
            if (hasClipboard()) {
              event.preventDefault()
              event.stopPropagation()
              // Smart paste positioning - use mouse position if available, otherwise default offset
              const basePosition = mouseRef.current 
                ? { x: mouseRef.current.x * 100, y: mouseRef.current.y * 100, z: 0 } // Convert normalized coords
                : { x: 20, y: 20, z: 0 } // Default offset
              pasteElements(basePosition)
            }
            break
        }
        return // Don't process other keys when Ctrl/Cmd is pressed
      }

      // Handle placement and editing controls
      if (isPlacing || isEditing) {
        // Handle rotation
        if (event.key.toLowerCase() === 'r') {
          event.preventDefault()
          event.stopPropagation()
          
          if (event.shiftKey) {
            console.log('Rotating counterclockwise')
            rotatePlacementElement('counterclockwise')
          } else {
            console.log('Rotating clockwise')
            rotatePlacementElement('clockwise')
          }
        }
        
        // Handle wall expansion
        if (event.key.toLowerCase() === 'e' && isPlacing) {
          event.preventDefault()
          event.stopPropagation()
          console.log('🔧 Expanding wall edge-to-edge')
          expandPlacementWall()
        }
        
        // Handle escape to cancel
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          if (isEditing) {
            console.log('Canceling element edit')
            cancelElementEdit()
          } else {
            console.log('Canceling placement')
            cancelPlacement()
          }
        }
        
        // Handle enter to confirm (editing mode only)
        if (isEditing && event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          console.log('Confirming element edit')
          finalizeElementEdit()
        }
      } else {
        // Handle edit shortcut when not in placement/editing mode
        if (event.key.toLowerCase() === 'e' && selectedElements.length === 1) {
          event.preventDefault()
          event.stopPropagation()
          const selectedElement = currentFloorplan?.elements.find(el => el.id === selectedElements[0])
          if (selectedElement) {
            console.log('Starting element edit via keyboard shortcut')
            startElementEdit(selectedElement)
          }
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isPlacing, isEditing, rotatePlacementElement, expandPlacementWall, cancelPlacement, cancelElementEdit, finalizeElementEdit, selectedElements, copyElements, cutElements, pasteElements, hasClipboard, currentFloorplan, startElementEdit])

  // Refs for Three.js objects
  const cameraRef = React.useRef<THREE.Camera>()
  const raycasterRef = React.useRef(new THREE.Raycaster())
  const mouseRef = React.useRef(new THREE.Vector2())
  const groundPlaneRef = React.useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  // Throttled mouse position for performance
  const lastMouseUpdate = React.useRef(0)
  const mouseThrottleMs = 16 // ~60fps

  // Intelligent wall system for smart snapping
  const intelligentWallSystem = React.useMemo(() => {
    console.log('Creating IntelligentWallSystem with snapTolerance:', snapTolerance)
    const system = new IntelligentWallSystem(snapTolerance)
    console.log('IntelligentWallSystem created:', system)
    return system
  }, [snapTolerance])
  


  // FAST pre-calculated snap points for all elements
  const snapPointsCache = React.useMemo(() => {
    if (!currentFloorplan?.elements || !isPlacing) return []
    
    const points: any[] = []
    
    // Generate snap points for all elements efficiently
    for (const element of currentFloorplan.elements) {
      if (element.metadata?.isPreview) continue
      
      if (element.type === 'wall') {
        const start = { x: element.position.x, z: element.position.y }
        const end = { 
          x: element.position.x + element.dimensions.width, 
          z: element.position.y + element.dimensions.height 
        }
        
        // Wall endpoints
        points.push(
          {
            position: { x: start.x, y: 0, z: start.z },
            type: 'wall-end',
            confidence: 0.9,
            description: `Wall start: ${element.id.slice(0, 8)}...`
          },
          {
            position: { x: end.x, y: 0, z: end.z },
            type: 'wall-end',
            confidence: 0.9,
            description: `Wall end: ${element.id.slice(0, 8)}...`
          }
        )
        
        // CENTER POINT - Highest priority
        const centerX = (start.x + end.x) / 2
        const centerZ = (start.z + end.z) / 2
        points.push({
          position: { x: centerX, y: 0, z: centerZ },
          type: 'wall-center',
          confidence: 0.98,
          description: `⭐ CENTERED on wall: ${element.id.slice(0, 8)}...`
        })
        
        // Quarter points
        const quarter1X = start.x + (end.x - start.x) * 0.25
        const quarter1Z = start.z + (end.z - start.z) * 0.25
        const quarter3X = start.x + (end.x - start.x) * 0.75
        const quarter3Z = start.z + (end.z - start.z) * 0.75
        
        points.push(
          {
            position: { x: quarter1X, y: 0, z: quarter1Z },
            type: 'wall-quarter',
            confidence: 0.85,
            description: `Quarter (25%) on wall: ${element.id.slice(0, 8)}...`
          },
          {
            position: { x: quarter3X, y: 0, z: quarter3Z },
            type: 'wall-quarter',
            confidence: 0.85,
            description: `Quarter (75%) on wall: ${element.id.slice(0, 8)}...`
          }
        )
      } else {
        // Center points for other elements
        points.push({
          position: { 
            x: element.position.x + element.dimensions.width / 2, 
            y: 0, 
            z: element.position.y + element.dimensions.height / 2 
          },
          type: 'element-center',
          confidence: 0.7,
          description: `Center of ${element.type}: ${element.id.slice(0, 8)}...`
        })
      }
    }

    console.log(`🚀 Fast cached ${points.length} snap points`)
    return points
  }, [currentFloorplan?.elements, isPlacing])

  // Optimized mouse movement handler - smooth and responsive
  const handlePointerMove = React.useCallback((event: any) => {
    // Handle dragging if active
    if (isDragging && cameraRef.current) {
      // Fast raycasting for drag updates
      const canvas = event.target
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      mouseRef.current.x = (x / rect.width) * 2 - 1
      mouseRef.current.y = -(y / rect.height) * 2 + 1

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

      const intersection = new THREE.Vector3()
      const hit = raycasterRef.current.ray.intersectPlane(groundPlaneRef.current, intersection)
      
      if (hit) {
        updateDrag({
          x: intersection.x,
          y: intersection.z, // Note: in our coordinate system, y is the ground plane
          z: intersection.y
        })
      }
      return
    }
    
    if (!isPlacing || !placementTemplate || !cameraRef.current) return

    // Optimized throttling for smooth response
    const now = Date.now()
    if (now - lastMouseUpdate.current < 8) return // ~120fps for smoother movement
    lastMouseUpdate.current = now

    // Fast raycasting
    const canvas = event.target
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    mouseRef.current.x = (x / rect.width) * 2 - 1
    mouseRef.current.y = -(y / rect.height) * 2 + 1

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

    const intersection = new THREE.Vector3()
    const hit = raycasterRef.current.ray.intersectPlane(groundPlaneRef.current, intersection)
    
    if (!hit) return

    const worldX = intersection.x
    const worldZ = intersection.z

    // Simple, reliable snap detection
    let activeSnapPoint = null

    // Snap detection optimized for performance

    // For walls, use enhanced intelligent wall system
    if (intelligentWallSystem && currentFloorplan && 
        (placementTemplate === 'EXTERIOR_WALL' || placementTemplate === 'INTERIOR_WALL' || placementTemplate === 'PARTITION_WALL')) {
      
      const wallElements = currentFloorplan.elements.filter(el => 
        el.type === 'wall' && !el.metadata?.isPreview
      )
      
      if (wallElements.length > 0) {
        const cursorPos = new THREE.Vector3(worldX, 0, worldZ)
        
        const intelligentSnapPoints = intelligentWallSystem.findWallSnapPoints(
          cursorPos,
          wallElements,
          placementDimensions
        )
        
        // Get best snap point with lower threshold for smoother snapping
        const bestIntelligentSnap = intelligentWallSystem.getBestSnapPoint(intelligentSnapPoints)
        
        if (bestIntelligentSnap && bestIntelligentSnap.confidence > 0.5) { // Higher threshold for precise snapping
          activeSnapPoint = {
            position: { 
              x: bestIntelligentSnap.position.x, 
              y: bestIntelligentSnap.position.y, 
              z: bestIntelligentSnap.position.z 
            },
            type: bestIntelligentSnap.type,
            confidence: bestIntelligentSnap.confidence,
            suggestedDimensions: bestIntelligentSnap.suggestedDimensions,
            suggestedRotation: bestIntelligentSnap.suggestedRotation,
            description: bestIntelligentSnap.description
          }
          
          // Rotation suggestions are now only applied in preview, not to actual placement rotation
          // This prevents overriding user's locked rotation choice
        }
      }
    }
    // For doors, use door-specific snapping
    else if (intelligentWallSystem && currentFloorplan && 
        (placementTemplate === 'SINGLE_DOOR' || placementTemplate === 'DOUBLE_DOOR')) {
      
      console.log('🚪 Using door placement system')
      
      const wallElements = currentFloorplan.elements.filter(el => 
        el.type === 'wall' && !el.metadata?.isPreview
      )
      
      if (wallElements.length > 0) {
        const cursorPos = new THREE.Vector3(worldX, 0, worldZ)
        const doorSnapPoints = intelligentWallSystem.findDoorSnapPoints(
          cursorPos,
          wallElements,
          placementDimensions
        )
        
        const bestDoorSnap = intelligentWallSystem.getBestSnapPoint(doorSnapPoints)
        
        if (bestDoorSnap && bestDoorSnap.confidence > 0.7) {
          console.log('🎯 DOOR SNAP ACTIVATED:', bestDoorSnap.description)
          activeSnapPoint = {
            position: { 
              x: bestDoorSnap.position.x, 
              y: bestDoorSnap.position.y, 
              z: bestDoorSnap.position.z 
            },
            type: bestDoorSnap.type,
            confidence: bestDoorSnap.confidence,
            suggestedDimensions: bestDoorSnap.suggestedDimensions,
            suggestedRotation: bestDoorSnap.suggestedRotation,
            description: bestDoorSnap.description
          }
          
          // Door rotation suggestions are applied only in preview, respecting rotation lock
        }
      }
    } else {
      console.log('❌ Intelligent wall system not active:', {
        hasSystem: !!intelligentWallSystem,
        hasFloorplan: !!currentFloorplan,
        isWallTemplate: ['EXTERIOR_WALL', 'INTERIOR_WALL', 'PARTITION_WALL'].includes(placementTemplate || '')
      })
    }
    
    // For non-walls OR if no wall snap found, use FAST snap detection
    if (!activeSnapPoint) {
      // Use pre-cached snap points for performance
      let minDistance = snapTolerance
      for (const snapPoint of snapPointsCache) {
        const distance = Math.sqrt(
          Math.pow(snapPoint.position.x - worldX, 2) + 
          Math.pow(snapPoint.position.z - worldZ, 2)
        )
        
        // Prioritize center snaps with distance bonus
        const adjustedDistance = snapPoint.type === 'wall-center' 
          ? distance * 0.3  // Make center snaps much easier to activate
          : snapPoint.type === 'wall-quarter'
          ? distance * 0.7  // Quarter points easier too
          : distance
        
        if (adjustedDistance < minDistance) {
          minDistance = adjustedDistance
          activeSnapPoint = snapPoint
        }
      }
    }

    // Grid snap as fallback
    const gridPosition = {
      x: Math.round(worldX),
      y: 0,
      z: Math.round(worldZ)
    }

    const finalPosition = activeSnapPoint 
      ? { x: activeSnapPoint.position.x, y: activeSnapPoint.position.z }
      : { x: gridPosition.x, y: gridPosition.z }

    // Fast preview element creation
    const { ELEMENT_TEMPLATES } = require('@/lib/element-tools')
    const template = ELEMENT_TEMPLATES[placementTemplate]
    if (!template) return

    // Use intelligent system suggestions or fallback to user dimensions
    let finalDimensions = activeSnapPoint?.suggestedDimensions || { ...placementDimensions }
    // PRESERVE USER ROTATION: Only use suggested rotation if rotation is not locked
    let finalRotation = isRotationLocked
      ? placementRotation  // Rotation is locked, always use user's choice
      : (activeSnapPoint?.suggestedRotation !== undefined 
          ? activeSnapPoint.suggestedRotation 
          : placementRotation)

    const previewElement = {
      id: 'preview-element',
      type: template.type,
      position: { x: finalPosition.x, y: finalPosition.y, z: 0 },
      dimensions: finalDimensions,
      color: template.defaultColor,
      material: template.material,
      rotation: finalRotation,
      metadata: {
        ...template.metadata,
        isPreview: true,
        snapType: activeSnapPoint?.type,
        snapDescription: activeSnapPoint?.description,
        isIntelligentSnap: !!activeSnapPoint?.suggestedDimensions
      }
    }
    
    console.log('Created preview element with final rotation:', finalRotation)

    // Update store efficiently
    updatePreview(previewElement)
    
    // Update snap points efficiently using cached data
    const currentSnapPoints = activeSnapPoint ? [activeSnapPoint] : [{
      position: gridPosition,
      type: 'grid',
      confidence: 0.5,
      description: `Grid: ${gridPosition.x}', ${gridPosition.z}'`
    }]
    
    updateSnapPoints(currentSnapPoints, activeSnapPoint)

  }, [isPlacing, placementTemplate, placementRotation, placementDimensions, isRotationLocked, snapPointsCache, snapTolerance, updatePreview, updateSnapPoints, currentFloorplan, isDragging, updateDrag])

  // Handle pointer up for drag finalization
  const handlePointerUp = React.useCallback((event: any) => {
    if (isDragging) {
      finalizeDrag()
    }
  }, [isDragging, finalizeDrag])

  // Keyboard shortcuts for drag operations and precise movement
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isDragging && event.key === 'Escape') {
        event.preventDefault()
        cancelDrag()
        return
      }
      
      // Arrow key movement for selected elements (when not in placement mode)
      if (!isPlacing && !isDragging && selectedElements.length > 0) {
        const moveDistance = event.shiftKey ? 10 : 1 // Shift for larger moves
        let deltaX = 0, deltaY = 0
        
        switch (event.key) {
          case 'ArrowLeft':
            deltaX = -moveDistance
            event.preventDefault()
            break
          case 'ArrowRight':
            deltaX = moveDistance
            event.preventDefault()
            break
          case 'ArrowUp':
            deltaY = -moveDistance
            event.preventDefault()
            break
          case 'ArrowDown':
            deltaY = moveDistance
            event.preventDefault()
            break
          default:
            return
        }
        
        // Move selected elements
        if (deltaX !== 0 || deltaY !== 0) {
          selectedElements.forEach(elementId => {
            const element = currentFloorplan?.elements.find(el => el.id === elementId)
            if (element) {
              updateElement(elementId, {
                position: {
                  x: element.position.x + deltaX,
                  y: element.position.y + deltaY,
                  z: element.position.z || 0
                }
              })
            }
          })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isDragging, cancelDrag, isPlacing, selectedElements, currentFloorplan, updateElement])



  // Handle click to place element
  const handleClick = React.useCallback((event: any) => {
    // Skip measurement handling - now handled directly by object clicks
    
    if (!isPlacing || !cameraRef.current) return

    // Use the active snap point if available
    if (activeSnapPoint) {
      finalizePlacement({ 
        x: activeSnapPoint.position.x, 
        y: activeSnapPoint.position.z, 
        z: 0 
      })
    } else {
      // Use raycasting for accurate positioning
      const canvas = event.target
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      
      // Convert to normalized device coordinates
      mouseRef.current.x = (x / rect.width) * 2 - 1
      mouseRef.current.y = -(y / rect.height) * 2 + 1

      // Update raycaster
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current)

      // Intersect with ground plane
      const intersection = new THREE.Vector3()
      const hit = raycasterRef.current.ray.intersectPlane(groundPlaneRef.current, intersection)
      
      if (hit) {
        const snappedX = Math.round(intersection.x)
        const snappedZ = Math.round(intersection.z)
        finalizePlacement({ x: snappedX, y: snappedZ, z: 0 })
      }
    }
  }, [isPlacing, activeSnapPoint, finalizePlacement])

  return (
    <div className="w-full h-full bg-gray-700">
      <Canvas
        camera={{
          position: [150, 100, 200], // View rotated building from Southeast corner
          fov: 60,
        }}
        shadows
        className="bg-gray-700"
        gl={{ 
          antialias: true,
          alpha: false 
        }}
        dpr={[1, 2]}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onCreated={({ gl }) => {
          // Store canvas reference for screenshots
          if (gl.domElement) {
            canvasRef.current = gl.domElement
          }
        }}
        onClick={handleClick}
        onPointerMissed={(event) => {
          // Measurement now handled by direct object clicks - no ground clicking needed
        }}
      >
        <Suspense fallback={
          <Html center>
            <div className="text-white text-lg">Loading 3D Scene...</div>
          </Html>
        }>
          <Scene onCameraReady={handleCameraReady} snapPointsCache={snapPointsCache} />
        </Suspense>
      </Canvas>
    </div>
  )
}
