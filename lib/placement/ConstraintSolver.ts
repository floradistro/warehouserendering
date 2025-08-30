import * as THREE from 'three'
import { SpatialIndex, SpatialObject } from '../spatial/SpatialIndex'

// Placement constraint types
export interface PlacementConstraint {
  id: string
  type: 'snap' | 'align' | 'distance' | 'angle' | 'collision' | 'surface' | 'clearance'
  priority: number
  description: string
  validate(transform: PlacementTransform, context: PlacementContext): ValidationResult
  solve(transform: PlacementTransform, context: PlacementContext): PlacementTransform
}

export interface PlacementTransform {
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
}

export interface PlacementContext {
  spatialIndex: SpatialIndex
  targetObject: {
    id: string
    type: string
    dimensions: { width: number; height: number; depth: number }
    placementType: 'floor' | 'wall' | 'ceiling' | 'table' | 'freestanding'
    clearances: { front: number; back: number; left: number; right: number; top: number; bottom: number }
  }
  nearbyObjects: SpatialObject[]
  snapPoints: Array<{ position: THREE.Vector3; normal: THREE.Vector3; type: string }>
  gridSize: number
  snapTolerance: number
}

export interface ValidationResult {
  isValid: boolean
  score: number // Higher is better
  issues: string[]
  suggestions: string[]
}

// Grid snap constraint
export class GridSnapConstraint implements PlacementConstraint {
  id = 'grid-snap'
  type = 'snap' as const
  priority = 100
  description = 'Snap to grid'

  validate(transform: PlacementTransform, context: PlacementContext): ValidationResult {
    const { position } = transform
    const { gridSize } = context
    
    const snappedX = Math.round(position.x / gridSize) * gridSize
    const snappedY = Math.round(position.y / gridSize) * gridSize
    const snappedZ = Math.round(position.z / gridSize) * gridSize
    
    const distance = position.distanceTo(new THREE.Vector3(snappedX, snappedY, snappedZ))
    const isSnapped = distance < 0.1
    
    return {
      isValid: true,
      score: isSnapped ? 100 : Math.max(0, 100 - distance * 10),
      issues: isSnapped ? [] : [`Position is ${distance.toFixed(2)} units off grid`],
      suggestions: isSnapped ? [] : [`Snap to grid at (${snappedX}, ${snappedY}, ${snappedZ})`]
    }
  }

  solve(transform: PlacementTransform, context: PlacementContext): PlacementTransform {
    const { gridSize } = context
    
    return {
      ...transform,
      position: new THREE.Vector3(
        Math.round(transform.position.x / gridSize) * gridSize,
        Math.round(transform.position.y / gridSize) * gridSize,
        Math.round(transform.position.z / gridSize) * gridSize
      )
    }
  }
}

// Collision avoidance constraint
export class CollisionConstraint implements PlacementConstraint {
  id = 'collision-avoidance'
  type = 'collision' as const
  priority = 1000 // Very high priority
  description = 'Avoid collisions with existing objects'

  validate(transform: PlacementTransform, context: PlacementContext): ValidationResult {
    const { position } = transform
    const { targetObject, spatialIndex } = context
    
    // Create bounding box for the object at this position
    const bounds = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(
        targetObject.dimensions.width,
        targetObject.dimensions.height,
        targetObject.dimensions.depth
      )
    )
    
    const collisions = spatialIndex.checkCollisions(bounds, targetObject.id)
    
    return {
      isValid: collisions.length === 0,
      score: collisions.length === 0 ? 100 : 0,
      issues: collisions.map(obj => `Collision with ${obj.id}`),
      suggestions: collisions.length > 0 ? ['Move to avoid collisions'] : []
    }
  }

  solve(transform: PlacementTransform, context: PlacementContext): PlacementTransform {
    const { position } = transform
    const { targetObject, spatialIndex, gridSize } = context
    
    // Try different positions in a spiral pattern
    const maxAttempts = 50
    let bestPosition = position.clone()
    let bestScore = -1
    
    for (let i = 0; i < maxAttempts; i++) {
      const angle = (i * 0.618) * Math.PI * 2 // Golden angle for good distribution
      const radius = Math.ceil(i / 8) * gridSize
      
      const testPosition = position.clone().add(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ))
      
      const testTransform = { ...transform, position: testPosition }
      const result = this.validate(testTransform, context)
      
      if (result.isValid && result.score > bestScore) {
        bestPosition = testPosition
        bestScore = result.score
        break
      }
    }
    
    return { ...transform, position: bestPosition }
  }
}

// Surface placement constraint
export class SurfacePlacementConstraint implements PlacementConstraint {
  id = 'surface-placement'
  type = 'surface' as const
  priority = 800
  description = 'Place on appropriate surface'

  validate(transform: PlacementTransform, context: PlacementContext): ValidationResult {
    const { position } = transform
    const { targetObject, spatialIndex } = context
    
    if (targetObject.placementType === 'freestanding') {
      return { isValid: true, score: 100, issues: [], suggestions: [] }
    }
    
    // Check for appropriate surface below/behind object
    const searchBounds = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(
        targetObject.dimensions.width + 1,
        targetObject.dimensions.height + 1,
        targetObject.dimensions.depth + 1
      )
    )
    
    const nearbyObjects = spatialIndex.queryBounds(searchBounds)
    
    let foundSurface = false
    const issues: string[] = []
    
    switch (targetObject.placementType) {
      case 'floor':
        foundSurface = nearbyObjects.some(obj => 
          obj.userData.type === 'floor' || 
          obj.userData.category === 'structural'
        )
        if (!foundSurface) {
          issues.push('No floor or structural surface found below')
        }
        break
        
      case 'wall':
        foundSurface = nearbyObjects.some(obj => 
          obj.userData.type === 'wall'
        )
        if (!foundSurface) {
          issues.push('No wall surface found for mounting')
        }
        break
        
      case 'ceiling':
        foundSurface = nearbyObjects.some(obj => 
          obj.userData.type === 'ceiling' ||
          obj.userData.type === 'roof'
        )
        if (!foundSurface) {
          issues.push('No ceiling or roof surface found above')
        }
        break
        
      case 'table':
        foundSurface = nearbyObjects.some(obj => 
          obj.userData.type === 'table' ||
          obj.userData.category === 'furniture'
        )
        if (!foundSurface) {
          issues.push('No table or furniture surface found')
        }
        break
    }
    
    return {
      isValid: foundSurface,
      score: foundSurface ? 100 : 20,
      issues,
      suggestions: foundSurface ? [] : [`Find appropriate ${targetObject.placementType} surface`]
    }
  }

  solve(transform: PlacementTransform, context: PlacementContext): PlacementTransform {
    // For now, return the original transform
    // In a full implementation, this would find the nearest appropriate surface
    return transform
  }
}

// Clearance constraint
export class ClearanceConstraint implements PlacementConstraint {
  id = 'clearance'
  type = 'clearance' as const
  priority = 700
  description = 'Maintain required clearances'

  validate(transform: PlacementTransform, context: PlacementContext): ValidationResult {
    const { position } = transform
    const { targetObject, spatialIndex } = context
    const { clearances } = targetObject
    
    // Create expanded bounding box including clearances
    const clearanceBounds = new THREE.Box3().setFromCenterAndSize(
      position,
      new THREE.Vector3(
        targetObject.dimensions.width + clearances.left + clearances.right,
        targetObject.dimensions.height + clearances.top + clearances.bottom,
        targetObject.dimensions.depth + clearances.front + clearances.back
      )
    )
    
    const conflicts = spatialIndex.checkCollisions(clearanceBounds, targetObject.id)
    const issues: string[] = []
    
    for (const conflict of conflicts) {
      // Check which clearance is violated
      const conflictCenter = conflict.boundingBox.getCenter(new THREE.Vector3())
      const relativePos = conflictCenter.clone().sub(position)
      
      if (Math.abs(relativePos.x) < clearances.left + clearances.right) {
        if (relativePos.x > 0) {
          issues.push(`Insufficient right clearance (${clearances.right}ft required)`)
        } else {
          issues.push(`Insufficient left clearance (${clearances.left}ft required)`)
        }
      }
      
      if (Math.abs(relativePos.z) < clearances.front + clearances.back) {
        if (relativePos.z > 0) {
          issues.push(`Insufficient front clearance (${clearances.front}ft required)`)
        } else {
          issues.push(`Insufficient back clearance (${clearances.back}ft required)`)
        }
      }
    }
    
    return {
      isValid: conflicts.length === 0,
      score: conflicts.length === 0 ? 100 : Math.max(0, 100 - conflicts.length * 20),
      issues,
      suggestions: issues.length > 0 ? ['Move to maintain required clearances'] : []
    }
  }

  solve(transform: PlacementTransform, context: PlacementContext): PlacementTransform {
    // Similar to collision constraint, but accounting for clearances
    return transform
  }
}

// Main constraint solver
export class ConstraintSolver {
  private constraints: PlacementConstraint[] = []

  constructor() {
    // Add default constraints
    this.addConstraint(new GridSnapConstraint())
    this.addConstraint(new CollisionConstraint())
    this.addConstraint(new SurfacePlacementConstraint())
    this.addConstraint(new ClearanceConstraint())
  }

  addConstraint(constraint: PlacementConstraint) {
    this.constraints.push(constraint)
    // Sort by priority (highest first)
    this.constraints.sort((a, b) => b.priority - a.priority)
  }

  removeConstraint(id: string) {
    this.constraints = this.constraints.filter(c => c.id !== id)
  }

  // Validate a placement
  validate(transform: PlacementTransform, context: PlacementContext): ValidationResult {
    let totalScore = 0
    let weightSum = 0
    const allIssues: string[] = []
    const allSuggestions: string[] = []
    let isValid = true

    for (const constraint of this.constraints) {
      const result = constraint.validate(transform, context)
      
      if (!result.isValid && constraint.priority >= 1000) {
        // Critical constraint failed
        isValid = false
      }
      
      totalScore += result.score * constraint.priority
      weightSum += constraint.priority
      allIssues.push(...result.issues)
      allSuggestions.push(...result.suggestions)
    }

    return {
      isValid,
      score: weightSum > 0 ? totalScore / weightSum : 0,
      issues: [...new Set(allIssues)], // Remove duplicates
      suggestions: [...new Set(allSuggestions)]
    }
  }

  // Solve constraints to find optimal placement
  solve(initialTransform: PlacementTransform, context: PlacementContext): {
    transform: PlacementTransform
    result: ValidationResult
    iterations: number
  } {
    let currentTransform = { ...initialTransform }
    let bestTransform = { ...initialTransform }
    let bestResult = this.validate(currentTransform, context)
    let iterations = 0
    const maxIterations = 10

    // Iteratively apply constraint solvers
    while (iterations < maxIterations && !bestResult.isValid) {
      let improved = false
      
      for (const constraint of this.constraints) {
        const solvedTransform = constraint.solve(currentTransform, context)
        const result = this.validate(solvedTransform, context)
        
        if (result.score > bestResult.score) {
          bestTransform = solvedTransform
          bestResult = result
          currentTransform = solvedTransform
          improved = true
        }
      }
      
      if (!improved) break
      iterations++
    }

    return {
      transform: bestTransform,
      result: bestResult,
      iterations
    }
  }

  // Get constraint by ID
  getConstraint(id: string): PlacementConstraint | undefined {
    return this.constraints.find(c => c.id === id)
  }

  // Get all constraints
  getConstraints(): PlacementConstraint[] {
    return [...this.constraints]
  }
}
