import React, { useMemo } from 'react'
import { 
  Vector3, 
  BufferGeometry, 
  BufferAttribute, 
  LineBasicMaterial,
  CanvasTexture,
  SpriteMaterial,
  DoubleSide
} from 'three'
import { Html } from '@react-three/drei'
import {
  Measurement,
  LinearMeasurement,
  formatMeasurement
} from './MeasurementTypes'

interface SimpleDimensionRendererProps {
  measurements: Measurement[]
  globalOpacity?: number
}

/**
 * Simplified dimension renderer that focuses on core functionality
 * without complex text rendering that was causing errors
 */
export const SimpleDimensionRenderer: React.FC<SimpleDimensionRendererProps> = ({
  measurements,
  globalOpacity = 1.0
}) => {
  const renderElements = useMemo(() => {
    const elements: JSX.Element[] = []
    
    measurements
      .filter(measurement => measurement.visible)
      .forEach((measurement) => {
        const style = measurement.style
        if (!style) return
        
        const opacity = (style.opacity || 1.0) * globalOpacity
        if (opacity <= 0) return
        
        switch (measurement.type) {
          case 'linear':
            const linearMeas = measurement as LinearMeasurement
            elements.push(
              <SimpleLinearDimension
                key={measurement.id}
                measurement={linearMeas}
                style={style}
                opacity={opacity}
              />
            )
            break
        }
      })
    
    return elements
  }, [measurements, globalOpacity])
  
  return (
    <group name="simple-measurement-dimensions">
      {renderElements}
    </group>
  )
}

// Simple linear dimension component
interface SimpleLinearDimensionProps {
  measurement: LinearMeasurement
  style: any
  opacity: number
}

const SimpleLinearDimension: React.FC<SimpleLinearDimensionProps> = ({
  measurement,
  style,
  opacity
}) => {
  const { points, totalDistance, unit, precision } = measurement
  
  const { mainLine, arrowLines, textData } = useMemo(() => {
    const result = {
      mainLine: null as Float32Array | null,
      arrowLines: null as Float32Array | null, 
      textData: null as { position: Vector3; text: string } | null
    }
    
    // Safety check
    if (!points || !Array.isArray(points) || points.length < 2) {
      return result
    }
    
    try {
      const p1 = points[0]
      const p2 = points[points.length - 1]
      
      // Validate points
      if (!p1 || typeof p1.x !== 'number' || !p2 || typeof p2.x !== 'number') {
        return result
      }
      
      const start = new Vector3(p1.x || 0, (p1.y || 0) + 5, p1.z || 0) // Raise higher above objects
      const end = new Vector3(p2.x || 0, (p2.y || 0) + 5, p2.z || 0)
      
      // Force horizontal measurement (ignore Y differences)
      const horizontalStart = new Vector3(p1.x || 0, 8, p1.z || 0) // Fixed height for all lines
      const horizontalEnd = new Vector3(p2.x || 0, 8, p2.z || 0)
      
      // Create very thick visible lines using cylinder geometry approach
      const mainVertices: number[] = []
      const lineHeight = 8 // Fixed height above ground
      
      // Create multiple thick lines to simulate a thick dimension line
      for (let i = -5; i <= 5; i++) {
        for (let j = -5; j <= 5; j++) {
          const offsetY = i * 0.02 // Slight Y variations
          const offsetZ = j * 0.02 // Slight Z variations
          mainVertices.push(
            horizontalStart.x, lineHeight + offsetY, horizontalStart.z + offsetZ,
            horizontalEnd.x, lineHeight + offsetY, horizontalEnd.z + offsetZ
          )
        }
      }
      
      result.mainLine = new Float32Array(mainVertices)
      
      // Create massive arrow indicators using horizontal direction
      const horizontalDirection = new Vector3().subVectors(horizontalEnd, horizontalStart).normalize()
      const arrowSize = 2.0 // Very large arrows
      const arrowVertices: number[] = []
      
      // Start arrow - massive triangle pointing toward end
      arrowVertices.push(
        horizontalStart.x, lineHeight, horizontalStart.z,
        horizontalStart.x + horizontalDirection.x * arrowSize, lineHeight, horizontalStart.z + horizontalDirection.z * arrowSize
      )
      arrowVertices.push(
        horizontalStart.x, lineHeight, horizontalStart.z,
        horizontalStart.x + horizontalDirection.z * arrowSize * 0.5, lineHeight, horizontalStart.z - horizontalDirection.x * arrowSize * 0.5
      )
      arrowVertices.push(
        horizontalStart.x, lineHeight, horizontalStart.z,
        horizontalStart.x - horizontalDirection.z * arrowSize * 0.5, lineHeight, horizontalStart.z + horizontalDirection.x * arrowSize * 0.5
      )
      
      // End arrow - massive triangle pointing toward start  
      arrowVertices.push(
        horizontalEnd.x, lineHeight, horizontalEnd.z,
        horizontalEnd.x - horizontalDirection.x * arrowSize, lineHeight, horizontalEnd.z - horizontalDirection.z * arrowSize
      )
      arrowVertices.push(
        horizontalEnd.x, lineHeight, horizontalEnd.z,
        horizontalEnd.x + horizontalDirection.z * arrowSize * 0.5, lineHeight, horizontalEnd.z - horizontalDirection.x * arrowSize * 0.5
      )
      arrowVertices.push(
        horizontalEnd.x, lineHeight, horizontalEnd.z,
        horizontalEnd.x - horizontalDirection.z * arrowSize * 0.5, lineHeight, horizontalEnd.z + horizontalDirection.x * arrowSize * 0.5
      )
      
      result.arrowLines = new Float32Array(arrowVertices)
      
      // Text at horizontal midpoint
      const midpoint = new Vector3().addVectors(horizontalStart, horizontalEnd).multiplyScalar(0.5)
      midpoint.y = lineHeight + 3 // High above the line for visibility
      
      // Recalculate distance for horizontal measurement accuracy
      const horizontalDistance = Math.sqrt(
        Math.pow(horizontalEnd.x - horizontalStart.x, 2) + 
        Math.pow(horizontalEnd.z - horizontalStart.z, 2)
      )
      
      const text = `📏 ${formatMeasurement(horizontalDistance, unit, precision)}`
      result.textData = { position: midpoint, text }
      
    } catch (error) {
      console.error('Error creating linear dimension:', error)
    }
    
    return result
  }, [points, totalDistance, unit, precision])
  
  const material = useMemo(() => 
    new LineBasicMaterial({ 
      color: style?.color || '#00ff00',
      transparent: false, // Make solid for better visibility
      linewidth: 5, // Much thicker lines
      depthTest: false // Always show on top
    }),
    [style?.color]
  )
  
  const arrowMaterial = useMemo(() => 
    new LineBasicMaterial({ 
      color: style?.color || '#ffff00', // Yellow for arrows to stand out
      transparent: false, // Make solid
      linewidth: 4, // Thick arrows
      depthTest: false // Always show on top
    }),
    [style?.color]
  )
  
  return (
    <group name={`simple-linear-dimension-${measurement.id}`}>
      {/* Main dimension line - use thick cylinder for visibility */}
      {textData && (
        <>
          {/* Thick dimension line cylinder */}
          <mesh
            position={[
              ((points[0]?.x || 0) + (points[points.length - 1]?.x || 0)) / 2,
              8,
              ((points[0]?.z || 0) + (points[points.length - 1]?.z || 0)) / 2
            ]}
            rotation={[
              Math.PI / 2, // Rotate to horizontal
              Math.atan2(
                (points[points.length - 1]?.z || 0) - (points[0]?.z || 0), 
                (points[points.length - 1]?.x || 0) - (points[0]?.x || 0)
              ), 
              0
            ]}
          >
            <cylinderGeometry 
              args={[0.1, 0.1, Math.sqrt(
                Math.pow((points[points.length - 1]?.x || 0) - (points[0]?.x || 0), 2) +
                Math.pow((points[points.length - 1]?.z || 0) - (points[0]?.z || 0), 2)
              ), 16]} 
            />
            <meshBasicMaterial color="#00ff00" />
          </mesh>
          
          {/* Start arrow - large cone */}
          <mesh
            position={[points[0]?.x || 0, 8, points[0]?.z || 0]}
            rotation={[0, Math.atan2(
              (points[points.length - 1]?.z || 0) - (points[0]?.z || 0), 
              (points[points.length - 1]?.x || 0) - (points[0]?.x || 0)
            ) + Math.PI/2, 0]}
          >
            <coneGeometry args={[0.3, 1, 8]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
          
          {/* End arrow - large cone */}
          <mesh
            position={[points[points.length - 1]?.x || 0, 8, points[points.length - 1]?.z || 0]}
            rotation={[0, Math.atan2(
              (points[0]?.z || 0) - (points[points.length - 1]?.z || 0), 
              (points[0]?.x || 0) - (points[points.length - 1]?.x || 0)
            ) + Math.PI/2, 0]}
          >
            <coneGeometry args={[0.3, 1, 8]} />
            <meshBasicMaterial color="#ffff00" />
          </mesh>
        </>
      )}
      
      {/* Measurement text - make it much more prominent */}
      {textData && (
        <Html 
          position={[textData.position.x, textData.position.y, textData.position.z]}
          center
          distanceFactor={15}
          occlude={false}
        >
          <div className="bg-lime-500 text-black px-4 py-2 rounded-lg text-lg font-bold border-2 border-lime-300 shadow-xl">
            {textData.text}
          </div>
        </Html>
      )}
    </group>
  )
}

export default SimpleDimensionRenderer
