import * as THREE from 'three'
import { FloorplanElement } from './store'
import { 
  calculateRiseRun, 
  riseRunFromPitch, 
  calculateRadialSpan,
  Point2D,
  Point3D
} from './geometry/GeometryCalculator'
import {
  designKingPostTruss,
  designQueenPostTruss,
  sizeBeam,
  calculateCompoundMiter,
  calculateJoistLayout,
  LUMBER_SIZES,
  TrussDesign,
  BeamSizing
} from './geometry/FramingCalculator'

/**
 * ENHANCED FRAMING MODELS
 * 
 * Warehouse models that use advanced geometry calculations
 * for precise framing, spans, and structural elements
 */

// ===== ENHANCED ROOF SYSTEM =====

export interface RoofSystemConfig {
  span: number
  length: number
  pitch: string
  roofType: 'gable' | 'hip' | 'shed' | 'gambrel' | 'mansard'
  overhang: { front: number; back: number; left: number; right: number }
  rafterSpacing: number // inches on center
  rafterSize: string
  ridgeBeamSize?: string
  materials: {
    roofing: 'metal' | 'shingles' | 'membrane'
    sheathing: 'osb' | 'plywood' | 'skip'
    insulation?: boolean
  }
}

export interface RoofCalculations {
  riseRun: any
  rafterLength: number
  ridgeLength: number
  rafterCount: number
  hipRafterLength?: number
  valleyRafterLength?: number
  roofArea: number
  materials: {
    rafters: { size: string; count: number; length: number }[]
    sheathing: { area: number; sheets: number }
    roofing: { area: number; squares: number }
  }
  loads: {
    deadLoad: number
    liveLoad: number
    snowLoad?: number
    totalLoad: number
  }
}

/**
 * Calculate comprehensive roof system
 */
export function calculateRoofSystem(config: RoofSystemConfig): RoofCalculations {
  const riseRun = riseRunFromPitch(config.pitch, config.span / 2)
  
  // Calculate rafter length including overhang
  const baseRafterLength = riseRun.hypotenuse
  const rafterLength = baseRafterLength + config.overhang.front + config.overhang.back
  
  // Ridge length
  const ridgeLength = config.length - (config.roofType === 'hip' ? config.span : 0)
  
  // Rafter count
  const rafterLayout = calculateJoistLayout(config.length, config.rafterSpacing)
  const rafterCount = rafterLayout.count * 2 // Both sides
  
  // Hip/valley rafters for hip roofs
  let hipRafterLength = 0
  let valleyRafterLength = 0
  
  if (config.roofType === 'hip') {
    const hipRun = Math.sqrt((config.span/2) ** 2 + (config.span/2) ** 2)
    const hipRiseRun = riseRunFromPitch(config.pitch, hipRun)
    hipRafterLength = hipRiseRun.hypotenuse
  }
  
  // Roof area calculation
  const roofPlaneArea = rafterLength * config.length
  const roofArea = config.roofType === 'gable' ? roofPlaneArea * 2 : 
                   config.roofType === 'hip' ? roofPlaneArea * 2 - (config.span ** 2) :
                   roofPlaneArea
  
  // Load calculations (simplified)
  const deadLoad = 15 // psf (roofing + structure)
  const liveLoad = 20 // psf
  const snowLoad = 30 // psf (varies by location)
  const totalLoad = deadLoad + Math.max(liveLoad, snowLoad)
  
  // Material calculations
  const sheetingArea = roofArea * 1.1 // 10% waste
  const sheetsPerUnit = config.materials.sheathing === 'osb' ? 32 : 32 // 4x8 sheets
  const sheetCount = Math.ceil(sheetingArea / sheetsPerUnit)
  
  const roofingSquares = roofArea / 100 // 100 sq ft per square
  
  return {
    riseRun,
    rafterLength,
    ridgeLength,
    rafterCount,
    hipRafterLength,
    valleyRafterLength,
    roofArea,
    materials: {
      rafters: [
        { size: config.rafterSize, count: rafterCount, length: rafterLength }
      ],
      sheathing: { area: sheetingArea, sheets: sheetCount },
      roofing: { area: roofArea, squares: roofingSquares }
    },
    loads: {
      deadLoad,
      liveLoad,
      snowLoad,
      totalLoad
    }
  }
}

// ===== ENHANCED TRUSS SYSTEM =====

export interface TrussSystemConfig {
  span: number
  length: number
  pitch: string
  trussType: 'king-post' | 'queen-post' | 'fink' | 'howe' | 'fan'
  spacing: number // inches on center
  loadConditions: {
    roofLoad: number // psf
    ceilingLoad: number // psf
    concentratedLoads?: { position: number; load: number }[]
  }
  materials: {
    chordSize: string
    webSize: string
    connectionType: 'gusset' | 'connector-plate' | 'bolted'
  }
}

/**
 * Generate enhanced truss system with detailed calculations
 */
export function generateTrussSystem(config: TrussSystemConfig): {
  trusses: TrussDesign[]
  spacing: { actual: number; count: number }
  loads: { perTruss: number; total: number }
  connections: { type: string; count: number }[]
} {
  // Calculate number of trusses needed
  const trussLayout = calculateJoistLayout(config.length, config.spacing)
  
  // Design individual truss
  const trussDesign = config.trussType === 'king-post' 
    ? designKingPostTruss(config.span, config.pitch)
    : designQueenPostTruss(config.span, config.pitch)
  
  // Load calculations
  const tributaryArea = config.span * (config.spacing / 12) // sq ft per truss
  const roofLoadPerTruss = config.loadConditions.roofLoad * tributaryArea
  const ceilingLoadPerTruss = config.loadConditions.ceilingLoad * tributaryArea
  const totalLoadPerTruss = roofLoadPerTruss + ceilingLoadPerTruss
  
  // Connection count estimation
  const connectionsPerTruss = trussDesign.webMembers.length + 4 // web + chord connections
  const totalConnections = connectionsPerTruss * trussLayout.count
  
  return {
    trusses: Array(trussLayout.count).fill(trussDesign),
    spacing: { actual: trussLayout.actualSpacing, count: trussLayout.count },
    loads: { perTruss: totalLoadPerTruss, total: totalLoadPerTruss * trussLayout.count },
    connections: [
      { type: config.materials.connectionType, count: totalConnections }
    ]
  }
}

// ===== ENHANCED BEAM SYSTEM =====

export interface BeamSystemConfig {
  spans: number[]
  loads: { uniform?: number; point?: { position: number; load: number }[] }[]
  supportConditions: ('simple' | 'continuous' | 'cantilever')[]
  deflectionLimits: number[]
  materials: {
    species: 'douglas-fir' | 'southern-pine' | 'hem-fir'
    grade: 'select-structural' | 'no1' | 'no2'
    treatment?: 'pressure-treated' | 'fire-retardant'
  }
}

/**
 * Design multi-span beam system
 */
export function designBeamSystem(config: BeamSystemConfig): {
  beams: { span: number; size: string; sizing: BeamSizing }[]
  totalLength: number
  supports: { position: number; reaction: number }[]
  deflections: { span: number; maxDeflection: number }[]
} {
  const beams: { span: number; size: string; sizing: BeamSizing }[] = []
  const supports: { position: number; reaction: number }[] = []
  const deflections: { span: number; maxDeflection: number }[] = []
  
  let currentPosition = 0
  
  config.spans.forEach((span, index) => {
    const load = config.loads[index]?.uniform || 50
    const deflectionLimit = config.deflectionLimits[index] || 240
    
    // Size the beam
    const sizing = sizeBeam(span, load, deflectionLimit)
    beams.push({ span, size: sizing.recommendedSize, sizing })
    
    // Calculate support reactions (simplified)
    const totalLoad = load * span
    supports.push(
      { position: currentPosition, reaction: totalLoad / 2 },
      { position: currentPosition + span, reaction: totalLoad / 2 }
    )
    
    // Record deflection
    deflections.push({ span, maxDeflection: sizing.deflection })
    
    currentPosition += span
  })
  
  return {
    beams,
    totalLength: currentPosition,
    supports,
    deflections
  }
}

// ===== ENHANCED FOUNDATION SYSTEM =====

export interface FoundationConfig {
  buildingDimensions: { length: number; width: number }
  soilBearingCapacity: number // psf
  frostDepth: number // inches
  foundationType: 'strip' | 'pad' | 'raft' | 'pile'
  loads: {
    deadLoad: number // psf
    liveLoad: number // psf
    windLoad?: number // psf
    seismicLoad?: number // psf
  }
  materials: {
    concrete: { strength: number; type: 'normal' | 'high-strength' }
    reinforcement: { grade: number; spacing: number }
  }
}

/**
 * Calculate foundation requirements
 */
export function calculateFoundation(config: FoundationConfig): {
  footingWidth: number
  footingDepth: number
  concreteVolume: number
  reinforcement: { bars: string; spacing: number; length: number }
  soilPressure: number
  isAdequate: boolean
} {
  const totalLoad = (config.loads.deadLoad + config.loads.liveLoad) * 
                   config.buildingDimensions.length * config.buildingDimensions.width
  
  // Calculate required footing area
  const requiredArea = totalLoad / config.soilBearingCapacity
  const perimeter = 2 * (config.buildingDimensions.length + config.buildingDimensions.width)
  const footingWidth = requiredArea / perimeter
  
  // Minimum depth based on frost line
  const footingDepth = Math.max(config.frostDepth + 6, 24) // inches
  
  // Concrete volume
  const footingVolume = perimeter * footingWidth * (footingDepth / 12) // cubic feet
  const concreteVolume = footingVolume / 27 // cubic yards
  
  // Reinforcement calculation
  const reinforcementLength = perimeter * 2 // top and bottom bars
  
  // Check adequacy
  const actualSoilPressure = totalLoad / (perimeter * footingWidth)
  const isAdequate = actualSoilPressure <= config.soilBearingCapacity
  
  return {
    footingWidth,
    footingDepth,
    concreteVolume,
    reinforcement: {
      bars: '#4',
      spacing: 12,
      length: reinforcementLength
    },
    soilPressure: actualSoilPressure,
    isAdequate
  }
}

// ===== INTEGRATION WITH FLOORPLAN ELEMENTS =====

/**
 * Create enhanced warehouse model with geometry calculations
 */
export function createEnhancedWarehouseModel(
  dimensions: { length: number; width: number; height: number },
  roofConfig: RoofSystemConfig,
  structuralConfig: {
    columnSpacing: number
    beamSpacing: number
    foundationConfig: FoundationConfig
  }
): FloorplanElement[] {
  const elements: FloorplanElement[] = []
  
  // Calculate roof system
  const roofCalcs = calculateRoofSystem(roofConfig)
  
  // Generate structural columns
  const columnLayout = calculateJoistLayout(dimensions.length, structuralConfig.columnSpacing * 12)
  const columnRows = Math.ceil(dimensions.width / structuralConfig.columnSpacing)
  
  let elementId = 1
  
  for (let row = 0; row <= columnRows; row++) {
    for (let col = 0; col < columnLayout.count; col++) {
      const x = (col * columnLayout.actualSpacing) / 12
      const y = row * structuralConfig.columnSpacing
      
      elements.push({
        id: `column-${elementId++}`,
        type: 'fixture',
        position: { x, y, z: 0 },
        dimensions: { width: 1, height: 1, depth: dimensions.height },
        color: '#34495e',
        material: 'steel',
        metadata: {
          category: 'structural',
          element_type: 'column',
          load_bearing: true,
          calculated_size: '8x8',
          geometry_enhanced: true
        }
      })
    }
  }
  
  // Generate roof structure based on calculations
  const rafterSpacing = roofCalcs.materials.rafters[0]
  for (let i = 0; i < rafterSpacing.count / 2; i++) {
    const x = (i * roofConfig.rafterSpacing) / 12
    
    elements.push({
      id: `rafter-left-${i}`,
      type: 'fixture',
      position: { x, y: 0, z: dimensions.height },
      dimensions: { 
        width: LUMBER_SIZES[roofConfig.rafterSize]?.actualWidth / 12 || 0.125,
        height: LUMBER_SIZES[roofConfig.rafterSize]?.actualHeight / 12 || 0.5,
        depth: rafterSpacing.length
      },
      rotation: roofCalcs.riseRun.angle,
      color: '#8B4513',
      material: 'wood',
      metadata: {
        category: 'structural',
        element_type: 'rafter',
        pitch: roofConfig.pitch,
        calculated_length: rafterSpacing.length,
        rise_run_angle: roofCalcs.riseRun.angle,
        geometry_enhanced: true
      }
    })
  }
  
  return elements
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate material waste factors
 */
export function calculateWasteFactor(materialType: string, complexity: 'simple' | 'complex'): number {
  const baseWaste = {
    'lumber': 0.10,
    'concrete': 0.05,
    'roofing': 0.15,
    'siding': 0.12,
    'insulation': 0.08
  }
  
  const complexityMultiplier = complexity === 'complex' ? 1.5 : 1.0
  return (baseWaste[materialType as keyof typeof baseWaste] || 0.10) * complexityMultiplier
}

/**
 * Generate cut list from framing calculations
 */
export function generateCutList(elements: FloorplanElement[]): {
  size: string
  lengths: number[]
  totalLength: number
  pieces: number
}[] {
  const cutList: { [key: string]: number[] } = {}
  
  elements.forEach(element => {
    if (element.metadata?.calculated_size) {
      const size = element.metadata.calculated_size
      const length = Math.max(element.dimensions.width, element.dimensions.height, element.dimensions.depth || 0)
      
      if (!cutList[size]) {
        cutList[size] = []
      }
      cutList[size].push(length)
    }
  })
  
  return Object.entries(cutList).map(([size, lengths]) => ({
    size,
    lengths: lengths.sort((a, b) => b - a), // Sort descending for optimal cutting
    totalLength: lengths.reduce((sum, length) => sum + length, 0),
    pieces: lengths.length
  }))
}

/**
 * Calculate construction sequence based on dependencies
 */
export function calculateConstructionSequence(elements: FloorplanElement[]): {
  phase: number
  name: string
  elements: string[]
  duration: number // days
  dependencies: number[]
}[] {
  return [
    {
      phase: 1,
      name: 'Foundation',
      elements: elements.filter(e => e.metadata?.category === 'foundation').map(e => e.id),
      duration: 7,
      dependencies: []
    },
    {
      phase: 2,
      name: 'Structural Frame',
      elements: elements.filter(e => e.metadata?.element_type === 'column').map(e => e.id),
      duration: 5,
      dependencies: [1]
    },
    {
      phase: 3,
      name: 'Roof Structure',
      elements: elements.filter(e => e.metadata?.element_type === 'rafter').map(e => e.id),
      duration: 8,
      dependencies: [2]
    },
    {
      phase: 4,
      name: 'Wall Framing',
      elements: elements.filter(e => e.type === 'wall').map(e => e.id),
      duration: 6,
      dependencies: [2]
    },
    {
      phase: 5,
      name: 'Roofing',
      elements: [], // Would include roofing elements
      duration: 4,
      dependencies: [3]
    }
  ]
}
