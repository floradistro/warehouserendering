// Professional Measurement System for WarehouseCAD
// Phase 1: Core Measurement Engine

// Core types and interfaces
export * from './MeasurementTypes'

// Measurement engine and calculations
export { measurementEngine, MeasurementEngine } from './MeasurementEngine'

// Snap engine for precise point selection
export { snapEngine, SnapEngine } from './SnapEngine'

// Persistent measurement storage with Zustand
export { 
  useMeasurementStore,
  useMeasurements,
  useVisibleMeasurements,
  useActiveTool,
  useSnapPoints
} from './MeasurementStore'

// React components for measurement system
export { DimensionRenderer } from './DimensionRenderer'

// Version info
export const MEASUREMENT_SYSTEM_VERSION = '1.0.0'
export const MEASUREMENT_SYSTEM_PHASE = 1

// Feature flags for phase-based features
export const MEASUREMENT_FEATURES = {
  // Phase 1 features
  LINEAR_MEASUREMENT: true,
  ANGULAR_MEASUREMENT: true,
  AREA_MEASUREMENT: true,
  VOLUME_MEASUREMENT: true,
  RADIUS_MEASUREMENT: true,
  DIAMETER_MEASUREMENT: true,
  PATH_MEASUREMENT: true,
  CLEARANCE_MEASUREMENT: true,
  SNAP_SYSTEM: true,
  PERSISTENT_STORAGE: true,
  DIMENSION_RENDERING: true,
  MULTI_POINT_CHAIN: true,
  UNDO_REDO: true,
  
  // Phase 2 features (not yet implemented)
  ADVANCED_AREA_TOOLS: false,
  VOLUME_CALCULATOR: false,
  PATH_ANALYTICS: false,
  CLEARANCE_ANALYZER: false,
  DENSITY_ANALYSIS: false,
  
  // Phase 3 features (not yet implemented)
  CAD_DIMENSION_STYLES: false,
  INTERACTIVE_EDITING: false,
  ANNOTATION_SYSTEM: false,
  QUICK_MEASURE: false,
  
  // Phase 4 features (not yet implemented)
  EXPORT_SYSTEM: false,
  REPORT_GENERATOR: false,
  AI_ASSISTANT: false,
  COMPLIANCE_CHECKER: false
}

// Utility functions for feature checking
export const isFeatureEnabled = (feature: keyof typeof MEASUREMENT_FEATURES): boolean => {
  return MEASUREMENT_FEATURES[feature]
}

export const getEnabledFeatures = (): string[] => {
  return Object.entries(MEASUREMENT_FEATURES)
    .filter(([_, enabled]) => enabled)
    .map(([feature, _]) => feature)
}

export const getPhaseFeatures = (phase: number): string[] => {
  const phaseFeatures = {
    1: [
      'LINEAR_MEASUREMENT',
      'ANGULAR_MEASUREMENT', 
      'AREA_MEASUREMENT',
      'VOLUME_MEASUREMENT',
      'RADIUS_MEASUREMENT',
      'DIAMETER_MEASUREMENT',
      'PATH_MEASUREMENT',
      'CLEARANCE_MEASUREMENT',
      'SNAP_SYSTEM',
      'PERSISTENT_STORAGE',
      'DIMENSION_RENDERING',
      'MULTI_POINT_CHAIN',
      'UNDO_REDO'
    ],
    2: [
      'ADVANCED_AREA_TOOLS',
      'VOLUME_CALCULATOR',
      'PATH_ANALYTICS',
      'CLEARANCE_ANALYZER',
      'DENSITY_ANALYSIS'
    ],
    3: [
      'CAD_DIMENSION_STYLES',
      'INTERACTIVE_EDITING',
      'ANNOTATION_SYSTEM',
      'QUICK_MEASURE'
    ],
    4: [
      'EXPORT_SYSTEM',
      'REPORT_GENERATOR',
      'AI_ASSISTANT',
      'COMPLIANCE_CHECKER'
    ]
  }
  
  return phaseFeatures[phase as keyof typeof phaseFeatures] || []
}

// Quick start guide for developers
export const QUICK_START_GUIDE = `
# WarehouseCAD Measurement System - Phase 1

## Quick Start

1. Import measurement tools:
   import { useMeasurementStore, MeasurementDisplay, MeasurementTools } from '@/lib/measurement'

2. Add UI components:
   <MeasurementTools /> // Tool palette
   <MeasurementDisplay /> // 3D measurement rendering

3. Use measurement store:
   const { activeTool, setActiveTool } = useMeasurementStore()

## Phase 1 Features Available

✅ Linear measurements (point-to-point, multi-point chains)
✅ Angular measurements (3-point angle measurement)
✅ Area measurements (polygon boundary calculation)
✅ Volume measurements (bounding box calculation)
✅ Radius & diameter measurements
✅ Path measurements (route distance calculation)
✅ Clearance measurements (minimum distance analysis)
✅ Smart snap system (corners, centers, midpoints, grid)
✅ Professional dimension line rendering
✅ Persistent measurement storage
✅ Undo/redo system
✅ Unit support (feet, inches, ft-in, metric)
✅ Measurement groups and organization

## Coming in Future Phases

📋 Phase 2: Advanced analysis tools, clearance checking, density analysis
📋 Phase 3: CAD-style dimension editing, annotation system, quick measure
📋 Phase 4: Export to PDF/DXF/Excel, AI assistant, code compliance

## Example Usage

\`\`\`tsx
import { MeasurementTools, MeasurementDisplay, MeasurementPanel } from '@/lib/measurement'

function WarehouseCAD() {
  return (
    <div>
      <MeasurementTools className="absolute top-4 left-4" />
      <MeasurementPanel className="absolute top-4 right-4" />
      
      <Canvas>
        <MeasurementDisplay 
          sceneObjects={sceneObjects}
          showSnapIndicators={true}
          interactionEnabled={true}
        />
      </Canvas>
    </div>
  )
}
\`\`\`
`
