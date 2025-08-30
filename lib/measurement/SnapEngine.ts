import { Vector3, Raycaster, Object3D, Mesh, BufferGeometry, Box3, Sphere } from 'three'
import { SnapPoint, SnapPointType } from './MeasurementTypes'

/**
 * Advanced snapping engine for precise measurement point selection
 * Provides intelligent snapping to geometry features like corners, edges, centers, etc.
 */
export class SnapEngine {
  private raycaster: Raycaster
  private snapPoints: SnapPoint[] = []
  private tolerance: number = 0.5
  private enabled: boolean = true
  private priorityTypes: SnapPointType[] = ['corner', 'endpoint', 'center', 'midpoint', 'intersection']
  
  constructor(tolerance: number = 0.5) {
    this.raycaster = new Raycaster()
    this.tolerance = tolerance
  }
  
  // ===== CONFIGURATION =====
  
  setTolerance(tolerance: number): void {
    this.tolerance = Math.max(0.1, Math.min(5.0, tolerance))
  }
  
  getTolerance(): number {
    return this.tolerance
  }
  
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }
  
  isEnabled(): boolean {
    return this.enabled
  }
  
  setPriorityTypes(types: SnapPointType[]): void {
    this.priorityTypes = [...types]
  }
  
  // ===== SNAP POINT GENERATION =====
  
  /**
   * Generate snap points from scene objects
   */
  generateSnapPoints(objects: Object3D[], includeGrid: boolean = true): SnapPoint[] {
    this.snapPoints = []
    
    if (!this.enabled) return this.snapPoints
    
    // Generate points from each object
    objects.forEach(object => {
      if (object.visible && !object.userData.skipSnapping) {
        const objectSnaps = this.generateObjectSnapPoints(object)
        this.snapPoints.push(...objectSnaps)
      }
    })
    
    // Generate intersections between objects
    this.generateIntersectionPoints(objects)
    
    // Generate grid points if requested
    if (includeGrid) {
      const gridSnaps = this.generateGridSnapPoints()
      this.snapPoints.push(...gridSnaps)
    }
    
    // Sort by priority and confidence
    this.snapPoints.sort((a, b) => {
      const aPriority = this.getSnapTypePriority(a.type)
      const bPriority = this.getSnapTypePriority(b.type)
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority // Higher priority first
      }
      
      return b.confidence - a.confidence // Higher confidence first
    })
    
    return this.snapPoints
  }
  
  /**
   * Generate snap points for a specific object
   */
  private generateObjectSnapPoints(object: Object3D): SnapPoint[] {
    const snapPoints: SnapPoint[] = []
    
    if (!(object instanceof Mesh) || !object.geometry) {
      console.log('🔍 Skipping object - not a mesh or no geometry:', object.type, object.userData.id)
      return snapPoints
    }
    
    const geometry = object.geometry
    const worldMatrix = object.matrixWorld
    const elementId = object.userData.id
    
    // Get bounding box
    if (!geometry.boundingBox) {
      geometry.computeBoundingBox()
    }
    
    const boundingBox = geometry.boundingBox
    if (!boundingBox) {
      console.log('🔍 No bounding box for object:', elementId)
      return snapPoints
    }
    
    // Corner points
    const corners = [
      new Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.min.z),
      new Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.min.z),
      new Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.min.z),
      new Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.min.z),
      new Vector3(boundingBox.min.x, boundingBox.min.y, boundingBox.max.z),
      new Vector3(boundingBox.max.x, boundingBox.min.y, boundingBox.max.z),
      new Vector3(boundingBox.max.x, boundingBox.max.y, boundingBox.max.z),
      new Vector3(boundingBox.min.x, boundingBox.max.y, boundingBox.max.z),
    ]
    
    corners.forEach((corner, index) => {
      const worldPosition = corner.applyMatrix4(worldMatrix)
      snapPoints.push({
        position: worldPosition,
        type: 'corner',
        elementId,
        confidence: 1.0,
        description: `Corner ${index + 1} of ${object.name || object.type}`,
        normal: this.calculateCornerNormal(corner, boundingBox)
      })
    })
    
    // Center points
    const center = new Vector3().addVectors(boundingBox.min, boundingBox.max).multiplyScalar(0.5)
    snapPoints.push({
      position: center.applyMatrix4(worldMatrix),
      type: 'center',
      elementId,
      confidence: 0.9,
      description: `Center of ${object.name || object.type}`
    })
    
    // Face centers
    const faceCenters = [
      new Vector3(center.x, center.y, boundingBox.min.z), // Front face
      new Vector3(center.x, center.y, boundingBox.max.z), // Back face
      new Vector3(boundingBox.min.x, center.y, center.z), // Left face
      new Vector3(boundingBox.max.x, center.y, center.z), // Right face
      new Vector3(center.x, boundingBox.min.y, center.z), // Bottom face
      new Vector3(center.x, boundingBox.max.y, center.z), // Top face
    ]
    
    const faceNames = ['Front', 'Back', 'Left', 'Right', 'Bottom', 'Top']
    faceCenters.forEach((faceCenter, index) => {
      snapPoints.push({
        position: faceCenter.applyMatrix4(worldMatrix),
        type: 'center',
        elementId,
        confidence: 0.8,
        description: `${faceNames[index]} face center of ${object.name || object.type}`
      })
    })
    
    // Edge midpoints
    const edges = this.generateEdgeMidpoints(boundingBox)
    edges.forEach((edge, index) => {
      snapPoints.push({
        position: edge.applyMatrix4(worldMatrix),
        type: 'midpoint',
        elementId,
        confidence: 0.7,
        description: `Edge midpoint ${index + 1} of ${object.name || object.type}`
      })
    })
    
    // Quadrant points for rounded objects
    if (object.userData.type === 'cylinder' || object.userData.type === 'sphere') {
      const quadrants = this.generateQuadrantPoints(center, boundingBox)
      quadrants.forEach((quadrant, index) => {
        snapPoints.push({
          position: quadrant.applyMatrix4(worldMatrix),
          type: 'quadrant',
          elementId,
          confidence: 0.6,
          description: `Quadrant ${index + 1} of ${object.name || object.type}`
        })
      })
    }
    
    return snapPoints
  }
  
  /**
   * Generate intersection points between objects
   */
  private generateIntersectionPoints(objects: Object3D[]): void {
    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        const obj1 = objects[i]
        const obj2 = objects[j]
        
        if (obj1 instanceof Mesh && obj2 instanceof Mesh) {
          const intersections = this.findObjectIntersections(obj1, obj2)
          this.snapPoints.push(...intersections)
        }
      }
    }
  }
  
  /**
   * Generate grid snap points
   */
  private generateGridSnapPoints(gridSize: number = 1, extent: number = 50): SnapPoint[] {
    const snapPoints: SnapPoint[] = []
    const halfExtent = extent / 2
    
    for (let x = -halfExtent; x <= halfExtent; x += gridSize) {
      for (let z = -halfExtent; z <= halfExtent; z += gridSize) {
        snapPoints.push({
          position: new Vector3(x, 0, z),
          type: 'grid',
          confidence: 0.3,
          description: `Grid point (${x}, ${z})`
        })
      }
    }
    
    return snapPoints
  }
  
  // ===== SNAP POINT FINDING =====
  
  /**
   * Find the best snap point for a given position
   */
  findBestSnapPoint(position: Vector3, mousePosition?: Vector3): SnapPoint | null {
    if (!this.enabled || this.snapPoints.length === 0) return null
    
    const candidates: Array<{ point: SnapPoint; distance: number; score: number }> = []
    
    // Find all candidates within tolerance
    for (const snapPoint of this.snapPoints) {
      const distance = position.distanceTo(snapPoint.position)
      
      if (distance <= this.tolerance) {
        const priority = this.getSnapTypePriority(snapPoint.type)
        const proximityScore = 1 - (distance / this.tolerance) // Closer = higher score
        const score = (priority * 0.6) + (proximityScore * 0.3) + (snapPoint.confidence * 0.1)
        
        candidates.push({
          point: snapPoint,
          distance,
          score
        })
      }
    }
    
    if (candidates.length === 0) return null
    
    // Sort by score and return the best
    candidates.sort((a, b) => b.score - a.score)
    return candidates[0].point
  }
  
  /**
   * Find all snap points within tolerance
   */
  findSnapPointsNear(position: Vector3): SnapPoint[] {
    return this.snapPoints.filter(snap => 
      position.distanceTo(snap.position) <= this.tolerance
    )
  }
  
  /**
   * Find snap points by type
   */
  findSnapPointsByType(type: SnapPointType): SnapPoint[] {
    return this.snapPoints.filter(snap => snap.type === type)
  }
  
  /**
   * Find snap points for a specific element
   */
  findSnapPointsForElement(elementId: string): SnapPoint[] {
    return this.snapPoints.filter(snap => snap.elementId === elementId)
  }
  
  // ===== SNAP PREVIEW AND GUIDANCE =====
  
  /**
   * Generate snap preview information for UI
   */
  generateSnapPreview(position: Vector3): {
    activeSnap: SnapPoint | null
    nearbySnaps: SnapPoint[]
    snapLine?: { start: Vector3; end: Vector3 }
    snapCircle?: { center: Vector3; radius: number }
  } {
    const activeSnap = this.findBestSnapPoint(position)
    const nearbySnaps = this.findSnapPointsNear(position).slice(0, 5) // Limit to 5 for performance
    
    let snapLine: { start: Vector3; end: Vector3 } | undefined
    let snapCircle: { center: Vector3; radius: number } | undefined
    
    if (activeSnap) {
      // Generate snap guides based on type
      switch (activeSnap.type) {
        case 'corner':
        case 'endpoint':
          // Show crosshairs
          snapLine = {
            start: new Vector3(activeSnap.position.x - 2, activeSnap.position.y, activeSnap.position.z),
            end: new Vector3(activeSnap.position.x + 2, activeSnap.position.y, activeSnap.position.z)
          }
          break
          
        case 'center':
          // Show circle
          snapCircle = {
            center: activeSnap.position,
            radius: 1.0
          }
          break
          
        case 'midpoint':
          // Show small circle
          snapCircle = {
            center: activeSnap.position,
            radius: 0.5
          }
          break
          
        case 'grid':
          // Show grid intersection
          snapLine = {
            start: new Vector3(activeSnap.position.x, activeSnap.position.y - 0.5, activeSnap.position.z),
            end: new Vector3(activeSnap.position.x, activeSnap.position.y + 0.5, activeSnap.position.z)
          }
          break
      }
    }
    
    return {
      activeSnap,
      nearbySnaps,
      snapLine,
      snapCircle
    }
  }
  
  // ===== UTILITY METHODS =====
  
  /**
   * Get priority value for snap type (higher = more important)
   */
  private getSnapTypePriority(type: SnapPointType): number {
    const priorities: Record<SnapPointType, number> = {
      endpoint: 10,
      corner: 9,
      intersection: 8,
      center: 7,
      perpendicular: 6,
      tangent: 5,
      midpoint: 4,
      edge: 3,
      quadrant: 2,
      grid: 1
    }
    
    return priorities[type] || 0
  }
  
  /**
   * Calculate corner normal for better snapping feedback
   */
  private calculateCornerNormal(corner: Vector3, boundingBox: Box3): Vector3 {
    const center = new Vector3().addVectors(boundingBox.min, boundingBox.max).multiplyScalar(0.5)
    return new Vector3().subVectors(corner, center).normalize()
  }
  
  /**
   * Generate edge midpoints for a bounding box
   */
  private generateEdgeMidpoints(boundingBox: Box3): Vector3[] {
    const min = boundingBox.min
    const max = boundingBox.max
    
    return [
      // Bottom edges
      new Vector3((min.x + max.x) / 2, min.y, min.z),
      new Vector3((min.x + max.x) / 2, min.y, max.z),
      new Vector3(min.x, min.y, (min.z + max.z) / 2),
      new Vector3(max.x, min.y, (min.z + max.z) / 2),
      
      // Top edges
      new Vector3((min.x + max.x) / 2, max.y, min.z),
      new Vector3((min.x + max.x) / 2, max.y, max.z),
      new Vector3(min.x, max.y, (min.z + max.z) / 2),
      new Vector3(max.x, max.y, (min.z + max.z) / 2),
      
      // Vertical edges
      new Vector3(min.x, (min.y + max.y) / 2, min.z),
      new Vector3(max.x, (min.y + max.y) / 2, min.z),
      new Vector3(min.x, (min.y + max.y) / 2, max.z),
      new Vector3(max.x, (min.y + max.y) / 2, max.z),
    ]
  }
  
  /**
   * Generate quadrant points for rounded objects
   */
  private generateQuadrantPoints(center: Vector3, boundingBox: Box3): Vector3[] {
    const radius = Math.min(
      (boundingBox.max.x - boundingBox.min.x) / 2,
      (boundingBox.max.z - boundingBox.min.z) / 2
    )
    
    return [
      new Vector3(center.x + radius, center.y, center.z),
      new Vector3(center.x, center.y, center.z + radius),
      new Vector3(center.x - radius, center.y, center.z),
      new Vector3(center.x, center.y, center.z - radius),
    ]
  }
  
  /**
   * Find intersection points between two objects (simplified)
   */
  private findObjectIntersections(obj1: Mesh, obj2: Mesh): SnapPoint[] {
    const intersections: SnapPoint[] = []
    
    // This is a simplified implementation
    // In a full implementation, you would use proper geometric intersection algorithms
    
    if (!obj1.geometry.boundingBox) obj1.geometry.computeBoundingBox()
    if (!obj2.geometry.boundingBox) obj2.geometry.computeBoundingBox()
    
    const box1 = obj1.geometry.boundingBox!.clone().applyMatrix4(obj1.matrixWorld)
    const box2 = obj2.geometry.boundingBox!.clone().applyMatrix4(obj2.matrixWorld)
    
    // Check if bounding boxes intersect
    if (box1.intersectsBox(box2)) {
      // Simple intersection point at the center of overlap
      const intersection = new Vector3()
      intersection.x = Math.max(box1.min.x, box2.min.x) + Math.min(box1.max.x, box2.max.x)
      intersection.y = Math.max(box1.min.y, box2.min.y) + Math.min(box1.max.y, box2.max.y)
      intersection.z = Math.max(box1.min.z, box2.min.z) + Math.min(box1.max.z, box2.max.z)
      intersection.multiplyScalar(0.5)
      
      intersections.push({
        position: intersection,
        type: 'intersection',
        confidence: 0.8,
        description: `Intersection of ${obj1.name || 'Object'} and ${obj2.name || 'Object'}`,
        elementId: undefined // No single element ID for intersections
      })
    }
    
    return intersections
  }
  
  /**
   * Clear all cached snap points
   */
  clearSnapPoints(): void {
    this.snapPoints = []
  }
  
  /**
   * Get all current snap points
   */
  getSnapPoints(): SnapPoint[] {
    return [...this.snapPoints]
  }
  
  /**
   * Get snap statistics for debugging/optimization
   */
  getSnapStatistics(): {
    total: number
    byType: Record<SnapPointType, number>
    byConfidence: { high: number; medium: number; low: number }
  } {
    const stats = {
      total: this.snapPoints.length,
      byType: {} as Record<SnapPointType, number>,
      byConfidence: { high: 0, medium: 0, low: 0 }
    }
    
    this.snapPoints.forEach(snap => {
      // Count by type
      stats.byType[snap.type] = (stats.byType[snap.type] || 0) + 1
      
      // Count by confidence
      if (snap.confidence >= 0.8) {
        stats.byConfidence.high++
      } else if (snap.confidence >= 0.5) {
        stats.byConfidence.medium++
      } else {
        stats.byConfidence.low++
      }
    })
    
    return stats
  }
}

// Export singleton instance
export const snapEngine = new SnapEngine()
