'use client'

import React from 'react'
import * as THREE from 'three'

interface SnapPoint {
  position: THREE.Vector3
  type: 'wall-end' | 'wall-middle' | 'wall-center' | 'wall-quarter' | 'wall-edge' | 'corner' | 'grid' | 'element-center' | 'element-edge'
  confidence: number
  description?: string
}

interface SnapIndicatorsProps {
  snapPoints: SnapPoint[]
  activeSnapPoint: SnapPoint | null
  showIndicators: boolean
}

export default function SnapIndicators({ snapPoints, activeSnapPoint, showIndicators }: SnapIndicatorsProps) {
  if (!showIndicators || snapPoints.length === 0) {
    return null
  }

  return (
    <>
      {snapPoints.map((snapPoint, index) => {
        const isActive = activeSnapPoint && 
          activeSnapPoint.position.equals(snapPoint.position) && 
          activeSnapPoint.type === snapPoint.type

        // Different colors and sizes based on snap type
        let color = '#888888' // Default gray
        let size = 0.3
        let opacity = 0.6

        switch (snapPoint.type) {
          case 'wall-center':
            color = '#00ff00' // Bright green for center snaps
            size = 0.6
            opacity = 1.0
            break
          case 'wall-quarter':
            color = '#ffff00' // Yellow for quarter points
            size = 0.4
            opacity = 0.8
            break
          case 'wall-end':
            color = '#ff6600' // Orange for wall ends
            size = 0.4
            opacity = 0.8
            break
          case 'wall-edge':
            color = '#66ccff' // Light blue for 1-foot intervals
            size = 0.3
            opacity = 0.7
            break
          case 'grid':
            color = '#cccccc' // Light gray for grid
            size = 0.2
            opacity = 0.5
            break
        }

        // Make active snap point more prominent
        if (isActive) {
          size *= 1.5
          opacity = 1.0
        }

        return (
          <mesh
            key={`${snapPoint.type}-${index}`}
            position={[snapPoint.position.x, snapPoint.position.y + 0.1, snapPoint.position.z]}
          >
            <sphereGeometry args={[size, 8, 6]} />
            <meshBasicMaterial 
              color={color} 
              transparent 
              opacity={opacity}
              depthTest={false}
            />
            
            {/* Add crosshair and ring indicators for center snaps */}
            {snapPoint.type === 'wall-center' && (
              <>
                {/* Ring indicator */}
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                  <ringGeometry args={[size * 1.2, size * 1.5, 16]} />
                  <meshBasicMaterial 
                    color="#00ff00" 
                    transparent 
                    opacity={0.6}
                    side={THREE.DoubleSide}
                  />
                </mesh>
                
                {/* Crosshair lines */}
                <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[size * 3, 0.05]} />
                  <meshBasicMaterial 
                    color="#00ff00" 
                    transparent 
                    opacity={0.8}
                  />
                </mesh>
                <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
                  <planeGeometry args={[size * 3, 0.05]} />
                  <meshBasicMaterial 
                    color="#00ff00" 
                    transparent 
                    opacity={0.8}
                  />
                </mesh>
              </>
            )}
            
            {/* Pulsing effect for active snap point */}
            {isActive && (
              <mesh>
                <sphereGeometry args={[size * 1.8, 8, 6]} />
                <meshBasicMaterial 
                  color={color} 
                  transparent 
                  opacity={0.3}
                  depthTest={false}
                />
              </mesh>
            )}
          </mesh>
        )
      })}
    </>
  )
}
