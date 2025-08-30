import * as THREE from 'three'

// Semantic categories for warehouse objects
export type ObjectCategory = 
  | 'structure'     // Walls, beams, columns
  | 'utility'       // Electrical, plumbing, HVAC
  | 'equipment'     // Machinery, tanks, conveyors
  | 'furniture'     // Tables, chairs, cabinets
  | 'storage'       // Shelving, racks, containers
  | 'safety'        // Fire exits, sprinklers, alarms
  | 'lighting'      // Lights, fixtures
  | 'flooring'      // Floor types, surfaces
  | 'opening'       // Doors, windows, gates

// Surface types for placement
export type SurfaceType = 'floor' | 'wall' | 'ceiling' | 'table' | 'rack' | 'beam' | 'freestanding'

// Connection types for utilities
export interface ConnectionPoint {
  type: 'electrical' | 'plumbing' | 'hvac' | 'data' | 'gas' | 'mechanical'
  voltage?: number
  amperage?: number
  pressure?: number
  diameter?: number
  required: boolean
  position: THREE.Vector3 // Relative to object center
  direction: THREE.Vector3 // Connection direction/normal
}

// Placement rules for objects
export interface PlacementRule {
  id: string
  description: string
  type: 'distance' | 'angle' | 'surface' | 'clearance' | 'code' | 'accessibility'
  condition: (object: SemanticObject, context: PlacementContext) => boolean
  validate: (object: SemanticObject, context: PlacementContext) => ValidationResult
  severity: 'error' | 'warning' | 'info'
}

// Object relationships
export interface ObjectRelationship {
  type: 'connects_to' | 'supports' | 'contains' | 'adjacent_to' | 'powers' | 'drains'
  targetId: string
  required: boolean
  distance?: { min: number; max: number }
  angle?: { min: number; max: number }
}

// Semantic metadata for objects
export interface SemanticMetadata {
  // Basic identification
  id: string
  name: string
  category: ObjectCategory
  subcategory?: string
  manufacturer?: string
  model?: string
  
  // Physical properties
  dimensions: {
    width: number
    height: number
    depth: number
    weight?: number
    volume?: number
  }
  
  // Placement information
  placement: {
    surfaces: SurfaceType[]
    orientation: 'fixed' | 'rotatable' | 'any'
    clearances: {
      front: number
      back: number
      left: number
      right: number
      top: number
      bottom: number
    }
    snapPoints: Array<{
      position: THREE.Vector3
      type: 'corner' | 'center' | 'edge' | 'connection'
      normal?: THREE.Vector3
    }>
  }
  
  // Connections and utilities
  connections: ConnectionPoint[]
  
  // Building code requirements
  codes: {
    fireRating?: number
    accessibility?: boolean
    clearanceRequired?: boolean
    emergencyAccess?: boolean
    ventilationRequired?: boolean
  }
  
  // Relationships with other objects
  relationships: ObjectRelationship[]
  
  // Operational properties
  operational?: {
    powerConsumption?: number // Watts
    heatGeneration?: number   // BTU/hr
    noiseLevel?: number       // dB
    operatingTemperature?: { min: number; max: number }
    maintenanceAccess?: 'front' | 'back' | 'sides' | 'top' | 'all'
  }
  
  // Visual properties
  visual: {
    color?: string
    material?: string
    texture?: string
    transparency?: number
    emissive?: boolean
  }
  
  // Cost and lifecycle
  lifecycle?: {
    cost: number
    lifespan: number // years
    maintenanceInterval: number // months
    energyEfficiency?: string
  }
}

// Context for placement validation
export interface PlacementContext {
  nearbyObjects: SemanticObject[]
  availableSurfaces: Array<{
    type: SurfaceType
    position: THREE.Vector3
    normal: THREE.Vector3
    area: number
  }>
  utilities: Array<{
    type: 'electrical' | 'plumbing' | 'hvac' | 'data'
    position: THREE.Vector3
    capacity: number
    available: number
  }>
  environmentalConditions: {
    temperature: number
    humidity: number
    airflow: number
    lighting: number
  }
  buildingCodes: {
    fireCode: string
    accessibilityStandards: string[]
    electricalCode: string
    plumbingCode: string
  }
}

// Validation result
export interface ValidationResult {
  isValid: boolean
  score: number
  issues: Array<{
    type: 'error' | 'warning' | 'info'
    rule: string
    description: string
    suggestion?: string
  }>
}

// Main semantic object class
export class SemanticObject {
  public metadata: SemanticMetadata
  public transform: {
    position: THREE.Vector3
    rotation: THREE.Euler
    scale: THREE.Vector3
  }
  public boundingBox: THREE.Box3
  private placementRules: PlacementRule[] = []

  constructor(metadata: SemanticMetadata) {
    this.metadata = metadata
    this.transform = {
      position: new THREE.Vector3(),
      rotation: new THREE.Euler(),
      scale: new THREE.Vector3(1, 1, 1)
    }
    this.boundingBox = new THREE.Box3()
    this.initializePlacementRules()
    this.updateBoundingBox()
  }

  private initializePlacementRules() {
    // Add default rules based on category
    switch (this.metadata.category) {
      case 'utility':
        this.addElectricalRules()
        break
      case 'equipment':
        this.addEquipmentRules()
        break
      case 'furniture':
        this.addFurnitureRules()
        break
      case 'safety':
        this.addSafetyRules()
        break
      case 'structure':
        this.addStructuralRules()
        break
    }
  }

  private addElectricalRules() {
    this.placementRules.push({
      id: 'electrical-clearance',
      description: 'Electrical equipment requires minimum clearance',
      type: 'clearance',
      condition: () => true,
      validate: (obj, context) => {
        const requiredClearance = obj.metadata.placement.clearances.front
        const hasSpace = this.checkClearance(context, requiredClearance)
        
        return {
          isValid: hasSpace,
          score: hasSpace ? 100 : 0,
          issues: hasSpace ? [] : [{
            type: 'error',
            rule: 'electrical-clearance',
            description: `Requires ${requiredClearance}ft clearance for electrical safety`,
            suggestion: 'Move away from walls and other equipment'
          }]
        }
      },
      severity: 'error'
    })

    this.placementRules.push({
      id: 'electrical-access',
      description: 'Electrical panels must be accessible',
      type: 'accessibility',
      condition: (obj) => obj.metadata.subcategory === 'panel',
      validate: (obj, context) => {
        const accessWidth = 3 // 3ft minimum access width
        const hasAccess = this.checkAccessPath(context, accessWidth)
        
        return {
          isValid: hasAccess,
          score: hasAccess ? 100 : 20,
          issues: hasAccess ? [] : [{
            type: 'error',
            rule: 'electrical-access',
            description: 'Electrical panel must have 3ft minimum access path',
            suggestion: 'Ensure clear path for maintenance access'
          }]
        }
      },
      severity: 'error'
    })
  }

  private addEquipmentRules() {
    this.placementRules.push({
      id: 'equipment-foundation',
      description: 'Heavy equipment requires proper foundation',
      type: 'surface',
      condition: (obj) => (obj.metadata.dimensions.weight || 0) > 1000,
      validate: (obj, context) => {
        const hasFoundation = context.availableSurfaces.some(
          surface => surface.type === 'floor' && surface.area > obj.metadata.dimensions.width * obj.metadata.dimensions.depth
        )
        
        return {
          isValid: hasFoundation,
          score: hasFoundation ? 100 : 0,
          issues: hasFoundation ? [] : [{
            type: 'error',
            rule: 'equipment-foundation',
            description: 'Heavy equipment requires reinforced foundation',
            suggestion: 'Place on concrete pad or structural floor'
          }]
        }
      },
      severity: 'error'
    })

    this.placementRules.push({
      id: 'equipment-ventilation',
      description: 'Equipment requires adequate ventilation',
      type: 'clearance',
      condition: (obj) => (obj.metadata.operational?.heatGeneration || 0) > 1000,
      validate: (obj, context) => {
        const ventilationOk = context.environmentalConditions.airflow > 10
        
        return {
          isValid: ventilationOk,
          score: ventilationOk ? 100 : 30,
          issues: ventilationOk ? [] : [{
            type: 'warning',
            rule: 'equipment-ventilation',
            description: 'Equipment generates heat and requires ventilation',
            suggestion: 'Ensure adequate airflow around equipment'
          }]
        }
      },
      severity: 'warning'
    })
  }

  private addFurnitureRules() {
    this.placementRules.push({
      id: 'furniture-accessibility',
      description: 'Furniture must allow ADA accessibility',
      type: 'accessibility',
      condition: () => true,
      validate: (obj, context) => {
        const adaCompliant = this.checkADACompliance(context)
        
        return {
          isValid: adaCompliant,
          score: adaCompliant ? 100 : 50,
          issues: adaCompliant ? [] : [{
            type: 'warning',
            rule: 'furniture-accessibility',
            description: 'Furniture placement should maintain ADA accessibility',
            suggestion: 'Ensure 32" minimum clear width for pathways'
          }]
        }
      },
      severity: 'warning'
    })
  }

  private addSafetyRules() {
    this.placementRules.push({
      id: 'safety-visibility',
      description: 'Safety equipment must be clearly visible',
      type: 'code',
      condition: () => true,
      validate: (obj, context) => {
        const isVisible = !context.nearbyObjects.some(nearby => 
          this.objectBlocksView(nearby, obj)
        )
        
        return {
          isValid: isVisible,
          score: isVisible ? 100 : 0,
          issues: isVisible ? [] : [{
            type: 'error',
            rule: 'safety-visibility',
            description: 'Safety equipment must be clearly visible and unobstructed',
            suggestion: 'Move blocking objects or relocate safety equipment'
          }]
        }
      },
      severity: 'error'
    })

    this.placementRules.push({
      id: 'fire-exit-clearance',
      description: 'Fire exits require clear egress path',
      type: 'code',
      condition: (obj) => obj.metadata.subcategory === 'fire-exit',
      validate: (obj, context) => {
        const clearPath = this.checkFireEgressPath(context)
        
        return {
          isValid: clearPath,
          score: clearPath ? 100 : 0,
          issues: clearPath ? [] : [{
            type: 'error',
            rule: 'fire-exit-clearance',
            description: 'Fire exit requires unobstructed egress path',
            suggestion: 'Remove obstructions from fire exit path'
          }]
        }
      },
      severity: 'error'
    })
  }

  private addStructuralRules() {
    this.placementRules.push({
      id: 'structural-support',
      description: 'Structural elements must have proper support',
      type: 'surface',
      condition: () => true,
      validate: (obj, context) => {
        const hasSupport = this.checkStructuralSupport(context)
        
        return {
          isValid: hasSupport,
          score: hasSupport ? 100 : 0,
          issues: hasSupport ? [] : [{
            type: 'error',
            rule: 'structural-support',
            description: 'Structural element requires proper foundation or support',
            suggestion: 'Ensure adequate structural support'
          }]
        }
      },
      severity: 'error'
    })
  }

  // Helper methods for rule validation
  private checkClearance(context: PlacementContext, requiredDistance: number): boolean {
    return context.nearbyObjects.every(obj => {
      const distance = this.transform.position.distanceTo(obj.transform.position)
      return distance >= requiredDistance
    })
  }

  private checkAccessPath(context: PlacementContext, requiredWidth: number): boolean {
    // Simplified access path check
    const frontDirection = new THREE.Vector3(0, 0, 1).applyEuler(this.transform.rotation)
    const frontPosition = this.transform.position.clone().add(frontDirection.multiplyScalar(2))
    
    return !context.nearbyObjects.some(obj => {
      const objBounds = obj.boundingBox
      return objBounds.containsPoint(frontPosition)
    })
  }

  private checkADACompliance(context: PlacementContext): boolean {
    // Check for 32" (2.67ft) minimum clear width
    const minWidth = 2.67
    
    // Simplified ADA check - ensure pathways aren't blocked
    return context.nearbyObjects.length === 0 || 
           context.nearbyObjects.every(obj => {
             const distance = this.transform.position.distanceTo(obj.transform.position)
             return distance >= minWidth
           })
  }

  private objectBlocksView(blocker: SemanticObject, target: SemanticObject): boolean {
    // Simplified line-of-sight check
    const direction = target.transform.position.clone().sub(blocker.transform.position).normalize()
    const distance = blocker.transform.position.distanceTo(target.transform.position)
    
    return distance < 10 && blocker.metadata.dimensions.height > target.metadata.dimensions.height * 0.5
  }

  private checkFireEgressPath(context: PlacementContext): boolean {
    // Check for clear 44" (3.67ft) egress path
    const egressWidth = 3.67
    
    return !context.nearbyObjects.some(obj => {
      const distance = this.transform.position.distanceTo(obj.transform.position)
      return distance < egressWidth
    })
  }

  private checkStructuralSupport(context: PlacementContext): boolean {
    // Check if there's a structural surface below
    return context.availableSurfaces.some(surface => 
      surface.type === 'floor' && 
      surface.position.y <= this.transform.position.y
    )
  }

  // Public methods
  validatePlacement(context: PlacementContext): ValidationResult {
    let totalScore = 0
    let weightSum = 0
    const allIssues: ValidationResult['issues'] = []
    let isValid = true

    for (const rule of this.placementRules) {
      if (rule.condition(this, context)) {
        const result = rule.validate(this, context)
        
        if (!result.isValid && rule.severity === 'error') {
          isValid = false
        }
        
        const weight = rule.severity === 'error' ? 100 : rule.severity === 'warning' ? 50 : 10
        totalScore += result.score * weight
        weightSum += weight
        allIssues.push(...result.issues)
      }
    }

    return {
      isValid,
      score: weightSum > 0 ? totalScore / weightSum : 100,
      issues: allIssues
    }
  }

  updateTransform(position?: THREE.Vector3, rotation?: THREE.Euler, scale?: THREE.Vector3) {
    if (position) this.transform.position.copy(position)
    if (rotation) this.transform.rotation.copy(rotation)
    if (scale) this.transform.scale.copy(scale)
    this.updateBoundingBox()
  }

  private updateBoundingBox() {
    const { width, height, depth } = this.metadata.dimensions
    this.boundingBox.setFromCenterAndSize(
      this.transform.position,
      new THREE.Vector3(
        width * this.transform.scale.x,
        height * this.transform.scale.y,
        depth * this.transform.scale.z
      )
    )
  }

  getConnectionPoints(): ConnectionPoint[] {
    return this.metadata.connections.map(conn => ({
      ...conn,
      position: conn.position.clone().applyEuler(this.transform.rotation).add(this.transform.position)
    }))
  }

  canConnectTo(other: SemanticObject): boolean {
    const myConnections = this.getConnectionPoints()
    const otherConnections = other.getConnectionPoints()
    
    for (const myConn of myConnections) {
      for (const otherConn of otherConnections) {
        if (myConn.type === otherConn.type) {
          const distance = myConn.position.distanceTo(otherConn.position)
          if (distance < 5) { // 5ft maximum connection distance
            return true
          }
        }
      }
    }
    
    return false
  }

  addPlacementRule(rule: PlacementRule) {
    this.placementRules.push(rule)
  }

  removePlacementRule(ruleId: string) {
    this.placementRules = this.placementRules.filter(rule => rule.id !== ruleId)
  }

  getPlacementRules(): PlacementRule[] {
    return [...this.placementRules]
  }

  clone(): SemanticObject {
    const cloned = new SemanticObject(JSON.parse(JSON.stringify(this.metadata)))
    cloned.updateTransform(
      this.transform.position.clone(),
      this.transform.rotation.clone(),
      this.transform.scale.clone()
    )
    return cloned
  }
}
