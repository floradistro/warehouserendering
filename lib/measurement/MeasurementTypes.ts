import { Vector3 } from 'three'

// Base measurement interface
export interface BaseMeasurement {
  id: string
  type: MeasurementType
  name: string
  description?: string
  createdAt: Date
  updatedAt: Date
  visible: boolean
  locked: boolean
  groupId?: string
  metadata?: Record<string, any>
  style?: MeasurementStyle
}

// Measurement types
export type MeasurementType = 'linear' | 'angular' | 'area' | 'volume' | 'radius' | 'diameter' | 'path' | 'clearance'

// Units supported
export type Unit = 'feet' | 'inches' | 'ft-in' | 'meters' | 'millimeters' | 'centimeters'
export type AngularUnit = 'degrees' | 'radians'
export type AreaUnit = 'sqft' | 'sqin' | 'sqm' | 'sqcm'
export type VolumeUnit = 'cuft' | 'cuin' | 'cum' | 'liters'

// Linear measurement - point to point or multi-point chain
export interface LinearMeasurement extends BaseMeasurement {
  type: 'linear'
  points: Vector3[]
  totalDistance: number
  segments: Array<{
    startPoint: Vector3
    endPoint: Vector3
    distance: number
    label?: string
  }>
  unit: Unit
  precision: number
  showSegments: boolean
  chainDimensions: boolean
}

// Angular measurement - angle between two lines or vectors
export interface AngularMeasurement extends BaseMeasurement {
  type: 'angular'
  vertex: Vector3
  startPoint: Vector3
  endPoint: Vector3
  angle: number // in radians
  unit: AngularUnit
  precision: number
  clockwise: boolean
}

// Area measurement - polygon area calculation
export interface AreaMeasurement extends BaseMeasurement {
  type: 'area'
  boundary: Vector3[]
  area: number
  perimeter: number
  centroid: Vector3
  unit: AreaUnit
  precision: number
  showPerimeter: boolean
  showCentroid: boolean
}

// Volume measurement - 3D space calculation
export interface VolumeMeasurement extends BaseMeasurement {
  type: 'volume'
  boundingBox: {
    min: Vector3
    max: Vector3
  }
  volume: number
  surfaceArea: number
  centroid: Vector3
  unit: VolumeUnit
  precision: number
}

// Radius measurement - center to edge
export interface RadiusMeasurement extends BaseMeasurement {
  type: 'radius'
  center: Vector3
  edgePoint: Vector3
  radius: number
  unit: Unit
  precision: number
  showCenter: boolean
}

// Diameter measurement - edge to edge through center
export interface DiameterMeasurement extends BaseMeasurement {
  type: 'diameter'
  center: Vector3
  startPoint: Vector3
  endPoint: Vector3
  diameter: number
  unit: Unit
  precision: number
  showCenter: boolean
}

// Path measurement - distance along a route
export interface PathMeasurement extends BaseMeasurement {
  type: 'path'
  waypoints: Vector3[]
  totalDistance: number
  segments: Array<{
    startPoint: Vector3
    endPoint: Vector3
    distance: number
    direction: Vector3
  }>
  unit: Unit
  precision: number
  showWaypoints: boolean
}

// Clearance measurement - minimum/maximum distances
export interface ClearanceMeasurement extends BaseMeasurement {
  type: 'clearance'
  objectIds: string[]
  clearanceType: 'minimum' | 'maximum'
  distance: number
  closestPoints: {
    point1: Vector3
    point2: Vector3
    objectId1: string
    objectId2: string
  }
  unit: Unit
  precision: number
  complianceCheck?: {
    requiredDistance: number
    isCompliant: boolean
    codeReference: string
  }
}

// Union type for all measurements
export type Measurement = 
  | LinearMeasurement 
  | AngularMeasurement 
  | AreaMeasurement 
  | VolumeMeasurement
  | RadiusMeasurement
  | DiameterMeasurement
  | PathMeasurement
  | ClearanceMeasurement

// Measurement style configuration
export interface MeasurementStyle {
  color: string
  thickness: number
  opacity: number
  textSize: number
  textColor: string
  arrowSize: number
  arrowStyle: 'arrow' | 'circle' | 'square' | 'none'
  lineStyle: 'solid' | 'dashed' | 'dotted'
  extensionLineLength: number
  textOffset: Vector3
  dimensionLineOffset: number
  showExtensionLines: boolean
  showDimensionLine: boolean
  showText: boolean
  backgroundOpacity: number
  backgroundColor: string
}

// Default styles by measurement type
export const DEFAULT_STYLES: Record<MeasurementType, MeasurementStyle> = {
  linear: {
    color: '#00ff00',
    thickness: 2,
    opacity: 1,
    textSize: 12,
    textColor: '#ffffff',
    arrowSize: 8,
    arrowStyle: 'arrow',
    lineStyle: 'solid',
    extensionLineLength: 20,
    textOffset: new Vector3(0, 5, 0),
    dimensionLineOffset: 10,
    showExtensionLines: true,
    showDimensionLine: true,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#000000'
  },
  angular: {
    color: '#ffff00',
    thickness: 2,
    opacity: 1,
    textSize: 12,
    textColor: '#ffffff',
    arrowSize: 6,
    arrowStyle: 'arrow',
    lineStyle: 'solid',
    extensionLineLength: 15,
    textOffset: new Vector3(0, 5, 0),
    dimensionLineOffset: 8,
    showExtensionLines: false,
    showDimensionLine: true,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#000000'
  },
  area: {
    color: '#0080ff',
    thickness: 2,
    opacity: 0.3,
    textSize: 14,
    textColor: '#ffffff',
    arrowSize: 0,
    arrowStyle: 'none',
    lineStyle: 'solid',
    extensionLineLength: 0,
    textOffset: new Vector3(0, 10, 0),
    dimensionLineOffset: 0,
    showExtensionLines: false,
    showDimensionLine: false,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#0080ff'
  },
  volume: {
    color: '#ff8000',
    thickness: 2,
    opacity: 0.2,
    textSize: 14,
    textColor: '#ffffff',
    arrowSize: 0,
    arrowStyle: 'none',
    lineStyle: 'solid',
    extensionLineLength: 0,
    textOffset: new Vector3(0, 10, 0),
    dimensionLineOffset: 0,
    showExtensionLines: false,
    showDimensionLine: false,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#ff8000'
  },
  radius: {
    color: '#ff0080',
    thickness: 2,
    opacity: 1,
    textSize: 12,
    textColor: '#ffffff',
    arrowSize: 8,
    arrowStyle: 'arrow',
    lineStyle: 'solid',
    extensionLineLength: 10,
    textOffset: new Vector3(0, 5, 0),
    dimensionLineOffset: 5,
    showExtensionLines: false,
    showDimensionLine: true,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#000000'
  },
  diameter: {
    color: '#8000ff',
    thickness: 2,
    opacity: 1,
    textSize: 12,
    textColor: '#ffffff',
    arrowSize: 8,
    arrowStyle: 'arrow',
    lineStyle: 'solid',
    extensionLineLength: 10,
    textOffset: new Vector3(0, 5, 0),
    dimensionLineOffset: 5,
    showExtensionLines: false,
    showDimensionLine: true,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#000000'
  },
  path: {
    color: '#80ff00',
    thickness: 3,
    opacity: 1,
    textSize: 12,
    textColor: '#ffffff',
    arrowSize: 6,
    arrowStyle: 'circle',
    lineStyle: 'dashed',
    extensionLineLength: 0,
    textOffset: new Vector3(0, 5, 0),
    dimensionLineOffset: 0,
    showExtensionLines: false,
    showDimensionLine: true,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#000000'
  },
  clearance: {
    color: '#ff4000',
    thickness: 2,
    opacity: 1,
    textSize: 12,
    textColor: '#ffffff',
    arrowSize: 8,
    arrowStyle: 'arrow',
    lineStyle: 'dotted',
    extensionLineLength: 15,
    textOffset: new Vector3(0, 5, 0),
    dimensionLineOffset: 8,
    showExtensionLines: true,
    showDimensionLine: true,
    showText: true,
    backgroundOpacity: 0.8,
    backgroundColor: '#ff4000'
  }
}

// Measurement group for organization
export interface MeasurementGroup {
  id: string
  name: string
  description?: string
  color: string
  visible: boolean
  locked: boolean
  measurements: string[] // measurement IDs
  createdAt: Date
  updatedAt: Date
}

// Snap point types for precision measurement
export type SnapPointType = 
  | 'corner' 
  | 'midpoint' 
  | 'center' 
  | 'edge' 
  | 'intersection' 
  | 'perpendicular' 
  | 'tangent' 
  | 'endpoint' 
  | 'quadrant'
  | 'grid'

export interface SnapPoint {
  position: Vector3
  type: SnapPointType
  elementId?: string
  confidence: number
  description: string
  normal?: Vector3
  tangent?: Vector3
}

// Unit conversion utilities
export const UNIT_CONVERSIONS = {
  toFeet: {
    inches: 1/12,
    meters: 3.28084,
    millimeters: 0.00328084,
    centimeters: 0.0328084
  },
  toInches: {
    feet: 12,
    meters: 39.3701,
    millimeters: 0.0393701,
    centimeters: 0.393701
  },
  toMeters: {
    feet: 0.3048,
    inches: 0.0254,
    millimeters: 0.001,
    centimeters: 0.01
  }
}

// Format measurement value with proper units and precision
export function formatMeasurement(
  value: number, 
  unit: Unit, 
  precision: number = 2
): string {
  switch (unit) {
    case 'ft-in':
      const feet = Math.floor(value)
      const inches = (value - feet) * 12
      if (inches < 0.01) {
        return `${feet}'`
      } else {
        return `${feet}'-${inches.toFixed(precision)}"`
      }
    case 'feet':
      return `${value.toFixed(precision)}'`
    case 'inches':
      return `${value.toFixed(precision)}"`
    case 'meters':
      return `${value.toFixed(precision)}m`
    case 'millimeters':
      return `${value.toFixed(precision)}mm`
    case 'centimeters':
      return `${value.toFixed(precision)}cm`
    default:
      return `${value.toFixed(precision)}`
  }
}

// Format angular measurement
export function formatAngularMeasurement(
  value: number, 
  unit: AngularUnit, 
  precision: number = 1
): string {
  switch (unit) {
    case 'degrees':
      return `${(value * 180 / Math.PI).toFixed(precision)}°`
    case 'radians':
      return `${value.toFixed(precision)} rad`
    default:
      return `${value.toFixed(precision)}`
  }
}

// Format area measurement
export function formatAreaMeasurement(
  value: number, 
  unit: AreaUnit, 
  precision: number = 2
): string {
  switch (unit) {
    case 'sqft':
      return `${value.toFixed(precision)} ft²`
    case 'sqin':
      return `${value.toFixed(precision)} in²`
    case 'sqm':
      return `${value.toFixed(precision)} m²`
    case 'sqcm':
      return `${value.toFixed(precision)} cm²`
    default:
      return `${value.toFixed(precision)}`
  }
}

// Format volume measurement
export function formatVolumeMeasurement(
  value: number, 
  unit: VolumeUnit, 
  precision: number = 2
): string {
  switch (unit) {
    case 'cuft':
      return `${value.toFixed(precision)} ft³`
    case 'cuin':
      return `${value.toFixed(precision)} in³`
    case 'cum':
      return `${value.toFixed(precision)} m³`
    case 'liters':
      return `${value.toFixed(precision)}L`
    default:
      return `${value.toFixed(precision)}`
  }
}
