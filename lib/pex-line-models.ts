import * as THREE from 'three'
import { SemanticMetadata } from './models/SemanticModel'

/**
 * PEX PLUMBING LINE MODELS
 * 
 * This module contains realistic PEX (cross-linked polyethylene) tubing models
 * for hot and cold water distribution systems. PEX is commonly used in commercial
 * and residential plumbing due to its flexibility, durability, and ease of installation.
 * 
 * Color coding:
 * - Red PEX: Hot water lines
 * - Blue PEX: Cold water lines
 * 
 * Standard PEX diameters: 3/8", 1/2", 5/8", 3/4", 1", 1-1/4", 1-1/2", 2"
 * Working pressure: 80-100 PSI at 180°F (hot water)
 * Working pressure: 100-160 PSI at 73°F (cold water)
 */

export const PEX_LINE_MODELS: Record<string, SemanticMetadata> = {
  // 1/2" Red PEX - Most common size for hot water distribution
  'pex-red-half-inch': {
    id: 'pex-red-half-inch',
    name: 'PEX Red 1/2" Hot Water Line',
    category: 'utility',
    subcategory: 'plumbing',
    manufacturer: 'Generic',
    model: 'PEX-A 1/2"',
    dimensions: {
      width: 0.5 / 12,    // 1/2" outer diameter converted to feet
      height: 0.5 / 12,   // Circular profile
      depth: 20,          // 20 feet default length
      weight: 0.08        // lbs per foot (typical for 1/2" PEX)
    },
    placement: {
      surfaces: ['wall', 'ceiling', 'floor', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.25, back: 0.25, left: 0.25, right: 0.25, top: 0.25, bottom: 0.25 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -10), type: 'connection' }, // Start connection
        { position: new THREE.Vector3(0, 0, 10), type: 'connection' },  // End connection
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },       // Center for support
        { position: new THREE.Vector3(0, 0, -5), type: 'connection' },  // Mid connection
        { position: new THREE.Vector3(0, 0, 5), type: 'connection' }    // Mid connection
      ]
    },
    connections: [
      {
        type: 'plumbing',
        diameter: 0.5,
        pressure: 80, // PSI at 180°F
        required: true,
        position: new THREE.Vector3(0, 0, -10),
        direction: new THREE.Vector3(0, 0, -1)
      },
      {
        type: 'plumbing',
        diameter: 0.5,
        pressure: 80,
        required: true,
        position: new THREE.Vector3(0, 0, 10),
        direction: new THREE.Vector3(0, 0, 1)
      }
    ],
    codes: {
      fireRating: 0,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [
      {
        type: 'connects_to',
        targetId: 'pex-fitting',
        required: true,
        distance: { min: 0, max: 0.5 }
      },
      {
        type: 'connects_to',
        targetId: 'water-heater',
        required: false,
        distance: { min: 0, max: 50 }
      }
    ],
    operational: {
      powerConsumption: 0,
      heatGeneration: 0,
      noiseLevel: 0,
      operatingTemperature: { min: 32, max: 200 }, // °F operating range
      maintenanceAccess: 'all'
    },
    visual: {
      color: '#DC143C', // Crimson red for hot water
      material: 'pex-tubing',
      transparency: 0.1
    },
    lifecycle: {
      cost: 0.75, // $ per foot
      lifespan: 50,
      maintenanceInterval: 120 // months
    }
  },

  // 1/2" Blue PEX - Most common size for cold water distribution
  'pex-blue-half-inch': {
    id: 'pex-blue-half-inch',
    name: 'PEX Blue 1/2" Cold Water Line',
    category: 'utility',
    subcategory: 'plumbing',
    manufacturer: 'Generic',
    model: 'PEX-A 1/2"',
    dimensions: {
      width: 0.5 / 12,    // 1/2" outer diameter converted to feet
      height: 0.5 / 12,   // Circular profile
      depth: 20,          // 20 feet default length
      weight: 0.08        // lbs per foot
    },
    placement: {
      surfaces: ['wall', 'ceiling', 'floor', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.25, back: 0.25, left: 0.25, right: 0.25, top: 0.25, bottom: 0.25 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'plumbing',
        diameter: 0.5,
        pressure: 160, // PSI at 73°F (higher pressure for cold water)
        required: true,
        position: new THREE.Vector3(0, 0, -10),
        direction: new THREE.Vector3(0, 0, -1)
      },
      {
        type: 'plumbing',
        diameter: 0.5,
        pressure: 160,
        required: true,
        position: new THREE.Vector3(0, 0, 10),
        direction: new THREE.Vector3(0, 0, 1)
      }
    ],
    codes: {
      fireRating: 0,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [
      {
        type: 'connects_to',
        targetId: 'pex-fitting',
        required: true,
        distance: { min: 0, max: 0.5 }
      },
      {
        type: 'connects_to',
        targetId: 'water-meter',
        required: false,
        distance: { min: 0, max: 50 }
      }
    ],
    operational: {
      powerConsumption: 0,
      heatGeneration: 0,
      noiseLevel: 0,
      operatingTemperature: { min: 32, max: 100 }, // °F operating range
      maintenanceAccess: 'all'
    },
    visual: {
      color: '#0047AB', // Cobalt blue for cold water
      material: 'pex-tubing',
      transparency: 0.1
    },
    lifecycle: {
      cost: 0.75, // $ per foot
      lifespan: 50,
      maintenanceInterval: 120 // months
    }
  },

  // 3/4" Red PEX - Larger diameter for main hot water distribution
  'pex-red-three-quarter': {
    id: 'pex-red-three-quarter',
    name: 'PEX Red 3/4" Hot Water Main',
    category: 'utility',
    subcategory: 'plumbing',
    manufacturer: 'Generic',
    model: 'PEX-A 3/4"',
    dimensions: {
      width: 0.75 / 12,   // 3/4" outer diameter
      height: 0.75 / 12,
      depth: 20,          // 20 feet default length
      weight: 0.12        // lbs per foot
    },
    placement: {
      surfaces: ['wall', 'ceiling', 'floor', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'plumbing',
        diameter: 0.75,
        pressure: 80, // PSI at 180°F
        required: true,
        position: new THREE.Vector3(0, 0, -10),
        direction: new THREE.Vector3(0, 0, -1)
      },
      {
        type: 'plumbing',
        diameter: 0.75,
        pressure: 80,
        required: true,
        position: new THREE.Vector3(0, 0, 10),
        direction: new THREE.Vector3(0, 0, 1)
      }
    ],
    codes: {
      fireRating: 0,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [
      {
        type: 'connects_to',
        targetId: 'pex-fitting-3-4',
        required: true,
        distance: { min: 0, max: 0.5 }
      }
    ],
    operational: {
      powerConsumption: 0,
      heatGeneration: 0,
      noiseLevel: 0,
      operatingTemperature: { min: 32, max: 200 },
      maintenanceAccess: 'all'
    },
    visual: {
      color: '#DC143C', // Crimson red
      material: 'pex-tubing',
      transparency: 0.1
    },
    lifecycle: {
      cost: 1.25, // $ per foot
      lifespan: 50,
      maintenanceInterval: 120
    }
  },

  // 3/4" Blue PEX - Larger diameter for main cold water distribution
  'pex-blue-three-quarter': {
    id: 'pex-blue-three-quarter',
    name: 'PEX Blue 3/4" Cold Water Main',
    category: 'utility',
    subcategory: 'plumbing',
    manufacturer: 'Generic',
    model: 'PEX-A 3/4"',
    dimensions: {
      width: 0.75 / 12,   // 3/4" outer diameter
      height: 0.75 / 12,
      depth: 20,          // 20 feet default length
      weight: 0.12        // lbs per foot
    },
    placement: {
      surfaces: ['wall', 'ceiling', 'floor', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0.5 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'plumbing',
        diameter: 0.75,
        pressure: 160, // PSI at 73°F
        required: true,
        position: new THREE.Vector3(0, 0, -10),
        direction: new THREE.Vector3(0, 0, -1)
      },
      {
        type: 'plumbing',
        diameter: 0.75,
        pressure: 160,
        required: true,
        position: new THREE.Vector3(0, 0, 10),
        direction: new THREE.Vector3(0, 0, 1)
      }
    ],
    codes: {
      fireRating: 0,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [
      {
        type: 'connects_to',
        targetId: 'pex-fitting-3-4',
        required: true,
        distance: { min: 0, max: 0.5 }
      }
    ],
    operational: {
      powerConsumption: 0,
      heatGeneration: 0,
      noiseLevel: 0,
      operatingTemperature: { min: 32, max: 100 },
      maintenanceAccess: 'all'
    },
    visual: {
      color: '#0047AB', // Cobalt blue
      material: 'pex-tubing',
      transparency: 0.1
    },
    lifecycle: {
      cost: 1.25, // $ per foot
      lifespan: 50,
      maintenanceInterval: 120
    }
  },

  // 1" Red PEX - Large diameter for trunk lines
  'pex-red-one-inch': {
    id: 'pex-red-one-inch',
    name: 'PEX Red 1" Hot Water Trunk Line',
    category: 'utility',
    subcategory: 'plumbing',
    manufacturer: 'Generic',
    model: 'PEX-A 1"',
    dimensions: {
      width: 1.0 / 12,    // 1" outer diameter
      height: 1.0 / 12,
      depth: 20,          // 20 feet default length
      weight: 0.18        // lbs per foot
    },
    placement: {
      surfaces: ['wall', 'ceiling', 'floor', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.75, back: 0.75, left: 0.75, right: 0.75, top: 0.75, bottom: 0.75 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'plumbing',
        diameter: 1.0,
        pressure: 80, // PSI at 180°F
        required: true,
        position: new THREE.Vector3(0, 0, -10),
        direction: new THREE.Vector3(0, 0, -1)
      },
      {
        type: 'plumbing',
        diameter: 1.0,
        pressure: 80,
        required: true,
        position: new THREE.Vector3(0, 0, 10),
        direction: new THREE.Vector3(0, 0, 1)
      }
    ],
    codes: {
      fireRating: 0,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [
      {
        type: 'connects_to',
        targetId: 'pex-fitting-1-inch',
        required: true,
        distance: { min: 0, max: 0.5 }
      }
    ],
    operational: {
      powerConsumption: 0,
      heatGeneration: 0,
      noiseLevel: 0,
      operatingTemperature: { min: 32, max: 200 },
      maintenanceAccess: 'all'
    },
    visual: {
      color: '#DC143C', // Crimson red
      material: 'pex-tubing',
      transparency: 0.1
    },
    lifecycle: {
      cost: 2.0, // $ per foot
      lifespan: 50,
      maintenanceInterval: 120
    }
  },

  // 1" Blue PEX - Large diameter for trunk lines
  'pex-blue-one-inch': {
    id: 'pex-blue-one-inch',
    name: 'PEX Blue 1" Cold Water Trunk Line',
    category: 'utility',
    subcategory: 'plumbing',
    manufacturer: 'Generic',
    model: 'PEX-A 1"',
    dimensions: {
      width: 1.0 / 12,    // 1" outer diameter
      height: 1.0 / 12,
      depth: 20,          // 20 feet default length
      weight: 0.18        // lbs per foot
    },
    placement: {
      surfaces: ['wall', 'ceiling', 'floor', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.75, back: 0.75, left: 0.75, right: 0.75, top: 0.75, bottom: 0.75 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 10), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'plumbing',
        diameter: 1.0,
        pressure: 160, // PSI at 73°F
        required: true,
        position: new THREE.Vector3(0, 0, -10),
        direction: new THREE.Vector3(0, 0, -1)
      },
      {
        type: 'plumbing',
        diameter: 1.0,
        pressure: 160,
        required: true,
        position: new THREE.Vector3(0, 0, 10),
        direction: new THREE.Vector3(0, 0, 1)
      }
    ],
    codes: {
      fireRating: 0,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [
      {
        type: 'connects_to',
        targetId: 'pex-fitting-1-inch',
        required: true,
        distance: { min: 0, max: 0.5 }
      }
    ],
    operational: {
      powerConsumption: 0,
      heatGeneration: 0,
      noiseLevel: 0,
      operatingTemperature: { min: 32, max: 100 },
      maintenanceAccess: 'all'
    },
    visual: {
      color: '#0047AB', // Cobalt blue
      material: 'pex-tubing',
      transparency: 0.1
    },
    lifecycle: {
      cost: 2.0, // $ per foot
      lifespan: 50,
      maintenanceInterval: 120
    }
  }
}

/**
 * Helper function to create a curved PEX line between two points
 * This is useful for creating realistic routing around obstacles
 */
export function createCurvedPexLine(
  startPoint: THREE.Vector3,
  endPoint: THREE.Vector3,
  pexType: 'red' | 'blue',
  diameter: 0.5 | 0.75 | 1.0,
  curveHeight: number = 2
): SemanticMetadata {
  const distance = startPoint.distanceTo(endPoint)
  const midPoint = new THREE.Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5)
  midPoint.y += curveHeight // Add curve height
  
  const baseId = pexType === 'red' ? 'pex-red' : 'pex-blue'
  const sizeId = diameter === 0.5 ? 'half-inch' : diameter === 0.75 ? 'three-quarter' : 'one-inch'
  const baseModel = PEX_LINE_MODELS[`${baseId}-${sizeId}`]
  
  return {
    ...baseModel,
    id: `${baseId}-${sizeId}-curved-${Date.now()}`,
    name: `${baseModel.name} (Curved)`,
    dimensions: {
      ...baseModel.dimensions,
      depth: distance // Adjust length to actual distance
    },
    placement: {
      ...baseModel.placement,
      snapPoints: [
        { position: startPoint.clone().sub(midPoint), type: 'connection' },
        { position: endPoint.clone().sub(midPoint), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' }
      ]
    }
  }
}

/**
 * Helper function to calculate PEX line flow rate based on diameter and pressure
 */
export function calculatePexFlowRate(diameter: number, pressure: number, length: number): number {
  // Simplified flow calculation using Hazen-Williams equation
  // Flow rate in GPM (gallons per minute)
  const C = 150 // Hazen-Williams coefficient for PEX
  const headLoss = pressure * 2.31 / length // Convert PSI to head loss per foot
  
  // Simplified calculation - in reality this would be more complex
  const flowRate = Math.pow(diameter, 2.63) * Math.pow(headLoss / 100, 0.54) * C / 100
  
  return Math.max(0, flowRate)
}

/**
 * PEX installation guidelines and best practices
 */
export const PEX_INSTALLATION_GUIDELINES = {
  minBendRadius: {
    '0.5': 2.5,   // inches - 5x diameter
    '0.75': 3.75, // inches - 5x diameter  
    '1.0': 5.0    // inches - 5x diameter
  },
  maxSupportSpacing: {
    horizontal: 32, // inches
    vertical: 48    // inches
  },
  temperatureDerating: {
    '73F': 1.0,   // No derating at room temperature
    '100F': 0.9,  // 10% pressure reduction
    '140F': 0.7,  // 30% pressure reduction
    '180F': 0.5   // 50% pressure reduction
  },
  fittingTypes: [
    'crimp-ring',
    'push-fit',
    'expansion',
    'compression'
  ],
  insulationRequired: {
    hotLines: true,
    coldLines: false, // Optional for condensation control
    minimumRValue: 3.0
  }
}
