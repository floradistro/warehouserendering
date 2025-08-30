import React, { useMemo, useCallback, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { Vector3, Object3D, Raycaster } from 'three'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import { useMeasurementStore, useVisibleMeasurements } from '../lib/measurement/MeasurementStore'
import { measurementEngine } from '../lib/measurement/MeasurementEngine'
import SimpleDimensionRenderer from '../lib/measurement/SimpleDimensionRenderer'
import { formatMeasurement } from '../lib/measurement/MeasurementTypes'

interface SimpleMeasurementDisplayProps {
  onPointClick?: (point: Vector3) => void
  interactionEnabled?: boolean
}

/**
 * Simplified 3D measurement display component
 * Focuses on core functionality without complex snapping
 */
export const SimpleMeasurementDisplay: React.FC<SimpleMeasurementDisplayProps> = ({
  onPointClick,
  interactionEnabled = true
}) => {
  const { scene, raycaster, pointer, camera } = useThree()
  const [hoverPoint, setHoverPoint] = useState<Vector3 | null>(null)
  const [snapPoints, setSnapPoints] = useState<Array<{ point: Vector3; type: 'center' | 'corner'; elementId: string }>>([])
  
  const {
    activeTool,
    currentPoints,
    addPoint,
    finalizeMeasurement,
    globalOpacity,
    defaultUnit,
    defaultPrecision
  } = useMeasurementStore()
  
  const measurements = useVisibleMeasurements()
  
  // Generate precise snap points - corners and centers only
  const generateSnapPoints = useCallback(() => {
    const allSnapPoints: Array<{ point: Vector3; type: 'center' | 'corner'; elementId: string }> = []
    const pointMap = new Map<string, { point: Vector3; type: 'center' | 'corner'; elementIds: string[] }>()
    
    scene.traverse((object) => {
      if (!object.userData?.id || !object.visible || !object.userData?.dimensions) return
      
      const elementId = object.userData.id
      const dimensions = object.userData.dimensions
      const width = dimensions.width || 0
      const height = dimensions.height || 0
      
      // Skip very small objects and non-structural elements
      if (width < 3 && height < 3) return
      
      // Only include major structural elements (walls, rooms, platforms, etc.)
      const metadata = object.userData.metadata || {}
      const isStructural = (
        object.userData.type === 'wall' ||
        object.userData.type === 'room' ||
        object.userData.type === 'platform' ||
        metadata.category === 'structural' ||
        width > 10 || height > 10 // Large objects are likely structural
      )
      
      if (!isStructural) {
        return
      }
      
      // Get object's world position (CENTER of the object)
      const worldPos = new Vector3()
      object.getWorldPosition(worldPos)
      
      // Get object's actual height from dimensions
      const depth = dimensions.depth || 8 // Default height for walls/objects
      const objectTopY = worldPos.y + depth / 2 // Top surface of the object
      const objectBottomY = worldPos.y - depth / 2 // Bottom surface of the object
      
      // Calculate actual corners from center position
      const minX = worldPos.x - width / 2
      const maxX = worldPos.x + width / 2
      const minZ = worldPos.z - height / 2
      const maxZ = worldPos.z + height / 2
      

      
      // Add CENTER POINT at TOP of object (always add for all objects)
      const centerKey = `${worldPos.x.toFixed(2)},${worldPos.z.toFixed(2)},${objectTopY.toFixed(2)}`
      if (pointMap.has(centerKey)) {
        pointMap.get(centerKey)!.elementIds.push(elementId)
      } else {
        pointMap.set(centerKey, {
          point: new Vector3(worldPos.x, objectTopY, worldPos.z),
          type: 'center',
          elementIds: [elementId]
        })
      }
      
      // Add ALL 4 CORNER POINTS at TOP of object (exact corners)
      const corners = [
        [minX, minZ], // Bottom-left
        [maxX, minZ], // Bottom-right  
        [minX, maxZ], // Top-left
        [maxX, maxZ]  // Top-right
      ]
      
      corners.forEach(([x, z]) => {
        const cornerKey = `${x.toFixed(2)},${z.toFixed(2)},${objectTopY.toFixed(2)}`
        if (pointMap.has(cornerKey)) {
          // Share the point between connected objects at same height
          pointMap.get(cornerKey)!.elementIds.push(elementId)
        } else {
          pointMap.set(cornerKey, {
            point: new Vector3(x, objectTopY, z),
            type: 'corner',
            elementIds: [elementId]
          })
        }
      })
    })
    
    // Convert map to array
    const newSnapPoints = Array.from(pointMap.values()).map(({ point, type, elementIds }) => ({
      point,
      type,
      elementId: elementIds.join(',') // Show which elements share this point
    }))
    

    
    setSnapPoints(newSnapPoints)
  }, [scene])
  
  // Enhanced cursor-following with better snap detection
  useFrame(() => {
    if (!activeTool || !interactionEnabled) {
      setHoverPoint(null)
      return
    }
    
    // Update raycaster with current mouse position
    raycaster.setFromCamera(pointer, camera)
    
    // Project to ground plane for consistent coordinates
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const projectedPoint = new Vector3()
    const hit = raycaster.ray.intersectPlane(groundPlane, projectedPoint)
    
    if (!hit) {
      setHoverPoint(null)
      return
    }
    
    // Always show a cursor position for feedback
    let targetPoint = projectedPoint.clone()
    
    // Check for snap points if we have them
    if (snapPoints.length > 0) {
      let bestSnap: Vector3 | null = null
      let bestDistance = Infinity
      const snapTolerance = 3.0 // Increased tolerance for easier targeting
      
      // Find closest snap point with expanded tolerance for better clickability
      const expandedTolerance = snapTolerance * 1.5 // More forgiving for clicking
      snapPoints.forEach((snapData) => {
        const distance = projectedPoint.distanceTo(snapData.point)
        if (distance < expandedTolerance && distance < bestDistance) {
          bestDistance = distance
          bestSnap = snapData.point.clone()

        }
      })
      
      // Use snap point if found and close enough
      if (bestSnap) {
        targetPoint = bestSnap
      } else {
        // Grid snapping for precision
        targetPoint = new Vector3(
          Math.round(projectedPoint.x),
          0,
          Math.round(projectedPoint.z)
        )
      }
    } else {
      // Grid snapping when no object snaps
      targetPoint = new Vector3(
        Math.round(projectedPoint.x),
        0, 
        Math.round(projectedPoint.z)
      )
    }
    
    setHoverPoint(targetPoint)
  })
  
  // Update snap points when scene changes - but also regenerate periodically
  React.useEffect(() => {
    generateSnapPoints()
    
    // Regenerate every 2 seconds to catch scene updates
    const interval = setInterval(generateSnapPoints, 2000)
    return () => clearInterval(interval)
  }, [generateSnapPoints])
  
  // Enhanced double-click handler with Shift key support
  const handleSceneDoubleClick = useCallback((event: any) => {
    if (!interactionEnabled || !activeTool) {
      return
    }
    
    const isShiftPressed = event.shiftKey || event.nativeEvent?.shiftKey
    
    event.stopPropagation()
    
    // Use the current hover point (should be accurate from snap system)
    let pointToAdd: Vector3
    
    if (hoverPoint) {
      pointToAdd = hoverPoint.clone()
    } else {
      // Fallback to raycaster
      raycaster.setFromCamera(pointer, camera)
      const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
      const intersection = new Vector3()
      const hit = raycaster.ray.intersectPlane(groundPlane, intersection)
      
      if (hit) {
        pointToAdd = intersection
      } else {
        return
      }
    }
    
    // Validate and add point
    if (measurementEngine.isValidPoint(pointToAdd)) {
      addPoint(pointToAdd)
      onPointClick?.(pointToAdd)
    }
  }, [activeTool, hoverPoint, addPoint, finalizeMeasurement, onPointClick, camera, interactionEnabled, currentPoints, defaultUnit, raycaster, pointer])
  
  // Enhanced current points visualization
  const currentPointsData = useMemo(() => {
    if (currentPoints.length === 0) return { geometry: null, pointLabels: [] }
    
    const positions: number[] = []
    const pointLabels: Array<{ position: Vector3; text: string; coordinates: string; index: number }> = []
    
    currentPoints.forEach((point, index) => {
      // Much larger, highly visible point markers
      const size = 2.0 // Double the size
      const x = point.x || 0
      const y = (point.y || 0) + 3
      const z = point.z || 0
      
      // Create multiple cross markers for maximum visibility
      for (let i = -2; i <= 2; i++) {
        const offset = i * 0.1
        positions.push(
          x - size, y + offset, z, x + size, y + offset, z,
          x, y - size + offset, z, x, y + size + offset, z,
          x, y + offset, z - size, x, y + offset, z + size
        )
      }
      
      // Point labels - make them more prominent with coordinates
      pointLabels.push({
        position: new Vector3(x, y + 2, z),
        text: `📍 P${index + 1}`,
        coordinates: `(${x.toFixed(1)}, ${z.toFixed(1)})`,
        index
      })
    })
    
    // Horizontal connection lines between points (preview measurement)
    if (currentPoints.length > 1) {
      for (let i = 0; i < currentPoints.length - 1; i++) {
        const start = currentPoints[i]
        const end = currentPoints[i + 1]
        
        // Force horizontal lines at fixed height
        const startVec = new Vector3(start.x || 0, 6, start.z || 0)
        const endVec = new Vector3(end.x || 0, 6, end.z || 0)
        
        // Draw multiple parallel lines for thickness and visibility
        for (let j = -3; j <= 3; j++) {
          for (let k = -3; k <= 3; k++) {
            const offsetY = j * 0.05
            const offsetZ = k * 0.05
            positions.push(
              startVec.x, startVec.y + offsetY, startVec.z + offsetZ,
              endVec.x, endVec.y + offsetY, endVec.z + offsetZ
            )
          }
        }
      }
    }
    
    return {
      geometry: positions.length > 0 ? new Float32Array(positions) : null,
      pointLabels
    }
  }, [currentPoints])
  
  // Calculate current measurement preview - HORIZONTAL ONLY
  const currentMeasurementData = useMemo(() => {
    if (currentPoints.length < 2) return null
    
    const start = currentPoints[0]
    const end = currentPoints[currentPoints.length - 1]
    
    // Use measurement engine for accurate horizontal distance
    const startVec = new Vector3(start.x || 0, start.y || 0, start.z || 0)
    const endVec = new Vector3(end.x || 0, end.y || 0, end.z || 0)
    const horizontalDistance = measurementEngine.calculateHorizontalDistance(startVec, endVec, defaultUnit)
    
    const midpoint = new Vector3(
      ((start.x || 0) + (end.x || 0)) / 2,
      10, // Fixed height for visibility
      ((start.z || 0) + (end.z || 0)) / 2
    )
    
    return {
      distance: horizontalDistance,
      text: formatMeasurement(horizontalDistance, defaultUnit, defaultPrecision),
      position: midpoint
    }
  }, [currentPoints, defaultUnit, defaultPrecision])
  
  return (
    <group name="simple-measurement-display">
      {/* Render completed measurements */}
      <SimpleDimensionRenderer
        measurements={measurements}
        globalOpacity={globalOpacity}
      />
      
      {/* Current measurement points with enhanced visibility */}
      {currentPointsData.geometry && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={currentPointsData.geometry}
              count={currentPointsData.geometry.length / 3}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#ffff00"
            transparent={false}
            linewidth={6}
            depthTest={false}
          />
        </line>
      )}

      {/* SOLID RED LINE between measurement points */}
      {currentPoints.length >= 2 && (
        <>
          {/* Add thick cylindrical line for better visibility */}
          {currentPoints.map((point, index) => {
            if (index === 0) return null
            
            const prevPoint = currentPoints[index - 1]
            const currentPoint = point
            
            // Calculate line properties
            const start = new Vector3(prevPoint.x || 0, (prevPoint.y || 0) + 0.5, prevPoint.z || 0)
            const end = new Vector3(currentPoint.x || 0, (currentPoint.y || 0) + 0.5, currentPoint.z || 0)
            const direction = end.clone().sub(start)
            const length = direction.length()
            const midPoint = start.clone().add(end).multiplyScalar(0.5)
            
            // Create rotation to align cylinder with line
            const up = new Vector3(0, 1, 0)
            const axis = direction.clone().normalize()
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, axis)
            
            return (
              <group key={`measurement-line-group-${index}`}>
                {/* Main red cylinder line */}
                <mesh 
                  position={[midPoint.x, midPoint.y, midPoint.z]}
                  quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
                >
                  <cylinderGeometry args={[0.1, 0.1, length, 8]} />
                  <meshBasicMaterial 
                    color="#ff0000" 
                    transparent={false}
                    depthTest={false}
                    depthWrite={false}
                  />
                </mesh>
                
                {/* Glowing outline for better visibility */}
                <mesh 
                  position={[midPoint.x, midPoint.y, midPoint.z]}
                  quaternion={[quaternion.x, quaternion.y, quaternion.z, quaternion.w]}
                >
                  <cylinderGeometry args={[0.15, 0.15, length, 8]} />
                  <meshBasicMaterial 
                    color="#ff0000" 
                    transparent={true}
                    opacity={0.3}
                    depthTest={false}
                    depthWrite={false}
                  />
                </mesh>
                
                {/* Distance label on the line */}
                <Html
                  position={[midPoint.x, midPoint.y + 1, midPoint.z]}
                  center
                  distanceFactor={8}
                  occlude={false}
                >
                  <div className="bg-red-600 text-white px-2 py-1 rounded font-bold text-sm border border-red-400 shadow-lg">
                    {measurementEngine.calculateHorizontalDistance(start, end, defaultUnit).toFixed(2)}ft
                  </div>
                </Html>
              </group>
            )
          })}
        </>
      )}
      
      {/* Point labels */}
      {currentPointsData.pointLabels.map((label) => (
        <Html
          key={`point-${label.index}`}
          position={[label.position.x, label.position.y, label.position.z]}
          center
          distanceFactor={8}
          occlude={false}
        >
          <div className="bg-yellow-400 text-black px-3 py-2 rounded-lg font-bold text-base border-2 border-yellow-200 shadow-lg">
            {label.text}
            <div className="text-xs font-mono mt-1">{label.coordinates}</div>
          </div>
        </Html>
      ))}
      
      {/* Live measurement preview */}
      {currentMeasurementData && (
        <Html
          position={[currentMeasurementData.position.x, currentMeasurementData.position.y, currentMeasurementData.position.z]}
          center
          distanceFactor={12}
          occlude={false}
                  >
            <div className="bg-orange-400 text-black px-4 py-3 rounded-xl font-bold text-xl border-3 border-orange-200 shadow-2xl">
              📏 {currentMeasurementData.text}
              <div className="text-xs mt-1 font-mono">
                X: {Math.abs((currentPoints[currentPoints.length - 1]?.x || 0) - (currentPoints[0]?.x || 0)).toFixed(2)}ft | 
                Z: {Math.abs((currentPoints[currentPoints.length - 1]?.z || 0) - (currentPoints[0]?.z || 0)).toFixed(2)}ft
              </div>
            </div>
          </Html>
      )}
      
      {/* ALL SNAP POINTS - Visible when measurement tool is active */}
      {activeTool && snapPoints.map((snapData, index) => {
        const { point, type, elementId } = snapData
        
        let color = '#888888'
        let size = 0.15
        let geometry = 'sphere'
        
        // Use actual snap point type with highly visible indicators
        // Check if this point is close to any current measurement points
        const isNearCurrentPoint = currentPoints.some(cp => 
          Math.abs(cp.x - point.x) < 0.5 && Math.abs(cp.z - point.z) < 0.5
        )
        
        switch (type) {
          case 'center':
            color = isNearCurrentPoint ? '#ffff00' : '#00ff00' // Yellow if selected, green otherwise
            size = isNearCurrentPoint ? 0.6 : 0.4 // Larger if selected
            geometry = 'sphere'
            break
          case 'corner':
            color = isNearCurrentPoint ? '#ff8800' : '#ff0000' // Orange if selected, red otherwise
            size = isNearCurrentPoint ? 0.5 : 0.3 // Larger if selected
            geometry = 'box'
            break
          default:
            color = '#888888'
            size = 0.2
            geometry = 'sphere'
        }
        
        return (
          <mesh 
            key={`snap-${elementId}-${type}-${index}`} 
            position={[point.x, point.y, point.z]}
          >
            {geometry === 'sphere' && <sphereGeometry args={[size, 8, 8]} />}
            {geometry === 'box' && <boxGeometry args={[size, size, size]} />}
            {geometry === 'octahedron' && <octahedronGeometry args={[size]} />}
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={isNearCurrentPoint ? 1.0 : 0.8}
              depthTest={false}
              depthWrite={false}
            />
            
            {/* Pulsing ring for selected points */}
            {isNearCurrentPoint && (
              <mesh>
                <ringGeometry args={[size * 1.2, size * 1.5, 16]} />
                <meshBasicMaterial 
                  color={color}
                  transparent 
                  opacity={0.3}
                  depthTest={false}
                  depthWrite={false}
                />
              </mesh>
            )}
          </mesh>
        )
      })}
      
      {/* Tool status indicator with snap legend */}
      {activeTool && (
        <Html
          position={[0, 15, 0]}
          center
          distanceFactor={25}
          occlude={false}
        >
          <div className="bg-blue-600 text-white px-4 py-3 rounded-lg border-2 border-blue-400">
            <div className="font-bold text-base mb-2">
              🔧 {activeTool.toUpperCase()} TOOL ACTIVE - DOUBLE-CLICK points to measure
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span>🎯 Centers</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-400"></div>
                <span>📐 Corners</span>
              </div>
            </div>
            <div className="text-xs mt-2 text-blue-200">
              Single-click = Move model | Double-click = Add measurement point
            </div>
          </div>
        </Html>
      )}
      
      {/* Enhanced hover point indicator - positioned exactly at cursor */}
      {hoverPoint && activeTool && (
        <>
          {/* Main cursor indicator - right at the point */}
          <mesh position={[hoverPoint.x, hoverPoint.y, hoverPoint.z]}>
            <sphereGeometry args={[0.3, 12, 12]} />
            <meshBasicMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.9}
              depthTest={false}
            />
          </mesh>
          
          {/* Outer glow ring */}
          <mesh position={[hoverPoint.x, hoverPoint.y, hoverPoint.z]}>
            <sphereGeometry args={[0.5, 12, 12]} />
            <meshBasicMaterial 
              color="#ffffff" 
              transparent 
              opacity={0.2}
              depthTest={false}
            />
          </mesh>
          
          {/* Crosshairs for precision - exactly at the point */}
          <group position={[hoverPoint.x, hoverPoint.y, hoverPoint.z]}>
            <mesh>
              <boxGeometry args={[1.5, 0.03, 0.03]} />
              <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.8}
                depthTest={false}
              />
            </mesh>
            <mesh>
              <boxGeometry args={[0.03, 0.03, 1.5]} />
              <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.8}
                depthTest={false}
              />
            </mesh>
          </group>
          <Html
            position={[hoverPoint.x, hoverPoint.y + 1, hoverPoint.z]}
            center
            distanceFactor={6}
            occlude={false}
          >
            {/* Determine snap type based on proximity to different snap point types */}
            {(() => {
              let snapType = 'grid'
              let bgColor = 'bg-gray-400'
              let borderColor = 'border-gray-200'
              let icon = '📍'
              let label = 'GRID SNAP'
              
              // Find the closest snap point to determine type
              let snapTypeFound = 'grid'
              let closestDistance = Infinity
              
              snapPoints.forEach((snapData) => {
                const distance = hoverPoint.distanceTo(snapData.point)
                if (distance < 0.5 && distance < closestDistance) {
                  closestDistance = distance
                  snapTypeFound = snapData.type
                }
              })
              
              if (snapTypeFound === 'center') {
                snapType = 'center'
                bgColor = 'bg-green-400'
                borderColor = 'border-green-200'
                icon = '🎯'
                label = 'CENTER SNAP'
              } else if (snapTypeFound === 'corner') {
                snapType = 'corner'
                bgColor = 'bg-red-400'
                borderColor = 'border-red-200'
                icon = '📐'
                label = 'CORNER SNAP'
              }
              
              return (
                <div className={`px-3 py-2 rounded-lg font-bold text-sm border-2 shadow-lg text-black ${bgColor} ${borderColor}`}>
                  {icon} {label} - DOUBLE-CLICK
                  <div className="text-xs font-mono mt-1">
                    ({hoverPoint.x.toFixed(1)}, {hoverPoint.z.toFixed(1)})
                  </div>
                </div>
              )
            })()}
          </Html>
        </>
      )}
      
      {/* Clean snap point indicators */}
      {activeTool && snapPoints.slice(0, 20).map((snap, index) => {
        // Simple classification based on array order (sorted by priority)
        let color = '#ffffff'
        let size = 0.15
        let opacity = 0.6
        
        // First few are centers (green), next are corners (cyan), rest are edges (orange)
        if (index < 5) {
          color = '#00ff00' // Centers
          size = 0.2
          opacity = 0.8
        } else if (index < 15) {
          color = '#00ffff' // Corners
          size = 0.15
          opacity = 0.7
        } else {
          color = '#ff8800' // Edges
          size = 0.1
          opacity = 0.5
        }
        
        return (
          <mesh 
            key={`snap-${index}`}
            position={[snap.point.x, snap.point.y + 0.2, snap.point.z]}
          >
            <sphereGeometry args={[size, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} />
          </mesh>
        )
      })}
      
      {/* Multiple interaction planes for reliable double-click detection at various heights */}
      {interactionEnabled && activeTool && (
        <>
          {/* Ground plane */}
          <mesh
            position={[0, -0.1, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onDoubleClick={handleSceneDoubleClick}
            visible={false}
          >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          
          {/* Elevated planes for different object heights */}
          {[4, 8, 12, 16, 20].map(height => (
            <mesh
              key={`plane-${height}`}
              position={[0, height, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              onDoubleClick={handleSceneDoubleClick}
              visible={false}
            >
              <planeGeometry args={[1000, 1000]} />
              <meshBasicMaterial transparent opacity={0} />
            </mesh>
          ))}
          
          {/* Higher plane for better detection */}
          <mesh
            position={[0, 5, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            onDoubleClick={handleSceneDoubleClick}
            visible={false}
          >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
          
          {/* Vertical plane for side clicks */}
          <mesh
            position={[0, 10, 0]}
            onDoubleClick={handleSceneDoubleClick}
            visible={false}
          >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial transparent opacity={0} />
          </mesh>
        </>
      )}
    </group>
  )
}

export default SimpleMeasurementDisplay
