/**
 * PLUMBING SYSTEM - Phase 1 Implementation
 * 
 * Path-based pipe system that replaces individual fixtures with intelligent routing.
 * 
 * Features:
 * ✅ Click-to-route pipe creation tool
 * ✅ Automatic 90° elbow insertion at bends
 * ✅ Brass/PVC/PEX material options with proper colors
 * ✅ Basic pipe diameter sizing (1/2", 3/4", 1", etc.)
 * ✅ Delete/modify existing paths
 * ✅ Smart pipe renderer with TubeGeometry and fittings
 * ✅ Material-based coloring and properties
 * ✅ Path validation and cost calculation
 */

// Core system classes
export { 
  PlumbingSystem, 
  PlumbingSystemManager,
  type PlumbingSystemConfig,
  type PipePoint,
  type PipeConnection,
  type PipeMaterial
} from './PlumbingSystem'

// Rendering system
export { 
  SmartPipeRenderer,
  SmartPipeRendererComponent,
  type PipeSegmentGeometry
} from './SmartPipeRenderer'

// Interactive tools
export { 
  PipeRoutingTool,
  PipeRoutingToolbar,
  type PipeRoutingState
} from './PipeRoutingTool'

export { 
  PipePathEditor,
  PipePathEditorToolbar,
  type PathEditingState
} from './PipePathEditor'

// Main integration component
export { 
  default as PlumbingSystemIntegration,
  usePlumbingSystems
} from '../../components/PlumbingSystemIntegration'

// Example usage:
/*
import { PlumbingSystemManager, PlumbingSystem } from '@/lib/plumbing'

// Create a plumbing manager
const plumbingManager = new PlumbingSystemManager()

// Create a PEX cold water system as specified in Phase 1
const pexSystem = plumbingManager.createSystem({
  id: 'pex-cold-water-main',
  name: 'PEX Cold Water Distribution',
  systemType: 'cold_water',
  material: 'pex',
  diameter: 0.5,
  path: [
    { x: 37.5, y: 222, z: 9.0 },  // Start at north wall
    { x: 37.5, y: 210, z: 9.0 },  // Veg branch point  
    { x: 76.4, y: 210, z: 9.0 }   // Terminate at Veg center
  ]
})

// Add to scene
scene.add(plumbingManager.getScene())
*/
