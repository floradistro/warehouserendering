import { FloorplanElement } from './store'
import { 
  generateAllWallToTrussFraming,
  WallToTrussConfig,
  identifyEastWestWalls
} from './wall-to-truss-framing'
import { modelManager } from './model-manager'

/**
 * AUTO WALL-TO-TRUSS FRAMING GENERATOR
 * 
 * Automatically generates 2x4 framing from interior walls to roof trusses
 * for existing warehouse models
 */

// ===== DEFAULT CONFIGURATIONS =====

export const DEFAULT_WALL_TO_TRUSS_CONFIG: WallToTrussConfig = {
  wallHeight: 8,              // 8 foot interior walls
  trussHeight: 12,            // 12 foot truss height
  trussSpacing: 24,           // 24" on center truss spacing
  wallThickness: 6,           // 6" interior wall thickness
  framingMember: {
    size: '2x4',
    spacing: 16,              // 16" on center stud spacing
    material: 'wood'
  },
  roofPitch: '4:12',          // 4:12 roof pitch
  connectionType: 'direct'    // Direct bearing connection
}

export const WAREHOUSE_CONFIGS: Record<string, WallToTrussConfig> = {
  'light-industrial': {
    ...DEFAULT_WALL_TO_TRUSS_CONFIG,
    trussSpacing: 24,
    framingMember: { size: '2x4', spacing: 16, material: 'wood' },
    connectionType: 'direct'
  },
  'heavy-industrial': {
    ...DEFAULT_WALL_TO_TRUSS_CONFIG,
    trussSpacing: 20,
    framingMember: { size: '2x6', spacing: 16, material: 'wood' },
    connectionType: 'hanger',
    wallHeight: 10,
    trussHeight: 16
  },
  'commercial': {
    ...DEFAULT_WALL_TO_TRUSS_CONFIG,
    trussSpacing: 24,
    framingMember: { size: '2x4', spacing: 24, material: 'wood' },
    connectionType: 'blocking',
    roofPitch: '3:12'
  }
}

// ===== AUTO-GENERATION FUNCTIONS =====

/**
 * Automatically add wall-to-truss framing to existing warehouse model
 */
export function autoGenerateWallFraming(
  modelId?: string,
  configType: keyof typeof WAREHOUSE_CONFIGS = 'light-industrial'
): {
  success: boolean
  elementsAdded: number
  wallsProcessed: number
  errors: string[]
  summary: string
} {
  try {
    // Get current model elements
    const currentModel = modelManager.getCurrentModel()
    if (!currentModel) {
      return {
        success: false,
        elementsAdded: 0,
        wallsProcessed: 0,
        errors: ['No active model found'],
        summary: 'Failed: No active model'
      }
    }

    const config = WAREHOUSE_CONFIGS[configType]
    const elements = currentModel.data?.elements || []

    // Identify east/west interior walls
    const eastWestWalls = identifyEastWestWalls(elements)
    
    if (eastWestWalls.length === 0) {
      return {
        success: true,
        elementsAdded: 0,
        wallsProcessed: 0,
        errors: [],
        summary: 'No east/west interior walls found to frame'
      }
    }

    // Generate all wall-to-truss framing
    const framingElements = generateAllWallToTrussFraming(elements, config)
    
    // Add framing elements to the model
    let addedCount = 0
    const errors: string[] = []

    framingElements.forEach(element => {
      const result = modelManager.addElement(element)
      if (result.success) {
        addedCount++
      } else {
        errors.push(`Failed to add ${element.id}: ${result.error}`)
      }
    })

    const summary = `Added ${addedCount} framing elements for ${eastWestWalls.length} walls`

    return {
      success: errors.length === 0,
      elementsAdded: addedCount,
      wallsProcessed: eastWestWalls.length,
      errors,
      summary
    }

  } catch (error) {
    return {
      success: false,
      elementsAdded: 0,
      wallsProcessed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      summary: 'Failed: Exception occurred'
    }
  }
}

/**
 * Preview wall-to-truss framing without adding to model
 */
export function previewWallFraming(
  elements: FloorplanElement[],
  configType: keyof typeof WAREHOUSE_CONFIGS = 'light-industrial'
): {
  wallsFound: FloorplanElement[]
  framingElements: FloorplanElement[]
  materialSummary: {
    lumber: { size: string; pieces: number; totalFeet: number }[]
    hardware: { item: string; quantity: number }[]
    estimatedCost: number
  }
  warnings: string[]
} {
  const config = WAREHOUSE_CONFIGS[configType]
  const eastWestWalls = identifyEastWestWalls(elements)
  const framingElements = generateAllWallToTrussFraming(elements, config)
  
  // Calculate material summary
  const lumberSummary: { [size: string]: { pieces: number; totalFeet: number } } = {}
  
  framingElements.forEach(element => {
    const size = element.metadata?.lumber_size || '2x4'
    const length = Math.max(element.dimensions.width, element.dimensions.height, element.dimensions.depth || 0)
    
    if (!lumberSummary[size]) {
      lumberSummary[size] = { pieces: 0, totalFeet: 0 }
    }
    
    lumberSummary[size].pieces++
    lumberSummary[size].totalFeet += length
  })
  
  const lumber = Object.entries(lumberSummary).map(([size, data]) => ({
    size,
    pieces: data.pieces,
    totalFeet: data.totalFeet
  }))
  
  // Hardware summary
  const studCount = framingElements.filter(e => e.metadata?.framing_type === 'stud').length
  const hardware = [
    { item: '16d Framing Nails', quantity: Math.ceil(studCount * 0.5) }, // lbs
    { item: 'Simpson A35 Clips', quantity: studCount },
    { item: 'Construction Screws', quantity: Math.ceil(studCount * 8) }
  ]
  
  // Cost estimate
  const lumberCost = lumber.reduce((sum, item) => sum + (item.totalFeet * 2.5), 0) // $2.50/ft estimate
  const hardwareCost = studCount * 15 // $15 per connection point
  const estimatedCost = lumberCost + hardwareCost
  
  // Warnings
  const warnings: string[] = []
  if (eastWestWalls.length === 0) {
    warnings.push('No east/west interior walls found')
  }
  if (framingElements.length > 100) {
    warnings.push('Large number of framing elements - consider phased installation')
  }
  
  return {
    wallsFound: eastWestWalls,
    framingElements,
    materialSummary: {
      lumber,
      hardware,
      estimatedCost
    },
    warnings
  }
}

/**
 * Remove all wall-to-truss framing from current model
 */
export function removeWallFraming(): {
  success: boolean
  elementsRemoved: number
  summary: string
} {
  try {
    const currentModel = modelManager.getCurrentModel()
    if (!currentModel) {
      return {
        success: false,
        elementsRemoved: 0,
        summary: 'No active model found'
      }
    }

    // Find all wall-to-truss framing elements
    const framingElements = (currentModel.data?.elements || []).filter(element => 
      element.metadata?.subcategory === 'wall-to-truss-framing' ||
      element.metadata?.subcategory === 'wall-framing' ||
      element.metadata?.hardware_type === 'angle-clip'
    )

    // Remove each framing element
    let removedCount = 0
    framingElements.forEach(element => {
      const result = modelManager.removeElement(element.id)
      if (result.success) {
        removedCount++
      }
    })

    return {
      success: true,
      elementsRemoved: removedCount,
      summary: `Removed ${removedCount} wall framing elements`
    }

  } catch (error) {
    return {
      success: false,
      elementsRemoved: 0,
      summary: 'Failed to remove framing elements'
    }
  }
}

/**
 * Update existing wall-to-truss framing configuration
 */
export function updateWallFramingConfig(
  newConfigType: keyof typeof WAREHOUSE_CONFIGS
): {
  success: boolean
  elementsUpdated: number
  summary: string
} {
  try {
    // Remove existing framing
    const removeResult = removeWallFraming()
    
    if (!removeResult.success) {
      return {
        success: false,
        elementsUpdated: 0,
        summary: 'Failed to remove existing framing'
      }
    }

    // Add new framing with updated config
    const addResult = autoGenerateWallFraming(undefined, newConfigType)
    
    return {
      success: addResult.success,
      elementsUpdated: addResult.elementsAdded,
      summary: `Updated to ${newConfigType} configuration: ${addResult.summary}`
    }

  } catch (error) {
    return {
      success: false,
      elementsUpdated: 0,
      summary: 'Failed to update framing configuration'
    }
  }
}

// ===== VALIDATION AND QUALITY CONTROL =====

/**
 * Validate wall-to-truss framing in current model
 */
export function validateWallFraming(): {
  isValid: boolean
  wallsFramed: number
  totalConnections: number
  issues: {
    critical: string[]
    warnings: string[]
    recommendations: string[]
  }
  loadAnalysis: {
    totalLoad: number
    connectionCapacity: number
    safetyFactor: number
  }
} {
  const currentModel = modelManager.getCurrentModel()
  if (!currentModel) {
    return {
      isValid: false,
      wallsFramed: 0,
      totalConnections: 0,
      issues: {
        critical: ['No active model found'],
        warnings: [],
        recommendations: []
      },
      loadAnalysis: { totalLoad: 0, connectionCapacity: 0, safetyFactor: 0 }
    }
  }

  const elements = currentModel.data?.elements || []
  const eastWestWalls = identifyEastWestWalls(elements)
  const framingElements = elements.filter(e => 
    e.metadata?.subcategory === 'wall-to-truss-framing'
  )
  const connectionElements = elements.filter(e => 
    e.metadata?.hardware_type === 'angle-clip'
  )

  const critical: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []

  // Check if all E/W walls have framing
  const framedWalls = new Set(framingElements.map(e => e.metadata?.wall_id).filter(Boolean))
  const unframedWalls = eastWestWalls.filter(wall => !framedWalls.has(wall.id))
  
  if (unframedWalls.length > 0) {
    critical.push(`${unframedWalls.length} east/west walls lack framing connections`)
  }

  // Check connection spacing
  framingElements.forEach(element => {
    if (element.metadata?.framing_type === 'stud') {
      const spacing = element.metadata?.stud_spacing
      if (spacing && spacing > 24) {
        warnings.push(`Excessive stud spacing: ${spacing}" (max 24")`)
      }
    }
  })

  // Load analysis
  const totalLoad = framingElements.reduce((sum, element) => {
    return sum + (element.metadata?.total_load || 0)
  }, 0)
  
  const connectionCapacity = connectionElements.reduce((sum, element) => {
    return sum + (element.metadata?.load_capacity || 1200)
  }, 0)
  
  const safetyFactor = connectionCapacity > 0 ? connectionCapacity / totalLoad : 0

  if (safetyFactor < 1.5) {
    critical.push(`Insufficient safety factor: ${safetyFactor.toFixed(2)} (min 1.5)`)
  } else if (safetyFactor < 2.0) {
    warnings.push(`Low safety factor: ${safetyFactor.toFixed(2)} (recommend 2.0+)`)
  }

  // Recommendations
  if (framingElements.length > 0 && connectionElements.length === 0) {
    recommendations.push('Add connection hardware for proper load transfer')
  }
  
  if (eastWestWalls.length > 5) {
    recommendations.push('Consider phased installation for large projects')
  }

  return {
    isValid: critical.length === 0,
    wallsFramed: framedWalls.size,
    totalConnections: connectionElements.length,
    issues: { critical, warnings, recommendations },
    loadAnalysis: { totalLoad, connectionCapacity, safetyFactor }
  }
}

// ===== INTEGRATION WITH MODEL MANAGER =====

/**
 * Register wall framing functions with model manager
 */
export function registerWallFramingCommands() {
  // These would be registered with the command system
  const commands = {
    'wall-framing:auto-generate': autoGenerateWallFraming,
    'wall-framing:preview': previewWallFraming,
    'wall-framing:remove': removeWallFraming,
    'wall-framing:update-config': updateWallFramingConfig,
    'wall-framing:validate': validateWallFraming
  }
  
  return commands
}

// Make functions available globally for UI integration
if (typeof window !== 'undefined') {
  (window as any).wallFramingUtils = {
    autoGenerate: autoGenerateWallFraming,
    preview: previewWallFraming,
    remove: removeWallFraming,
    updateConfig: updateWallFramingConfig,
    validate: validateWallFraming,
    configs: WAREHOUSE_CONFIGS
  }
}
