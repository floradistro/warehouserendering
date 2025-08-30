import * as THREE from 'three'

/**
 * GEOMETRY CALCULATOR
 * 
 * Advanced geometric calculations for warehouse framing and construction
 * Includes rise/run, radial spans, pitch calculations, and framing geometry
 */

// ===== BASIC GEOMETRY TYPES =====

export interface Point2D {
  x: number
  y: number
}

export interface Point3D {
  x: number
  y: number
  z: number
}

export interface RiseRunResult {
  rise: number
  run: number
  slope: number
  angle: number // in degrees
  pitch: string // e.g., "4:12"
  percentage: number
  hypotenuse: number
}

export interface RadialSpanResult {
  radius: number
  diameter: number
  circumference: number
  arcLength: number
  chord: number
  sagitta: number // height of arc
  centralAngle: number // in degrees
  area: number
}

export interface FramingCalculation {
  memberLength: number
  cutAngle: number
  birdsMouth?: {
    depth: number
    width: number
    angle: number
  }
  overhang?: number
  totalLength: number
}

// ===== RISE/RUN CALCULATIONS =====

/**
 * Calculate rise over run from two points
 */
export function calculateRiseRun(point1: Point2D, point2: Point2D): RiseRunResult {
  const rise = Math.abs(point2.y - point1.y)
  const run = Math.abs(point2.x - point1.x)
  
  if (run === 0) {
    throw new Error('Run cannot be zero (vertical line)')
  }
  
  const slope = rise / run
  const angle = Math.atan(slope) * (180 / Math.PI)
  const percentage = slope * 100
  const hypotenuse = Math.sqrt(rise * rise + run * run)
  
  // Calculate pitch (rise per 12 units of run)
  const pitchRise = Math.round((rise / run) * 12)
  const pitch = `${pitchRise}:12`
  
  return {
    rise,
    run,
    slope,
    angle,
    pitch,
    percentage,
    hypotenuse
  }
}

/**
 * Calculate rise/run from angle
 */
export function riseRunFromAngle(angle: number, run: number): RiseRunResult {
  const angleRad = angle * (Math.PI / 180)
  const rise = Math.tan(angleRad) * run
  const slope = rise / run
  const percentage = slope * 100
  const hypotenuse = run / Math.cos(angleRad)
  
  const pitchRise = Math.round((rise / run) * 12)
  const pitch = `${pitchRise}:12`
  
  return {
    rise,
    run,
    slope,
    angle,
    pitch,
    percentage,
    hypotenuse
  }
}

/**
 * Calculate rise/run from pitch (e.g., "4:12")
 */
export function riseRunFromPitch(pitch: string, run: number): RiseRunResult {
  const [riseStr, runStr] = pitch.split(':')
  const pitchRise = parseFloat(riseStr)
  const pitchRun = parseFloat(runStr)
  
  if (pitchRun === 0) {
    throw new Error('Pitch run cannot be zero')
  }
  
  const rise = (pitchRise / pitchRun) * run
  const slope = rise / run
  const angle = Math.atan(slope) * (180 / Math.PI)
  const percentage = slope * 100
  const hypotenuse = Math.sqrt(rise * rise + run * run)
  
  return {
    rise,
    run,
    slope,
    angle,
    pitch,
    percentage,
    hypotenuse
  }
}

// ===== RADIAL SPAN CALCULATIONS =====

/**
 * Calculate radial span properties from radius and central angle
 */
export function calculateRadialSpan(radius: number, centralAngleDegrees: number): RadialSpanResult {
  const centralAngleRad = centralAngleDegrees * (Math.PI / 180)
  const diameter = radius * 2
  const circumference = 2 * Math.PI * radius
  const arcLength = radius * centralAngleRad
  
  // Chord length using the formula: chord = 2 * radius * sin(angle/2)
  const chord = 2 * radius * Math.sin(centralAngleRad / 2)
  
  // Sagitta (height of arc) using: sagitta = radius * (1 - cos(angle/2))
  const sagitta = radius * (1 - Math.cos(centralAngleRad / 2))
  
  // Sector area
  const area = 0.5 * radius * radius * centralAngleRad
  
  return {
    radius,
    diameter,
    circumference,
    arcLength,
    chord,
    sagitta,
    centralAngle: centralAngleDegrees,
    area
  }
}

/**
 * Calculate radial span from chord and sagitta
 */
export function radialSpanFromChordSagitta(chord: number, sagitta: number): RadialSpanResult {
  // Formula: radius = (chord² + 4*sagitta²) / (8*sagitta)
  const radius = (chord * chord + 4 * sagitta * sagitta) / (8 * sagitta)
  
  // Calculate central angle from chord and radius
  const centralAngleRad = 2 * Math.asin(chord / (2 * radius))
  const centralAngleDegrees = centralAngleRad * (180 / Math.PI)
  
  return calculateRadialSpan(radius, centralAngleDegrees)
}

/**
 * Calculate radial span from three points on the arc
 */
export function radialSpanFromThreePoints(p1: Point2D, p2: Point2D, p3: Point2D): RadialSpanResult {
  // Find the center of the circle passing through three points
  const d = 2 * (p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y))
  
  if (Math.abs(d) < 1e-10) {
    throw new Error('Points are collinear, cannot form a circle')
  }
  
  const centerX = ((p1.x * p1.x + p1.y * p1.y) * (p2.y - p3.y) + 
                   (p2.x * p2.x + p2.y * p2.y) * (p3.y - p1.y) + 
                   (p3.x * p3.x + p3.y * p3.y) * (p1.y - p2.y)) / d
  
  const centerY = ((p1.x * p1.x + p1.y * p1.y) * (p3.x - p2.x) + 
                   (p2.x * p2.x + p2.y * p2.y) * (p1.x - p3.x) + 
                   (p3.x * p3.x + p3.y * p3.y) * (p2.x - p1.x)) / d
  
  const radius = Math.sqrt((centerX - p1.x) ** 2 + (centerY - p1.y) ** 2)
  
  // Calculate angle between first and last points
  const angle1 = Math.atan2(p1.y - centerY, p1.x - centerX)
  const angle3 = Math.atan2(p3.y - centerY, p3.x - centerX)
  let centralAngleRad = Math.abs(angle3 - angle1)
  
  // Ensure we take the smaller angle
  if (centralAngleRad > Math.PI) {
    centralAngleRad = 2 * Math.PI - centralAngleRad
  }
  
  const centralAngleDegrees = centralAngleRad * (180 / Math.PI)
  
  return calculateRadialSpan(radius, centralAngleDegrees)
}

// ===== FRAMING CALCULATIONS =====

/**
 * Calculate rafter length and cuts for a given pitch and span
 */
export function calculateRafter(span: number, pitch: string, overhang: number = 0): FramingCalculation {
  const riseRun = riseRunFromPitch(pitch, span / 2) // Half span for run
  const memberLength = riseRun.hypotenuse
  const cutAngle = riseRun.angle
  
  // Birds mouth calculation (typical depth is 1/3 of rafter depth)
  const rafterDepth = 8 // inches, typical 2x8
  const birdsMouthDepth = rafterDepth / 3
  const birdsMouthWidth = birdsMouthDepth / Math.tan(cutAngle * Math.PI / 180)
  
  const totalLength = memberLength + overhang
  
  return {
    memberLength,
    cutAngle,
    birdsMouth: {
      depth: birdsMouthDepth,
      width: birdsMouthWidth,
      angle: 90 - cutAngle
    },
    overhang,
    totalLength
  }
}

/**
 * Calculate hip/valley rafter length
 */
export function calculateHipValleyRafter(span1: number, span2: number, pitch: string): FramingCalculation {
  // Hip/valley runs at 45 degrees to the building
  const hipRun = Math.sqrt((span1/2) ** 2 + (span2/2) ** 2)
  const riseRun = riseRunFromPitch(pitch, hipRun)
  
  const memberLength = riseRun.hypotenuse
  const cutAngle = Math.atan(Math.sqrt(2) * Math.tan(riseRun.angle * Math.PI / 180)) * 180 / Math.PI
  
  return {
    memberLength,
    cutAngle,
    totalLength: memberLength
  }
}

/**
 * Calculate joist spacing and count for a given span
 */
export function calculateJoistLayout(span: number, spacing: number = 16, joistWidth: number = 1.5): {
  count: number
  actualSpacing: number
  endSpacing: number
} {
  // Convert spacing from inches to feet
  const spacingFeet = spacing / 12
  
  // Calculate number of spaces (one less than number of joists)
  const spaces = Math.floor(span / spacingFeet)
  const count = spaces + 1
  
  // Calculate actual spacing to fit evenly
  const actualSpacing = span / spaces
  const actualSpacingInches = actualSpacing * 12
  
  // End spacing (from wall to first joist center)
  const endSpacing = (actualSpacing - joistWidth/12) / 2
  
  return {
    count,
    actualSpacing: actualSpacingInches,
    endSpacing: endSpacing * 12 // convert to inches
  }
}

// ===== ADVANCED GEOMETRIC UTILITIES =====

/**
 * Calculate the intersection point of two lines
 */
export function lineIntersection(
  line1Start: Point2D, 
  line1End: Point2D, 
  line2Start: Point2D, 
  line2End: Point2D
): Point2D | null {
  const x1 = line1Start.x, y1 = line1Start.y
  const x2 = line1End.x, y2 = line1End.y
  const x3 = line2Start.x, y3 = line2Start.y
  const x4 = line2End.x, y4 = line2End.y
  
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  
  if (Math.abs(denominator) < 1e-10) {
    return null // Lines are parallel
  }
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator
  
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1)
  }
}

/**
 * Calculate polygon area using the shoelace formula
 */
export function polygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0
  
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  
  return Math.abs(area) / 2
}

/**
 * Calculate the centroid of a polygon
 */
export function polygonCentroid(points: Point2D[]): Point2D {
  if (points.length === 0) return { x: 0, y: 0 }
  
  let cx = 0, cy = 0
  let area = 0
  
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    const cross = points[i].x * points[j].y - points[j].x * points[i].y
    area += cross
    cx += (points[i].x + points[j].x) * cross
    cy += (points[i].y + points[j].y) * cross
  }
  
  area /= 2
  cx /= (6 * area)
  cy /= (6 * area)
  
  return { x: cx, y: cy }
}

/**
 * Calculate beam deflection for various load conditions
 */
export function calculateBeamDeflection(
  length: number, // feet
  load: number,   // pounds per linear foot
  momentOfInertia: number, // in^4
  elasticModulus: number = 1600000 // psi for wood
): {
  maxDeflection: number // inches
  maxMoment: number     // foot-pounds
  maxShear: number      // pounds
} {
  // Convert length to inches for calculation
  const L = length * 12
  
  // For uniformly distributed load on simply supported beam
  const maxDeflection = (5 * load * Math.pow(L, 4)) / (384 * elasticModulus * momentOfInertia)
  const maxMoment = (load * Math.pow(L, 2)) / 8 / 12 // convert to foot-pounds
  const maxShear = (load * L) / 2
  
  return {
    maxDeflection,
    maxMoment,
    maxShear
  }
}

// ===== COORDINATE TRANSFORMATIONS =====

/**
 * Convert 2D point to 3D (assuming z = 0)
 */
export function to3D(point: Point2D, z: number = 0): Point3D {
  return { x: point.x, y: point.y, z }
}

/**
 * Convert 3D point to 2D (project onto XY plane)
 */
export function to2D(point: Point3D): Point2D {
  return { x: point.x, y: point.y }
}

/**
 * Rotate point around origin
 */
export function rotatePoint2D(point: Point2D, angle: number): Point2D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos
  }
}

/**
 * Transform point by translation and rotation
 */
export function transformPoint2D(
  point: Point2D, 
  translation: Point2D, 
  rotation: number = 0
): Point2D {
  const rotated = rotatePoint2D(point, rotation)
  return {
    x: rotated.x + translation.x,
    y: rotated.y + translation.y
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Convert degrees to radians
 */
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Convert radians to degrees
 */
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI)
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Linear interpolation between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Check if a point is inside a polygon
 */
export function pointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
        (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)) {
      inside = !inside
    }
  }
  
  return inside
}
