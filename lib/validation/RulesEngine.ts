import * as THREE from 'three'
import { SemanticObject, ValidationResult } from '../models/SemanticModel'
import { FloorPlan2D, Room2D } from '../floorplan/FloorPlanEngine'

// Building code standards
export interface BuildingCode {
  id: string
  name: string
  version: string
  jurisdiction: string
  rules: CodeRule[]
}

export interface CodeRule {
  id: string
  section: string
  title: string
  description: string
  category: 'fire' | 'accessibility' | 'structural' | 'electrical' | 'plumbing' | 'hvac' | 'occupancy'
  severity: 'error' | 'warning' | 'info'
  validate: (layout: WarehouseLayout) => CodeValidationResult
}

export interface CodeValidationResult {
  compliant: boolean
  issues: Array<{
    ruleId: string
    severity: 'error' | 'warning' | 'info'
    description: string
    location?: THREE.Vector3 | { x: number; y: number }
    affectedObjects: string[]
    suggestion: string
    reference: string // Code section reference
  }>
  score: number // 0-100 compliance score
}

// Warehouse layout for validation
export interface WarehouseLayout {
  objects: SemanticObject[]
  floorPlan: FloorPlan2D
  rooms: Room2D[]
  totalArea: number
  occupancy: number
  buildingHeight: number
  constructionType: 'I' | 'II' | 'III' | 'IV' | 'V'
  sprinklerSystem: boolean
  fireAlarmSystem: boolean
}

// Optimization suggestions
export interface OptimizationSuggestion {
  id: string
  type: 'efficiency' | 'cost' | 'safety' | 'accessibility' | 'workflow' | 'energy'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  impact: string
  estimatedSavings?: number
  implementationCost?: number
  affectedObjects: string[]
  steps: string[]
}

// Main Rules Engine
export class RulesEngine {
  private buildingCodes: Map<string, BuildingCode> = new Map()
  private customRules: Map<string, CodeRule> = new Map()

  constructor() {
    this.initializeStandardCodes()
  }

  private initializeStandardCodes() {
    // International Building Code (IBC) 2021
    const ibc2021: BuildingCode = {
      id: 'ibc-2021',
      name: 'International Building Code',
      version: '2021',
      jurisdiction: 'International',
      rules: [
        // Fire safety rules
        {
          id: 'ibc-1006-exit-width',
          section: '1006.2',
          title: 'Exit Width',
          description: 'Exits must provide minimum width based on occupant load',
          category: 'fire',
          severity: 'error',
          validate: (layout) => this.validateExitWidth(layout)
        },
        {
          id: 'ibc-1015-exit-access',
          section: '1015.1',
          title: 'Exit Access Travel Distance',
          description: 'Maximum travel distance to exits',
          category: 'fire',
          severity: 'error',
          validate: (layout) => this.validateExitAccessDistance(layout)
        },
        {
          id: 'ibc-1006-exit-number',
          section: '1006.2',
          title: 'Number of Exits',
          description: 'Minimum number of exits required',
          category: 'fire',
          severity: 'error',
          validate: (layout) => this.validateExitNumber(layout)
        },

        // Accessibility rules (ADA)
        {
          id: 'ada-206-accessible-routes',
          section: 'ADA 206',
          title: 'Accessible Routes',
          description: 'Accessible routes must connect all areas',
          category: 'accessibility',
          severity: 'error',
          validate: (layout) => this.validateAccessibleRoutes(layout)
        },
        {
          id: 'ada-403-walking-surfaces',
          section: 'ADA 403',
          title: 'Walking Surface Requirements',
          description: 'Minimum width and surface requirements for accessible routes',
          category: 'accessibility',
          severity: 'error',
          validate: (layout) => this.validateWalkingSurfaces(layout)
        },

        // Electrical code rules
        {
          id: 'nec-110-working-space',
          section: 'NEC 110.26',
          title: 'Electrical Working Space',
          description: 'Required working space around electrical equipment',
          category: 'electrical',
          severity: 'error',
          validate: (layout) => this.validateElectricalWorkingSpace(layout)
        },
        {
          id: 'nec-240-overcurrent-protection',
          section: 'NEC 240',
          title: 'Overcurrent Protection',
          description: 'Electrical panels must be accessible and properly protected',
          category: 'electrical',
          severity: 'error',
          validate: (layout) => this.validateElectricalAccess(layout)
        },

        // Structural rules
        {
          id: 'ibc-1607-live-loads',
          section: '1607',
          title: 'Live Loads',
          description: 'Floor live load requirements for warehouse occupancy',
          category: 'structural',
          severity: 'warning',
          validate: (layout) => this.validateLiveLoads(layout)
        },

        // HVAC rules
        {
          id: 'imc-403-ventilation',
          section: 'IMC 403',
          title: 'Ventilation Requirements',
          description: 'Minimum ventilation rates for warehouse spaces',
          category: 'hvac',
          severity: 'warning',
          validate: (layout) => this.validateVentilation(layout)
        }
      ]
    }

    this.buildingCodes.set('ibc-2021', ibc2021)

    // OSHA Safety Standards
    const osha: BuildingCode = {
      id: 'osha-general',
      name: 'OSHA General Industry Standards',
      version: '2023',
      jurisdiction: 'United States',
      rules: [
        {
          id: 'osha-1910-22-walking-surfaces',
          section: '1910.22',
          title: 'Walking and Working Surfaces',
          description: 'General requirements for walking and working surfaces',
          category: 'fire',
          severity: 'error',
          validate: (layout) => this.validateOSHAWalkingSurfaces(layout)
        },
        {
          id: 'osha-1910-36-exit-routes',
          section: '1910.36',
          title: 'Exit Route Requirements',
          description: 'Exit routes must be continuous and unobstructed',
          category: 'fire',
          severity: 'error',
          validate: (layout) => this.validateOSHAExitRoutes(layout)
        },
        {
          id: 'osha-1910-106-flammable-liquids',
          section: '1910.106',
          title: 'Flammable and Combustible Liquids',
          description: 'Storage and handling requirements for flammable liquids',
          category: 'fire',
          severity: 'error',
          validate: (layout) => this.validateFlammableLiquidStorage(layout)
        }
      ]
    }

    this.buildingCodes.set('osha-general', osha)
  }

  // Fire safety validations
  private validateExitWidth(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    const exits = layout.objects.filter(obj => 
      obj.metadata.category === 'opening' && 
      obj.metadata.subcategory === 'door' &&
      (obj.metadata as any).properties?.isExit
    )

    const requiredWidth = Math.max(32, layout.occupancy * 0.2) // 0.2" per person, min 32"
    
    for (const exit of exits) {
      const exitWidth = exit.metadata.dimensions.width * 12 // Convert to inches
      
      if (exitWidth < requiredWidth) {
        issues.push({
          ruleId: 'ibc-1006-exit-width',
          severity: 'error',
          description: `Exit width ${exitWidth}" is less than required ${requiredWidth}"`,
          location: exit.transform.position,
          affectedObjects: [exit.metadata.id],
          suggestion: `Increase exit width to ${requiredWidth}" or reduce occupancy`,
          reference: 'IBC 2021 Section 1006.2'
        })
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20)
    }
  }

  private validateExitAccessDistance(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    const maxDistance = layout.sprinklerSystem ? 300 : 200 // feet
    
    // Simplified validation - check if any point is too far from exits
    const exits = layout.objects.filter(obj => 
      obj.metadata.category === 'opening' && 
      obj.metadata.subcategory === 'door' &&
      (obj.metadata as any).properties?.isExit
    )

    if (exits.length === 0) {
      issues.push({
        ruleId: 'ibc-1015-exit-access',
        severity: 'error',
        description: 'No exits found in layout',
        affectedObjects: [],
        suggestion: 'Add exit doors to the layout',
        reference: 'IBC 2021 Section 1015.1'
      })
    } else {
      // Check travel distance from center of each room
      for (const room of layout.rooms) {
        const roomCenter = new THREE.Vector3(room.centroid.x, 0, room.centroid.y)
        let minDistance = Infinity
        
        for (const exit of exits) {
          const distance = roomCenter.distanceTo(exit.transform.position)
          minDistance = Math.min(minDistance, distance)
        }
        
        if (minDistance > maxDistance) {
          issues.push({
            ruleId: 'ibc-1015-exit-access',
            severity: 'error',
            description: `Travel distance ${minDistance.toFixed(1)}ft exceeds maximum ${maxDistance}ft`,
            location: { x: room.centroid.x, y: room.centroid.y },
            affectedObjects: [room.id],
            suggestion: 'Add additional exits or reconfigure layout',
            reference: 'IBC 2021 Section 1015.1'
          })
        }
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15)
    }
  }

  private validateExitNumber(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    const exits = layout.objects.filter(obj => 
      obj.metadata.category === 'opening' && 
      obj.metadata.subcategory === 'door' &&
      (obj.metadata as any).properties?.isExit
    )

    let requiredExits = 1
    if (layout.occupancy > 49) requiredExits = 2
    if (layout.occupancy > 500) requiredExits = 3
    if (layout.totalArea > 10000) requiredExits = Math.max(requiredExits, 2)

    if (exits.length < requiredExits) {
      issues.push({
        ruleId: 'ibc-1006-exit-number',
        severity: 'error',
        description: `${exits.length} exits provided, ${requiredExits} required`,
        affectedObjects: exits.map(exit => exit.metadata.id),
        suggestion: `Add ${requiredExits - exits.length} additional exit(s)`,
        reference: 'IBC 2021 Section 1006.2'
      })
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25)
    }
  }

  // Accessibility validations
  private validateAccessibleRoutes(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    
    // Check if all areas are connected by accessible routes
    // This is a simplified check - a full implementation would use pathfinding
    const accessibleEntrances = layout.objects.filter(obj => 
      obj.metadata.category === 'opening' && 
      (obj.metadata as any).properties?.accessible
    )

    if (accessibleEntrances.length === 0) {
      issues.push({
        ruleId: 'ada-206-accessible-routes',
        severity: 'error',
        description: 'No accessible entrances found',
        affectedObjects: [],
        suggestion: 'Designate at least one entrance as accessible',
        reference: 'ADA 2010 Section 206'
      })
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 30)
    }
  }

  private validateWalkingSurfaces(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    const minWidth = 32 // inches
    
    // Check corridor widths
    for (const room of layout.rooms) {
      if (room.properties.type === 'circulation') {
        // Calculate minimum width of circulation space
        const width = Math.sqrt(room.area) // Simplified width calculation
        
        if (width * 12 < minWidth) { // Convert to inches
          issues.push({
            ruleId: 'ada-403-walking-surfaces',
            severity: 'error',
            description: `Corridor width ${(width * 12).toFixed(1)}" is less than minimum ${minWidth}"`,
            location: { x: room.centroid.x, y: room.centroid.y },
            affectedObjects: [room.id],
            suggestion: `Widen corridor to minimum ${minWidth}"`,
            reference: 'ADA 2010 Section 403.5.1'
          })
        }
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20)
    }
  }

  // Electrical validations
  private validateElectricalWorkingSpace(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    
    const electricalPanels = layout.objects.filter(obj => 
      obj.metadata.category === 'utility' && 
      obj.metadata.subcategory === 'panel'
    )

    for (const panel of electricalPanels) {
      const requiredClearance = 3 // feet in front
      const requiredWidth = 2.5 // feet on each side
      
      // Check for obstructions
      const obstructions = layout.objects.filter(obj => {
        if (obj.metadata.id === panel.metadata.id) return false
        
        const distance = panel.transform.position.distanceTo(obj.transform.position)
        const frontDirection = new THREE.Vector3(0, 0, 1).applyEuler(panel.transform.rotation)
        const toObject = obj.transform.position.clone().sub(panel.transform.position).normalize()
        const isFront = frontDirection.dot(toObject) > 0.7
        
        return isFront && distance < requiredClearance
      })

      if (obstructions.length > 0) {
        issues.push({
          ruleId: 'nec-110-working-space',
          severity: 'error',
          description: `Electrical panel has insufficient working space clearance`,
          location: panel.transform.position,
          affectedObjects: [panel.metadata.id, ...obstructions.map(obj => obj.metadata.id)],
          suggestion: `Maintain ${requiredClearance}ft clear space in front of electrical panel`,
          reference: 'NEC 2020 Section 110.26'
        })
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 25)
    }
  }

  private validateElectricalAccess(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    
    const electricalPanels = layout.objects.filter(obj => 
      obj.metadata.category === 'utility' && 
      obj.metadata.subcategory === 'panel'
    )

    for (const panel of electricalPanels) {
      // Check if panel is accessible (not in a locked room)
      const containingRoom = layout.rooms.find(room => 
        this.pointInPolygon({ x: panel.transform.position.x, y: panel.transform.position.z }, room.boundary)
      )

      if (containingRoom && containingRoom.properties.type === 'storage') {
        issues.push({
          ruleId: 'nec-240-overcurrent-protection',
          severity: 'warning',
          description: 'Electrical panel located in storage area may have restricted access',
          location: panel.transform.position,
          affectedObjects: [panel.metadata.id],
          suggestion: 'Ensure electrical panel remains accessible at all times',
          reference: 'NEC 2020 Section 240'
        })
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15)
    }
  }

  // Structural validations
  private validateLiveLoads(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    const warehouseLiveLoad = 125 // psf for light storage
    const heavyStorageLiveLoad = 250 // psf for heavy storage
    
    const heavyEquipment = layout.objects.filter(obj => 
      (obj.metadata.dimensions.weight || 0) > 2000
    )

    for (const equipment of heavyEquipment) {
      const weight = equipment.metadata.dimensions.weight || 0
      const area = equipment.metadata.dimensions.width * equipment.metadata.dimensions.depth
      const loadPsf = weight / area

      if (loadPsf > heavyStorageLiveLoad) {
        issues.push({
          ruleId: 'ibc-1607-live-loads',
          severity: 'warning',
          description: `Equipment load ${loadPsf.toFixed(1)} psf exceeds heavy storage limit ${heavyStorageLiveLoad} psf`,
          location: equipment.transform.position,
          affectedObjects: [equipment.metadata.id],
          suggestion: 'Verify structural capacity or redistribute load',
          reference: 'IBC 2021 Section 1607'
        })
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 10)
    }
  }

  // HVAC validations
  private validateVentilation(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    const requiredCFMPerSqFt = 0.05 // CFM per square foot for warehouse
    
    const hvacUnits = layout.objects.filter(obj => 
      obj.metadata.category === 'utility' && 
      obj.metadata.subcategory === 'hvac'
    )

    const totalRequiredCFM = layout.totalArea * requiredCFMPerSqFt
    const totalProvidedCFM = hvacUnits.reduce((sum, unit) => 
      sum + (unit.metadata.operational?.powerConsumption || 0) * 0.1, 0 // Simplified CFM calculation
    )

    if (totalProvidedCFM < totalRequiredCFM) {
      issues.push({
        ruleId: 'imc-403-ventilation',
        severity: 'warning',
        description: `Ventilation capacity ${totalProvidedCFM.toFixed(0)} CFM is less than required ${totalRequiredCFM.toFixed(0)} CFM`,
        affectedObjects: hvacUnits.map(unit => unit.metadata.id),
        suggestion: 'Add additional HVAC capacity or verify calculations',
        reference: 'IMC 2021 Section 403'
      })
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 15)
    }
  }

  // OSHA validations
  private validateOSHAWalkingSurfaces(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    
    // Check for slip/trip hazards and adequate lighting
    const lightingObjects = layout.objects.filter(obj => obj.metadata.category === 'lighting')
    const lightingDensity = lightingObjects.length / (layout.totalArea / 1000) // lights per 1000 sq ft

    if (lightingDensity < 1) {
      issues.push({
        ruleId: 'osha-1910-22-walking-surfaces',
        severity: 'warning',
        description: 'Insufficient lighting density for safe walking surfaces',
        affectedObjects: [],
        suggestion: 'Add additional lighting fixtures',
        reference: 'OSHA 1910.22(b)'
      })
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 10)
    }
  }

  private validateOSHAExitRoutes(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    
    // Check exit route continuity and obstruction
    const exits = layout.objects.filter(obj => 
      obj.metadata.category === 'opening' && 
      (obj.metadata as any).properties?.isExit
    )

    for (const exit of exits) {
      // Check for obstructions near exits
      const nearbyObjects = layout.objects.filter(obj => {
        const distance = exit.transform.position.distanceTo(obj.transform.position)
        return distance < 10 && obj.metadata.id !== exit.metadata.id
      })

      const blockingObjects = nearbyObjects.filter(obj => 
        obj.metadata.category !== 'lighting' && 
        obj.metadata.dimensions.height > 3
      )

      if (blockingObjects.length > 0) {
        issues.push({
          ruleId: 'osha-1910-36-exit-routes',
          severity: 'error',
          description: 'Exit route may be obstructed by nearby objects',
          location: exit.transform.position,
          affectedObjects: [exit.metadata.id, ...blockingObjects.map(obj => obj.metadata.id)],
          suggestion: 'Ensure exit routes remain clear and unobstructed',
          reference: 'OSHA 1910.36(a)(3)'
        })
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 20)
    }
  }

  private validateFlammableLiquidStorage(layout: WarehouseLayout): CodeValidationResult {
    const issues: CodeValidationResult['issues'] = []
    
    const flammableStorage = layout.objects.filter(obj => 
      obj.metadata.category === 'storage' && 
      (obj.metadata as any).properties?.flammable
    )

    for (const storage of flammableStorage) {
      // Check separation from ignition sources
      const ignitionSources = layout.objects.filter(obj => 
        obj.metadata.operational?.heatGeneration && obj.metadata.operational.heatGeneration > 500
      )

      for (const source of ignitionSources) {
        const distance = storage.transform.position.distanceTo(source.transform.position)
        const requiredSeparation = 25 // feet

        if (distance < requiredSeparation) {
          issues.push({
            ruleId: 'osha-1910-106-flammable-liquids',
            severity: 'error',
            description: `Flammable storage too close to heat source (${distance.toFixed(1)}ft < ${requiredSeparation}ft)`,
            location: storage.transform.position,
            affectedObjects: [storage.metadata.id, source.metadata.id],
            suggestion: `Maintain ${requiredSeparation}ft separation from ignition sources`,
            reference: 'OSHA 1910.106(d)(5)'
          })
        }
      }
    }

    return {
      compliant: issues.length === 0,
      issues,
      score: issues.length === 0 ? 100 : Math.max(0, 100 - issues.length * 30)
    }
  }

  // Utility methods
  private pointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
    let inside = false
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside
      }
    }
    return inside
  }

  // Public API methods
  validateLayout(layout: WarehouseLayout, codeIds?: string[]): CodeValidationResult {
    const codesToCheck = codeIds || Array.from(this.buildingCodes.keys())
    let allIssues: CodeValidationResult['issues'] = []
    let totalScore = 0
    let ruleCount = 0

    for (const codeId of codesToCheck) {
      const code = this.buildingCodes.get(codeId)
      if (!code) continue

      for (const rule of code.rules) {
        const result = rule.validate(layout)
        allIssues.push(...result.issues)
        totalScore += result.score
        ruleCount++
      }
    }

    return {
      compliant: !allIssues.some(issue => issue.severity === 'error'),
      issues: allIssues,
      score: ruleCount > 0 ? totalScore / ruleCount : 100
    }
  }

  generateOptimizationSuggestions(layout: WarehouseLayout): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    // Energy efficiency suggestions
    const lightingObjects = layout.objects.filter(obj => obj.metadata.category === 'lighting')
    const inefficientLighting = lightingObjects.filter(light => 
      !light.metadata.lifecycle?.energyEfficiency || 
      light.metadata.lifecycle.energyEfficiency < 'A'
    )

    if (inefficientLighting.length > 0) {
      suggestions.push({
        id: 'lighting-efficiency',
        type: 'energy',
        priority: 'medium',
        title: 'Upgrade to LED Lighting',
        description: `${inefficientLighting.length} lighting fixtures could be upgraded to LED`,
        impact: 'Reduce energy consumption by 50-70%',
        estimatedSavings: inefficientLighting.length * 100,
        implementationCost: inefficientLighting.length * 150,
        affectedObjects: inefficientLighting.map(light => light.metadata.id),
        steps: [
          'Replace existing fixtures with LED equivalents',
          'Install occupancy sensors for automatic control',
          'Consider daylight harvesting controls'
        ]
      })
    }

    // Workflow optimization
    const storageAreas = layout.rooms.filter(room => room.properties.type === 'storage')
    const officeAreas = layout.rooms.filter(room => room.properties.type === 'office')

    if (storageAreas.length > 0 && officeAreas.length > 0) {
      // Check if offices are optimally located relative to storage
      let totalDistance = 0
      for (const office of officeAreas) {
        for (const storage of storageAreas) {
          const distance = Math.sqrt(
            Math.pow(office.centroid.x - storage.centroid.x, 2) +
            Math.pow(office.centroid.y - storage.centroid.y, 2)
          )
          totalDistance += distance
        }
      }

      const avgDistance = totalDistance / (officeAreas.length * storageAreas.length)
      if (avgDistance > 100) {
        suggestions.push({
          id: 'workflow-optimization',
          type: 'workflow',
          priority: 'low',
          title: 'Optimize Office-Storage Proximity',
          description: 'Office areas are far from storage areas',
          impact: 'Reduce travel time and improve productivity',
          affectedObjects: [...officeAreas.map(r => r.id), ...storageAreas.map(r => r.id)],
          steps: [
            'Consider relocating offices closer to primary storage areas',
            'Add intermediate workstations in storage areas',
            'Implement mobile office solutions'
          ]
        })
      }
    }

    // Safety improvements
    const validationResult = this.validateLayout(layout)
    const safetyIssues = validationResult.issues.filter(issue => 
      issue.severity === 'error' && 
      (issue.ruleId.includes('fire') || issue.ruleId.includes('exit') || issue.ruleId.includes('osha'))
    )

    if (safetyIssues.length > 0) {
      suggestions.push({
        id: 'safety-improvements',
        type: 'safety',
        priority: 'high',
        title: 'Address Critical Safety Issues',
        description: `${safetyIssues.length} critical safety issues found`,
        impact: 'Ensure code compliance and worker safety',
        affectedObjects: safetyIssues.flatMap(issue => issue.affectedObjects),
        steps: safetyIssues.map(issue => issue.suggestion)
      })
    }

    return suggestions
  }

  addCustomRule(rule: CodeRule) {
    this.customRules.set(rule.id, rule)
  }

  removeCustomRule(ruleId: string) {
    this.customRules.delete(ruleId)
  }

  getBuildingCodes(): BuildingCode[] {
    return Array.from(this.buildingCodes.values())
  }

  getBuildingCode(id: string): BuildingCode | undefined {
    return this.buildingCodes.get(id)
  }

  getCustomRules(): CodeRule[] {
    return Array.from(this.customRules.values())
  }
}
