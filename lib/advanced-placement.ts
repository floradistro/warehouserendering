import * as THREE from 'three'
import { FloorplanElement } from './store'
import { ELEMENT_TEMPLATES } from './element-tools'

/**
 * ADVANCED PLACEMENT SYSTEM
 * Handles sophisticated 3D placement with raycasting, snapping, and rotation
 */

export interface SnapPoint {
  position: THREE.Vector3
  type: 'wall-end' | 'wall-middle' | 'wall-center' | 'wall-quarter' | 'wall-edge' | 'corner' | 'grid' | 'element-center' | 'element-edge'
  element?: FloorplanElement
  normal?: THREE.Vector3
  confidence: number
  description?: string
}

export interface PlacementConstraint {
  type: 'wall-to-wall' | 'door-in-wall' | 'window-in-wall' | 'ground-only'
  targetElement?: FloorplanElement
  allowedOrientations?: number[]
}

export interface AdvancedPlacementState {
  isPlacing: boolean
  templateId: string | null
  previewElement: FloorplanElement | null
  currentRotation: number
  snapPoints: SnapPoint[]
  activeSnapPoint: SnapPoint | null
  constraints: PlacementConstraint[]
  showSnapIndicators: boolean
}

export class AdvancedPlacementManager {
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private snapTolerance = 1.5 // feet - tighter for precise 1-foot grid
  private gridSize = 1.0 // feet - 1-foot grid intervals
  
  constructor(
    private camera: THREE.Camera,
    private scene: THREE.Scene
  ) {}

  /**
   * Updates mouse position and calculates world position with raycasting
   */
  updateMousePosition(
    clientX: number, 
    clientY: number, 
    canvasRect: DOMRect
  ): THREE.Vector3 | null {
    // Convert to normalized device coordinates
    this.mouse.x = ((clientX - canvasRect.left) / canvasRect.width) * 2 - 1
    this.mouse.y = -((clientY - canvasRect.top) / canvasRect.height) * 2 + 1

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)

    // First try to intersect with existing objects in the scene
    const intersects = this.raycaster.intersectObjects(this.scene.children, true)
    
    if (intersects.length > 0) {
      // Use the first intersection point
      return intersects[0].point
    }

    // Fallback to ground plane intersection
    const intersection = new THREE.Vector3()
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, intersection)
    
    return hit ? intersection : null
  }

  /**
   * Finds snap points near the given position with enhanced 1-foot grid and centering
   */
  findSnapPoints(
    position: THREE.Vector3, 
    elements: FloorplanElement[],
    templateId: string
  ): SnapPoint[] {
    const snapPoints: SnapPoint[] = []
    const template = ELEMENT_TEMPLATES[templateId]
    
    if (!template) return snapPoints

    // Enhanced 1-foot grid snap points
    const gridX = Math.round(position.x / this.gridSize) * this.gridSize
    const gridZ = Math.round(position.z / this.gridSize) * this.gridSize
    snapPoints.push({
      position: new THREE.Vector3(gridX, 0, gridZ),
      type: 'grid',
      confidence: 0.5,
      description: `Grid: ${gridX}', ${gridZ}'`
    })

    // Element-based snap points with enhanced centering
    for (const element of elements) {
      if (element.metadata?.isPreview) continue

      const elementPos = new THREE.Vector3(element.position.x, 0, element.position.y)
      const distance = position.distanceTo(elementPos)
      
      if (distance > this.snapTolerance * 3) continue

      // Enhanced wall-specific snapping with comprehensive centering
      if (element.type === 'wall') {
        const wallStart = new THREE.Vector3(element.position.x, 0, element.position.y)
        const wallEnd = new THREE.Vector3(
          element.position.x + element.dimensions.width, 
          0, 
          element.position.y + element.dimensions.height
        )
        
        // Calculate key points along the wall
        const wallCenter = wallStart.clone().lerp(wallEnd, 0.5)
        const wallQuarter1 = wallStart.clone().lerp(wallEnd, 0.25)
        const wallQuarter3 = wallStart.clone().lerp(wallEnd, 0.75)
        
        // Wall endpoints
        if (position.distanceTo(wallStart) <= this.snapTolerance) {
          snapPoints.push({
            position: wallStart,
            type: 'wall-end',
            element,
            confidence: 0.9,
            description: `Wall start: ${element.id.slice(0, 8)}...`
          })
        }
        
        if (position.distanceTo(wallEnd) <= this.snapTolerance) {
          snapPoints.push({
            position: wallEnd,
            type: 'wall-end',
            element,
            confidence: 0.9,
            description: `Wall end: ${element.id.slice(0, 8)}...`
          })
        }

        // Wall center - HIGH PRIORITY for centering
        if (position.distanceTo(wallCenter) <= this.snapTolerance) {
          snapPoints.push({
            position: wallCenter,
            type: 'wall-center',
            element,
            confidence: 0.95,
            description: `⭐ CENTERED on wall: ${element.id.slice(0, 8)}...`
          })
        }
        
        // Wall quarter points for balanced placement
        if (position.distanceTo(wallQuarter1) <= this.snapTolerance) {
          snapPoints.push({
            position: wallQuarter1,
            type: 'wall-quarter',
            element,
            confidence: 0.85,
            description: `Quarter point (25%) on wall: ${element.id.slice(0, 8)}...`
          })
        }
        
        if (position.distanceTo(wallQuarter3) <= this.snapTolerance) {
          snapPoints.push({
            position: wallQuarter3,
            type: 'wall-quarter',
            element,
            confidence: 0.85,
            description: `Quarter point (75%) on wall: ${element.id.slice(0, 8)}...`
          })
        }
        
        // 1-foot intervals along the wall length
        const wallLength = wallStart.distanceTo(wallEnd)
        const wallDirection = wallEnd.clone().sub(wallStart).normalize()
        
        for (let i = 1; i < wallLength; i += 1) { // Every 1 foot
          const intervalPoint = wallStart.clone().add(wallDirection.clone().multiplyScalar(i))
          if (position.distanceTo(intervalPoint) <= this.snapTolerance) {
            snapPoints.push({
              position: intervalPoint,
              type: 'wall-edge',
              element,
              confidence: 0.7,
              description: `${i}' along wall: ${element.id.slice(0, 8)}...`
            })
          }
        }

        // Wall-to-wall perpendicular snapping
        if (template.type === 'wall') {
          const wallVector = wallEnd.clone().sub(wallStart).normalize()
          const perpendicular = new THREE.Vector3(-wallVector.z, 0, wallVector.x)
          
          // Check for perpendicular attachment points
          const attachPoint1 = wallStart.clone().add(perpendicular.clone().multiplyScalar(template.defaultDimensions.width))
          const attachPoint2 = wallEnd.clone().add(perpendicular.clone().multiplyScalar(template.defaultDimensions.width))
          
          if (position.distanceTo(attachPoint1) <= this.snapTolerance) {
            snapPoints.push({
              position: attachPoint1,
              type: 'corner',
              element,
              normal: perpendicular,
              confidence: 0.85
            })
          }
          
          if (position.distanceTo(attachPoint2) <= this.snapTolerance) {
            snapPoints.push({
              position: attachPoint2,
              type: 'corner',
              element,
              normal: perpendicular,
              confidence: 0.85
            })
          }
        }
      }

      // Element center snapping
      if (distance <= this.snapTolerance) {
        snapPoints.push({
          position: elementPos,
          type: 'element-center',
          element,
          confidence: 0.7
        })
      }
    }

    // Sort by confidence (highest first)
    return snapPoints.sort((a, b) => b.confidence - a.confidence)
  }

  /**
   * Gets the best snap point from available options
   */
  getBestSnapPoint(snapPoints: SnapPoint[]): SnapPoint | null {
    return snapPoints.length > 0 ? snapPoints[0] : null
  }

  /**
   * Creates preview element with proper positioning and rotation
   */
  createPreviewElement(
    templateId: string,
    position: THREE.Vector3,
    rotation: number = 0,
    snapPoint?: SnapPoint | null
  ): FloorplanElement | null {
    const template = ELEMENT_TEMPLATES[templateId]
    if (!template) return null

    let finalPosition = position.clone()
    let finalRotation = rotation

    // Apply snap point positioning
    if (snapPoint) {
      finalPosition = snapPoint.position.clone()
      
      // Auto-rotate based on snap context
      if (snapPoint.normal && template.type === 'wall') {
        const angle = Math.atan2(snapPoint.normal.z, snapPoint.normal.x)
        finalRotation = angle
      }
    }

    // Ensure element is at ground level
    finalPosition.y = 0

    return {
      id: 'preview-element',
      type: template.type,
      position: { 
        x: finalPosition.x, 
        y: finalPosition.z, 
        z: finalPosition.y 
      },
      dimensions: {
        width: template.defaultDimensions.width,
        height: template.defaultDimensions.height,
        depth: template.defaultDimensions.depth || 8
      },
      color: template.defaultColor,
      material: template.material,
      rotation: finalRotation,
      metadata: {
        ...template.metadata,
        isPreview: true,
        snapPoint: snapPoint?.type,
        snapElement: snapPoint?.element?.id
      }
    }
  }

  /**
   * Validates placement based on constraints
   */
  validatePlacement(
    element: FloorplanElement,
    existingElements: FloorplanElement[],
    constraints: PlacementConstraint[]
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const constraint of constraints) {
      switch (constraint.type) {
        case 'wall-to-wall':
          // Check if wall connects to another wall
          const nearbyWalls = existingElements.filter(el => 
            el.type === 'wall' && 
            !el.metadata?.isPreview &&
            this.getElementDistance(element, el) < 2
          )
          if (nearbyWalls.length === 0) {
            errors.push('Wall must connect to another wall')
          }
          break

        case 'door-in-wall':
        case 'window-in-wall':
          // Check if door/window is placed in a wall
          const hostWall = existingElements.find(el =>
            el.type === 'wall' && 
            !el.metadata?.isPreview &&
            this.isElementInsideWall(element, el)
          )
          if (!hostWall) {
            errors.push(`${element.type} must be placed in a wall`)
          }
          break

        case 'ground-only':
          if (element.position.z !== 0) {
            errors.push('Element must be placed on the ground')
          }
          break
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Helper: Calculate distance between elements
   */
  private getElementDistance(el1: FloorplanElement, el2: FloorplanElement): number {
    const pos1 = new THREE.Vector3(el1.position.x, 0, el1.position.y)
    const pos2 = new THREE.Vector3(el2.position.x, 0, el2.position.y)
    return pos1.distanceTo(pos2)
  }

  /**
   * Helper: Check if element is inside a wall
   */
  private isElementInsideWall(element: FloorplanElement, wall: FloorplanElement): boolean {
    const elementPos = new THREE.Vector2(element.position.x, element.position.y)
    const wallStart = new THREE.Vector2(wall.position.x, wall.position.y)
    const wallEnd = new THREE.Vector2(
      wall.position.x + wall.dimensions.width,
      wall.position.y
    )
    
    // Check if element position is on the wall line (with tolerance)
    const distToWall = elementPos.distanceToSquared(
      wallStart.lerp(wallEnd, 0.5)
    )
    
    return distToWall < (wall.dimensions.height / 2) ** 2
  }

  /**
   * Update camera reference
   */
  updateCamera(camera: THREE.Camera) {
    this.camera = camera
  }

  /**
   * Update scene reference
   */
  updateScene(scene: THREE.Scene) {
    this.scene = scene
  }
}

/**
 * PLACEMENT CONSTRAINTS DEFINITIONS
 */
export function getPlacementConstraints(templateId: string): PlacementConstraint[] {
  const template = ELEMENT_TEMPLATES[templateId]
  if (!template) return []

  const constraints: PlacementConstraint[] = [
    { type: 'ground-only' } // All elements must be on ground
  ]

  switch (template.type) {
    case 'wall':
      // Walls should connect to other walls (except first wall)
      constraints.push({ type: 'wall-to-wall' })
      break

    case 'door':
    case 'window':
      // Doors and windows must be placed in walls
      constraints.push({ 
        type: template.type === 'door' ? 'door-in-wall' : 'window-in-wall' 
      })
      break
  }

  return constraints
}

/**
 * ROTATION UTILITIES
 */
export function getNextRotation(currentRotation: number, step: number = Math.PI / 2): number {
  return (currentRotation + step) % (Math.PI * 2)
}

export function getPreviousRotation(currentRotation: number, step: number = Math.PI / 2): number {
  return (currentRotation - step + Math.PI * 2) % (Math.PI * 2)
}

export function snapRotationToCardinal(rotation: number): number {
  const cardinals = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2]
  let closest = cardinals[0]
  let minDiff = Math.abs(rotation - closest)

  for (const cardinal of cardinals) {
    const diff = Math.abs(rotation - cardinal)
    if (diff < minDiff) {
      minDiff = diff
      closest = cardinal
    }
  }

  return closest
}



