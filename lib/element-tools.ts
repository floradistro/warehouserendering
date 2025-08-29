import { FloorplanElement } from './store'
import { modelManager } from './model-manager'

/**
 * ELEMENT CREATION TOOLS
 * Provides utilities for creating different types of warehouse elements
 */

export interface ElementTemplate {
  id: string
  name: string
  description: string
  type: FloorplanElement['type']
  defaultDimensions: { width: number; height: number; depth?: number }
  defaultColor: string
  material?: string
  category: string
  metadata?: Record<string, any>
}

// Element templates for quick creation
export const ELEMENT_TEMPLATES: Record<string, ElementTemplate> = {
  // === WALLS ===
  EXTERIOR_WALL: {
    id: 'exterior-wall',
    name: 'Exterior Wall',
    description: 'Load-bearing brick exterior wall',
    type: 'wall',
    defaultDimensions: { width: 20, height: 1, depth: 12 },
    defaultColor: '#4a5568',
    category: 'exterior',
    metadata: { 
      category: 'exterior', 
      material_type: 'brick',
      load_bearing: true 
    }
  },
  INTERIOR_WALL: {
    id: 'interior-wall',
    name: 'Interior Wall',
    description: 'Non-load-bearing drywall interior wall',
    type: 'wall',
    defaultDimensions: { width: 20, height: 1, depth: 12 },
    defaultColor: '#ffffff',
    category: 'interior',
    metadata: { 
      category: 'interior', 
      material_type: 'drywall',
      load_bearing: false 
    }
  },
  PARTITION_WALL: {
    id: 'partition-wall',
    name: 'Partition Wall',
    description: 'Temporary or modular partition wall',
    type: 'wall',
    defaultDimensions: { width: 20, height: 1, depth: 8 },
    defaultColor: '#e2e8f0',
    category: 'interior',
    metadata: { 
      category: 'interior', 
      material_type: 'modular',
      load_bearing: false,
      temporary: true
    }
  },
  FIREWALL: {
    id: 'firewall',
    name: 'Firewall',
    description: 'Fire-rated wall with enhanced safety features',
    type: 'wall',
    defaultDimensions: { width: 20, height: 1, depth: 12 },
    defaultColor: '#dc2626',
    material: 'concrete',
    category: 'fire-safety',
    metadata: { 
      category: 'fire-safety', 
      material_type: 'fire-rated-concrete',
      load_bearing: true,
      fire_rating: '2-hour',
      extends_to_exterior: true,
      crosses_hallways: true,
      firewall_marking: 'subtle'
    }
  },

  // === SAFETY RAILINGS ===
  METAL_HANDRAIL: {
    id: 'metal-handrail',
    name: 'Metal Handrail System',
    description: 'OSHA compliant metal handrail with posts, top rail, mid rail, and toe kick',
    type: 'fixture',
    defaultDimensions: { width: 10, height: 0.1, depth: 3.5 },
    defaultColor: '#708090',
    material: 'metal',
    category: 'safety',
    metadata: {
      category: 'safety_railing',
      material_type: 'galvanized_steel',
      osha_compliant: true,
      height_inches: 42,
      mid_rail_height: 21,
      toe_kick_height: 4,
      post_spacing: 60, // 5 feet maximum
      rail_diameter: 1.5,
      post_diameter: 2,
      has_toe_kick: true,
      has_mid_rail: true,
      compliance_standard: 'OSHA_1910.29'
    }
  },

  // === STRUCTURAL ELEMENTS ===
  STEEL_BEAM: {
    id: 'steel-beam',
    name: 'Steel I-Beam (Single Layer)',
    description: 'Structural steel I-beam column - single layer',
    type: 'fixture',
    defaultDimensions: { width: 0.67, height: 0.67, depth: 14 },
    defaultColor: '#2c3e50',
    material: 'steel',
    category: 'structural',
    metadata: { 
      category: 'structural', 
      beam_type: 'I-beam',
      beam_size: '8_inch',
      beam_layers: 1,
      load_bearing: true 
    }
  },
  STEEL_BEAM_MULTI: {
    id: 'steel-beam-multi',
    name: 'Steel I-Beam (Multi-Layer)',
    description: 'Structural steel I-beam column - configurable layers',
    type: 'fixture',
    defaultDimensions: { width: 0.67, height: 0.67, depth: 14 },
    defaultColor: '#2c3e50',
    material: 'steel',
    category: 'structural',
    metadata: { 
      category: 'structural', 
      beam_type: 'I-beam',
      beam_size: '8_inch',
      beam_layers: 2,
      load_bearing: true 
    }
  },
  STEEL_COLUMN: {
    id: 'steel-column',
    name: 'Steel Column',
    description: 'Structural steel support column',
    type: 'fixture',
    defaultDimensions: { width: 1, height: 1, depth: 12 },
    defaultColor: '#34495e',
    material: 'steel',
    category: 'structural',
    metadata: { 
      category: 'structural', 
      beam_type: 'column',
      load_bearing: true 
    }
  },
  CONCRETE_PILLAR: {
    id: 'concrete-pillar',
    name: 'Concrete Pillar',
    description: 'Reinforced concrete support pillar',
    type: 'fixture',
    defaultDimensions: { width: 2, height: 2, depth: 12 },
    defaultColor: '#6b7280',
    material: 'concrete',
    category: 'structural',
    metadata: { 
      category: 'structural', 
      pillar_type: 'reinforced_concrete',
      load_bearing: true 
    }
  },

  // === DOORS ===
  SINGLE_DOOR: {
    id: 'single-door',
    name: 'Single Door',
    description: 'Standard single door',
    type: 'fixture',
    defaultDimensions: { width: 3, height: 1, depth: 8 },
    defaultColor: '#8B4513',
    material: 'wood',
    category: 'access',
    metadata: { 
      category: 'access', 
      door_type: 'single' 
    }
  },
  DOUBLE_DOOR: {
    id: 'double-door',
    name: 'Double Door',
    description: 'Wide double door for high traffic areas',
    type: 'fixture',
    defaultDimensions: { width: 6, height: 1, depth: 8 },
    defaultColor: '#8B4513',
    material: 'wood',
    category: 'access',
    metadata: { 
      category: 'access', 
      door_type: 'double' 
    }
  },
  OVERHEAD_DOOR: {
    id: 'overhead-door',
    name: 'Overhead Door',
    description: 'Large overhead door for loading docks',
    type: 'fixture',
    defaultDimensions: { width: 12, height: 1, depth: 12 },
    defaultColor: '#718096',
    material: 'steel',
    category: 'access',
    metadata: { 
      category: 'access', 
      door_type: 'overhead',
      industrial: true 
    }
  },

  // === WINDOWS ===
  STANDARD_WINDOW: {
    id: 'standard-window',
    name: 'Standard Window',
    description: 'Standard office window',
    type: 'window',
    defaultDimensions: { width: 4, height: 1, depth: 4 },
    defaultColor: '#cbd5e0',
    category: 'access',
    metadata: { 
      category: 'access', 
      window_type: 'standard' 
    }
  },
  INDUSTRIAL_WINDOW: {
    id: 'industrial-window',
    name: 'Industrial Window',
    description: 'Large industrial window for warehouses',
    type: 'window',
    defaultDimensions: { width: 8, height: 1, depth: 6 },
    defaultColor: '#a0aec0',
    category: 'access',
    metadata: { 
      category: 'access', 
      window_type: 'industrial' 
    }
  },

  // === SPECIALIZED ELEMENTS ===
  LOADING_DOCK: {
    id: 'loading-dock',
    name: 'Loading Dock',
    description: 'Truck loading dock area',
    type: 'fixture',
    defaultDimensions: { width: 12, height: 8, depth: 2 },
    defaultColor: '#4a5568',
    material: 'concrete',
    category: 'industrial',
    metadata: { 
      category: 'industrial', 
      dock_type: 'truck_loading',
      specialized: true 
    }
  },
  OFFICE_SPACE: {
    id: 'office-space',
    name: 'Office Space',
    description: 'Designated office area',
    type: 'room',
    defaultDimensions: { width: 12, height: 12, depth: 10 },
    defaultColor: '#f7fafc',
    category: 'office',
    metadata: { 
      category: 'office', 
      room_type: 'office',
      enclosed: true 
    }
  },
  STORAGE_AREA: {
    id: 'storage-area',
    name: 'Storage Area',
    description: 'General storage area',
    type: 'room',
    defaultDimensions: { width: 20, height: 20, depth: 12 },
    defaultColor: '#edf2f7',
    category: 'storage',
    metadata: { 
      category: 'storage', 
      room_type: 'storage',
      enclosed: false 
    }
  }
}

// Group templates by category for UI organization
export const TEMPLATE_CATEGORIES = {
  WALLS: ['EXTERIOR_WALL', 'INTERIOR_WALL', 'PARTITION_WALL', 'FIREWALL'],
  STRUCTURAL: ['STEEL_BEAM', 'STEEL_COLUMN', 'CONCRETE_PILLAR'],
  DOORS: ['SINGLE_DOOR', 'DOUBLE_DOOR', 'OVERHEAD_DOOR'],
  WINDOWS: ['STANDARD_WINDOW', 'INDUSTRIAL_WINDOW'],
  SPECIALIZED: ['LOADING_DOCK', 'OFFICE_SPACE', 'STORAGE_AREA']
} as const

/**
 * ELEMENT CREATION UTILITIES
 */

export interface CreateElementOptions {
  position: { x: number; y: number; z?: number }
  templateId?: string
  customDimensions?: { width?: number; height?: number; depth?: number }
  customColor?: string
  customMaterial?: string
  customMetadata?: Record<string, any>
}

/**
 * Creates a new element from a template
 */
export function createElement(options: CreateElementOptions): FloorplanElement | null {
  const { position, templateId, customDimensions, customColor, customMaterial, customMetadata } = options
  
  if (!templateId || !ELEMENT_TEMPLATES[templateId]) {
    console.error(`Invalid template ID: ${templateId}`)
    return null
  }

  const template = ELEMENT_TEMPLATES[templateId]
  
  const element: Omit<FloorplanElement, 'id'> = {
    type: template.type,
    position: {
      x: position.x,
      y: position.y,
      z: position.z || 0
    },
    dimensions: {
      width: customDimensions?.width || template.defaultDimensions.width,
      height: customDimensions?.height || template.defaultDimensions.height,
      depth: customDimensions?.depth || template.defaultDimensions.depth || 8
    },
    color: customColor || template.defaultColor,
    material: customMaterial || template.material,
    metadata: {
      ...template.metadata,
      ...customMetadata,
      created_from_template: templateId,
      created_at: new Date().toISOString()
    }
  }

  return element as FloorplanElement
}

/**
 * Creates and adds an element to the current model
 */
export function createAndAddElement(options: CreateElementOptions): boolean {
  const element = createElement(options)
  if (!element) {
    return false
  }

  const result = modelManager.addElement(element)
  return result.success
}

/**
 * ELEMENT VALIDATION UTILITIES
 */

export interface ElementValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates element positioning and dimensions
 */
export function validateElement(element: FloorplanElement): ElementValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check position
  if (element.position.x < 0 || element.position.y < 0) {
    errors.push('Element position cannot be negative')
  }

  // Check dimensions
  if (element.dimensions.width <= 0 || element.dimensions.height <= 0) {
    errors.push('Element dimensions must be positive')
  }

  if (element.dimensions.depth && element.dimensions.depth <= 0) {
    errors.push('Element depth must be positive')
  }

  // Type-specific validations
  switch (element.type) {
    case 'wall':
      if (element.dimensions.width < 1 && element.dimensions.height < 1) {
        warnings.push('Wall should be at least 1 foot in one dimension')
      }
      break
    
    case 'door':
    case 'fixture':
      if (element.material === 'wood' && element.dimensions.depth && element.dimensions.depth > 12) {
        warnings.push('Door height seems unusually tall')
      }
      break
    
    case 'window':
      if (element.dimensions.depth && element.dimensions.depth > 8) {
        warnings.push('Window height seems unusually tall')
      }
      break
  }

  // Material validations
  if (element.material === 'steel' && !element.metadata?.load_bearing) {
    warnings.push('Steel elements are typically load-bearing')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * ELEMENT POSITIONING UTILITIES
 */

export interface SnapOptions {
  gridSize?: number
  snapToElements?: boolean
  snapTolerance?: number
}

/**
 * Snaps position to grid or nearby elements
 */
export function snapPosition(
  position: { x: number; y: number; z?: number }, 
  options: SnapOptions = {}
): { x: number; y: number; z?: number } {
  const { gridSize = 1, snapToElements = false, snapTolerance = 0.5 } = options
  
  let snappedX = Math.round(position.x / gridSize) * gridSize
  let snappedY = Math.round(position.y / gridSize) * gridSize
  let snappedZ = position.z ? Math.round(position.z / gridSize) * gridSize : position.z

  // TODO: Implement element-to-element snapping
  if (snapToElements) {
    // This would require access to current model elements
    // Implementation would check nearby elements and snap to their edges/corners
  }

  return {
    x: snappedX,
    y: snappedY,
    z: snappedZ
  }
}

/**
 * ELEMENT TRANSFORMATION UTILITIES
 */

export interface TransformOptions {
  scale?: { x?: number; y?: number; z?: number }
  rotate?: number
  translate?: { x?: number; y?: number; z?: number }
}

/**
 * Applies transformations to an element
 */
export function transformElement(
  element: FloorplanElement, 
  transforms: TransformOptions
): Partial<FloorplanElement> {
  const updates: Partial<FloorplanElement> = {}

  // Apply scaling
  if (transforms.scale) {
    updates.dimensions = {
      width: element.dimensions.width * (transforms.scale.x || 1),
      height: element.dimensions.height * (transforms.scale.y || 1),
      depth: (element.dimensions.depth || 8) * (transforms.scale.z || 1)
    }
  }

  // Apply rotation
  if (transforms.rotate !== undefined) {
    updates.rotation = (element.rotation || 0) + transforms.rotate
  }

  // Apply translation
  if (transforms.translate) {
    updates.position = {
      x: element.position.x + (transforms.translate.x || 0),
      y: element.position.y + (transforms.translate.y || 0),
      z: (element.position.z || 0) + (transforms.translate.z || 0)
    }
  }

  return updates
}

/**
 * ELEMENT DUPLICATION UTILITIES
 */

export interface DuplicationOptions {
  count?: number
  spacing?: { x?: number; y?: number; z?: number }
  pattern?: 'linear' | 'grid' | 'circular'
  gridDimensions?: { rows?: number; cols?: number }
}

/**
 * Creates multiple copies of an element with specified patterns
 */
export function duplicateElementPattern(
  element: FloorplanElement,
  options: DuplicationOptions = {}
): Omit<FloorplanElement, 'id'>[] {
  const { 
    count = 1, 
    spacing = { x: 5, y: 5, z: 0 }, 
    pattern = 'linear',
    gridDimensions = { rows: 2, cols: 2 }
  } = options

  const duplicates: Omit<FloorplanElement, 'id'>[] = []
  const { id, ...elementWithoutId } = element

  switch (pattern) {
    case 'linear':
      for (let i = 1; i <= count; i++) {
        duplicates.push({
          ...elementWithoutId,
          position: {
            x: element.position.x + (spacing.x || 0) * i,
            y: element.position.y + (spacing.y || 0) * i,
            z: (element.position.z || 0) + (spacing.z || 0) * i
          },
          metadata: {
            ...element.metadata,
            duplicated_from: element.id,
            duplicate_index: i
          }
        })
      }
      break

    case 'grid':
      const rows = gridDimensions.rows || 2
      const cols = gridDimensions.cols || 2
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (row === 0 && col === 0) continue // Skip original position
          duplicates.push({
            ...elementWithoutId,
            position: {
              x: element.position.x + (spacing.x || 0) * col,
              y: element.position.y + (spacing.y || 0) * row,
              z: element.position.z || 0
            },
            metadata: {
              ...element.metadata,
              duplicated_from: element.id,
              grid_position: { row, col }
            }
          })
        }
      }
      break

    case 'circular':
      const radius = Math.max(spacing.x || 5, spacing.y || 5)
      for (let i = 1; i <= count; i++) {
        const angle = (2 * Math.PI * i) / count
        duplicates.push({
          ...elementWithoutId,
          position: {
            x: element.position.x + radius * Math.cos(angle),
            y: element.position.y + radius * Math.sin(angle),
            z: element.position.z || 0
          },
          metadata: {
            ...element.metadata,
            duplicated_from: element.id,
            circular_index: i,
            angle: angle
          }
        })
      }
      break
  }

  return duplicates
}

/**
 * ELEMENT MEASUREMENT UTILITIES
 */

/**
 * Calculates the area of an element
 */
export function calculateElementArea(element: FloorplanElement): number {
  return element.dimensions.width * element.dimensions.height
}

/**
 * Calculates the volume of an element
 */
export function calculateElementVolume(element: FloorplanElement): number {
  const depth = element.dimensions.depth || 8
  return element.dimensions.width * element.dimensions.height * depth
}

/**
 * Calculates distance between two elements
 */
export function calculateElementDistance(
  element1: FloorplanElement, 
  element2: FloorplanElement
): number {
  const dx = element2.position.x - element1.position.x
  const dy = element2.position.y - element1.position.y
  const dz = (element2.position.z || 0) - (element1.position.z || 0)
  
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

/**
 * Calculates straight-line distance between two elements (horizontal, vertical, or height)
 * Returns the measurement along the axis with the largest difference
 */
export function calculateStraightLineDistance(
  element1: FloorplanElement, 
  element2: FloorplanElement
): { distance: number; type: 'horizontal' | 'vertical' | 'height'; axis: string } {
  const dx = Math.abs(element2.position.x - element1.position.x)
  const dy = Math.abs(element2.position.y - element1.position.y)
  const dz = Math.abs((element2.position.z || 0) - (element1.position.z || 0))
  
  if (dy > dx && dy > dz) {
    return { distance: dy, type: 'vertical', axis: 'Y' }
  } else if (dz > dx && dz > dy) {
    return { distance: dz, type: 'height', axis: 'Z' }
  } else {
    return { distance: dx, type: 'horizontal', axis: 'X' }
  }
}

/**
 * Gets element bounds (bounding box)
 */
export function getElementBounds(element: FloorplanElement) {
  return {
    minX: element.position.x,
    maxX: element.position.x + element.dimensions.width,
    minY: element.position.y,
    maxY: element.position.y + element.dimensions.height,
    minZ: element.position.z || 0,
    maxZ: (element.position.z || 0) + (element.dimensions.depth || 8)
  }
}

/**
 * Checks if two elements overlap
 */
export function elementsOverlap(element1: FloorplanElement, element2: FloorplanElement): boolean {
  const bounds1 = getElementBounds(element1)
  const bounds2 = getElementBounds(element2)
  
  return !(
    bounds1.maxX <= bounds2.minX ||
    bounds2.maxX <= bounds1.minX ||
    bounds1.maxY <= bounds2.minY ||
    bounds2.maxY <= bounds1.minY ||
    bounds1.maxZ <= bounds2.minZ ||
    bounds2.maxZ <= bounds1.minZ
  )
}



