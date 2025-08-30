'use client'

import React from 'react'
import * as THREE from 'three'

// Snap point indicator component
interface SnapPointIndicatorProps {
  position: [number, number, number]
  type: 'corner' | 'midpoint' | 'center' | 'grid'
  isActive?: boolean
}

export function SnapPointIndicator({ 
  position, 
  type, 
  isActive = false 
}: SnapPointIndicatorProps) {
  const color = isActive ? '#00ff00' : '#ffff00'
  const size = isActive ? 0.8 : 0.5
  
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 8, 6]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

// Snap system utilities
export interface SnapPoint {
  id: string
  position: THREE.Vector3
  type: 'corner' | 'midpoint' | 'center' | 'grid' | 'edge'
  elementId?: string
  normal?: THREE.Vector3
}

export class SnapSystem {
  private snapPoints: Map<string, SnapPoint> = new Map()
  private gridSize: number = 1
  private snapTolerance: number = 2
  private enabled: boolean = true

  setGridSize(size: number) {
    this.gridSize = size
  }

  setSnapTolerance(tolerance: number) {
    this.snapTolerance = tolerance
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  addSnapPoint(point: SnapPoint) {
    this.snapPoints.set(point.id, point)
  }

  removeSnapPoint(id: string) {
    this.snapPoints.delete(id)
  }

  clearSnapPoints() {
    this.snapPoints.clear()
  }

  // Find closest snap point to given position
  findClosestSnapPoint(position: THREE.Vector3): SnapPoint | null {
    if (!this.enabled) return null

    let closestPoint: SnapPoint | null = null
    let closestDistance = this.snapTolerance

    for (const point of Array.from(this.snapPoints.values())) {
      const distance = position.distanceTo(point.position)
      if (distance < closestDistance) {
        closestDistance = distance
        closestPoint = point
      }
    }

    return closestPoint
  }

  // Snap position to grid
  snapToGrid(position: THREE.Vector3): THREE.Vector3 {
    if (!this.enabled) return position.clone()

    return new THREE.Vector3(
      Math.round(position.x / this.gridSize) * this.gridSize,
      Math.round(position.y / this.gridSize) * this.gridSize,
      Math.round(position.z / this.gridSize) * this.gridSize
    )
  }

  // Get all snap points within tolerance of position
  getSnapPointsInRange(position: THREE.Vector3): SnapPoint[] {
    if (!this.enabled) return []

    return Array.from(this.snapPoints.values()).filter(
      point => position.distanceTo(point.position) <= this.snapTolerance
    )
  }

  // Generate grid snap points around a position
  generateGridSnapPoints(center: THREE.Vector3, radius: number): SnapPoint[] {
    const points: SnapPoint[] = []
    const steps = Math.ceil(radius / this.gridSize)

    for (let x = -steps; x <= steps; x++) {
      for (let y = -steps; y <= steps; y++) {
        const gridPos = new THREE.Vector3(
          center.x + x * this.gridSize,
          center.y + y * this.gridSize,
          center.z
        )

        if (center.distanceTo(gridPos) <= radius) {
          points.push({
            id: `grid_${x}_${y}`,
            position: gridPos,
            type: 'grid'
          })
        }
      }
    }

    return points
  }

  // Update snap points for an element
  updateElementSnapPoints(elementId: string, bounds: THREE.Box3) {
    // Remove existing snap points for this element
    const keysToRemove = Array.from(this.snapPoints.keys()).filter(
      key => this.snapPoints.get(key)?.elementId === elementId
    )
    keysToRemove.forEach(key => this.snapPoints.delete(key))

    // Add corner snap points
    const corners = [
      new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
      new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.min.z),
      new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
      new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.min.z),
      new THREE.Vector3(bounds.min.x, bounds.min.y, bounds.max.z),
      new THREE.Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
      new THREE.Vector3(bounds.min.x, bounds.max.y, bounds.max.z),
      new THREE.Vector3(bounds.max.x, bounds.max.y, bounds.max.z)
    ]

    corners.forEach((corner, index) => {
      this.addSnapPoint({
        id: `${elementId}_corner_${index}`,
        position: corner,
        type: 'corner',
        elementId
      })
    })

    // Add center snap point
    const center = bounds.getCenter(new THREE.Vector3())
    this.addSnapPoint({
      id: `${elementId}_center`,
      position: center,
      type: 'center',
      elementId
    })
  }
}
