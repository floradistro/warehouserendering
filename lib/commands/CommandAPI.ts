import * as THREE from 'three'
import { SpatialIndex, SpatialObject } from '../spatial/SpatialIndex'
import { ConstraintSolver, PlacementTransform, PlacementContext } from '../placement/ConstraintSolver'

// Command result interface
export interface CommandResult {
  success: boolean
  objectIds: string[]
  warnings: string[]
  errors: string[]
  suggestions: string[]
  metadata?: Record<string, any>
}

// Placement options for AI commands
export interface PlaceOptions {
  rotation?: number
  snapToGrid?: boolean
  enforceConstraints?: boolean
  allowOverlap?: boolean
  preferredSurface?: 'floor' | 'wall' | 'ceiling' | 'table'
  clearances?: {
    front?: number
    back?: number
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
}

// Wall creation options
export interface WallOptions {
  thickness?: number
  height?: number
  material?: 'drywall' | 'concrete' | 'steel' | 'wood'
  hasOpenings?: boolean
  allowOverlap?: boolean
  openings?: Array<{
    type: 'door' | 'window'
    position: number // Position along wall (0-1)
    width: number
    height: number
  }>
}

// Room creation options
export interface RoomOptions {
  wallHeight?: number
  wallThickness?: number
  floorMaterial?: string
  ceilingMaterial?: string
  includeFloor?: boolean
  includeCeiling?: boolean
}

// Object alignment types
export type AlignmentType = 'left' | 'right' | 'center' | 'top' | 'bottom' | 'middle' | 'front' | 'back'

// Main Command API for AI integration
export class CommandAPI {
  private spatialIndex: SpatialIndex
  private constraintSolver: ConstraintSolver
  private objects = new Map<string, any>() // Store actual objects
  private nextId = 1

  constructor(spatialIndex: SpatialIndex, constraintSolver: ConstraintSolver) {
    this.spatialIndex = spatialIndex
    this.constraintSolver = constraintSolver
  }

  // Generate unique ID
  private generateId(): string {
    return `obj_${this.nextId++}`
  }

  // Place a single object
  placeObject(
    type: string,
    position: { x: number; y: number; z?: number },
    options: PlaceOptions = {}
  ): CommandResult {
    try {
      const id = this.generateId()
      const pos = new THREE.Vector3(position.x, position.y, position.z || 0)
      
      // Get object metadata (this would come from a model library)
      const objectMeta = this.getObjectMetadata(type)
      if (!objectMeta) {
        return {
          success: false,
          objectIds: [],
          warnings: [],
          errors: [`Unknown object type: ${type}`],
          suggestions: ['Check available object types']
        }
      }

      // Create initial transform
      const transform: PlacementTransform = {
        position: pos,
        rotation: new THREE.Euler(0, options.rotation || 0, 0),
        scale: new THREE.Vector3(1, 1, 1)
      }

      // Create placement context
      const context: PlacementContext = {
        spatialIndex: this.spatialIndex,
        targetObject: {
          id,
          type,
          dimensions: objectMeta.dimensions,
          placementType: options.preferredSurface || objectMeta.placementType,
          clearances: { ...objectMeta.clearances, ...options.clearances }
        },
        nearbyObjects: this.spatialIndex.queryRadius(pos, 20),
        snapPoints: [], // Would be populated from nearby objects
        gridSize: 1,
        snapTolerance: 2
      }

      // Solve constraints if enabled
      let finalTransform = transform
      const warnings: string[] = []
      const suggestions: string[] = []

      if (options.enforceConstraints !== false) {
        const solution = this.constraintSolver.solve(transform, context)
        finalTransform = solution.transform
        
        if (!solution.result.isValid) {
          warnings.push(...solution.result.issues)
          suggestions.push(...solution.result.suggestions)
        }
        
        if (solution.iterations > 0) {
          warnings.push(`Position adjusted after ${solution.iterations} constraint iterations`)
        }
      }

      // Create spatial object
      const boundingBox = new THREE.Box3().setFromCenterAndSize(
        finalTransform.position,
        new THREE.Vector3(
          objectMeta.dimensions.width,
          objectMeta.dimensions.height,
          objectMeta.dimensions.depth
        )
      )

      const spatialObject: SpatialObject = {
        id,
        boundingBox,
        position: finalTransform.position,
        userData: {
          type,
          transform: finalTransform,
          metadata: objectMeta
        }
      }

      // Add to spatial index
      this.spatialIndex.addObject(spatialObject)
      this.objects.set(id, spatialObject)

      return {
        success: true,
        objectIds: [id],
        warnings,
        errors: [],
        suggestions,
        metadata: {
          finalPosition: finalTransform.position,
          finalRotation: finalTransform.rotation
        }
      }

    } catch (error) {
      return {
        success: false,
        objectIds: [],
        warnings: [],
        errors: [`Failed to place object: ${error}`],
        suggestions: ['Check object type and position parameters']
      }
    }
  }

  // Place a wall between two points
  placeWall(
    start: { x: number; y: number; z?: number },
    end: { x: number; y: number; z?: number },
    options: WallOptions = {}
  ): CommandResult {
    try {
      const startPos = new THREE.Vector3(start.x, start.y, start.z || 0)
      const endPos = new THREE.Vector3(end.x, end.y, end.z || 0)
      const length = startPos.distanceTo(endPos)
      
      if (length < 0.1) {
        return {
          success: false,
          objectIds: [],
          warnings: [],
          errors: ['Wall length must be greater than 0.1 units'],
          suggestions: ['Specify start and end points that are further apart']
        }
      }

      const id = this.generateId()
      const center = startPos.clone().add(endPos).multiplyScalar(0.5)
      const direction = endPos.clone().sub(startPos).normalize()
      const angle = Math.atan2(direction.z, direction.x)

      const height = options.height || 8
      const thickness = options.thickness || 0.5

      // Create wall transform
      const transform: PlacementTransform = {
        position: center,
        rotation: new THREE.Euler(0, angle, 0),
        scale: new THREE.Vector3(1, 1, 1)
      }

      // Create bounding box
      const boundingBox = new THREE.Box3().setFromCenterAndSize(
        center,
        new THREE.Vector3(length, height, thickness)
      )

      // Check for collisions
      const collisions = this.spatialIndex.checkCollisions(boundingBox, id)
      const warnings: string[] = []
      
      if (collisions.length > 0 && !options.allowOverlap) {
        warnings.push(`Wall intersects with ${collisions.length} existing object(s)`)
      }

      const spatialObject: SpatialObject = {
        id,
        boundingBox,
        position: center,
        userData: {
          type: 'wall',
          subtype: 'straight',
          material: options.material || 'drywall',
          dimensions: { width: length, height, depth: thickness },
          startPoint: startPos,
          endPoint: endPos,
          openings: options.openings || []
        }
      }

      this.spatialIndex.addObject(spatialObject)
      this.objects.set(id, spatialObject)

      return {
        success: true,
        objectIds: [id],
        warnings,
        errors: [],
        suggestions: [],
        metadata: {
          length,
          angle: angle * 180 / Math.PI,
          material: options.material || 'drywall'
        }
      }

    } catch (error) {
      return {
        success: false,
        objectIds: [],
        warnings: [],
        errors: [`Failed to create wall: ${error}`],
        suggestions: ['Check start and end point coordinates']
      }
    }
  }

  // Create a room from corner points
  createRoom(
    corners: Array<{ x: number; y: number; z?: number }>,
    options: RoomOptions = {}
  ): CommandResult {
    try {
      if (corners.length < 3) {
        return {
          success: false,
          objectIds: [],
          warnings: [],
          errors: ['Room must have at least 3 corners'],
          suggestions: ['Provide at least 3 corner points']
        }
      }

      const objectIds: string[] = []
      const warnings: string[] = []
      const height = options.wallHeight || 8

      // Create walls between consecutive corners
      for (let i = 0; i < corners.length; i++) {
        const start = corners[i]
        const end = corners[(i + 1) % corners.length]
        
        const wallResult = this.placeWall(start, end, {
          height,
          thickness: options.wallThickness || 0.5
        })
        
        if (wallResult.success) {
          objectIds.push(...wallResult.objectIds)
          warnings.push(...wallResult.warnings)
        }
      }

      // Create floor if requested
      if (options.includeFloor !== false) {
        // Calculate room bounds
        const bounds = new THREE.Box3()
        corners.forEach(corner => {
          bounds.expandByPoint(new THREE.Vector3(corner.x, corner.y, corner.z || 0))
        })

        const floorCenter = bounds.getCenter(new THREE.Vector3())
        floorCenter.y = 0 // Floor at ground level

        const floorSize = bounds.getSize(new THREE.Vector3())
        
        const floorResult = this.placeObject('floor', 
          { x: floorCenter.x, y: floorCenter.y, z: floorCenter.z },
          { preferredSurface: 'floor' }
        )
        
        if (floorResult.success) {
          objectIds.push(...floorResult.objectIds)
        }
      }

      return {
        success: objectIds.length > 0,
        objectIds,
        warnings,
        errors: [],
        suggestions: [],
        metadata: {
          cornerCount: corners.length,
          wallCount: corners.length,
          includesFloor: options.includeFloor !== false
        }
      }

    } catch (error) {
      return {
        success: false,
        objectIds: [],
        warnings: [],
        errors: [`Failed to create room: ${error}`],
        suggestions: ['Check corner coordinates and options']
      }
    }
  }

  // Align multiple objects
  alignObjects(ids: string[], alignment: AlignmentType): CommandResult {
    try {
      const objects = ids.map(id => this.objects.get(id)).filter(Boolean)
      
      if (objects.length < 2) {
        return {
          success: false,
          objectIds: [],
          warnings: [],
          errors: ['At least 2 objects required for alignment'],
          suggestions: ['Select more objects to align']
        }
      }

      // Calculate alignment reference
      const bounds = objects.map(obj => obj.boundingBox)
      const overallBounds = bounds.reduce((acc, box) => acc.union(box), bounds[0].clone())
      
      let referenceValue: number
      let axis: 'x' | 'y' | 'z'
      
      switch (alignment) {
        case 'left':
          referenceValue = overallBounds.min.x
          axis = 'x'
          break
        case 'right':
          referenceValue = overallBounds.max.x
          axis = 'x'
          break
        case 'center':
          referenceValue = (overallBounds.min.x + overallBounds.max.x) / 2
          axis = 'x'
          break
        case 'front':
          referenceValue = overallBounds.min.z
          axis = 'z'
          break
        case 'back':
          referenceValue = overallBounds.max.z
          axis = 'z'
          break
        case 'middle':
          referenceValue = (overallBounds.min.z + overallBounds.max.z) / 2
          axis = 'z'
          break
        case 'bottom':
          referenceValue = overallBounds.min.y
          axis = 'y'
          break
        case 'top':
          referenceValue = overallBounds.max.y
          axis = 'y'
          break
        default:
          throw new Error(`Unknown alignment type: ${alignment}`)
      }

      const movedObjects: string[] = []
      
      // Move objects to alignment
      for (const obj of objects) {
        const currentBounds = obj.boundingBox
        const currentCenter = currentBounds.getCenter(new THREE.Vector3())
        
        let targetPosition: number
        
        switch (alignment) {
          case 'left':
          case 'front':
          case 'bottom':
            targetPosition = referenceValue + (currentBounds.max[axis] - currentBounds.min[axis]) / 2
            break
          case 'right':
          case 'back':
          case 'top':
            targetPosition = referenceValue - (currentBounds.max[axis] - currentBounds.min[axis]) / 2
            break
          default: // center, middle
            targetPosition = referenceValue
        }
        
        const newPosition = currentCenter.clone()
        newPosition[axis] = targetPosition
        
        // Update spatial index
        this.spatialIndex.removeObject(obj.id)
        obj.position = newPosition
        obj.boundingBox = new THREE.Box3().setFromCenterAndSize(
          newPosition,
          currentBounds.getSize(new THREE.Vector3())
        )
        this.spatialIndex.addObject(obj)
        
        movedObjects.push(obj.id)
      }

      return {
        success: true,
        objectIds: movedObjects,
        warnings: [],
        errors: [],
        suggestions: [],
        metadata: {
          alignment,
          referenceValue,
          axis,
          objectCount: movedObjects.length
        }
      }

    } catch (error) {
      return {
        success: false,
        objectIds: [],
        warnings: [],
        errors: [`Failed to align objects: ${error}`],
        suggestions: ['Check object IDs and alignment type']
      }
    }
  }

  // Validate placement before committing
  validatePlacement(
    type: string,
    position: { x: number; y: number; z?: number },
    options: PlaceOptions = {}
  ): CommandResult {
    const objectMeta = this.getObjectMetadata(type)
    if (!objectMeta) {
      return {
        success: false,
        objectIds: [],
        warnings: [],
        errors: [`Unknown object type: ${type}`],
        suggestions: ['Check available object types']
      }
    }

    const pos = new THREE.Vector3(position.x, position.y, position.z || 0)
    
    const transform: PlacementTransform = {
      position: pos,
      rotation: new THREE.Euler(0, options.rotation || 0, 0),
      scale: new THREE.Vector3(1, 1, 1)
    }

    const context: PlacementContext = {
      spatialIndex: this.spatialIndex,
      targetObject: {
        id: 'validation',
        type,
        dimensions: objectMeta.dimensions,
        placementType: options.preferredSurface || objectMeta.placementType,
        clearances: { ...objectMeta.clearances, ...options.clearances }
      },
      nearbyObjects: this.spatialIndex.queryRadius(pos, 20),
      snapPoints: [],
      gridSize: 1,
      snapTolerance: 2
    }

    const result = this.constraintSolver.validate(transform, context)
    
    return {
      success: result.isValid,
      objectIds: [],
      warnings: result.issues,
      errors: result.isValid ? [] : ['Placement validation failed'],
      suggestions: result.suggestions,
      metadata: {
        score: result.score,
        isValid: result.isValid
      }
    }
  }

  // Get object metadata (mock implementation)
  private getObjectMetadata(type: string) {
    const metadata: Record<string, any> = {
      'table': {
        dimensions: { width: 4, height: 2.5, depth: 2 },
        placementType: 'floor',
        clearances: { front: 2, back: 1, left: 1, right: 1, top: 0, bottom: 0 }
      },
      'chair': {
        dimensions: { width: 2, height: 3, depth: 2 },
        placementType: 'floor',
        clearances: { front: 1, back: 1, left: 0.5, right: 0.5, top: 0, bottom: 0 }
      },
      'electrical-panel': {
        dimensions: { width: 2, height: 4, depth: 0.5 },
        placementType: 'wall',
        clearances: { front: 3, back: 0, left: 1, right: 1, top: 1, bottom: 0 }
      },
      'storage-tank': {
        dimensions: { width: 8, height: 10, depth: 8 },
        placementType: 'floor',
        clearances: { front: 3, back: 3, left: 3, right: 3, top: 2, bottom: 0 }
      },
      'floor': {
        dimensions: { width: 1, height: 0.1, depth: 1 },
        placementType: 'freestanding',
        clearances: { front: 0, back: 0, left: 0, right: 0, top: 0, bottom: 0 }
      }
    }
    
    return metadata[type]
  }

  // Get all objects
  getAllObjects(): SpatialObject[] {
    return Array.from(this.objects.values())
  }

  // Remove object
  removeObject(id: string): boolean {
    const removed = this.spatialIndex.removeObject(id)
    this.objects.delete(id)
    return removed
  }

  // Clear all objects
  clear() {
    this.spatialIndex.clear()
    this.objects.clear()
    this.nextId = 1
  }

  // Get spatial index statistics
  getStats() {
    return this.spatialIndex.getStats()
  }
}
