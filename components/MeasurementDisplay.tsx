import React, { useMemo, useRef, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3, Raycaster, Camera, Object3D } from 'three'
import { useMeasurementStore, useVisibleMeasurements, useSnapPoints } from '../lib/measurement/MeasurementStore'
import { snapEngine } from '../lib/measurement/SnapEngine'
import { measurementEngine } from '../lib/measurement/MeasurementEngine'
import SimpleDimensionRenderer from '../lib/measurement/SimpleDimensionRenderer'
import { SnapPoint, MeasurementType } from '../lib/measurement/MeasurementTypes'

interface MeasurementDisplayProps {
  onPointClick?: (point: Vector3) => void
  showSnapIndicators?: boolean
  interactionEnabled?: boolean
}

/**
 * 3D measurement display component that integrates with the Three.js scene
 * Handles measurement rendering, snapping, and user interactions
 */
export const MeasurementDisplay: React.FC<MeasurementDisplayProps> = ({
  onPointClick,
  showSnapIndicators = true,
  interactionEnabled = true
}) => {
  const { camera, scene, raycaster, pointer, size } = useThree()
  const snapIndicatorsRef = useRef<any>(null)
  
  const {
    activeTool,
    currentPoints,
    addPoint,
    snapEnabled,
    snapTolerance,
    updateSnapPoints,
    setActiveSnapPoint,
    activeSnapPoint,
    globalOpacity,
    previewMeasurement
  } = useMeasurementStore()
  
  const measurements = useVisibleMeasurements()
  const snapPoints = useSnapPoints()
  
  // Get actual mesh objects from the scene for snapping
  const sceneObjects = useMemo(() => {
    const meshes: Object3D[] = []
    
    // Traverse the scene to find mesh objects with userData.id (warehouse elements)
    scene.traverse((object) => {
      if (object.userData?.id && object.visible) {
        meshes.push(object)
      }
    })
    
    console.log('🔍 Found scene objects for measurement:', meshes.length)
    if (meshes.length > 0) {
      console.log('🔍 Sample objects:', meshes.slice(0, 3).map(obj => ({ 
        id: obj.userData.id, 
        type: obj.type, 
        hasGeometry: !!(obj as any).geometry 
      })))
    }
    
    return meshes
  }, [scene])
  
  // Generate snap points from scene objects
  const sceneSnapPoints = useMemo(() => {
    if (!snapEnabled || !sceneObjects.length) {
      console.log('🔍 No snap points - snapEnabled:', snapEnabled, 'objects:', sceneObjects.length)
      return []
    }
    
    try {
      console.log('🔍 Generating snap points from', sceneObjects.length, 'objects...')
      const snapPoints = snapEngine.generateSnapPoints(sceneObjects, true)
      console.log('🔍 Generated', snapPoints.length, 'snap points')
      if (snapPoints.length > 0) {
        console.log('🔍 Sample snap points:', snapPoints.slice(0, 3))
      }
      return snapPoints
    } catch (error) {
      console.warn('Failed to generate snap points:', error)
      return []
    }
  }, [sceneObjects, snapEnabled])
  
  // Update snap points in store
  React.useEffect(() => {
    updateSnapPoints(sceneSnapPoints)
  }, [sceneSnapPoints, updateSnapPoints])
  
  // Handle scene click for measurements
  const handleSceneClick = useCallback((event: any) => {
    if (!interactionEnabled || !activeTool) return
    
    console.log('🎯 Scene click detected, active tool:', activeTool)
    event.stopPropagation()
    
    // Get intersection point from event
    let pointToAdd: Vector3
    
    if (event.point) {
      // Use intersection point from the event
      pointToAdd = event.point.clone()
      console.log('📍 Using intersection point:', pointToAdd)
    } else {
      // Fallback - raycast manually
      raycaster.setFromCamera(pointer, camera)
      const intersections = raycaster.intersectObjects(sceneObjects, true)
      
      if (intersections.length > 0) {
        pointToAdd = intersections[0].point
        console.log('📍 Using raycasted point:', pointToAdd)
      } else {
        // Project to ground plane
        const groundY = 0
        const cameraDirection = new Vector3()
        camera.getWorldDirection(cameraDirection)
        
        const distance = (camera.position.y - groundY) / (-cameraDirection.y)
        pointToAdd = camera.position.clone().add(cameraDirection.multiplyScalar(distance))
        console.log('📍 Using ground projection:', pointToAdd)
      }
    }
    
    // Apply snapping if enabled
    if (snapEnabled && snapPoints.length > 0) {
      const bestSnap = snapEngine.findBestSnapPoint(pointToAdd)
      if (bestSnap) {
        pointToAdd = bestSnap.position.clone()
        console.log('📍 Snapped to:', bestSnap.type, pointToAdd)
      }
    }
    
    // Validate point
    if (measurementEngine.isValidPoint(pointToAdd)) {
      addPoint(pointToAdd)
      onPointClick?.(pointToAdd)
      console.log('✅ Point added to measurement:', pointToAdd)
    } else {
      console.warn('⚠️ Invalid point:', pointToAdd)
    }
  }, [
    activeTool, 
    snapEnabled,
    snapPoints,
    addPoint, 
    onPointClick, 
    raycaster, 
    pointer, 
    camera, 
    sceneObjects,
    interactionEnabled
  ])
  
  // Handle pointer move for snap feedback
  const handlePointerMove = useCallback((event: any) => {
    if (!interactionEnabled || !activeTool || !snapEnabled) return
    
    // Update raycaster from pointer position
    raycaster.setFromCamera(pointer, camera)
    const intersections = raycaster.intersectObjects(sceneObjects, true)
    
    if (intersections.length > 0 && snapPoints.length > 0) {
      const intersectionPoint = intersections[0].point
      const bestSnap = snapEngine.findBestSnapPoint(intersectionPoint)
      setActiveSnapPoint(bestSnap)
    } else {
      setActiveSnapPoint(null)
    }
  }, [activeTool, snapEnabled, snapPoints, sceneObjects, raycaster, pointer, camera, setActiveSnapPoint])
  
  // Snap indicators geometry
  const snapIndicatorsGeometry = useMemo(() => {
    if (!showSnapIndicators || !snapEnabled || !snapPoints.length) return null
    
    const positions: number[] = []
    const colors: number[] = []
    
    snapPoints.forEach(snap => {
      const { position, type, confidence } = snap
      
      // Create different indicators based on snap type
      switch (type) {
        case 'corner':
        case 'endpoint':
          // Cross indicator
          const size = 0.3 * confidence
          positions.push(
            position.x - size, position.y, position.z,
            position.x + size, position.y, position.z,
            position.x, position.y - size, position.z,
            position.x, position.y + size, position.z,
            position.x, position.y, position.z - size,
            position.x, position.y, position.z + size
          )
          
          // Yellow for corners
          for (let i = 0; i < 6; i++) {
            colors.push(1, 1, 0) // Yellow
          }
          break
          
        case 'center':
          // Circle indicator (approximated with segments)
          const radius = 0.2 * confidence
          const segments = 8
          for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2
            const angle2 = ((i + 1) / segments) * Math.PI * 2
            
            positions.push(
              position.x + Math.cos(angle1) * radius, position.y, position.z + Math.sin(angle1) * radius,
              position.x + Math.cos(angle2) * radius, position.y, position.z + Math.sin(angle2) * radius
            )
            
            colors.push(0, 1, 1) // Cyan
            colors.push(0, 1, 1)
          }
          break
          
        case 'midpoint':
          // Small square
          const halfSize = 0.15 * confidence
          positions.push(
            position.x - halfSize, position.y, position.z - halfSize,
            position.x + halfSize, position.y, position.z - halfSize,
            position.x + halfSize, position.y, position.z - halfSize,
            position.x + halfSize, position.y, position.z + halfSize,
            position.x + halfSize, position.y, position.z + halfSize,
            position.x - halfSize, position.y, position.z + halfSize,
            position.x - halfSize, position.y, position.z + halfSize,
            position.x - halfSize, position.y, position.z - halfSize
          )
          
          // Green for midpoints
          for (let i = 0; i < 8; i++) {
            colors.push(0, 1, 0)
          }
          break
          
        case 'grid':
          // Small dot
          const dotSize = 0.1
          positions.push(
            position.x - dotSize, position.y, position.z,
            position.x + dotSize, position.y, position.z
          )
          
          colors.push(0.5, 0.5, 0.5) // Gray
          colors.push(0.5, 0.5, 0.5)
          break
      }
    })
    
    return { positions: new Float32Array(positions), colors: new Float32Array(colors) }
  }, [snapPoints, snapEnabled, showSnapIndicators])
  
  // Active snap point indicator
  const activeSnapIndicator = useMemo(() => {
    if (!activeSnapPoint) return null
    
    const { position, type } = activeSnapPoint
    const positions: number[] = []
    
    // Larger, more prominent indicator for active snap
    switch (type) {
      case 'corner':
      case 'endpoint':
        const size = 0.5
        positions.push(
          position.x - size, position.y, position.z,
          position.x + size, position.y, position.z,
          position.x, position.y - size, position.z,
          position.x, position.y + size, position.z,
          position.x, position.y, position.z - size,
          position.x, position.y, position.z + size
        )
        break
        
      case 'center':
        const radius = 0.4
        const segments = 12
        for (let i = 0; i < segments; i++) {
          const angle1 = (i / segments) * Math.PI * 2
          const angle2 = ((i + 1) / segments) * Math.PI * 2
          
          positions.push(
            position.x + Math.cos(angle1) * radius, position.y, position.z + Math.sin(angle1) * radius,
            position.x + Math.cos(angle2) * radius, position.y, position.z + Math.sin(angle2) * radius
          )
        }
        break
    }
    
    return positions.length > 0 ? new Float32Array(positions) : null
  }, [activeSnapPoint])
  
  // Current points indicators
  const currentPointsGeometry = useMemo(() => {
    if (currentPoints.length === 0) return null
    
    const positions: number[] = []
    const colors: number[] = []
    
    currentPoints.forEach((point, index) => {
      // Point marker
      const size = 0.2
      positions.push(
        point.x - size, point.y, point.z,
        point.x + size, point.y, point.z,
        point.x, point.y - size, point.z,
        point.x, point.y + size, point.z
      )
      
      // Different colors for first/last points
      if (index === 0) {
        colors.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0) // Green for start
      } else if (index === currentPoints.length - 1) {
        colors.push(1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0) // Red for end
      } else {
        colors.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1) // White for intermediate
      }
    })
    
    // Connection lines between points
    if (currentPoints.length > 1) {
      for (let i = 0; i < currentPoints.length - 1; i++) {
        const start = currentPoints[i]
        const end = currentPoints[i + 1]
        
        positions.push(start.x, start.y, start.z)
        positions.push(end.x, end.y, end.z)
        
        colors.push(1, 1, 0, 1, 1, 0) // Yellow for construction lines
      }
    }
    
    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors)
    }
  }, [currentPoints])
  
  // Frame update for pointer tracking
  useFrame(() => {
    if (interactionEnabled && activeTool && snapEnabled) {
      handlePointerMove({})
    }
  })
  
  return (
    <group name="measurement-display">
      {/* Render completed measurements */}
      <SimpleDimensionRenderer
        measurements={measurements}
        globalOpacity={globalOpacity}
      />
      
      {/* Render preview measurement */}
      {previewMeasurement && (
        <SimpleDimensionRenderer
          measurements={[previewMeasurement as any]}
          globalOpacity={globalOpacity * 0.7}
        />
      )}
      
      {/* Snap point indicators */}
      {snapIndicatorsGeometry && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={snapIndicatorsGeometry.positions}
              count={snapIndicatorsGeometry.positions.length / 3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              array={snapIndicatorsGeometry.colors}
              count={snapIndicatorsGeometry.colors.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.6}
            linewidth={1}
          />
        </line>
      )}
      
      {/* Active snap point indicator */}
      {activeSnapIndicator && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={activeSnapIndicator}
              count={activeSnapIndicator.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.9}
            linewidth={3}
          />
        </line>
      )}
      
      {/* Current measurement points */}
      {currentPointsGeometry && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={currentPointsGeometry.positions}
              count={currentPointsGeometry.positions.length / 3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              array={currentPointsGeometry.colors}
              count={currentPointsGeometry.colors.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            vertexColors
            transparent
            opacity={0.8}
            linewidth={2}
          />
        </line>
      )}
      
      {/* Tool-specific guides and helpers */}
      {activeTool && currentPoints.length > 0 && (
        <MeasurementGuides
          toolType={activeTool}
          points={currentPoints}
          activeSnapPoint={activeSnapPoint}
        />
      )}
      
      {/* Invisible click plane for measurements */}
      {interactionEnabled && activeTool && (
        <mesh
          position={[0, -0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={handleSceneClick}
          visible={false}
        >
          <planeGeometry args={[1000, 1000]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}
    </group>
  )
}

// ===== MEASUREMENT GUIDES COMPONENT =====

interface MeasurementGuidesProps {
  toolType: MeasurementType
  points: Vector3[]
  activeSnapPoint: SnapPoint | null
}

const MeasurementGuides: React.FC<MeasurementGuidesProps> = ({
  toolType,
  points,
  activeSnapPoint
}) => {
  const guideGeometry = useMemo(() => {
    const positions: number[] = []
    
    switch (toolType) {
      case 'angular':
        if (points.length >= 2) {
          // Show angle construction lines
          const vertex = points.length >= 3 ? points[1] : points[0]
          const arm1 = points[0]
          const arm2 = points.length >= 3 ? points[2] : (activeSnapPoint?.position || points[1])
          
          // Extend arms for visualization
          const dir1 = new Vector3().subVectors(arm1, vertex).normalize().multiplyScalar(5)
          const dir2 = new Vector3().subVectors(arm2, vertex).normalize().multiplyScalar(5)
          
          positions.push(
            vertex.x, vertex.y, vertex.z,
            vertex.x + dir1.x, vertex.y + dir1.y, vertex.z + dir1.z,
            vertex.x, vertex.y, vertex.z,
            vertex.x + dir2.x, vertex.y + dir2.y, vertex.z + dir2.z
          )
        }
        break
        
      case 'area':
        if (points.length >= 2) {
          // Show construction polygon
          for (let i = 0; i < points.length; i++) {
            const current = points[i]
            const next = points[(i + 1) % points.length]
            positions.push(current.x, current.y, current.z)
            positions.push(next.x, next.y, next.z)
          }
          
          // Close to active snap point or back to start
          if (activeSnapPoint && points.length >= 3) {
            const lastPoint = points[points.length - 1]
            positions.push(lastPoint.x, lastPoint.y, lastPoint.z)
            positions.push(activeSnapPoint.position.x, activeSnapPoint.position.y, activeSnapPoint.position.z)
            positions.push(activeSnapPoint.position.x, activeSnapPoint.position.y, activeSnapPoint.position.z)
            positions.push(points[0].x, points[0].y, points[0].z)
          }
        }
        break
        
      case 'radius':
        if (points.length >= 1) {
          const center = points[0]
          const edge = activeSnapPoint?.position || (points[1] || new Vector3())
          const radius = center.distanceTo(edge)
          
          // Draw circle
          const segments = 32
          for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2
            const angle2 = ((i + 1) / segments) * Math.PI * 2
            
            positions.push(
              center.x + Math.cos(angle1) * radius, center.y, center.z + Math.sin(angle1) * radius,
              center.x + Math.cos(angle2) * radius, center.y, center.z + Math.sin(angle2) * radius
            )
          }
          
          // Radius line
          positions.push(center.x, center.y, center.z)
          positions.push(edge.x, edge.y, edge.z)
        }
        break
        
      case 'diameter':
        if (points.length >= 2) {
          const start = points[0]
          const end = points[1]
          const center = new Vector3().addVectors(start, end).multiplyScalar(0.5)
          const radius = start.distanceTo(center)
          
          // Draw circle
          const segments = 32
          for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2
            const angle2 = ((i + 1) / segments) * Math.PI * 2
            
            positions.push(
              center.x + Math.cos(angle1) * radius, center.y, center.z + Math.sin(angle1) * radius,
              center.x + Math.cos(angle2) * radius, center.y, center.z + Math.sin(angle2) * radius
            )
          }
          
          // Diameter line
          positions.push(start.x, start.y, start.z)
          positions.push(end.x, end.y, end.z)
        }
        break
    }
    
    return positions.length > 0 ? new Float32Array(positions) : null
  }, [toolType, points, activeSnapPoint])
  
  if (!guideGeometry) return null
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={guideGeometry}
          count={guideGeometry.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial
        color="#888888"
        transparent
        opacity={0.5}
        linewidth={1}
        linecap="round"
        linejoin="round"
      />
    </line>
  )
}

export default MeasurementDisplay
