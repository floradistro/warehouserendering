import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAppStore } from '../lib/store'

interface SelectionBoxProps {
  element: {
    id: string
    position: { x: number; y: number; z?: number }
    dimensions: { width: number; height: number; depth?: number }
    rotation?: number
  }
  color?: string
  opacity?: number
}

/**
 * 3D selection box outline that wraps around selected objects
 */
export function SelectionBox({ element, color = '#0e639c', opacity = 0.8 }: SelectionBoxProps) {
  const boxRef = React.useRef<THREE.Group>(null)
  
  // Create box outline geometry
  const outlineGeometry = useMemo(() => {
    const { width, height, depth = 1 } = element.dimensions
    
    // Create edge geometry for box outline
    const geometry = new THREE.BoxGeometry(width, depth, height)
    const edges = new THREE.EdgesGeometry(geometry)
    
    return edges
  }, [element.dimensions])
  
  // Animate pulsing effect
  useFrame((state) => {
    if (boxRef.current) {
      const time = state.clock.getElapsedTime()
      const pulse = 0.8 + 0.2 * Math.sin(time * 3)
      boxRef.current.scale.setScalar(pulse * 1.02)
    }
  })
  
  const position: [number, number, number] = [
    element.position.x + element.dimensions.width / 2,
    (element.position.z || 0) + (element.dimensions.depth || 1) / 2,
    element.position.y + element.dimensions.height / 2
  ]
  
  return (
    <group 
      ref={boxRef}
      position={position}
      rotation={[0, element.rotation || 0, 0]}
    >
      {/* Main outline */}
      <lineSegments geometry={outlineGeometry}>
        <lineBasicMaterial 
          color={color} 
          transparent 
          opacity={opacity}
          linewidth={2}
          depthTest={false}
        />
      </lineSegments>
      
      {/* Corner indicators */}
      {[-1, 1].map(x => 
        [-1, 1].map(y => 
          [-1, 1].map(z => (
            <mesh 
              key={`corner-${x}-${y}-${z}`}
              position={[
                x * element.dimensions.width / 2,
                y * (element.dimensions.depth || 1) / 2,
                z * element.dimensions.height / 2
              ]}
            >
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshBasicMaterial 
                color={color} 
                transparent 
                opacity={opacity * 1.2}
                depthTest={false}
              />
            </mesh>
          ))
        )
      )}
    </group>
  )
}

/**
 * Selection indicator overlay for the entire scene
 */
export function SelectionIndicators() {
  const { selectedElements, currentFloorplan } = useAppStore()
  
  // Get selected element objects
  const selectedObjects = useMemo(() => {
    if (!currentFloorplan || selectedElements.length === 0) return []
    
    return currentFloorplan.elements.filter(element => 
      selectedElements.includes(element.id)
    )
  }, [selectedElements, currentFloorplan])
  
  if (selectedObjects.length === 0) return null
  
  return (
    <>
      {selectedObjects.map(element => (
        <SelectionBox 
          key={`selection-${element.id}`}
          element={element}
        />
      ))}
    </>
  )
}

export default SelectionIndicators
