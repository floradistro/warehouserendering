'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'
import { PlumbingSnapPoint, PlumbingSnapType, PlumbingSystemType } from '@/lib/plumbing/PlumbingSnapPoints'

/**
 * PLUMBING SNAP INDICATORS
 * 
 * Visual indicators for plumbing-specific snap points in the 3D scene.
 * Shows industry-standard locations for pipe connections, fixtures, and supports.
 */

interface PlumbingSnapIndicatorsProps {
  snapPoints: PlumbingSnapPoint[]
  activeSnapPoint?: PlumbingSnapPoint | null
  currentSystemType?: PlumbingSystemType
  visible?: boolean
  opacity?: number
}

export const PlumbingSnapIndicators: React.FC<PlumbingSnapIndicatorsProps> = ({
  snapPoints,
  activeSnapPoint,
  currentSystemType,
  visible = true,
  opacity = 0.6
}) => {
  
  // Filter snap points based on current system type
  const filteredSnapPoints = useMemo(() => {
    if (!currentSystemType) return snapPoints
    
    return snapPoints.filter(point => 
      point.systemTypes.includes(currentSystemType)
    )
  }, [snapPoints, currentSystemType])

  // Get color for snap point type
  const getSnapPointColor = (snapPoint: PlumbingSnapPoint): string => {
    if (activeSnapPoint && activeSnapPoint === snapPoint) {
      return '#00FF00' // Bright green for active
    }

    switch (snapPoint.type) {
      case PlumbingSnapType.WALL_CENTER:
      case PlumbingSnapType.WALL_CORNER:
      case PlumbingSnapType.WALL_PENETRATION:
        return '#4A90E2' // Blue for wall points
      
      case PlumbingSnapType.SINK_SUPPLY:
      case PlumbingSnapType.TOILET_SUPPLY:
      case PlumbingSnapType.SHOWER_SUPPLY:
        return '#FF6B6B' // Red for supply points
      
      case PlumbingSnapType.SINK_DRAIN:
      case PlumbingSnapType.TOILET_DRAIN:
      case PlumbingSnapType.SHOWER_DRAIN:
      case PlumbingSnapType.FLOOR_DRAIN:
        return '#4ECDC4' // Teal for drain points
      
      case PlumbingSnapType.WATER_HEATER:
      case PlumbingSnapType.PUMP_CONNECTION:
      case PlumbingSnapType.TANK_CONNECTION:
        return '#FFD93D' // Yellow for equipment
      
      case PlumbingSnapType.PIPE_SUPPORT:
      case PlumbingSnapType.CEILING_SUPPORT:
        return '#A8E6CF' // Light green for supports
      
      case PlumbingSnapType.BRANCH_CONNECTION:
        return '#FF8B94' // Pink for branches
      
      case PlumbingSnapType.ACCESS_POINT:
        return '#C7CEEA' // Light purple for access
      
      default:
        return '#CCCCCC' // Gray for unknown
    }
  }

  // Get size for snap point based on type and confidence
  const getSnapPointSize = (snapPoint: PlumbingSnapPoint): number => {
    const baseSize = 0.1
    const confidenceMultiplier = 0.5 + (snapPoint.confidence * 0.5) // 0.5 to 1.0
    
    switch (snapPoint.type) {
      case PlumbingSnapType.WATER_HEATER:
      case PlumbingSnapType.PUMP_CONNECTION:
        return baseSize * 1.5 * confidenceMultiplier // Larger for equipment
      
      case PlumbingSnapType.SINK_SUPPLY:
      case PlumbingSnapType.TOILET_SUPPLY:
      case PlumbingSnapType.SHOWER_SUPPLY:
        return baseSize * 1.2 * confidenceMultiplier // Medium for fixtures
      
      case PlumbingSnapType.PIPE_SUPPORT:
        return baseSize * 0.8 * confidenceMultiplier // Smaller for supports
      
      default:
        return baseSize * confidenceMultiplier
    }
  }

  // Get shape for snap point type
  const getSnapPointGeometry = (snapPoint: PlumbingSnapPoint): THREE.BufferGeometry => {
    const size = getSnapPointSize(snapPoint)
    
    switch (snapPoint.type) {
      case PlumbingSnapType.WALL_CENTER:
      case PlumbingSnapType.WALL_CORNER:
      case PlumbingSnapType.WALL_PENETRATION:
        return new THREE.BoxGeometry(size, size * 0.5, size) // Rectangular for wall points
      
      case PlumbingSnapType.SINK_SUPPLY:
      case PlumbingSnapType.TOILET_SUPPLY:
      case PlumbingSnapType.SHOWER_SUPPLY:
        return new THREE.ConeGeometry(size, size * 2, 6) // Cone pointing up for supply
      
      case PlumbingSnapType.SINK_DRAIN:
      case PlumbingSnapType.TOILET_DRAIN:
      case PlumbingSnapType.SHOWER_DRAIN:
      case PlumbingSnapType.FLOOR_DRAIN:
        return new THREE.CylinderGeometry(size, size * 1.2, size * 0.5, 8) // Funnel shape for drains
      
      case PlumbingSnapType.WATER_HEATER:
      case PlumbingSnapType.PUMP_CONNECTION:
      case PlumbingSnapType.TANK_CONNECTION:
        return new THREE.OctahedronGeometry(size) // Diamond shape for equipment
      
      case PlumbingSnapType.PIPE_SUPPORT:
      case PlumbingSnapType.CEILING_SUPPORT:
        return new THREE.TetrahedronGeometry(size) // Pyramid for supports
      
      case PlumbingSnapType.BRANCH_CONNECTION:
        return new THREE.SphereGeometry(size, 8, 6) // Sphere for branches
      
      default:
        return new THREE.SphereGeometry(size, 8, 6) // Default sphere
    }
  }

  if (!visible || filteredSnapPoints.length === 0) {
    return null
  }

  return (
    <group>
      {filteredSnapPoints.map((snapPoint, index) => {
        const geometry = getSnapPointGeometry(snapPoint)
        const color = getSnapPointColor(snapPoint)
        const isActive = activeSnapPoint === snapPoint
        const finalOpacity = isActive ? 1.0 : opacity

        return (
          <mesh
            key={`plumbing-snap-${index}`}
            position={[snapPoint.position.x, snapPoint.position.y, snapPoint.position.z]}
            geometry={geometry}
            userData={{ 
              snapPoint,
              type: 'plumbing_snap_point',
              description: snapPoint.description
            }}
          >
            <meshStandardMaterial
              color={color}
              transparent={true}
              opacity={finalOpacity}
              emissive={color}
              emissiveIntensity={isActive ? 0.3 : 0.1}
              roughness={0.3}
              metalness={0.1}
            />
            
            {/* Add a subtle outline for better visibility */}
            <mesh scale={[1.1, 1.1, 1.1]}>
              <meshBasicMaterial
                color={color}
                transparent={true}
                opacity={finalOpacity * 0.3}
                side={THREE.BackSide}
              />
            </mesh>

            {/* Add text label for active snap point */}
            {isActive && (
              <group position={[0, getSnapPointSize(snapPoint) + 0.2, 0]}>
                {/* Background for text readability */}
                <mesh>
                  <planeGeometry args={[2, 0.3]} />
                  <meshBasicMaterial
                    color="#000000"
                    transparent={true}
                    opacity={0.7}
                  />
                </mesh>
                {/* TODO: Add text geometry for label */}
              </group>
            )}
          </mesh>
        )
      })}

      {/* Legend indicators */}
      {visible && (
        <group position={[0, 0, 0]}>
          {/* Add floating legend showing snap point types */}
          {/* This could be expanded to show a legend of different snap point types */}
        </group>
      )}
    </group>
  )
}

export default PlumbingSnapIndicators
