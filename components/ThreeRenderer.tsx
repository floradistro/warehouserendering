'use client'

import React from 'react'
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { Suspense, useMemo, useRef, useEffect, useCallback, memo } from 'react'
import * as THREE from 'three'
import { FloorplanData, FloorplanElement, useAppStore } from '@/lib/store'
import { useMeasurementStore } from '@/lib/measurement/MeasurementStore'
import { IntelligentWallSystem } from '@/lib/intelligent-wall-system'
import { MAIN_WAREHOUSE_MODEL } from '@/lib/warehouse-models'
import { createDetailedIBCTote, createSimpleIBCTote } from '@/lib/ibc-tote-model'
import { createDetailedSpiralFeederTank, createSimpleSpiralFeederTank } from '@/lib/spiral-feeder-tank-model'
import { createDetailedNorwescoTank, createSimpleNorwescoTank } from '@/lib/norwesco-tank-model'
import { createDetailedEatonPanel, createSimpleElectricalPanel, createDetailed200APanel } from '@/lib/electrical-panel-model'
import { createWarehouseTJIJoist, createIJoist_11_7_8 } from '@/lib/tji-beam-model'
import { createFramedWallGroup, shouldShowFraming, shouldShowDrywall, updateFramingLOD, updateDrywallLOD, STANDARD_FRAMING_CONFIG, STANDARD_DRYWALL_CONFIG } from '@/lib/wall-framing-system'
import FirstPersonControls from './FirstPersonControls'
import SnapIndicators from './SnapIndicators'
import EnhancedLighting from './EnhancedLighting'
import { CameraController, CameraCapture } from '@/lib/core/CameraController'
// Professional measurement system imports  
import SimpleMeasurementDisplay from './SimpleMeasurementDisplay'
import SelectionIndicators from './SelectionIndicators'


// Temporary formatMeasurement function to avoid breaking existing code
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
import { SelectionBox } from '@/lib/core/SelectionManager'
import { initializeWarehouseCAD } from '@/lib/integration/WarehouseCADIntegration'
import { Background3DGrid } from '@/lib/core/RenderingUtils'

// WASD-enabled Orbit Controls - DEPRECATED: Use CameraController instead
function WASDOrbitControls({ target, ...props }: any) {
  const orbitRef = useRef<any>()
  const { camera } = useThree()
  const keysPressed = useRef<Set<string>>(new Set())
  const panSpeed = 2.0
  
  // Animation state for smooth target transitions
  const isAnimating = useRef(false)
  const animationStart = useRef(0)
  const startTarget = useRef(new THREE.Vector3())
  const endTarget = useRef(new THREE.Vector3())
  
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

  // Start smooth animation when target changes
  useEffect(() => {
    if (orbitRef.current && target) {
      const controls = orbitRef.current
      
      // Store starting target only
      startTarget.current.copy(controls.target)
      endTarget.current.set(target[0], target[1], target[2])
      

      
      // Start animation
      isAnimating.current = true
      animationStart.current = Date.now()
    }
  }, [target, camera])

  useFrame((state, delta) => {
    if (!orbitRef.current) return

    const controls = orbitRef.current
    const camera = state.camera
    
    // Handle smooth target focus animation with frame rate limiting
    if (isAnimating.current) {
      const elapsed = Date.now() - animationStart.current
      const duration = 800 // 0.8 second animation - much faster and smoother
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease out quadratic for smoother feel)
      const eased = 1 - Math.pow(1 - progress, 2)
      
      // Only interpolate target - let camera position stay where user left it
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget.current, endTarget.current, eased)
      
      // Apply smooth target transition
      controls.target.copy(currentTarget)
      controls.update()
      
      // End animation
      if (progress >= 1) {
        isAnimating.current = false
      }
      
      // Allow WASD movement during focus animation (don't return early)
    }
    
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
      // Zoom settings for smoother, more precise control
      zoomSpeed={0.5} // Reduced from default 1.0 for less sensitivity
      zoomToCursor={true} // Zoom towards cursor/touch point
      screenSpacePanning={false} // Keep panning in world space
      // Smooth zoom dampening
      enableDamping={true}
      dampingFactor={0.05}
      {...props}
    />
  )
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
  onToggleSelect: (id: string) => void
  showMeasurements: boolean
  // Legacy measurement props removed
  onStartEdit: (element: FloorplanElement) => void
  onStartDrag: (element: FloorplanElement, worldPosition: { x: number; y: number; z: number }) => void
  isEditing: boolean
  selectedElements: string[]
  isDragging: boolean
  measurementToolActive: boolean
}

const FloorplanElementMesh = memo(({ 
  element, 
  isSelected, 
  onSelect, 
  onToggleSelect,
  showMeasurements, 
  // Legacy measurement props removed
  onStartEdit,
  onStartDrag,
  isEditing,
  selectedElements,
  isDragging,
  showFraming = false,
  showDrywall = false,
  lockedTarget,
  measurementToolActive
}: FloorplanElementProps & { showFraming?: boolean, showDrywall?: boolean, lockedTarget: string | null }) => {
  // Load brick texture for walls
  const brickTexture = useLoader(THREE.TextureLoader, '/textures/materials/concrete/Brick/bricktexture.jpg')
  const concreteTexture = useLoader(THREE.TextureLoader, '/textures/materials/concrete/Textured Dark Concrete Surface.png')
  
  // Get camera for LOD calculations
  const { camera } = useThree()

  const isPreview = element.metadata?.isPreview === true

  const { geometry, material, framedWallGroup, iBeamGroup, tjiBeamGroup, railingGroup } = useMemo(() => {
    const { width, height, depth = 8 } = element.dimensions
    
    // Show structural framing for selected walls (structural skeleton as selection indicator)
    if (element.type === 'wall' && lockedTarget === element.id) {
      const wallPosition = new THREE.Vector3(
        element.position.x + width / 2,
        element.position.z || 0,
        element.position.y + height / 2
      )
      
      const framingConfig = { 
        ...STANDARD_FRAMING_CONFIG, 
        showFraming: true, // Show structural skeleton for selected element
        minLOD: 1000 // Always show structural skeleton when selected, regardless of distance
      }
      
      const framedWall = createFramedWallGroup(element, framingConfig)
      
      // Add bright pink outline to all structural elements
      framedWall.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Create bright pink outline material
          const outlineMaterial = new THREE.MeshBasicMaterial({
            color: '#FF1493', // Deep pink/bright magenta
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.8
          })
          
          // Create outline geometry (slightly larger)
          const outlineGeometry = child.geometry.clone()
          outlineGeometry.scale(1.05, 1.05, 1.05)
          
          // Create outline mesh
          const outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
          outline.position.copy(child.position)
          outline.rotation.copy(child.rotation)
          outline.scale.copy(child.scale)
          
          // Add outline to the same parent
          if (child.parent) {
            child.parent.add(outline)
          }
        }
      })

      
      return {
        geometry: null,
        material: null,
        framedWallGroup: framedWall,
        iBeamGroup: null,
        tjiBeamGroup: null
      }
    }
    
    // Show framing/drywall for walls when toggles are enabled
    if (element.type === 'wall' && (showFraming || showDrywall) && lockedTarget !== element.id) {
      const isWallSelected = isSelected
      
      // Check if this is an exterior brick wall
      const isExteriorWall = element.metadata?.category === 'exterior' || 
                            element.material === 'brick' ||
                            element.metadata?.material_type === 'brick' ||
                            ['wall-bottom', 'wall-top', 'wall-left', 'wall-right', 'wall-bottom-left', 'wall-bottom-right'].includes(element.id)
      
      // Check if this wall should have drywall
      const shouldShowDrywallOnThisWall = showDrywall && !isExteriorWall && 
                                          (element.metadata?.material_type === 'drywall' || 
                                           element.metadata?.category === 'interior' ||
                                           (!element.metadata?.material_type && !isExteriorWall))
      

      
      const framingConfig = { 
        ...STANDARD_FRAMING_CONFIG, 
        showFraming: showFraming || false,
        minLOD: 1000 // Always show when toggle is on, regardless of distance
      }
      
      const drywallConfig = shouldShowDrywallOnThisWall ? {
        ...STANDARD_DRYWALL_CONFIG,
        showDrywall: true,
        minLOD: 1000 // Show at all distances for debugging
      } : undefined
      
      const framedWall = createFramedWallGroup(element, framingConfig, isWallSelected, drywallConfig)
      
      return {
        geometry: null,
        material: null,
        framedWallGroup: framedWall,
        iBeamGroup: null,
        tjiBeamGroup: null
      }
    }
    
    // Show structural skeleton for selected steel I-beams
    if (element.material === 'steel' && element.type === 'fixture' && lockedTarget === element.id) {

      
      // Create enhanced I-beam with visible structural details
      const iBeamGroup = new THREE.Group()
      
      // Create steel material with enhanced visibility for selection
      const structuralSteelMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#4682B4'), // Steel blue for structural visibility
        metalness: 0.9,
        roughness: 0.1,
        transparent: false,
        wireframe: true // Show wireframe for structural skeleton effect
      })
      
      // Enhanced I-beam geometry with structural details
      const { width: beamWidth, height: beamHeight, depth: beamLength = 20 } = element.dimensions
      
      // Main I-beam body (web)
      const webGeometry = new THREE.BoxGeometry(0.5, beamLength, beamHeight - 1)
      const web = new THREE.Mesh(webGeometry, structuralSteelMaterial)
      web.position.set(0, 0, 0)
      iBeamGroup.add(web)
      
      // Top flange
      const flangeGeometry = new THREE.BoxGeometry(beamWidth, beamLength, 0.75)
      const topFlange = new THREE.Mesh(flangeGeometry, structuralSteelMaterial)
      topFlange.position.set(0, 0, (beamHeight - 0.75) / 2)
      iBeamGroup.add(topFlange)
      
      // Bottom flange  
      const bottomFlange = new THREE.Mesh(flangeGeometry, structuralSteelMaterial)
      bottomFlange.position.set(0, 0, -(beamHeight - 0.75) / 2)
      iBeamGroup.add(bottomFlange)
      
      // Add structural connection details
      const connectionGeometry = new THREE.SphereGeometry(0.25, 8, 8)
      const connectionMaterial = new THREE.MeshStandardMaterial({
        color: '#FF6600', // Orange for connection points
        metalness: 0.8,
        roughness: 0.3
      })
      
      // Connection points at beam ends
      for (let i = 0; i < 2; i++) {
        const connection = new THREE.Mesh(connectionGeometry, connectionMaterial)
        connection.position.set(0, (i - 0.5) * (beamLength - 2), 0)
        iBeamGroup.add(connection)
      }
      
      // Add bright pink outline to all steel structural elements
      iBeamGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Create bright pink outline material
          const outlineMaterial = new THREE.MeshBasicMaterial({
            color: '#FF1493', // Deep pink/bright magenta
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.9
          })
          
          // Create outline geometry (slightly larger)
          const outlineGeometry = child.geometry.clone()
          outlineGeometry.scale(1.08, 1.08, 1.08)
          
          // Create outline mesh
          const outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
          outline.position.copy(child.position)
          outline.rotation.copy(child.rotation)
          outline.scale.copy(child.scale)
          
          // Add outline to the group
          iBeamGroup.add(outline)
        }
      })
      
      return {
        geometry: null,
        material: null,
        framedWallGroup: null,
        iBeamGroup: iBeamGroup,
        tjiBeamGroup: null
      }
    }
    
    // Show structural skeleton for selected tanks and totes (wireframe structural view)
    if ((element.id.includes('ibc-tote') || element.id.includes('tank')) && lockedTarget === element.id) {

      
      const containerGroup = new THREE.Group()
      const { width: containerWidth, height: containerHeight, depth: containerDepth = containerWidth } = element.dimensions
      
      // Create wireframe structural material
      const structuralMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color('#2E8B57'), // Sea green for tank structure
        metalness: 0.7,
        roughness: 0.3,
        wireframe: true, // Show structural wireframe
        transparent: true,
        opacity: 0.9
      })
      
      // Main container structure (wireframe)
      const containerGeometry = new THREE.CylinderGeometry(
        containerWidth / 2, containerWidth / 2, containerHeight, 16
      )
      const containerMesh = new THREE.Mesh(containerGeometry, structuralMaterial)
      containerGroup.add(containerMesh)
      
      // Add structural ribs for tanks
      if (element.id.includes('tank')) {
        const ribMaterial = new THREE.MeshStandardMaterial({
          color: '#FF6600', // Orange for structural ribs
          metalness: 0.8,
          roughness: 0.2
        })
        
        // Horizontal ribs
        for (let i = 0; i < 4; i++) {
          const ribGeometry = new THREE.TorusGeometry(containerWidth / 2, 0.15, 8, 16)
          const rib = new THREE.Mesh(ribGeometry, ribMaterial)
          rib.position.y = -containerHeight / 2 + (i + 1) * (containerHeight / 5)
          containerGroup.add(rib)
        }
        
        // Base support ring
        const baseGeometry = new THREE.CylinderGeometry(containerWidth / 2 + 0.5, containerWidth / 2 + 0.5, 0.5, 16)
        const base = new THREE.Mesh(baseGeometry, ribMaterial)
        base.position.y = -containerHeight / 2
        containerGroup.add(base)
      }
      
      // Add connection points for IBC totes
      if (element.id.includes('ibc-tote')) {
        const connectionMaterial = new THREE.MeshStandardMaterial({
          color: '#4169E1', // Royal blue for connections
          metalness: 0.9,
          roughness: 0.1
        })
        
        // Corner connection points
        const corners = [
          [-containerWidth/3, containerHeight/3, -containerDepth/3],
          [containerWidth/3, containerHeight/3, -containerDepth/3],
          [-containerWidth/3, containerHeight/3, containerDepth/3],
          [containerWidth/3, containerHeight/3, containerDepth/3],
        ]
        
        corners.forEach(([x, y, z]) => {
          const connectionGeometry = new THREE.SphereGeometry(0.3, 8, 8)
          const connection = new THREE.Mesh(connectionGeometry, connectionMaterial)
          connection.position.set(x, y, z)
          containerGroup.add(connection)
        })
      }
      
      // Add bright pink outline to all tank/tote structural elements
      containerGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Create bright pink outline material
          const outlineMaterial = new THREE.MeshBasicMaterial({
            color: '#FF1493', // Deep pink/bright magenta
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.85
          })
          
          // Create outline geometry (slightly larger)
          const outlineGeometry = child.geometry.clone()
          outlineGeometry.scale(1.06, 1.06, 1.06)
          
          // Create outline mesh
          const outline = new THREE.Mesh(outlineGeometry, outlineMaterial)
          outline.position.copy(child.position)
          outline.rotation.copy(child.rotation)
          outline.scale.copy(child.scale)
          
          // Add outline to the container group
          containerGroup.add(outline)
        }
      })
      
      return {
        geometry: null,
        material: null,
        framedWallGroup: containerGroup,
        iBeamGroup: null,
        tjiBeamGroup: null
      }
    }
    
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
        framedWallGroup: null,
        iBeamGroup,
        tjiBeamGroup: null
      }
    }
    
    // Handle TJI I-Joist beams with detailed geometry
    if (element.material === 'tji_beam' && element.metadata?.equipment_type === 'tji_ijoist') {
      const { width, height, depth } = element.dimensions
      
      // Debug logging
      console.log(`Creating TJI beam ${element.id}:`)
      console.log(`  Dimensions: width=${width}, height=${height}, depth=${depth}`)
      console.log(`  Position: x=${element.position.x}, y=${element.position.y}, z=${element.position.z}`)
      
      // Create detailed TJI beam geometry directly in warehouse coordinates
      const tjiBeamGroup = new THREE.Group()
      
      // In warehouse model:
      // width = 0.125' (1.5" beam width)
      // height = 149.375' (beam length running north-south)
      // depth = 0.99' (11.875" beam depth)
      
      // Match the standard geometry pattern: BoxGeometry(width, depth, height)
      // In warehouse coords: width=X, depth=Y (vertical), height=Z
      // For TJI beams: width=0.125', height=149.375' (length), depth=0.99' (vertical)
      // So we need: BoxGeometry(width, depth, height) = (0.125, 0.99, 149.375)
      
      // Materials - Much darker colors for better visibility
      const osbMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4A3C28, // Dark brown OSB color (much darker)
        roughness: 0.8,
        metalness: 0.0
      })
      
      const lumberMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x6B5D54, // Dark lumber color (darker brown-gray)
        roughness: 0.9,
        metalness: 0.0
      })
      
      // Flange dimensions
      const flangeThickness = (depth || 12) * 0.127 // About 1.5" thick flanges
      const webThickness = width * 0.25     // 3/8" web thickness
      
      // Create OSB web (vertical thin plate in center of beam)
      // Using same pattern as standard geometry: (width, depth, height)
      const webGeometry = new THREE.BoxGeometry(
        webThickness,                // width: Very thin (3/8")
        (depth || 12) - 2 * flangeThickness, // depth: Beam depth minus flanges
        height                       // height: Full beam length (north-south)
      )
      const web = new THREE.Mesh(webGeometry, osbMaterial)
      web.name = 'OSB_Web'
      web.castShadow = true
      web.receiveShadow = true
      tjiBeamGroup.add(web)
      
      // Create top flange (lumber) - horizontal piece at top
      const topFlangeGeometry = new THREE.BoxGeometry(
        width,            // width: Full beam width (1.5")
        flangeThickness,  // depth: Flange thickness
        height           // height: Full beam length
      )
      const topFlange = new THREE.Mesh(topFlangeGeometry, lumberMaterial)
      topFlange.position.y = ((depth || 12) - flangeThickness) / 2  // Position at top (Y is vertical in Three.js)
      topFlange.name = 'Top_Flange'
      topFlange.castShadow = true
      topFlange.receiveShadow = true
      tjiBeamGroup.add(topFlange)
      
      // Create bottom flange (lumber) - horizontal piece at bottom
      const bottomFlangeGeometry = new THREE.BoxGeometry(
        width,            // width: Full beam width (1.5")
        flangeThickness,  // depth: Flange thickness
        height           // height: Full beam length
      )
      const bottomFlange = new THREE.Mesh(bottomFlangeGeometry, lumberMaterial)
      bottomFlange.position.y = -((depth || 12) - flangeThickness) / 2  // Position at bottom
      bottomFlange.name = 'Bottom_Flange'
      bottomFlange.castShadow = true
      bottomFlange.receiveShadow = true
      tjiBeamGroup.add(bottomFlange)
      
      // Set group name and metadata
      tjiBeamGroup.name = 'TJI_Beam_Warehouse'
      tjiBeamGroup.userData = {
        type: 'TJI_I_Joist',
        material: 'OSB_Web_with_Lumber_Flanges',
        dimensions: { width, height, depth }
      }
      
      console.log(`  Created TJI beam group with ${tjiBeamGroup.children.length} components`)
      
      return {
        geometry: null, // We'll use the group instead
        material: null,
        framedWallGroup: null,
        iBeamGroup: null,
        tjiBeamGroup
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
        // Configure concrete texture for interior walls
        concreteTexture.wrapS = concreteTexture.wrapT = THREE.RepeatWrapping
        concreteTexture.repeat.set(element.dimensions.width / 8, element.dimensions.height / 8)
        
        // Muted off-white drywall for interior walls with texture
        standardMaterial = new THREE.MeshStandardMaterial({
          map: isPreview ? null : concreteTexture,
          color: isPreview ? new THREE.Color('#4ade80') : new THREE.Color('#f5f5f0'),
          roughness: 0.85,
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
    } else if (element.material === 'tji_beam') {
      // TJI beam material - OSB brown color for engineered lumber
      standardMaterial = new THREE.MeshStandardMaterial({
        color: isPreview ? new THREE.Color('#4ade80') : new THREE.Color(element.color || '#D2B48C'),
        roughness: 0.8,
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

    // Create detailed railing geometry for safety railings
    if (element.metadata?.category === 'safety_railing' && element.metadata?.detailed_rendering) {
      const railingGroup = new THREE.Group()
      const { width, height, depth } = element.dimensions
      
      // Materials
      const steelMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 })
      const galvanizedMaterial = new THREE.MeshLambertMaterial({ color: 0x8A9BA8 })
      
      // Railing specifications from metadata
      const postSpacing = (element.metadata?.post_spacing || 60) / 12 // Convert inches to feet
      const railDiameter = (element.metadata?.rail_diameter || 1.5) / 12 // Convert to feet
      const postDiameter = (element.metadata?.post_diameter || 2) / 12 // Convert to feet
      const topHeight = depth // 42" = 3.5'
      const midHeight = (element.metadata?.mid_rail_height || 21) / 12 // 21" = 1.75'
      const toeHeight = (element.metadata?.toe_kick_height || 4) / 12 // 4" = 0.33'
      
      // Number of posts along the railing
      const numPosts = Math.ceil(height / postSpacing) + 1
      
      // Create posts
      for (let i = 0; i < numPosts; i++) {
        const postGeometry = new THREE.CylinderGeometry(postDiameter/2, postDiameter/2, topHeight || depth || 3.5, 8)
        const post = new THREE.Mesh(postGeometry, galvanizedMaterial)
        post.position.set(0, (topHeight || depth || 3.5)/2, (i * postSpacing) - (height/2))
        post.castShadow = true
        railingGroup.add(post)
        
        // Base plate
        const plateGeometry = new THREE.BoxGeometry(0.5, 0.04, 0.5) // 6"x6"x0.5"
        const plate = new THREE.Mesh(plateGeometry, galvanizedMaterial)
        plate.position.set(0, -0.02, (i * postSpacing) - (height/2))
        plate.castShadow = true
        railingGroup.add(plate)
      }
      
      // Top rail (running north-south along the catwalk)
      const topRailGeometry = new THREE.CylinderGeometry(railDiameter/2, railDiameter/2, height, 8)
      const topRail = new THREE.Mesh(topRailGeometry, steelMaterial)
      topRail.rotation.x = Math.PI / 2
      topRail.position.set(0, topHeight || depth || 3.5, 0)
      topRail.castShadow = true
      railingGroup.add(topRail)
      
      // Mid rail
      const midRailGeometry = new THREE.CylinderGeometry(railDiameter/2, railDiameter/2, height, 8)
      const midRail = new THREE.Mesh(midRailGeometry, steelMaterial)
      midRail.rotation.x = Math.PI / 2
      midRail.position.set(0, midHeight, 0)
      midRail.castShadow = true
      railingGroup.add(midRail)
      
      // Toe kick
      const toeGeometry = new THREE.BoxGeometry(0.02, toeHeight, height) // 1/4" thick
      const toeKick = new THREE.Mesh(toeGeometry, steelMaterial)
      toeKick.position.set(0, toeHeight/2, 0)
      toeKick.castShadow = true
      railingGroup.add(toeKick)
      
      return {
        geometry: null,
        material: null,
        framedWallGroup: null,
        iBeamGroup: null,
        tjiBeamGroup: null,
        railingGroup
      }
    }
    
    return {
      geometry: standardGeometry,
      material: standardMaterial,
      framedWallGroup: null,
      iBeamGroup: null,
      tjiBeamGroup: null,
      railingGroup: null
    }
  }, [element, brickTexture, lockedTarget, camera.position.x, camera.position.y, camera.position.z])

  const position = useMemo(() => {
    const { x, y, z = 0 } = element.position
    
    // Special positioning for detailed railings
    if (element.metadata?.category === 'safety_railing') {
      // Railings positioned at their start point, extending upward
      return [x, z + (element.dimensions.depth || 3.5) / 2, y + element.dimensions.height / 2] as [number, number, number]
    }
    
    // Special positioning for catwalks and elevated platforms
    if (element.metadata?.category === 'catwalk') {
      // Platforms and catwalks should be positioned at their specified z elevation
      return [x + element.dimensions.width / 2, z, y + element.dimensions.height / 2] as [number, number, number]
    }
    
    // Special positioning for roof panels (they sit on top of trusses)
    if (element.metadata?.category === 'roof') {
      // Roof panels follow the same curve as trusses but positioned at the TOP of the trusses
      // Positioned at the exterior height where the top of the truss is
      return [x + element.dimensions.width / 2, z, y] as [number, number, number] // Use z from model as height
    }
    
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
    
    // Special positioning for TJI beams (horizontal structural beams)
    if (element.material === 'tji_beam' && element.metadata?.equipment_type === 'tji_ijoist') {
      // TJI beams are positioned at their start point, need to center them
      // Position: [x-position, z-height+depth/2, y-start+length/2] in Three.js coordinates
      return [x, z + (element.dimensions.depth || 12) / 2, y + element.dimensions.height / 2] as [number, number, number]
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

  // Legacy measurement selection logic removed

  // Handle double-click for selection, editing or measurement
  const handleDoubleClick = (e: any) => {
    e.stopPropagation()
    
    // Disable object selection when measurement tool is active
    if (measurementToolActive) {
      return
    }
    
    // Check if Shift key is held for multi-select
    const isShiftPressed = e.shiftKey || e.nativeEvent?.shiftKey
    
    if (isShiftPressed) {
      // Multi-select: toggle this element's selection
      onToggleSelect(element.id)
    } else {
      // Single select: replace selection with this element
      onSelect(element.id)
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

  // Handle signage fixtures with text rendering
  if (element.type === 'fixture' && element.metadata?.category === 'signage') {
    return (
      <group 
        position={position}
        rotation={[0, element.rotation || 0, 0]}
        userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        {/* Sign backing plate */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[
            element.dimensions.width,
            element.dimensions.depth || 0.05,
            element.dimensions.height
          ]} />
          <meshStandardMaterial 
            color={element.color || '#6b7280'} 
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
        
        {/* Sign text using Html component */}
        <Html
          position={[0, 0.03, 0]} // Slightly in front of the sign
          center
          style={{
            width: `${element.dimensions.width * 50}px`,
            pointerEvents: 'none'
          }}
        >
          <div style={{
            padding: '4px 8px',
            backgroundColor: element.color || '#6b7280',
            color: element.metadata?.text_color || '#ffffff',
            fontSize: '16px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            textAlign: 'center',
            borderRadius: '2px',
            whiteSpace: 'nowrap'
          }}>
            {element.metadata?.text || 'SIGN'}
          </div>
        </Html>
        
        {(isSelected || false) && (
          <SelectionBox dimensions={element.dimensions} color={false ? '#ffff00' : '#ff0000'} />
        )}
      </group>
    )
  }

  // Handle roof panels with curved geometry
  if (element.metadata?.category === 'roof') {
    return (
      <group 
        position={position}
        rotation={[0, element.rotation || 0, 0]}
        userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        {/* Metal Roof Panel - Curved to match trusses */}
        <RoofPanel 
          position={[0, 0, 0]}
          width={element.dimensions.width}
          height={element.dimensions.height}
          depth={element.dimensions.depth || 0.05}
          centerHeight={element.metadata?.center_height || 14.046875}
          exteriorHeight={element.metadata?.exterior_height || 12}
          isCurved={element.metadata?.curved_profile || true}
        />
        
        {(isSelected || false) && (
          <SelectionBox dimensions={element.dimensions} color={false ? '#ffff00' : '#ff0000'} />
        )}
      </group>
    )
  }



  // Handle steel fixtures (I-beams and support trusses) rendering differently
  if (element.material === 'steel' && element.type === 'fixture') {
    // Support Truss rendering (cross trusses)
    if (element.metadata?.truss_type === 'support_truss') {
      return (
        <group 
          position={position}
          rotation={[0, element.rotation || 0, 0]}
          userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}
  
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={(e: any) => {
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
          
          {(isSelected || false) && (
            <SelectionBox dimensions={element.dimensions} color={false ? '#ffff00' : '#ff0000'} />
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
  
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={(e: any) => {
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
          
          {(isSelected || false) && (
            <SelectionBox dimensions={element.dimensions} color={false ? '#ffff00' : '#ff0000'} />
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
          userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}
  
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={(e: any) => {
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
        
        {(isSelected || false) && (
          <mesh position={[0, element.dimensions.depth! / 2, 0]}>
            <boxGeometry args={[1.4, element.dimensions.depth! + 0.2, 1.0]} />
            <meshBasicMaterial
              color={
                false && false
                  ? false
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

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        
        {(isSelected || false) && (
          <mesh position={[0, 1.915, 0]}> {/* Center at half height (3.83/2) */}
            <boxGeometry args={[4.2, 4.03, 3.53]} /> {/* Slightly larger than actual */}
            <meshBasicMaterial
              color={
                false && false
                  ? false
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

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        
        {(isSelected || false) && (
          <mesh position={[0, 5.335, 0]}> {/* Center at half height (10.67/2) */}
            <cylinderGeometry args={[3.2, 3.2, 11, 16]} /> {/* Slightly larger than actual */}
            <meshBasicMaterial
              color={
                false && false
                  ? false
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

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        
        {(isSelected || false) && (
          <mesh position={[0, 3.335, 0]}> {/* Center at half height (6.67/2) */}
            <cylinderGeometry args={[2.8, 2.8, 7, 16]} /> {/* Slightly larger than actual */}
            <meshBasicMaterial
              color={
                false && false
                  ? false
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

  // Handle Electrical Panel rendering
  if (element.material === 'electrical_panel' || 
      (element.metadata?.equipment_type === 'electrical_panel')) {
    
    const electricalPanelModel = useMemo(() => {
      // Use detailed model for 3D view, simple for 2D
      const is2D = false // viewMode not available in this component yet
      
      if (is2D) {
        return createSimpleElectricalPanel()
      } else {
        return createDetailedEatonPanel({
          circuitBreakers: element.metadata?.circuit_breakers || 42,
          busType: element.metadata?.bus_type || 'copper',
          finish: element.metadata?.finish || 'gray',
          enclosureType: element.metadata?.enclosure_type || 'surface'
        })
      }
    }, [element.metadata])
    
    return (
      <group 
        position={[
          element.position.x + element.dimensions.width / 2, // Center of panel
          element.position.z || 0, // Use z position for elevation if provided  
          element.position.y + (element.dimensions.depth || 0.05) / 2 // Center depth-wise (panel faces into room)
        ]}
        rotation={[0, (element.rotation || 0) * Math.PI / 180, 0]}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        <primitive object={electricalPanelModel} />
        
        {(isSelected || false) && (
          <mesh position={[0, 3.5, 0]}> {/* Center at half height (7'/2) */}
            <boxGeometry args={[element.dimensions.width, element.dimensions.height, element.dimensions.depth]} />
            <meshBasicMaterial
              color={isSelected ? "#22c55e" : "#3b82f6"}
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

  // Handle 200A Electrical Panel rendering
  if (element.material === 'electrical_panel_200a' || 
      (element.metadata?.equipment_type === 'electrical_panel_200a')) {
    
    const electricalPanel200AModel = useMemo(() => {
      // Use detailed model for 3D view, simple for 2D
      const is2D = false // viewMode not available in this component yet
      
      if (is2D) {
        return createSimpleElectricalPanel()
      } else {
        return createDetailed200APanel({
          circuitBreakers: element.metadata?.circuit_breakers || 24,
          busType: element.metadata?.bus_type || 'copper',
          finish: element.metadata?.finish || 'gray',
          enclosureType: element.metadata?.enclosure_type || 'surface'
        })
      }
    }, [element.metadata])
    
    return (
      <group 
        position={[
          element.position.x + element.dimensions.width / 2, // Center of panel
          element.position.z || 0, // Use z position for elevation if provided  
          element.position.y + (element.dimensions.depth || 0.05) / 2 // Center depth-wise (panel faces into room)
        ]}
        rotation={[0, (element.rotation || 0) * Math.PI / 180, 0]}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        <primitive object={electricalPanel200AModel} />
        
        {(isSelected || false) && (
          <mesh position={[0, 1.67, 0]}> {/* Center at half height (3.33'/2) */}
            <boxGeometry args={[element.dimensions.width, element.dimensions.height, element.dimensions.depth]} />
            <meshBasicMaterial
              color={isSelected ? "#22c55e" : "#3b82f6"}
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



  // Handle framed walls
  if (framedWallGroup) {
    return (
      <group
        position={position}
        rotation={[0, element.rotation || 0, 0]}
        userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        <primitive object={framedWallGroup} />
        
        {/* Dragging visual feedback for framed walls */}
        {isDragging && selectedElements.includes(element.id) && (
          <mesh
            geometry={new THREE.BoxGeometry(element.dimensions.width, element.dimensions.depth || 8, element.dimensions.height || 1)}
          >
            <meshBasicMaterial
              color="#4ade80" // Green for dragging
              transparent
              opacity={0.5}
              depthTest={false}
            />
          </mesh>
        )}
      </group>
    )
  }

  // Handle I-beam groups
  if (iBeamGroup) {
    return (
      <group
        position={position}
        rotation={[0, element.rotation || 0, 0]}
        userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        <primitive object={iBeamGroup} />
        
        {/* Dragging visual feedback for I-beams */}
        {isDragging && selectedElements.includes(element.id) && (
          <mesh
            geometry={new THREE.BoxGeometry(element.dimensions.width, element.dimensions.depth || 8, element.dimensions.height || 1)}
          >
            <meshBasicMaterial
              color="#4ade80" // Green for dragging
              transparent
              opacity={0.5}
              depthTest={false}
            />
          </mesh>
        )}
      </group>
    )
  }

  // Handle detailed railing groups
  if (railingGroup) {
    return (
      <group
        position={position}
        rotation={[0, element.rotation || 0, 0]}
        userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        <primitive object={railingGroup} />
        
        {/* Dragging visual feedback for railings */}
        {isDragging && selectedElements.includes(element.id) && (
          <mesh
            geometry={new THREE.BoxGeometry(element.dimensions.width, element.dimensions.depth || 3.5, element.dimensions.height || 1)}
          >
            <meshBasicMaterial
              color="#4ade80" // Green for dragging
              transparent
              opacity={0.3}
              depthTest={false}
            />
          </mesh>
        )}
      </group>
    )
  }

  // Handle TJI beam groups
  if (tjiBeamGroup) {
    return (
      <group
        position={position}
        rotation={[0, element.rotation || 0, 0]}
        userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        <primitive object={tjiBeamGroup} />
        
        {/* Dragging visual feedback for TJI beams */}
        {isDragging && selectedElements.includes(element.id) && (
          <mesh
            geometry={new THREE.BoxGeometry(element.dimensions.width, element.dimensions.depth || 8, element.dimensions.height || 1)}
          >
            <meshBasicMaterial
              color="#4ade80" // Green for dragging
              transparent
              opacity={0.5}
              depthTest={false}
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
        userData={{ id: element.id, dimensions: element.dimensions, ...element.metadata }}

        onDoubleClick={handleDoubleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={(e: any) => {
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
        {/* Selection highlighting */}
        {isSelected && !isDragging && (
          <meshBasicMaterial
            color="#0e639c" // Blue selection highlight
            transparent
            opacity={0.3}
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
})



// Background3DGrid function removed - using imported version from RenderingUtils

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
      receiveShadow={true}
      castShadow={false}
      renderOrder={-1}
    >
      <planeGeometry args={[width + 20, height + 20]} />
      <primitive object={material} />
    </mesh>
  )
}

// Room-specific floor component for white epoxy flooring
function RoomFloor({ 
  position, 
  width, 
  height, 
  material = 'white-epoxy' 
}: { 
  position: [number, number, number]; 
  width: number; 
  height: number;
  material?: string;
}) {
  const floorMaterial = useMemo(() => {
    if (material === 'white-epoxy') {
      return new THREE.MeshStandardMaterial({
        color: '#e8e8e5', // Muted off-white with less brightness
        roughness: 0.2, // Slightly less reflective
        metalness: 0.0,
        transparent: false,
        opacity: 1.0,
      })
    }
    
    if (material === 'black-gloss-epoxy') {
      return new THREE.MeshStandardMaterial({
        color: '#0a0a0a', // Deep black with slight warmth
        roughness: 0.05, // Ultra-smooth, highly reflective gloss epoxy
        metalness: 0.1, // Slight metallic sheen for glossiness
        transparent: false,
        opacity: 1.0,
      })
    }
    
    // Default concrete material
    return new THREE.MeshStandardMaterial({
      color: '#6b7280',
      roughness: 0.8,
      metalness: 0.1,
    })
  }, [material])
  
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow={true}
      castShadow={false}
      renderOrder={0} // Above ground plane
    >
      <planeGeometry args={[width, height]} />
      <primitive object={floorMaterial} />
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
          className={`px-2 py-1 rounded text-xs font-medium border whitespace-nowrap pointer-events-none select-none opacity-80 backdrop-blur-sm ${
            measurementType === 'horizontal' ? 'bg-gray-800/80 text-cyan-400 border-cyan-600/50' :
            measurementType === 'vertical' ? 'bg-gray-800/80 text-green-400 border-green-600/50' :
            measurementType === 'height' ? 'bg-gray-800/80 text-orange-400 border-orange-600/50' :
            'bg-gray-800/80 text-gray-400 border-gray-600/50'
          }`}
        >
          {label}: {distanceFormatted}
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
  
  // Subtle directional labels positioned around the building - VS Code theme
  // Building is now rotated: 88' 7/8" wide (East-West) x 198' long (North-South)
  // NORTH side of the warehouse
  return (
    <>
      {/* NORTH - On the long side (198' long) - top end */}
      <Html position={[centerX, 5, topWall.position.y + 25]}>
        <div className="text-gray-400 text-sm font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
          NORTH
        </div>
      </Html>
      
      {/* SOUTH - On the long side (198' long) - bottom end */}
      <Html position={[centerX, 5, effectiveBottomWall.position.y - 25]}>
        <div className="text-gray-400 text-sm font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
          SOUTH
        </div>
      </Html>
      
      {/* EAST - On the short side (88' 7/8" wide) - right side */}
      <Html position={[rightWall.position.x + 25, 5, centerY]}>
        <div className="text-gray-400 text-sm font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
          EAST
        </div>
      </Html>
      
      {/* WEST - On the short side (88' 7/8" wide) - left side */}
      <Html position={[leftWall.position.x - 25, 5, centerY]}>
        <div className="text-gray-400 text-sm font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
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
        <div className="text-gray-400 text-xs font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm whitespace-nowrap">
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
  
  // Find exterior walls to use as boundaries instead of missing hallway walls
  const northWall = floorplan.elements.find(e => e.id === 'wall-top')
  const southWall = floorplan.elements.find(e => e.id === 'wall-bottom-left' || e.id === 'wall-bottom-right')
  
  if (roomWalls.length === 0 || !northWall || !southWall) return null
  
  // Get all walls that separate rooms (including firewall and regular room walls)
  const allSeparatorWalls = floorplan.elements.filter(e =>
    e.type === 'wall' && 
    (e.metadata?.category === 'room-walls' || e.metadata?.category === 'fire-safety') &&
    e.id.startsWith('room-wall-')
  ).sort((a, b) => b.position.y - a.position.y) // Sort north to south
  
  if (allSeparatorWalls.length === 0) return null
  
  // Calculate room center positions
  const roomPositions = []
  
  // Control Room (northernmost) - no number displayed, handled by AreaLabels
  // Skip adding control room to roomPositions since it shouldn't be numbered
  
  // Room 2 = "Veg" - between first and second separator walls, but only west section
  if (allSeparatorWalls.length > 1) {
    const vegCenterY = (allSeparatorWalls[0].position.y + allSeparatorWalls[1].position.y) / 2
    // Position Veg label in the western section (stops at first divider wall x=82.75)
    const vegCenterX = (37.0625 + 82.75) / 2 // Center between west longway wall and first divider
    roomPositions.push({ roomNumber: 'Veg', centerY: vegCenterY, centerX: vegCenterX })
    
    // Add Dry 1 label in the middle section (between x=82.75 and x=94.75)
    const dry1CenterX = (82.75 + 94.75) / 2
    roomPositions.push({ roomNumber: 'Dry 1', centerY: vegCenterY, centerX: dry1CenterX })
    
    // Add Dry 2 label in the eastern section (between x=94.75 and x=106.75)
    const dry2CenterX = (94.75 + 106.75) / 2
    roomPositions.push({ roomNumber: 'Dry 2', centerY: vegCenterY, centerX: dry2CenterX })
  }
  
  // Room 3 = "Flower 1" - between second and third separator walls
  if (allSeparatorWalls.length > 2) {
    const flower1CenterY = (allSeparatorWalls[1].position.y + allSeparatorWalls[2].position.y) / 2
    roomPositions.push({ roomNumber: 'Flower 1', centerY: flower1CenterY })
  }
  
  // Rooms 4-8 = "Flower 2" through "Flower 6" - remaining rooms going west (south)
  for (let i = 2; i < allSeparatorWalls.length - 1; i++) {
    const centerY = (allSeparatorWalls[i].position.y + allSeparatorWalls[i + 1].position.y) / 2
    const flowerNumber = i // Flower 2 starts at i=2, Flower 3 at i=3, etc.
    roomPositions.push({ roomNumber: `Flower ${flowerNumber}`, centerY })
  }
  
  // Southernmost room = "Flower 6" - between last separator wall and south exterior wall
  if (allSeparatorWalls.length > 0) {
    const southWallY = southWall.position.y
    const lastFlowerCenterY = (allSeparatorWalls[allSeparatorWalls.length - 1].position.y + southWallY) / 2
    const lastFlowerNumber = allSeparatorWalls.length - 1 // Should be 6 for Flower 6
    roomPositions.push({ roomNumber: `Flower ${lastFlowerNumber}`, centerY: lastFlowerCenterY })
  }
  
  // Default center X position (middle of the room area)
  const defaultRoomCenterX = 69.375 // Center of building width, same as I-beams
  
  return (
    <>
      {roomPositions.map((room, index) => {
        const centerX = room.centerX || defaultRoomCenterX
        return (
          <Html key={`room-${room.roomNumber}-${index}`} position={[centerX, 2, room.centerY]} center>
            <div className="text-gray-300 text-xs font-medium pointer-events-none select-none bg-gray-800/95 px-2 py-1 rounded border border-gray-600/40 backdrop-blur-sm shadow-sm font-mono tracking-wide">
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
            <div className="text-red-400 text-xs font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-red-600/50 backdrop-blur-sm tracking-wider">
              FIREWALL
            </div>
          </Html>
        )
      })}
    </>
  )
}

function AreaLabels({ floorplan }: { floorplan: FloorplanData }) {
  // Define area labels for different zones in the warehouse
  const areas = [
    {
      id: 'control-room',
      name: 'Control Room',
      // Northwest corner area - in front of IBC/water tanks
      // From west wall (x=25) to east wall (x=112.75), from Room 2 north wall (y=198) to north wall (y=222) - expanded control area
      centerX: 68.875, // Center between x=25 and x=112.75: (25 + 112.75) / 2 = 68.875
      centerY: 210, // Center between y=198 and y=222: (198 + 222) / 2 = 210
      centerZ: 6 // Elevated for visibility
    }
  ]
  
  return (
    <>
      {areas.map((area) => (
        <Html key={`area-${area.id}`} position={[area.centerX, 2, area.centerY]} center>
          <div className="text-gray-300 text-xs font-medium pointer-events-none select-none bg-gray-800/95 px-2 py-1 rounded border border-gray-600/40 backdrop-blur-sm shadow-sm font-mono tracking-wide">
            {area.name}
          </div>
        </Html>
      ))}
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



function RoofPanel({ 
  position, 
  width, 
  height, 
  depth = 0.05,
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
  
  // Calculate curve parameters - same as trusses for perfect fit
  const heightDrop = centerHeight - exteriorHeight // 2.046875'
  
  // Create curved surface geometry that sits exactly on top of truss top chord
  // Roof panels span east-west (X direction) and north-south (Z direction, which is our height param)
  const createRoofSurface = () => {
    const widthSegments = 32 // East-west segments
    const heightSegments = 16 // North-south segments
    
    const geometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments)
    
    // Apply curve to the roof surface if curved - matches the TOP chord of trusses
    if (isCurved) {
      const vertices = geometry.attributes.position.array
      
      // Iterate through vertices and apply curve
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i] // East-west position (-width/2 to width/2)
        const z = vertices[i + 2] // North-south position (our element's height direction)
        
        // Calculate normalized position for curve (-1 to 1)
        const t = x / (width / 2) // -1 to 1 across width
        
        // Apply same curve formula as trusses top chord
        // This puts the roof surface exactly on the top chord curve
        const curveHeight = heightDrop * (1 - Math.pow(t, 2)) // Parabolic curve matching trusses
        vertices[i + 1] = curveHeight // Y is height in Three.js - sits exactly on top chord
      }
      
      geometry.attributes.position.needsUpdate = true
      geometry.computeVertexNormals() // Recalculate normals for proper lighting
    }
    
    return geometry
  }
  
  const roofGeometry = createRoofSurface()
  
  return (
    <group position={position}>
      {/* Main roof panel surface */}
      <mesh 
        geometry={roofGeometry} 
        castShadow 
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]} // Rotate to be horizontal (plane starts vertical)
      >
        <meshStandardMaterial 
          color="#708090" // Steel gray
          metalness={0.9} // High metalness for metal roofing
          roughness={0.1} // Low roughness for shiny metal
          side={THREE.DoubleSide} // Visible from both sides
        />
      </mesh>
      
      {/* Optional corrugation effect - thin ridges running north-south */}
      {Array.from({ length: Math.floor(width / 3) }, (_, i) => {
        const x = -width/2 + (i + 1) * 3 // Every 3 feet
        // Calculate ridge height to follow curve
        const t = x / (width / 2) // Normalized position (-1 to 1)
        const ridgeHeight = isCurved ? heightDrop * (1 - Math.pow(t, 2)) : 0
        
        return (
          <mesh
            key={`ridge-${i}`}
            position={[x, ridgeHeight, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            castShadow
          >
            <boxGeometry args={[0.1, height, 0.02]} />
            <meshStandardMaterial 
              color="#5a6b7a" // Slightly darker for ridges
              metalness={0.9}
              roughness={0.15}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// Legacy sample floorplan (kept for fallback compatibility)
const sampleFloorplan = MAIN_WAREHOUSE_MODEL

function Scene({ onCameraReady, snapPointsCache, showFraming, showDrywall, cameraTarget, lockedTarget, measurementToolActive }: { 
  onCameraReady: (camera: THREE.Camera) => void, 
  snapPointsCache: any[], 
  showFraming: boolean,
  showDrywall: boolean,
  cameraTarget: [number, number, number],
  lockedTarget: string | null,
  measurementToolActive: boolean
}) {
  const {
    currentFloorplan,
    selectedElements,
    toggleElementSelection,
    selectElementWithSnap,
    showMeasurements,
    // Legacy measurement variables removed
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

  // Initialize model on first render only
  const [isInitialized, setIsInitialized] = React.useState(false)
  
  React.useEffect(() => {
    if (!isInitialized) {
      console.log('🔄 Loading current model...')
      loadCurrentModel()
      setIsInitialized(true)
    }
  }, [isInitialized, loadCurrentModel])
  


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
        size={300}
      />

      {/* Enhanced Lighting System for Realistic Rendering */}
      <EnhancedLighting 
        enableShadows={true} 
        quality="ultra" 
      />

      {/* Ground plane with concrete texture */}
      <GroundPlane 
        width={floorplan.dimensions.width} 
        height={floorplan.dimensions.height} 
      />

      {/* White epoxy floors for rooms 2-6 */}
      {/* Room 2: y = 173.4792 to y = 198.0417 */}
      <RoomFloor
        position={[70.40625, -0.05, 185.76045]} // Center between longways walls, slightly above ground
        width={80.6875} // Room interior width between longways walls
        height={24.5625} // Room 2 height: 198.0417 - 173.4792
        material="white-epoxy"
      />
      
      {/* Room 3: y = 148.9167 to y = 173.4792 */}
      <RoomFloor
        position={[70.40625, -0.05, 161.19795]} // Center position
        width={80.6875}
        height={24.5625} // Room 3 height: 173.4792 - 148.9167
        material="white-epoxy"
      />
      
      {/* Room 4: y = 124.3542 to y = 148.9167 */}
      <RoomFloor
        position={[70.40625, -0.05, 136.63545]} // Center position
        width={80.6875}
        height={24.5625} // Room 4 height: 148.9167 - 124.3542
        material="white-epoxy"
      />
      
      {/* Room 5: y = 99.7917 to y = 124.3542 */}
      <RoomFloor
        position={[70.40625, -0.05, 112.07295]} // Center position
        width={80.6875}
        height={24.5625} // Room 5 height: 124.3542 - 99.7917
        material="white-epoxy"
      />
      
      {/* Room 6: y = 75.2292 to y = 99.7917 */}
      <RoomFloor
        position={[70.40625, -0.05, 87.51045]} // Center position
        width={80.6875}
        height={24.5625} // Room 6 height: 99.7917 - 75.2292
        material="white-epoxy"
      />
      
      {/* Room 7: y = 48.6667 to y = 75.2292 */}
      <RoomFloor
        position={[70.40625, -0.05, 61.94795]} // Center position
        width={80.6875}
        height={26.5625} // Room 7 height: 75.2292 - 48.6667
        material="white-epoxy"
      />
      
      {/* Room 8: y = 25 to y = 48.6667 - EXPANDED to full width from west longway wall to east exterior wall */}
      <RoomFloor
        position={[74.90625, -0.05, 36.83335]} // Center position: x=(37.0625+112.75)/2=74.90625, y=(25+48.6667)/2=36.83335
        width={75.6875} // Full width from west longway wall to east exterior wall (112.75 - 37.0625 = 75.6875)
        height={23.6667} // Room 8 height: 48.6667 - 25
        material="white-epoxy"
      />

      {/* Black gloss epoxy floors for hallways and control area */}
      
      {/* West Longway Hallway: x = 25 to x = 37.0625, y = 25 to y = 198.0417 - EXTENDED to south exterior wall */}
      <RoomFloor
        position={[31.03125, -0.05, 111.52085]} // Center position: x=(25+37.0625)/2=31.03125, y=(25+198.0417)/2=111.52085
        width={12.0625} // 12' hallway width
        height={173.0417} // From south exterior wall to Room 2 north wall (198.0417 - 25 = 173.0417)
        material="black-gloss-epoxy"
      />
      
      {/* East Longway Hallway: x = 106.75 to x = 112.75, y = 25 to y = 198.0417 - EXTENDED to south exterior wall */}
      <RoomFloor
        position={[109.75, -0.05, 111.52085]} // Center position: x=(106.75+112.75)/2=109.75, y=(25+198.0417)/2=111.52085
        width={6.0} // 6' hallway width
        height={173.0417} // From south exterior wall to Room 2 north wall (198.0417 - 25 = 173.0417)
        material="black-gloss-epoxy"
      />
      

      

      

      

      
      {/* Control Area: x = 25 to x = 112.75, y = 198.0417 to y = 222 - Expanded to cover entire northeast area */}
      <RoomFloor
        position={[68.875, -0.05, 210.02085]} // Center position: x=(25+112.75)/2=68.875, y=(198.0417+222)/2=210.02085
        width={87.75} // From west wall to east wall - expanded to cover former dry room area
        height={23.9583} // From Room 2 north wall to north wall (222 - 198.0417 = 23.9583)
        material="black-gloss-epoxy"
      />
      




      {/* Floorplan elements */}
      {allElements.map((element) => {
        const isPreview = element.metadata?.isPreview === true
        const isSelected = selectedElements.includes(element.id) && !isPreview
        const toolActive = measurementToolActive
        
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
          
          // Check if TJI Beams should be shown (part of framing layer)
          if (element.material === 'tji_beam' && element.metadata?.equipment_type === 'tji_ijoist') {
            // TJI beams are part of the framing system
            const visible = showFraming
            console.log(`🔍 TJI beam ${element.id} visibility check (framing): ${visible}`)
            return visible
          }
          
          // Check if Roof Panels layer is hidden
          if (element.metadata?.category === 'roof') {
            const visible = isLayerVisible('roof-panels')
            console.log(`🔍 Roof panel ${element.id} visibility check: ${visible}`)
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
        
        const handleDoubleClickSelect = () => {
          if (isPreview) return
          
          // Use group selection for I-beams, normal selection with snap for others
          if (element.material === 'steel' && element.metadata?.beam_type === 'I-beam') {
            selectElementGroup(element.id)
          } else {
            selectElementWithSnap(element.id)
          }
        }
        
        return (
        <FloorplanElementMesh
          key={element.id}
          element={element}
            isSelected={isSelected}
            onSelect={handleDoubleClickSelect}
            onToggleSelect={toggleElementSelection}
          showMeasurements={showMeasurements}
          // Legacy measurement props removed
          onStartEdit={startElementEdit}
          onStartDrag={startDrag}
          isEditing={isEditing}
          selectedElements={selectedElements}
          isDragging={isDragging}
          showFraming={showFraming}
          showDrywall={showDrywall}
          lockedTarget={lockedTarget}
          measurementToolActive={toolActive}
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
          <div className="text-gray-400 text-xs font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
            ↑ NORTH
          </div>
        </Html>
        
        {/* South indicator */}
        <mesh position={[69.375, 8, 1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 5]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
        </mesh>
        <Html position={[69.375, 8, 1]}>
          <div className="text-gray-400 text-xs font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
            ↓ SOUTH
          </div>
        </Html>
        
        {/* East indicator */}
        <mesh position={[137.75, 8, 124]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 5]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
        </mesh>
        <Html position={[137.75, 8, 124]}>
          <div className="text-gray-400 text-xs font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
            → EAST
          </div>
        </Html>
        
        {/* West indicator */}
        <mesh position={[1, 8, 124]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[15, 5]} />
          <meshBasicMaterial color="#1f2937" transparent opacity={0.8} />
        </mesh>
        <Html position={[1, 8, 124]}>
          <div className="text-gray-400 text-xs font-medium pointer-events-none select-none opacity-60 bg-gray-800/80 px-2 py-1 rounded border border-gray-600/50 backdrop-blur-sm">
            ← WEST
          </div>
        </Html>
      </group>
      
      {/* Framing Status Indicator */}
      {showFraming && (
        <Html position={[25, 15, 25]}>
          <div className="text-amber-400 text-xs font-medium pointer-events-none select-none opacity-70 bg-gray-800/80 px-2 py-1 rounded border border-amber-600/50 backdrop-blur-sm whitespace-nowrap">
            🔨 FRAMING & TJI BEAMS ON (Press F to toggle)
          </div>
        </Html>
      )}
      
      {/* Drywall Status Indicator */}
      {showDrywall && (
        <Html position={[25, 12, 25]}>
          <div className="text-blue-400 text-xs font-medium pointer-events-none select-none opacity-70 bg-gray-800/80 px-2 py-1 rounded border border-blue-600/50 backdrop-blur-sm whitespace-nowrap">
            🏠 DRYWALL ON - Interior walls only (Press G to toggle)
          </div>
        </Html>
      )}
      
      {/* Room number labels */}
      <RoomLabels floorplan={floorplan} />
      
      {/* Firewall labels */}
      <FirewallLabels floorplan={floorplan} />
      
      {/* Area labels */}
      <AreaLabels floorplan={floorplan} />

      {/* Removed beam-to-beam measurements to clean up view */}

      {/* Professional Measurement System */}
      <SimpleMeasurementDisplay
        interactionEnabled={true}
        onPointClick={(point) => {
          // Point click handled by measurement system
        }}
      />
      
      {/* Selection Indicators */}
      <SelectionIndicators />
      
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
        <CameraController
          target={cameraTarget}
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

// CameraCapture function removed - using imported version from CameraController

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
    // Legacy measurement variables removed
    
    // Camera state
    cameraPosition,
    cameraTarget,
    lockedTarget,
    setLockedTarget,
    
    // Layer visibility
    hiddenLayers,
    layerGroups,
    isLayerVisible,
    updateLayerGroups,
    selectElementGroup
  } = useAppStore()
  
  // Get measurement tool state
  const { activeTool } = useMeasurementStore()
  const measurementToolActive = !!activeTool

  // Local state for wall framing visibility
  const [showFraming, setShowFraming] = React.useState(false)
  
  // Local state for drywall visibility
  const [showDrywall, setShowDrywall] = React.useState(false)

  // Refs for saving functionality
  const canvasRef = React.useRef<HTMLCanvasElement>()
  
  // Update layer groups when floorplan changes
  React.useEffect(() => {
    updateLayerGroups()
  }, [currentFloorplan, updateLayerGroups])
  
  // ESC key handler to unlock camera target
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && lockedTarget) {
        console.log('🔓 ESC pressed - unlocking camera target')
        setLockedTarget(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [lockedTarget, setLockedTarget])
  
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
    
    // Initialize Advanced Warehouse Engine
    if (typeof window !== 'undefined' && !(window as any).warehouseCAD?.engine) {
      console.log('🚀 Initializing Advanced Warehouse Engine...')
      try {
        // Get the scene from the canvas context - this is a simplified approach
        const scene = new THREE.Scene() // In a real implementation, you'd get the actual scene
        const integration = initializeWarehouseCAD(scene, camera)
        console.log('✅ Advanced Warehouse Engine initialized successfully!')
        console.log('🤖 AI commands now available via window.warehouseCAD')
        console.log('🎮 Demo commands available via window.warehouseDemo')
      } catch (error) {
        console.error('❌ Failed to initialize Advanced Warehouse Engine:', error)
      }
    }
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
        
        // Handle framing toggle (F key) - only prevent if not used for movement
        if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
          event.preventDefault()
          event.stopPropagation()
          setShowFraming(prev => {
            const newValue = !prev
            console.log(`🔨 Toggling wall framing: ${newValue ? 'ON' : 'OFF'}`)
            console.log(`📍 Current camera position:`, cameraRef.current?.position)
            return newValue
          })
        }
        
        // Handle drywall toggle (G key for Gypsum) - avoid conflict with WASD
        if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
          event.preventDefault()
          event.stopPropagation()
          setShowDrywall(prev => {
            const newValue = !prev
            console.log(`🏠 Drywall mode: ${newValue ? 'ON - Interior walls only (LOD optimized)' : 'OFF'}`)
            return newValue
          })
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

    return new IntelligentWallSystem(snapTolerance)
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
    <div className="w-full h-full bg-gray-700 relative">
      <Canvas
        camera={{
          position: [150, 100, 200], // View rotated building from Southeast corner
          fov: 60,
        }}
        shadows
        className="w-full h-full bg-gray-700"
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        frameloop="demand"
        performance={{ min: 0.5 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onCreated={({ gl }) => {
          // Store canvas reference for screenshots
          if (gl.domElement) {
            canvasRef.current = gl.domElement
          }
        }}

        onPointerMissed={(event) => {
          // Measurement now handled by direct object clicks - no ground clicking needed
        }}
      >
        <Suspense fallback={
          <Html center>
            <div className="text-white text-lg">Loading 3D Scene...</div>
          </Html>
        }>
          <Scene 
            onCameraReady={handleCameraReady} 
            snapPointsCache={snapPointsCache} 
            showFraming={showFraming}
            showDrywall={showDrywall}
            cameraTarget={cameraTarget}
            lockedTarget={lockedTarget}
            measurementToolActive={measurementToolActive}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
