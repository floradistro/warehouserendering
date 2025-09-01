'use client'

import React, { useMemo } from 'react'
import * as THREE from 'three'
import { PipePoint } from '@/lib/plumbing/PlumbingSystem'
import { PlumbingSnapPoint } from '@/lib/plumbing/PlumbingSnapPoints'

/**
 * PIPE ALIGNMENT GUIDES
 * 
 * Canva-style alignment indicators for pipe routing that show when:
 * - Pipes are level (horizontal alignment)
 * - Pipes are plumb (vertical alignment)  
 * - Hover point aligns with existing snap points
 * - Multiple pipes are at the same height
 */

export interface AlignmentGuide {
  type: 'horizontal' | 'vertical' | 'height'
  position: THREE.Vector3
  direction: THREE.Vector3
  length: number
  color: string
  opacity: number
  description: string
  confidence: number
}

interface PipeAlignmentGuidesProps {
  currentPath: PipePoint[]
  hoverPoint: THREE.Vector3 | null
  existingPipes: PipePoint[][]
  snapPoints: PlumbingSnapPoint[]
  visible?: boolean
  tolerance?: number
}

export const PipeAlignmentGuides: React.FC<PipeAlignmentGuidesProps> = ({
  currentPath,
  hoverPoint,
  existingPipes,
  snapPoints,
  visible = true,
  tolerance = 0.25 // Quarter foot tolerance for alignment
}) => {

  // Calculate alignment guides based on current state with stability
  const alignmentGuides = useMemo(() => {
    if (!visible || !hoverPoint || currentPath.length === 0) return []

    const guides: AlignmentGuide[] = []
    const lastPoint = currentPath[currentPath.length - 1]

    // 1. HORIZONTAL ALIGNMENT GUIDES (Level pipes)
    // Check if hover point is level with last point with smoother tolerance
    const heightDiff = Math.abs(hoverPoint.y - lastPoint.y)
    if (heightDiff <= tolerance) {
      // Create horizontal guide line with stable positioning
      const extendDistance = Math.max(5, Math.abs(hoverPoint.x - lastPoint.x) + 2)
      const start = new THREE.Vector3(
        Math.min(lastPoint.x, hoverPoint.x) - extendDistance,
        lastPoint.y,
        lastPoint.z
      )
      const end = new THREE.Vector3(
        Math.max(lastPoint.x, hoverPoint.x) + extendDistance,
        lastPoint.y,
        lastPoint.z
      )
      
      // Calculate confidence with smoother curve
      const confidence = Math.pow(1.0 - (heightDiff / tolerance), 2)
      
      guides.push({
        type: 'horizontal',
        position: start,
        direction: new THREE.Vector3().subVectors(end, start).normalize(),
        length: start.distanceTo(end),
        color: '#00FF88', // Bright green for level
        opacity: 0.6 + (confidence * 0.4), // Variable opacity based on confidence
        description: `Level at ${lastPoint.y.toFixed(1)}' height`,
        confidence: confidence
      })
    }

    // 2. VERTICAL ALIGNMENT GUIDES (Plumb pipes)
    // Check if hover point is plumb with last point (same X or Z) with better stability
    const xDiff = Math.abs(hoverPoint.x - lastPoint.x)
    const zDiff = Math.abs(hoverPoint.z - lastPoint.z)
    
    // Only show the strongest vertical alignment to avoid competing guides
    const strongestVertical = xDiff < zDiff ? 'x' : 'z'
    const strongestDiff = Math.min(xDiff, zDiff)
    
    if (strongestDiff <= tolerance) {
      const confidence = Math.pow(1.0 - (strongestDiff / tolerance), 2)
      const extendDistance = Math.max(3, Math.abs(hoverPoint.y - lastPoint.y) + 1)
      
      if (strongestVertical === 'x' && xDiff <= tolerance) {
        // Vertical guide along X axis
        const start = new THREE.Vector3(
          lastPoint.x,
          Math.min(lastPoint.y, hoverPoint.y) - extendDistance,
          lastPoint.z
        )
        const end = new THREE.Vector3(
          lastPoint.x,
          Math.max(lastPoint.y, hoverPoint.y) + extendDistance,
          lastPoint.z
        )
        
        guides.push({
          type: 'vertical',
          position: start,
          direction: new THREE.Vector3().subVectors(end, start).normalize(),
          length: start.distanceTo(end),
          color: '#FF6600', // Orange for vertical
          opacity: 0.5 + (confidence * 0.4), // Variable opacity
          description: `Plumb at X=${lastPoint.x.toFixed(1)}'`,
          confidence: confidence
        })
      } else if (strongestVertical === 'z' && zDiff <= tolerance) {
        // Vertical guide along Z axis
        const start = new THREE.Vector3(
          lastPoint.x,
          Math.min(lastPoint.y, hoverPoint.y) - extendDistance,
          lastPoint.z
        )
        const end = new THREE.Vector3(
          lastPoint.x,
          Math.max(lastPoint.y, hoverPoint.y) + extendDistance,
          lastPoint.z
        )
        
        guides.push({
          type: 'vertical',
          position: start,
          direction: new THREE.Vector3().subVectors(end, start).normalize(),
          length: start.distanceTo(end),
          color: '#FF6600', // Orange for vertical
          opacity: 0.5 + (confidence * 0.4), // Variable opacity
          description: `Plumb at Z=${lastPoint.z.toFixed(1)}'`,
          confidence: confidence
        })
      }
    }

    // 3. SNAP POINT HEIGHT ALIGNMENT
    // Check if hover point aligns with nearby snap points at same height
    const nearbySnapPoints = snapPoints.filter(snap => {
      const distance = snap.position.distanceTo(hoverPoint)
      return distance > 1.0 && distance < 20.0 // Not too close, not too far
    })

    nearbySnapPoints.forEach(snapPoint => {
      const heightDiff = Math.abs(snapPoint.position.y - hoverPoint.y)
      if (heightDiff <= tolerance) {
        // Create height alignment guide
        const start = new THREE.Vector3(
          Math.min(snapPoint.position.x, hoverPoint.x) - 3,
          snapPoint.position.y,
          Math.min(snapPoint.position.z, hoverPoint.z) - 3
        )
        const end = new THREE.Vector3(
          Math.max(snapPoint.position.x, hoverPoint.x) + 3,
          snapPoint.position.y,
          Math.max(snapPoint.position.z, hoverPoint.z) + 3
        )

        guides.push({
          type: 'height',
          position: start,
          direction: new THREE.Vector3().subVectors(end, start).normalize(),
          length: start.distanceTo(end),
          color: '#FFFF00', // Yellow for height alignment
          opacity: 0.6,
          description: `Height aligned with ${snapPoint.description}`,
          confidence: 1.0 - (heightDiff / tolerance)
        })
      }
    })

    // 4. EXISTING PIPE ALIGNMENT
    // Check if hover point aligns with existing pipes
    existingPipes.forEach((pipePath, pipeIndex) => {
      pipePath.forEach((pipePoint, pointIndex) => {
        const heightDiff = Math.abs(pipePoint.y - hoverPoint.y)
        const distance = new THREE.Vector3(pipePoint.x, 0, pipePoint.z)
          .distanceTo(new THREE.Vector3(hoverPoint.x, 0, hoverPoint.z))
        
        // Only show guide if points are at similar height and reasonable distance apart
        if (heightDiff <= tolerance && distance > 2.0 && distance < 30.0) {
          const start = new THREE.Vector3(
            Math.min(pipePoint.x, hoverPoint.x) - 2,
            pipePoint.y,
            Math.min(pipePoint.z, hoverPoint.z) - 2
          )
          const end = new THREE.Vector3(
            Math.max(pipePoint.x, hoverPoint.x) + 2,
            pipePoint.y,
            Math.max(pipePoint.z, hoverPoint.z) + 2
          )

          guides.push({
            type: 'height',
            position: start,
            direction: new THREE.Vector3().subVectors(end, start).normalize(),
            length: start.distanceTo(end),
            color: '#00CCFF', // Light blue for pipe alignment
            opacity: 0.5,
            description: `Aligned with existing pipe at ${pipePoint.y.toFixed(1)}'`,
            confidence: 1.0 - (heightDiff / tolerance)
          })
        }
      })
    })

    return guides
  }, [currentPath, hoverPoint, existingPipes, snapPoints, visible, tolerance])

  if (!visible || alignmentGuides.length === 0) {
    return null
  }

  return (
    <group>
      {alignmentGuides.map((guide, index) => {
        // Create guide line geometry
        const points = [
          guide.position,
          new THREE.Vector3().addVectors(
            guide.position,
            guide.direction.clone().multiplyScalar(guide.length)
          )
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)

        return (
          <group key={`alignment-guide-${index}`}>
            {/* Main guide line */}
            <line>
              <bufferGeometry attach="geometry" {...geometry} />
              <lineBasicMaterial
                attach="material"
                color={guide.color}
                transparent={true}
                opacity={guide.opacity * guide.confidence}
                linewidth={2}
              />
            </line>

            {/* Subtle dashed line for extended alignment */}
            <line>
              <bufferGeometry attach="geometry" {...geometry} />
              <lineDashedMaterial
                attach="material"
                color={guide.color}
                transparent={true}
                opacity={guide.opacity * guide.confidence * 0.5}
                dashSize={0.5}
                gapSize={0.3}
                linewidth={1}
              />
            </line>

            {/* End point indicators */}
            {points.map((point, pointIndex) => (
              <mesh
                key={`guide-point-${pointIndex}`}
                position={[point.x, point.y, point.z]}
              >
                <sphereGeometry args={[0.05, 8, 6]} />
                <meshBasicMaterial
                  color={guide.color}
                  transparent={true}
                  opacity={guide.opacity * guide.confidence}
                />
              </mesh>
            ))}

            {/* Height indicator text (for height alignment guides) */}
            {guide.type === 'height' && (
              <group position={[guide.position.x, guide.position.y + 0.5, guide.position.z]}>
                {/* Background for text readability */}
                <mesh>
                  <planeGeometry args={[2, 0.3]} />
                  <meshBasicMaterial
                    color="#000000"
                    transparent={true}
                    opacity={0.6}
                  />
                </mesh>
                {/* TODO: Add text geometry showing height value */}
              </group>
            )}
          </group>
        )
      })}

      {/* Alignment confidence indicator */}
      {alignmentGuides.length > 0 && (
        <group position={[0, 10, 0]}>
          {/* Floating indicator showing alignment status */}
          <mesh>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshBasicMaterial
              color={alignmentGuides[0].color}
              transparent={true}
              opacity={0.8}
            />
          </mesh>
        </group>
      )}
    </group>
  )
}

export default PipeAlignmentGuides
