import * as THREE from 'three'
import { 
  calculateRiseRun, 
  riseRunFromPitch, 
  calculateRadialSpan,
  calculateRafter,
  Point2D,
  Point3D,
  RiseRunResult,
  RadialSpanResult,
  FramingCalculation
} from './GeometryCalculator'

/**
 * FRAMING CALCULATOR
 * 
 * Specialized calculations for warehouse and building framing
 * Includes truss design, beam sizing, and structural calculations
 */

// ===== LUMBER PROPERTIES =====

export interface LumberSize {
  nominal: string      // e.g., "2x8"
  actualWidth: number  // inches
  actualHeight: number // inches
  momentOfInertia: number // in^4
  sectionModulus: number  // in^3
  weight: number       // lbs per linear foot
}

export const LUMBER_SIZES: Record<string, LumberSize> = {
  '2x4': { nominal: '2x4', actualWidth: 1.5, actualHeight: 3.5, momentOfInertia: 5.36, sectionModulus: 3.06, weight: 1.28 },
  '2x6': { nominal: '2x6', actualWidth: 1.5, actualHeight: 5.5, momentOfInertia: 20.8, sectionModulus: 7.56, weight: 1.94 },
  '2x8': { nominal: '2x8', actualWidth: 1.5, actualHeight: 7.25, momentOfInertia: 47.6, sectionModulus: 13.1, weight: 2.56 },
  '2x10': { nominal: '2x10', actualWidth: 1.5, actualHeight: 9.25, momentOfInertia: 98.9, sectionModulus: 21.4, weight: 3.37 },
  '2x12': { nominal: '2x12', actualWidth: 1.5, actualHeight: 11.25, momentOfInertia: 178, sectionModulus: 31.6, weight: 4.12 },
  '4x8': { nominal: '4x8', actualWidth: 3.5, actualHeight: 7.25, momentOfInertia: 111, sectionModulus: 30.7, weight: 6.03 },
  '4x10': { nominal: '4x10', actualWidth: 3.5, actualHeight: 9.25, momentOfInertia: 231, sectionModulus: 49.9, weight: 7.87 },
  '4x12': { nominal: '4x12', actualWidth: 3.5, actualHeight: 11.25, momentOfInertia: 415, sectionModulus: 73.8, weight: 9.63 }
}

// ===== TRUSS CALCULATIONS =====

export interface TrussDesign {
  span: number
  pitch: string
  height: number
  topChordLength: number
  bottomChordLength: number
  webMembers: {
    length: number
    angle: number
    type: 'compression' | 'tension'
  }[]
  loadCapacity: number
  recommendedSpacing: number
}

export interface TrussNode {
  id: string
  position: Point2D
  connections: string[]
  loads: { vertical: number; horizontal: number }
}

export interface TrussMember {
  id: string
  startNodeId: string
  endNodeId: string
  length: number
  angle: number
  force: number
  type: 'compression' | 'tension'
  size: string
}

/**
 * Design a simple king post truss
 */
export function designKingPostTruss(span: number, pitch: string): TrussDesign {
  const riseRun = riseRunFromPitch(pitch, span / 2)
  const height = riseRun.rise
  
  // Top chord length (rafter length)
  const topChordLength = riseRun.hypotenuse
  
  // Bottom chord is the span
  const bottomChordLength = span
  
  // King post (vertical member from peak to center of bottom chord)
  const kingPostLength = height
  
  // Web members (struts from king post to top chord)
  const strutLength = Math.sqrt((span/4) ** 2 + height ** 2)
  const strutAngle = Math.atan(height / (span/4)) * 180 / Math.PI
  
  const webMembers = [
    { length: kingPostLength, angle: 90, type: 'compression' as const },
    { length: strutLength, angle: strutAngle, type: 'compression' as const },
    { length: strutLength, angle: 180 - strutAngle, type: 'compression' as const }
  ]
  
  // Estimate load capacity (simplified)
  const loadCapacity = Math.min(2000, span * 40) // lbs per truss
  const recommendedSpacing = span <= 24 ? 24 : 16 // inches on center
  
  return {
    span,
    pitch,
    height,
    topChordLength,
    bottomChordLength,
    webMembers,
    loadCapacity,
    recommendedSpacing
  }
}

/**
 * Design a queen post truss
 */
export function designQueenPostTruss(span: number, pitch: string): TrussDesign {
  const riseRun = riseRunFromPitch(pitch, span / 2)
  const height = riseRun.rise
  
  const topChordLength = riseRun.hypotenuse
  const bottomChordLength = span
  
  // Queen posts at 1/4 and 3/4 span points
  const queenPostSpacing = span / 4
  const queenPostHeight = height * 0.75 // Approximate height
  
  // Struts and ties
  const strutLength = Math.sqrt((queenPostSpacing/2) ** 2 + (height - queenPostHeight) ** 2)
  const tieLength = queenPostSpacing * 2 // Between queen posts
  
  const webMembers = [
    { length: queenPostHeight, angle: 90, type: 'compression' as const },
    { length: queenPostHeight, angle: 90, type: 'compression' as const },
    { length: tieLength, angle: 0, type: 'tension' as const },
    { length: strutLength, angle: 45, type: 'compression' as const },
    { length: strutLength, angle: 135, type: 'compression' as const },
    { length: strutLength, angle: 45, type: 'compression' as const },
    { length: strutLength, angle: 135, type: 'compression' as const }
  ]
  
  const loadCapacity = Math.min(3000, span * 50)
  const recommendedSpacing = span <= 30 ? 24 : 16
  
  return {
    span,
    pitch,
    height,
    topChordLength,
    bottomChordLength,
    webMembers,
    loadCapacity,
    recommendedSpacing
  }
}

// ===== BEAM SIZING CALCULATIONS =====

export interface BeamSizing {
  recommendedSize: string
  actualSize: LumberSize
  maxSpan: number
  deflection: number
  stressRatio: number
  isAdequate: boolean
  safetyFactor: number
}

/**
 * Size a beam for a given load and span
 */
export function sizeBeam(
  span: number,           // feet
  load: number,          // lbs per linear foot
  deflectionLimit: number = 240,  // L/deflectionLimit
  allowableStress: number = 1200  // psi
): BeamSizing {
  const spanInches = span * 12
  const maxDeflection = spanInches / deflectionLimit
  
  // Try different lumber sizes
  for (const [sizeKey, lumber] of Object.entries(LUMBER_SIZES)) {
    // Calculate actual deflection
    const E = 1600000 // Modulus of elasticity for wood (psi)
    const actualDeflection = (5 * load * Math.pow(spanInches, 4)) / (384 * E * lumber.momentOfInertia)
    
    // Calculate bending stress
    const moment = (load * Math.pow(spanInches, 2)) / 8 // inch-pounds
    const bendingStress = moment / lumber.sectionModulus
    
    const deflectionOK = actualDeflection <= maxDeflection
    const stressOK = bendingStress <= allowableStress
    
    if (deflectionOK && stressOK) {
      return {
        recommendedSize: sizeKey,
        actualSize: lumber,
        maxSpan: span,
        deflection: actualDeflection,
        stressRatio: bendingStress / allowableStress,
        isAdequate: true,
        safetyFactor: allowableStress / bendingStress
      }
    }
  }
  
  // If no single member works, recommend the largest
  const largestSize = LUMBER_SIZES['4x12']
  const E = 1600000
  const actualDeflection = (5 * load * Math.pow(spanInches, 4)) / (384 * E * largestSize.momentOfInertia)
  const moment = (load * Math.pow(spanInches, 2)) / 8
  const bendingStress = moment / largestSize.sectionModulus
  
  return {
    recommendedSize: '4x12',
    actualSize: largestSize,
    maxSpan: span,
    deflection: actualDeflection,
    stressRatio: bendingStress / allowableStress,
    isAdequate: false,
    safetyFactor: allowableStress / bendingStress
  }
}

// ===== COLUMN CALCULATIONS =====

export interface ColumnDesign {
  size: string
  actualSize: LumberSize
  bucklingLength: number
  criticalLoad: number
  safeLoad: number
  isAdequate: boolean
  slendernessRatio: number
}

/**
 * Design a column for axial load
 */
export function designColumn(
  height: number,        // feet
  axialLoad: number,     // pounds
  endCondition: 'pinned' | 'fixed' = 'pinned'
): ColumnDesign {
  const heightInches = height * 12
  const kFactor = endCondition === 'pinned' ? 1.0 : 0.5
  const bucklingLength = kFactor * heightInches
  
  // Try different lumber sizes
  for (const [sizeKey, lumber] of Object.entries(LUMBER_SIZES)) {
    // Calculate radius of gyration
    const area = lumber.actualWidth * lumber.actualHeight
    const radiusOfGyration = Math.sqrt(lumber.momentOfInertia / area)
    
    // Slenderness ratio
    const slendernessRatio = bucklingLength / radiusOfGyration
    
    // Critical buckling load (Euler's formula)
    const E = 1600000 // psi
    const criticalLoad = (Math.PI ** 2 * E * lumber.momentOfInertia) / (bucklingLength ** 2)
    
    // Apply safety factor
    const safeLoad = criticalLoad / 2.5
    
    if (safeLoad >= axialLoad && slendernessRatio <= 50) {
      return {
        size: sizeKey,
        actualSize: lumber,
        bucklingLength,
        criticalLoad,
        safeLoad,
        isAdequate: true,
        slendernessRatio
      }
    }
  }
  
  // Return largest size if nothing works
  const largestSize = LUMBER_SIZES['4x12']
  const area = largestSize.actualWidth * largestSize.actualHeight
  const radiusOfGyration = Math.sqrt(largestSize.momentOfInertia / area)
  const slendernessRatio = bucklingLength / radiusOfGyration
  const E = 1600000
  const criticalLoad = (Math.PI ** 2 * E * largestSize.momentOfInertia) / (bucklingLength ** 2)
  const safeLoad = criticalLoad / 2.5
  
  return {
    size: '4x12',
    actualSize: largestSize,
    bucklingLength,
    criticalLoad,
    safeLoad,
    isAdequate: false,
    slendernessRatio
  }
}

// ===== ADVANCED FRAMING UTILITIES =====

/**
 * Calculate compound miter cuts for hip rafters
 */
export function calculateCompoundMiter(
  pitch: string,
  hipAngle: number = 45
): {
  bevelAngle: number
  miterAngle: number
} {
  const riseRun = riseRunFromPitch(pitch, 12)
  const roofAngle = riseRun.angle
  
  // Convert to radians
  const roofAngleRad = roofAngle * Math.PI / 180
  const hipAngleRad = hipAngle * Math.PI / 180
  
  // Calculate compound angles
  const bevelAngle = Math.atan(Math.tan(roofAngleRad) * Math.cos(hipAngleRad)) * 180 / Math.PI
  const miterAngle = Math.atan(Math.cos(roofAngleRad) * Math.tan(hipAngleRad)) * 180 / Math.PI
  
  return {
    bevelAngle,
    miterAngle
  }
}

/**
 * Calculate stair stringers
 */
export function calculateStairStringers(
  totalRise: number,     // inches
  totalRun: number,      // inches
  maxRiserHeight: number = 7.75,
  minTreadDepth: number = 10
): {
  numberOfSteps: number
  actualRiserHeight: number
  actualTreadDepth: number
  stringerLength: number
  cutAngles: { top: number; bottom: number }
} {
  const numberOfSteps = Math.ceil(totalRise / maxRiserHeight)
  const actualRiserHeight = totalRise / numberOfSteps
  const actualTreadDepth = totalRun / (numberOfSteps - 1)
  
  // Calculate stringer length
  const stringerLength = Math.sqrt(totalRise ** 2 + totalRun ** 2)
  
  // Calculate cut angles
  const angle = Math.atan(totalRise / totalRun) * 180 / Math.PI
  const topAngle = 90 - angle
  const bottomAngle = angle
  
  return {
    numberOfSteps,
    actualRiserHeight,
    actualTreadDepth,
    stringerLength,
    cutAngles: { top: topAngle, bottom: bottomAngle }
  }
}

/**
 * Calculate purlin spacing for metal roofing
 */
export function calculatePurlinSpacing(
  roofLoad: number,      // psf
  purlinSpan: number,    // feet
  purlinSize: string = '2x6'
): {
  maxSpacing: number     // inches
  recommendedSpacing: number
  numberOfPurlins: number
} {
  const lumber = LUMBER_SIZES[purlinSize]
  if (!lumber) throw new Error(`Unknown purlin size: ${purlinSize}`)
  
  // Calculate maximum spacing based on deflection (L/240)
  const spanInches = purlinSpan * 12
  const maxDeflection = spanInches / 240
  const E = 1600000
  
  // For uniform load, max spacing where deflection = limit
  const maxSpacing = Math.pow(
    (384 * E * lumber.momentOfInertia * maxDeflection) / (5 * roofLoad * Math.pow(spanInches, 3)),
    1/4
  ) * 12 // convert to inches
  
  // Round down to common spacing
  const commonSpacings = [12, 16, 19.2, 24, 30, 36, 48]
  let recommendedSpacing = 24
  
  for (const spacing of commonSpacings) {
    if (spacing <= maxSpacing) {
      recommendedSpacing = spacing
    }
  }
  
  const numberOfPurlins = Math.ceil(purlinSpan * 12 / recommendedSpacing) + 1
  
  return {
    maxSpacing,
    recommendedSpacing,
    numberOfPurlins
  }
}

// ===== INTEGRATION WITH 3D GEOMETRY =====

/**
 * Generate 3D points for a truss
 */
export function generateTruss3D(
  trussDesign: TrussDesign,
  position: Point3D = { x: 0, y: 0, z: 0 }
): {
  nodes: Point3D[]
  members: { start: Point3D; end: Point3D; type: string }[]
} {
  const { span, height } = trussDesign
  
  // Define node positions
  const nodes: Point3D[] = [
    { x: position.x, y: position.y, z: position.z },                    // Left support
    { x: position.x + span/2, y: position.y + height, z: position.z }, // Peak
    { x: position.x + span, y: position.y, z: position.z },            // Right support
    { x: position.x + span/2, y: position.y, z: position.z }           // Bottom center
  ]
  
  // Define members
  const members = [
    { start: nodes[0], end: nodes[1], type: 'top-chord' },      // Left top chord
    { start: nodes[1], end: nodes[2], type: 'top-chord' },      // Right top chord
    { start: nodes[0], end: nodes[3], type: 'bottom-chord' },   // Left bottom chord
    { start: nodes[3], end: nodes[2], type: 'bottom-chord' },   // Right bottom chord
    { start: nodes[1], end: nodes[3], type: 'web-member' }      // King post
  ]
  
  return { nodes, members }
}

/**
 * Calculate material takeoff for framing
 */
export function calculateMaterialTakeoff(
  framingPlan: {
    beams: { size: string; length: number; quantity: number }[]
    columns: { size: string; length: number; quantity: number }[]
    trusses: { design: TrussDesign; quantity: number }[]
  }
): {
  lumber: { size: string; totalLength: number; pieces: number }[]
  totalBoardFeet: number
  estimatedCost: number
} {
  const lumber: { size: string; totalLength: number; pieces: number }[] = []
  let totalBoardFeet = 0
  
  // Process beams
  framingPlan.beams.forEach(beam => {
    const existing = lumber.find(l => l.size === beam.size)
    if (existing) {
      existing.totalLength += beam.length * beam.quantity
      existing.pieces += beam.quantity
    } else {
      lumber.push({
        size: beam.size,
        totalLength: beam.length * beam.quantity,
        pieces: beam.quantity
      })
    }
  })
  
  // Process columns
  framingPlan.columns.forEach(column => {
    const existing = lumber.find(l => l.size === column.size)
    if (existing) {
      existing.totalLength += column.length * column.quantity
      existing.pieces += column.quantity
    } else {
      lumber.push({
        size: column.size,
        totalLength: column.length * column.quantity,
        pieces: column.quantity
      })
    }
  })
  
  // Calculate board feet
  lumber.forEach(item => {
    const [width, height] = item.size.split('x').map(Number)
    const boardFeet = (width * height * item.totalLength) / 12
    totalBoardFeet += boardFeet
  })
  
  // Estimate cost ($2-6 per board foot depending on lumber type)
  const estimatedCost = totalBoardFeet * 4 // Average $4/bf
  
  return {
    lumber,
    totalBoardFeet,
    estimatedCost
  }
}
