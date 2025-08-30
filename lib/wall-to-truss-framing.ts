import * as THREE from 'three'
import { FloorplanElement } from './store'
import { 
  calculateRiseRun, 
  riseRunFromPitch,
  calculateJoistLayout,
  Point2D,
  Point3D 
} from './geometry/GeometryCalculator'
import {
  LUMBER_SIZES
} from './geometry/FramingCalculator'

/**
 * WALL-TO-TRUSS FRAMING SYSTEM
 * 
 * Creates 2x4 framing connections from the top of east/west running interior walls
 * up into the bottom chord of roof trusses for proper structural integration
 */

// ===== FRAMING CONFIGURATION =====

export interface WallToTrussConfig {
  wallHeight: number           // Height of interior walls (feet)
  trussHeight: number         // Height to bottom of truss (feet)  
  trussSpacing: number        // Truss spacing (inches on center)
  wallThickness: number       // Wall thickness (inches)
  framingMember: {
    size: string             // Lumber size (e.g., "2x4")
    spacing: number          // Stud spacing (inches on center)
    material: 'wood' | 'steel'
  }
  roofPitch: string           // Roof pitch (e.g., "4:12")
  connectionType: 'direct' | 'blocking' | 'hanger'
}

export interface WallToTrussFraming {
  id: string
  wallId: string
  trussId?: string
  framingMembers: FramingMember[]
  connections: TrussConnection[]
  loadPath: LoadPath
}

export interface FramingMember {
  id: string
  type: 'stud' | 'blocking' | 'connector' | 'top-plate'
  position: Point3D
  dimensions: { width: number; height: number; depth: number }
  angle: number
  size: string
  connections: string[]
}

export interface TrussConnection {
  id: string
  type: 'bearing' | 'hanger' | 'clip' | 'bolt'
  position: Point3D
  trussPoint: 'bottom-chord' | 'web-member' | 'heel'
  capacity: number // lbs
}

export interface LoadPath {
  roofLoad: number      // Load from roof (lbs/ft)
  wallLoad: number      // Load from wall (lbs/ft) 
  totalLoad: number     // Combined load (lbs/ft)
  transferMethod: string
}

// ===== WALL IDENTIFICATION =====

/**
 * Identify east/west running interior walls from floorplan elements
 */
export function identifyEastWestWalls(elements: FloorplanElement[]): FloorplanElement[] {
  return elements.filter(element => {
    if (element.type !== 'wall') return false
    
    // Check if it's an interior wall
    const isInterior = element.metadata?.category === 'interior' || 
                      element.metadata?.load_bearing === false ||
                      element.color === '#ffffff' // Interior wall color
    
    if (!isInterior) return false
    
    // Determine if wall runs east/west (horizontal orientation)
    const rotation = element.rotation || 0
    const width = element.dimensions.width
    const height = element.dimensions.height
    
    // Wall runs E/W if width > height (assuming standard orientation)
    // or if rotation indicates horizontal alignment
    const runsEastWest = (width > height) || 
                        (Math.abs(rotation) < 45 || Math.abs(rotation - 180) < 45)
    
    return runsEastWest
  })
}

// ===== FRAMING GENERATION =====

/**
 * Generate 2x4 framing from wall top to truss bottom
 */
export function generateWallToTrussFraming(
  wall: FloorplanElement,
  config: WallToTrussConfig,
  trusses: FloorplanElement[] = []
): WallToTrussFraming {
  
  const wallLength = wall.dimensions.width
  const wallTop = (wall.position.z || 0) + (wall.dimensions.depth || 8)
  const trussBottom = config.trussHeight
  const framingHeight = trussBottom - wallTop
  
  // Calculate stud layout along the wall
  const studLayout = calculateJoistLayout(wallLength, config.framingMember.spacing)
  
  const framingMembers: FramingMember[] = []
  const connections: TrussConnection[] = []
  
  // Generate top plates (double 2x4 at top of wall)
  const topPlate1: FramingMember = {
    id: `top-plate-1-${wall.id}`,
    type: 'top-plate',
    position: {
      x: wall.position.x,
      y: wall.position.y,
      z: wallTop
    },
    dimensions: {
      width: wallLength,
      height: LUMBER_SIZES[config.framingMember.size].actualHeight / 12,
      depth: LUMBER_SIZES[config.framingMember.size].actualWidth / 12
    },
    angle: wall.rotation || 0,
    size: config.framingMember.size,
    connections: []
  }
  
  const topPlate2: FramingMember = {
    id: `top-plate-2-${wall.id}`,
    type: 'top-plate',
    position: {
      x: wall.position.x,
      y: wall.position.y,
      z: wallTop + (LUMBER_SIZES[config.framingMember.size].actualHeight / 12)
    },
    dimensions: {
      width: wallLength,
      height: LUMBER_SIZES[config.framingMember.size].actualHeight / 12,
      depth: LUMBER_SIZES[config.framingMember.size].actualWidth / 12
    },
    angle: wall.rotation || 0,
    size: config.framingMember.size,
    connections: []
  }
  
  framingMembers.push(topPlate1, topPlate2)
  
  // Generate vertical framing members from wall to truss
  for (let i = 0; i < studLayout.count; i++) {
    const studPosition = (i * studLayout.actualSpacing) / 12
    
    // Calculate connection point based on roof pitch
    const riseRun = riseRunFromPitch(config.roofPitch, 12)
    const connectionHeight = framingHeight
    
    const verticalFraming: FramingMember = {
      id: `wall-truss-stud-${wall.id}-${i}`,
      type: 'stud',
      position: {
        x: wall.position.x + studPosition,
        y: wall.position.y,
        z: wallTop + (LUMBER_SIZES[config.framingMember.size].actualHeight / 12) * 2 // Above top plates
      },
      dimensions: {
        width: LUMBER_SIZES[config.framingMember.size].actualWidth / 12,
        height: LUMBER_SIZES[config.framingMember.size].actualHeight / 12,
        depth: connectionHeight
      },
      angle: 0, // Vertical
      size: config.framingMember.size,
      connections: [`top-plate-2-${wall.id}`]
    }
    
    framingMembers.push(verticalFraming)
    
    // Create truss connection
    const trussConnection: TrussConnection = {
      id: `truss-connection-${wall.id}-${i}`,
      type: config.connectionType === 'hanger' ? 'hanger' : 'bearing',
      position: {
        x: wall.position.x + studPosition,
        y: wall.position.y,
        z: trussBottom
      },
      trussPoint: 'bottom-chord',
      capacity: 1500 // lbs, typical for 2x4 connection
    }
    
    connections.push(trussConnection)
    verticalFraming.connections.push(trussConnection.id)
  }
  
  // Add blocking between studs if required
  if (framingHeight > 8) { // Add blocking for tall connections
    const blockingHeight = wallTop + framingHeight / 2
    
    for (let i = 0; i < studLayout.count - 1; i++) {
      const blockingPosition = ((i + 0.5) * studLayout.actualSpacing) / 12
      
      const blocking: FramingMember = {
        id: `blocking-${wall.id}-${i}`,
        type: 'blocking',
        position: {
          x: wall.position.x + blockingPosition,
          y: wall.position.y,
          z: blockingHeight
        },
        dimensions: {
          width: (studLayout.actualSpacing / 12) - (LUMBER_SIZES[config.framingMember.size].actualWidth / 12),
          height: LUMBER_SIZES[config.framingMember.size].actualHeight / 12,
          depth: LUMBER_SIZES[config.framingMember.size].actualWidth / 12
        },
        angle: 90, // Perpendicular to studs
        size: config.framingMember.size,
        connections: [
          `wall-truss-stud-${wall.id}-${i}`,
          `wall-truss-stud-${wall.id}-${i + 1}`
        ]
      }
      
      framingMembers.push(blocking)
    }
  }
  
  // Calculate load path
  const roofTributaryWidth = config.trussSpacing / 12 // feet
  const roofLoad = 50 * roofTributaryWidth // 50 psf roof load
  const wallLoad = 15 * wallLength // 15 plf wall load
  const totalLoad = roofLoad + wallLoad
  
  const loadPath: LoadPath = {
    roofLoad,
    wallLoad,
    totalLoad,
    transferMethod: `${config.connectionType} connection to truss bottom chord`
  }
  
  return {
    id: `wall-truss-framing-${wall.id}`,
    wallId: wall.id,
    framingMembers,
    connections,
    loadPath
  }
}

// ===== INTEGRATION WITH FLOORPLAN =====

/**
 * Convert wall-to-truss framing to FloorplanElements
 */
export function framingToFloorplanElements(
  framing: WallToTrussFraming,
  materialColor: string = '#DEB887' // Light wood color
): FloorplanElement[] {
  const elements: FloorplanElement[] = []
  
  framing.framingMembers.forEach((member, index) => {
    const element: FloorplanElement = {
      id: member.id,
      type: 'fixture',
      position: member.position,
      dimensions: member.dimensions,
      rotation: member.angle,
      color: materialColor,
      material: 'wood',
      metadata: {
        category: 'structural',
        subcategory: 'wall-to-truss-framing',
        framing_type: member.type,
        lumber_size: member.size,
        wall_id: framing.wallId,
        load_bearing: true,
        connections: member.connections,
        load_path: framing.loadPath.transferMethod,
        total_load: framing.loadPath.totalLoad
      }
    }
    
    elements.push(element)
  })
  
  return elements
}

/**
 * Generate all wall-to-truss framing for a warehouse model
 */
export function generateAllWallToTrussFraming(
  elements: FloorplanElement[],
  config: WallToTrussConfig
): FloorplanElement[] {
  const eastWestWalls = identifyEastWestWalls(elements)
  const trusses = elements.filter(e => e.metadata?.element_type === 'truss')
  
  const allFramingElements: FloorplanElement[] = []
  
  eastWestWalls.forEach(wall => {
    const framing = generateWallToTrussFraming(wall, config, trusses)
    const framingElements = framingToFloorplanElements(framing)
    allFramingElements.push(...framingElements)
  })
  
  return allFramingElements
}

// ===== ADVANCED FRAMING FEATURES =====

/**
 * Calculate optimal connection spacing for load transfer
 */
export function calculateOptimalConnectionSpacing(
  wallLength: number,
  totalLoad: number,
  connectionCapacity: number = 1500
): {
  recommendedSpacing: number
  connectionCount: number
  safetyFactor: number
} {
  const requiredConnections = Math.ceil(totalLoad / connectionCapacity)
  const recommendedSpacing = (wallLength * 12) / requiredConnections // inches
  
  // Round to standard spacing
  const standardSpacings = [12, 16, 19.2, 24]
  const actualSpacing = standardSpacings.find(spacing => spacing <= recommendedSpacing) || 12
  
  const actualConnectionCount = Math.ceil((wallLength * 12) / actualSpacing)
  const actualCapacity = actualConnectionCount * connectionCapacity
  const safetyFactor = actualCapacity / totalLoad
  
  return {
    recommendedSpacing: actualSpacing,
    connectionCount: actualConnectionCount,
    safetyFactor
  }
}

/**
 * Generate connection details for different truss types
 */
export function generateTrussConnectionDetails(
  connectionType: 'direct' | 'blocking' | 'hanger',
  trussType: 'wood' | 'steel' | 'engineered'
): {
  hardware: string[]
  installation: string[]
  loadCapacity: number
  cost: number
} {
  const connectionDetails = {
    direct: {
      wood: {
        hardware: ['16d nails', 'Simpson A35 angle clips', 'Construction adhesive'],
        installation: ['Toe-nail studs to truss bottom chord', 'Install angle clips every 4 feet', 'Apply adhesive to contact surfaces'],
        loadCapacity: 1200,
        cost: 15
      }
    },
    hanger: {
      wood: {
        hardware: ['Simpson LUS26 hangers', '10d x 1.5" hanger nails', 'Simpson SDS screws'],
        installation: ['Install hangers on truss bottom chord', 'Nail hangers with specified nails', 'Insert studs and secure'],
        loadCapacity: 1875,
        cost: 35
      }
    },
    blocking: {
      wood: {
        hardware: ['2x4 blocking', '16d nails', 'Simpson A34 clips'],
        installation: ['Cut blocking to fit between studs', 'Install blocking at mid-height', 'Secure with clips and nails'],
        loadCapacity: 1500,
        cost: 25
      }
    }
  }
  
  return (connectionDetails as any)[connectionType]?.[trussType] || connectionDetails.direct.wood
}

/**
 * Create material takeoff for wall-to-truss framing
 */
export function createWallToTrussFramingTakeoff(
  framingElements: FloorplanElement[]
): {
  lumber: { size: string; pieces: number; totalLength: number; cost: number }[]
  hardware: { item: string; quantity: number; cost: number }[]
  totalCost: number
  laborHours: number
} {
  const lumberTakeoff: { [size: string]: { pieces: number; totalLength: number } } = {}
  
  framingElements.forEach(element => {
    const size = element.metadata?.lumber_size || '2x4'
    const length = Math.max(element.dimensions.width, element.dimensions.height, element.dimensions.depth || 0)
    
    if (!lumberTakeoff[size]) {
      lumberTakeoff[size] = { pieces: 0, totalLength: 0 }
    }
    
    lumberTakeoff[size].pieces++
    lumberTakeoff[size].totalLength += length
  })
  
  // Convert to lumber list with costs
  const lumber = Object.entries(lumberTakeoff).map(([size, data]) => ({
    size,
    pieces: data.pieces,
    totalLength: data.totalLength,
    cost: data.totalLength * (LUMBER_SIZES[size]?.weight || 2) * 0.75 // $0.75/lb estimate
  }))
  
  // Hardware estimate
  const connectionCount = framingElements.filter(e => e.metadata?.framing_type === 'stud').length
  const hardware = [
    { item: '16d Framing Nails (50lb box)', quantity: Math.ceil(connectionCount / 100), cost: 85 },
    { item: 'Simpson A35 Angle Clips', quantity: connectionCount, cost: connectionCount * 2.50 },
    { item: 'Joist Hanger Nails (5lb)', quantity: Math.ceil(connectionCount / 50), cost: 25 }
  ]
  
  const lumberCost = lumber.reduce((sum, item) => sum + item.cost, 0)
  const hardwareCost = hardware.reduce((sum, item) => sum + (item.quantity * (typeof item.cost === 'number' ? item.cost : 0)), 0)
  const totalCost = lumberCost + hardwareCost
  
  // Labor estimate: 30 minutes per connection point
  const laborHours = connectionCount * 0.5
  
  return {
    lumber,
    hardware,
    totalCost,
    laborHours
  }
}

// ===== QUALITY CONTROL =====

/**
 * Validate wall-to-truss framing connections
 */
export function validateWallToTrussConnections(
  framing: WallToTrussFraming,
  buildingCode: 'IBC' | 'IRC' = 'IBC'
): {
  isValid: boolean
  warnings: string[]
  errors: string[]
  recommendations: string[]
} {
  const warnings: string[] = []
  const errors: string[] = []
  const recommendations: string[] = []
  
  // Check connection spacing
  const studSpacing = framing.framingMembers
    .filter(m => m.type === 'stud')
    .map((stud, index, studs) => {
      if (index === 0) return 0
      return Math.abs(stud.position.x - studs[index - 1].position.x) * 12 // inches
    })
    .filter(spacing => spacing > 0)
  
  const maxSpacing = Math.max(...studSpacing)
  if (maxSpacing > 24) {
    errors.push(`Stud spacing exceeds 24" maximum (found ${maxSpacing.toFixed(1)}")`)
  } else if (maxSpacing > 16) {
    warnings.push(`Stud spacing over 16" may require engineering review (found ${maxSpacing.toFixed(1)}")`)
  }
  
  // Check load capacity
  const totalLoad = framing.loadPath.totalLoad
  const connectionCapacity = framing.connections.reduce((sum, conn) => sum + conn.capacity, 0)
  const safetyFactor = connectionCapacity / totalLoad
  
  if (safetyFactor < 1.5) {
    errors.push(`Insufficient safety factor: ${safetyFactor.toFixed(2)} (minimum 1.5 required)`)
  } else if (safetyFactor < 2.0) {
    warnings.push(`Low safety factor: ${safetyFactor.toFixed(2)} (2.0+ recommended)`)
  }
  
  // Check framing height
  const framingHeight = framing.framingMembers
    .filter(m => m.type === 'stud')
    .map(m => m.dimensions.depth)[0] || 0
  
  if (framingHeight > 10) {
    recommendations.push('Consider adding mid-height blocking for framing over 10 feet tall')
  }
  
  // Check connection type appropriateness
  if (totalLoad > 2000 && !framing.connections.some(c => c.type === 'hanger')) {
    recommendations.push('Consider using joist hangers for loads over 2000 lbs')
  }
  
  const isValid = errors.length === 0
  
  return {
    isValid,
    warnings,
    errors,
    recommendations
  }
}
