import * as THREE from 'three'
import { FloorplanElement } from './store'

/**
 * SIMPLE, RELIABLE WALL SNAPPING SYSTEM
 * Just basic endpoint and perpendicular snapping - no complex gap detection
 */

export interface WallSnapPoint {
  position: THREE.Vector3
  type: 'wall-start' | 'wall-end' | 'wall-gap' | 'wall-perpendicular' | 'corner' | 'door-in-wall'
  targetWall?: FloorplanElement
  suggestedDimensions?: { width: number; height: number; depth: number }
  suggestedRotation?: number
  confidence: number
  description: string
  constrainToBounds?: { minX: number; maxX: number; minY: number; maxY: number }
}

export class IntelligentWallSystem {
  private snapTolerance: number = 1.0

  constructor(snapTolerance: number = 1.0) {
    this.snapTolerance = snapTolerance
  }

  /**
   * Enhanced wall snap detection with perpendicular alignment and thickness compensation
   */
  findWallSnapPoints(
    cursorPosition: THREE.Vector3,
    existingWalls: FloorplanElement[],
    placementDimensions: { width: number; height: number; depth: number }
  ): WallSnapPoint[] {
    console.log('🔍 Enhanced IntelligentWallSystem.findWallSnapPoints called')
    console.log('Cursor position:', cursorPosition.x.toFixed(2), cursorPosition.z.toFixed(2))
    console.log('Existing walls count:', existingWalls.length)
    console.log('Placement dimensions:', placementDimensions)
    
    const snapPoints: WallSnapPoint[] = []
    const tolerance = this.snapTolerance * 2 // More precise tolerance
    
    console.log('Effective tolerance:', tolerance)
    
    for (const wall of existingWalls) {
      if (wall.metadata?.isPreview) continue
      
      console.log(`Checking wall ${wall.id}:`, wall.position, wall.dimensions, wall.rotation)
      
      const { start, end } = this.getWallEndpoints(wall)
      const wallVector = end.clone().sub(start).normalize()
      const wallLength = start.distanceTo(end)
      
      // 1. ENDPOINT SNAPPING - Perfect flush connection
      const startDist = cursorPosition.distanceTo(start)
      const endDist = cursorPosition.distanceTo(end)
      
      if (startDist < tolerance) {
        console.log('✅ Adding flush start connection')
        snapPoints.push({
          position: start,
          type: 'wall-start',
          targetWall: wall,
          confidence: 1.0 - (startDist / tolerance),
          description: `Flush connection to wall start`,
          suggestedRotation: this.calculateOptimalRotation(wallVector, 'start')
        })
      }
      
      if (endDist < tolerance) {
        console.log('✅ Adding flush end connection')
        snapPoints.push({
          position: end,
          type: 'wall-end',
          targetWall: wall,
          confidence: 1.0 - (endDist / tolerance),
          description: `Flush connection to wall end`,
          suggestedRotation: this.calculateOptimalRotation(wallVector, 'end')
        })
      }
      
      // 2. PERPENDICULAR SNAPPING - T-junction connections with thickness compensation
      const perpendicular = new THREE.Vector3(-wallVector.z, 0, wallVector.x)
      const wallThickness = wall.dimensions.height || 1 // Height is thickness for walls
      const newWallThickness = placementDimensions.height || 1
      
      // Calculate perpendicular attachment points with proper thickness compensation
      const attachPoint1 = start.clone().add(perpendicular.clone().multiplyScalar(wallThickness / 2 + newWallThickness / 2))
      const attachPoint2 = start.clone().add(perpendicular.clone().multiplyScalar(-(wallThickness / 2 + newWallThickness / 2)))
      const attachPoint3 = end.clone().add(perpendicular.clone().multiplyScalar(wallThickness / 2 + newWallThickness / 2))
      const attachPoint4 = end.clone().add(perpendicular.clone().multiplyScalar(-(wallThickness / 2 + newWallThickness / 2)))
      
      // Check all perpendicular attachment points
      const perpPoints = [
        { point: attachPoint1, desc: 'T-junction at start (side 1)' },
        { point: attachPoint2, desc: 'T-junction at start (side 2)' },
        { point: attachPoint3, desc: 'T-junction at end (side 1)' },
        { point: attachPoint4, desc: 'T-junction at end (side 2)' }
      ]
      
      for (const { point, desc } of perpPoints) {
        const dist = cursorPosition.distanceTo(point)
        if (dist < tolerance) {
          console.log(`✅ Adding perpendicular snap: ${desc}`)
          snapPoints.push({
            position: point,
            type: 'wall-perpendicular',
            targetWall: wall,
            confidence: 0.9 - (dist / tolerance),
            description: desc,
            suggestedRotation: Math.atan2(perpendicular.z, perpendicular.x)
          })
        }
      }
      
      // 3. MIDPOINT SNAPPING - Along wall face with thickness compensation
      const midPoint = start.clone().lerp(end, 0.5)
      const midDist = cursorPosition.distanceTo(midPoint)
      
      if (midDist < tolerance) {
        // Calculate both sides of the wall for midpoint attachment
        const midAttach1 = midPoint.clone().add(perpendicular.clone().multiplyScalar(wallThickness / 2 + newWallThickness / 2))
        const midAttach2 = midPoint.clone().add(perpendicular.clone().multiplyScalar(-(wallThickness / 2 + newWallThickness / 2)))
        
        const midDist1 = cursorPosition.distanceTo(midAttach1)
        const midDist2 = cursorPosition.distanceTo(midAttach2)
        
        const bestMidPoint = midDist1 < midDist2 ? midAttach1 : midAttach2
        const bestMidDist = Math.min(midDist1, midDist2)
        
        if (bestMidDist < tolerance) {
          console.log('✅ Adding midpoint perpendicular snap')
          snapPoints.push({
            position: bestMidPoint,
            type: 'wall-perpendicular',
            targetWall: wall,
            confidence: 0.85 - (bestMidDist / tolerance),
            description: `T-junction at wall midpoint`,
            suggestedRotation: Math.atan2(perpendicular.z, perpendicular.x)
          })
        }
      }
      
      // 4. PARALLEL ALIGNMENT - Extension of existing walls
      const projectedPoint = this.projectPointOntoLine(cursorPosition, start, end)
      const projectedDist = cursorPosition.distanceTo(projectedPoint)
      
      if (projectedDist < tolerance && this.isPointOnLineSegment(projectedPoint, start, end, wallLength + tolerance)) {
        console.log('✅ Adding parallel extension snap')
        
        // Determine if extending from start or end
        const distToStart = projectedPoint.distanceTo(start)
        const distToEnd = projectedPoint.distanceTo(end)
        
        let extensionPoint: THREE.Vector3
        let extensionType: string
        
        if (distToStart < tolerance) {
          // Extending from start
          extensionPoint = start.clone().add(wallVector.clone().multiplyScalar(-placementDimensions.width))
          extensionType = 'Extension from wall start'
        } else if (distToEnd < tolerance) {
          // Extending from end  
          extensionPoint = end.clone().add(wallVector.clone().multiplyScalar(placementDimensions.width))
          extensionType = 'Extension from wall end'
        } else {
          // Inline with existing wall
          extensionPoint = projectedPoint
          extensionType = 'Inline with existing wall'
        }
        
        snapPoints.push({
          position: extensionPoint,
          type: 'wall-gap',
          targetWall: wall,
          confidence: 0.8 - (projectedDist / tolerance),
          description: extensionType,
          suggestedRotation: Math.atan2(wallVector.z, wallVector.x)
        })
      }
    }
    
    console.log(`Total snap points found: ${snapPoints.length}`)
    
    // Sort by confidence and return best options
    const sorted = snapPoints.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
    console.log('Returning snap points:', sorted.length)
    
    return sorted
  }

  /**
   * Get wall start and end points accounting for rotation
   */
  private getWallEndpoints(wall: FloorplanElement): { start: THREE.Vector3; end: THREE.Vector3 } {
    const start = new THREE.Vector3(wall.position.x, 0, wall.position.y)
    
    // Calculate end point with rotation
    const direction = new THREE.Vector3(wall.dimensions.width, 0, 0)
    if (wall.rotation) {
      direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), wall.rotation)
    }
    
    const end = start.clone().add(direction)
    
    return { start, end }
  }

  /**
   * Get the best snap point from available options
   */
  getBestSnapPoint(snapPoints: WallSnapPoint[]): WallSnapPoint | null {
    if (snapPoints.length === 0) return null
    return snapPoints[0] // Already sorted by confidence
  }

  /**
   * Update snap tolerance
   */
  setSnapTolerance(tolerance: number) {
    this.snapTolerance = tolerance
  }

  /**
   * Find door placement points within walls
   */
  findDoorSnapPoints(
    cursorPosition: THREE.Vector3,
    existingWalls: FloorplanElement[],
    doorDimensions: { width: number; height: number; depth: number }
  ): WallSnapPoint[] {
    console.log('🚪 Finding door snap points')
    const snapPoints: WallSnapPoint[] = []
    const tolerance = this.snapTolerance * 2

    for (const wall of existingWalls) {
      if (wall.metadata?.isPreview) continue
      
      const { start, end } = this.getWallEndpoints(wall)
      const wallVector = end.clone().sub(start).normalize()
      const wallLength = start.distanceTo(end)
      const wallThickness = wall.dimensions.height || 1
      
      // Project cursor onto wall line
      const projectedPoint = this.projectPointOntoLine(cursorPosition, start, end)
      const projectedDist = cursorPosition.distanceTo(projectedPoint)
      
      // Check if cursor is close to the wall face
      if (projectedDist < tolerance) {
        const distanceAlongWall = start.distanceTo(projectedPoint)
        
        // Ensure door fits within wall bounds with some margin
        const doorMargin = 1 // 1 foot margin from wall edges
        const minDistance = doorMargin
        const maxDistance = wallLength - doorDimensions.width - doorMargin
        
        if (distanceAlongWall >= minDistance && distanceAlongWall <= maxDistance) {
          // Calculate door center position
          const doorCenter = start.clone().add(
            wallVector.clone().multiplyScalar(distanceAlongWall + doorDimensions.width / 2)
          )
          
          // Position door flush with wall face
          const perpendicular = new THREE.Vector3(-wallVector.z, 0, wallVector.x)
          const doorPosition = doorCenter.clone().add(
            perpendicular.clone().multiplyScalar(wallThickness / 2)
          )
          
          snapPoints.push({
            position: doorPosition,
            type: 'door-in-wall',
            targetWall: wall,
            confidence: 0.95 - (projectedDist / tolerance),
            description: `Door centered in wall`,
            suggestedRotation: Math.atan2(perpendicular.z, perpendicular.x),
            constrainToBounds: {
              minX: start.x + minDistance,
              maxX: start.x + maxDistance,
              minY: start.z + minDistance,
              maxY: start.z + maxDistance
            }
          })
        }
      }
    }
    
    return snapPoints.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Calculate optimal rotation for wall connections
   */
  private calculateOptimalRotation(wallVector: THREE.Vector3, connectionType: 'start' | 'end'): number {
    // For flush connections, continue in the same direction or perpendicular
    if (connectionType === 'end') {
      return Math.atan2(wallVector.z, wallVector.x)
    } else {
      // For start connections, reverse direction
      return Math.atan2(-wallVector.z, -wallVector.x)
    }
  }

  /**
   * Project a point onto a line defined by two points
   */
  private projectPointOntoLine(point: THREE.Vector3, lineStart: THREE.Vector3, lineEnd: THREE.Vector3): THREE.Vector3 {
    const lineVector = lineEnd.clone().sub(lineStart)
    const pointVector = point.clone().sub(lineStart)
    
    const lineLength = lineVector.length()
    if (lineLength === 0) return lineStart.clone()
    
    const dotProduct = pointVector.dot(lineVector) / (lineLength * lineLength)
    
    return lineStart.clone().add(lineVector.multiplyScalar(dotProduct))
  }

  /**
   * Check if a point lies on a line segment (with tolerance)
   */
  private isPointOnLineSegment(
    point: THREE.Vector3, 
    lineStart: THREE.Vector3, 
    lineEnd: THREE.Vector3, 
    tolerance: number = 0.1
  ): boolean {
    const distToStart = point.distanceTo(lineStart)
    const distToEnd = point.distanceTo(lineEnd)
    const lineLength = lineStart.distanceTo(lineEnd)
    
    // Point is on segment if sum of distances equals line length (within tolerance)
    return Math.abs((distToStart + distToEnd) - lineLength) < tolerance
  }
}

/**
 * Helper function to get wall elements from floorplan
 */
export function getWallElements(elements: FloorplanElement[]): FloorplanElement[] {
  return elements.filter(el => el.type === 'wall' && !el.metadata?.isPreview)
}

/**
 * Helper function to create wall with suggested properties
 */
export function createIntelligentWall(
  snapPoint: WallSnapPoint,
  defaultDimensions: { width: number; height: number; depth: number }
): Partial<FloorplanElement> {
  return {
    type: 'wall',
    position: {
      x: snapPoint.position.x,
      y: snapPoint.position.z,
      z: snapPoint.position.y
    },
    dimensions: snapPoint.suggestedDimensions || defaultDimensions,
    rotation: snapPoint.suggestedRotation || 0,
    metadata: {
      snapType: snapPoint.type,
      snapDescription: snapPoint.description,
      autoSized: !!snapPoint.suggestedDimensions
    }
  }
}