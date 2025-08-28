import * as THREE from 'three'

/**
 * WALL WITH OPENINGS SYSTEM
 * Creates wall geometries that support cutouts/openings for doors, windows, etc.
 */

export interface WallOpening {
  id: string
  type: 'door' | 'window' | 'passage'
  position: { x: number; z: number } // Position along wall (x = along length, z = height from floor)
  dimensions: { width: number; height: number } // Opening dimensions
  metadata?: {
    doorType?: 'single' | 'double' | 'sliding'
    windowType?: 'standard' | 'transom' | 'clerestory'
    description?: string
  }
}

export interface WallWithOpeningsConfig {
  wallDimensions: { width: number; height: number; depth: number } // width=length, height=thickness, depth=height
  openings: WallOpening[]
  material?: THREE.Material
}

/**
 * Creates a wall geometry with openings using CSG (Constructive Solid Geometry) approach
 * by creating the wall shape and subtracting opening shapes
 */
export function createWallWithOpenings(config: WallWithOpeningsConfig): THREE.BufferGeometry {
  const { wallDimensions, openings } = config
  const { width, height, depth } = wallDimensions

  // Start with a basic wall shape
  const wallShape = new THREE.Shape()
  wallShape.moveTo(-width/2, 0)
  wallShape.lineTo(width/2, 0)
  wallShape.lineTo(width/2, depth)
  wallShape.lineTo(-width/2, depth)
  wallShape.closePath()

  // Create holes for openings
  const holes: THREE.Path[] = []
  
  for (const opening of openings) {
    const { position, dimensions } = opening
    const { x: openingX, z: openingZ } = position
    const { width: openingWidth, height: openingHeight } = dimensions
    
    // Create opening hole - position relative to wall center
    const hole = new THREE.Path()
    const left = openingX - openingWidth/2
    const right = openingX + openingWidth/2  
    const bottom = openingZ
    const top = openingZ + openingHeight
    
    // Ensure opening is within wall bounds
    if (left >= -width/2 && right <= width/2 && bottom >= 0 && top <= depth) {
      hole.moveTo(left, bottom)
      hole.lineTo(right, bottom)
      hole.lineTo(right, top)
      hole.lineTo(left, top)
      hole.closePath()
      holes.push(hole)
    }
  }
  
  // Add holes to the wall shape
  wallShape.holes = holes

  // Create extruded geometry
  const extrudeSettings = {
    depth: height, // Wall thickness
    bevelEnabled: false
  }
  
  const geometry = new THREE.ExtrudeGeometry(wallShape, extrudeSettings)
  
  // Rotate geometry to match our coordinate system
  // (ExtrudeGeometry extrudes along Z, but we want thickness along Y)
  geometry.rotateX(-Math.PI / 2)
  geometry.rotateZ(Math.PI / 2)
  
  return geometry
}

/**
 * Creates a simple wall geometry without openings (fallback)
 */
export function createSimpleWall(dimensions: { width: number; height: number; depth: number }): THREE.BufferGeometry {
  return new THREE.BoxGeometry(dimensions.width, dimensions.depth, dimensions.height)
}

/**
 * Checks if a wall element has openings defined in its metadata
 */
export function hasWallOpenings(element: any): boolean {
  return element.metadata?.openings && Array.isArray(element.metadata.openings) && element.metadata.openings.length > 0
}

/**
 * Extracts wall openings from element metadata
 */
export function getWallOpenings(element: any): WallOpening[] {
  if (!hasWallOpenings(element)) return []
  return element.metadata.openings as WallOpening[]
}

/**
 * Creates wall geometry based on whether it has openings or not
 */
export function createWallGeometry(element: any): THREE.BufferGeometry {
  const { width, height, depth = 8 } = element.dimensions
  
  if (hasWallOpenings(element)) {
    const openings = getWallOpenings(element)
    return createWallWithOpenings({
      wallDimensions: { width, height, depth },
      openings
    })
  } else {
    return createSimpleWall({ width, height, depth })
  }
}

/**
 * Helper function to add an opening to a wall element
 */
export function addOpeningToWall(
  element: any, 
  opening: Omit<WallOpening, 'id'>
): WallOpening {
  if (!element.metadata) element.metadata = {}
  if (!element.metadata.openings) element.metadata.openings = []
  
  const wallOpening: WallOpening = {
    id: `opening-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...opening
  }
  
  element.metadata.openings.push(wallOpening)
  return wallOpening
}

/**
 * Helper function to remove an opening from a wall element
 */
export function removeOpeningFromWall(element: any, openingId: string): boolean {
  if (!hasWallOpenings(element)) return false
  
  const openings = element.metadata.openings
  const index = openings.findIndex((opening: WallOpening) => opening.id === openingId)
  
  if (index !== -1) {
    openings.splice(index, 1)
    return true
  }
  
  return false
}

/**
 * Standard opening templates
 */
export const OPENING_TEMPLATES = {
  STANDARD_DOOR: {
    type: 'door' as const,
    dimensions: { width: 3, height: 8 }, // 3' wide x 8' tall
    metadata: { doorType: 'single', description: 'Standard single door' }
  },
  DOUBLE_DOOR: {
    type: 'door' as const,
    dimensions: { width: 6, height: 8 }, // 6' wide x 8' tall  
    metadata: { doorType: 'double', description: 'Standard double door' }
  },
  WIDE_DOOR: {
    type: 'door' as const,
    dimensions: { width: 8, height: 8 }, // 8' wide x 8' tall
    metadata: { doorType: 'double', description: 'Wide double door opening' }
  },
  STANDARD_WINDOW: {
    type: 'window' as const,
    dimensions: { width: 4, height: 3 }, // 4' wide x 3' tall
    metadata: { windowType: 'standard', description: 'Standard window' }
  },
  CLERESTORY_WINDOW: {
    type: 'window' as const,
    dimensions: { width: 6, height: 2 }, // 6' wide x 2' tall, positioned high
    metadata: { windowType: 'clerestory', description: 'High clerestory window' }
  }
} as const
