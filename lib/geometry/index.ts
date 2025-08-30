/**
 * GEOMETRY CALCULATION LIBRARY INDEX
 * 
 * Export all geometry calculation utilities for easy importing
 */

// Core geometry calculations
export * from './GeometryCalculator'

// Framing-specific calculations  
export * from './FramingCalculator'

// Enhanced models
export * from '../enhanced-framing-models'

// Quick utility functions for common calculations
export {
  calculateRiseRun,
  riseRunFromPitch,
  riseRunFromAngle,
  calculateRadialSpan,
  radialSpanFromChordSagitta,
  radialSpanFromThreePoints,
  calculateRafter,
  calculateJoistLayout,
  polygonArea,
  polygonCentroid,
  lineIntersection,
  pointInPolygon,
  degToRad,
  radToDeg
} from './GeometryCalculator'

export {
  designKingPostTruss,
  designQueenPostTruss,
  sizeBeam,
  designColumn,
  calculateCompoundMiter,
  calculateStairStringers,
  calculatePurlinSpacing,
  LUMBER_SIZES
} from './FramingCalculator'
