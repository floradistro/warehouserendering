import * as THREE from 'three'
import { SemanticMetadata } from './models/SemanticModel'

/**
 * UNISTRUT AND CHANNEL SYSTEM MODELS
 * 
 * This module contains detailed models for structural support systems including:
 * - Unistrut P-series channels
 * - Standard steel channels (C, U, Hat)
 * - Mounting brackets and accessories
 * 
 * All dimensions are in inches and converted to feet for the 3D system.
 */

export const UNISTRUT_MODELS: Record<string, SemanticMetadata> = {
  // P1000 - Standard 1-5/8" x 1-5/8" channel
  'unistrut-p1000': {
    id: 'unistrut-p1000',
    name: 'Unistrut P1000 Standard Channel',
    category: 'structure',
    subcategory: 'support-system',
    manufacturer: 'Unistrut',
    model: 'P1000',
    dimensions: { 
      width: 1.625 / 12,  // 1-5/8" converted to feet
      height: 1.625 / 12, // 1-5/8" converted to feet
      depth: 10,          // 10 feet default length
      weight: 2.27        // lbs per foot
    },
    placement: {
      surfaces: ['floor', 'wall', 'ceiling', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -2.5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 2.5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'mechanical',
        required: false,
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 1, 0)
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
        targetId: 'unistrut-bracket',
        required: false,
        distance: { min: 0, max: 0 }
      }
    ],
    operational: {
      maintenanceAccess: 'all'
    },
    visual: { 
      color: '#708090', 
      material: 'galvanized-steel' 
    },
    lifecycle: { 
      cost: 12, 
      lifespan: 50, 
      maintenanceInterval: 120 
    }
  },

  // P1001 - Slotted channel for flexible mounting
  'unistrut-p1001': {
    id: 'unistrut-p1001',
    name: 'Unistrut P1001 Slotted Channel',
    category: 'structure',
    subcategory: 'support-system',
    manufacturer: 'Unistrut',
    model: 'P1001',
    dimensions: { 
      width: 1.625 / 12,  // 1-5/8" converted to feet
      height: 1.625 / 12, // 1-5/8" converted to feet
      depth: 10,          // 10 feet default length
      weight: 2.15        // lbs per foot (lighter due to slots)
    },
    placement: {
      surfaces: ['floor', 'wall', 'ceiling', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -2.5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 2.5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'mechanical',
        required: false,
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 1, 0)
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
        targetId: 'unistrut-bracket',
        required: false,
        distance: { min: 0, max: 0 }
      }
    ],
    operational: {
      maintenanceAccess: 'all'
    },
    visual: { 
      color: '#708090', 
      material: 'galvanized-steel' 
    },
    lifecycle: { 
      cost: 11, 
      lifespan: 50, 
      maintenanceInterval: 120 
    }
  },

  // P3000 - Heavy duty wide channel
  'unistrut-p3000': {
    id: 'unistrut-p3000',
    name: 'Unistrut P3000 Heavy Duty Channel',
    category: 'structure',
    subcategory: 'support-system',
    manufacturer: 'Unistrut',
    model: 'P3000',
    dimensions: { 
      width: 2.5 / 12,    // 2-1/2" converted to feet
      height: 1.625 / 12, // 1-5/8" converted to feet
      depth: 10,          // 10 feet default length
      weight: 3.42        // lbs per foot
    },
    placement: {
      surfaces: ['floor', 'wall', 'ceiling', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -2.5), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 2.5), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'mechanical',
        required: false,
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 1, 0)
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
        targetId: 'unistrut-bracket',
        required: false,
        distance: { min: 0, max: 0 }
      }
    ],
    operational: {
      maintenanceAccess: 'all'
    },
    visual: { 
      color: '#708090', 
      material: 'galvanized-steel' 
    },
    lifecycle: { 
      cost: 18, 
      lifespan: 50, 
      maintenanceInterval: 120 
    }
  }
}

export const CHANNEL_MODELS: Record<string, SemanticMetadata> = {
  // Standard C-Channel 3" x 1.5"
  'c-channel-3x1.5': {
    id: 'c-channel-3x1.5',
    name: 'C-Channel 3" x 1.5"',
    category: 'structure',
    subcategory: 'channel',
    dimensions: { 
      width: 3 / 12,      // 3" converted to feet
      height: 1.5 / 12,   // 1.5" converted to feet
      depth: 10,          // 10 feet default length
      weight: 3.85        // lbs per foot
    },
    placement: {
      surfaces: ['floor', 'wall', 'ceiling', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(-1.5/12, 0, 0), type: 'edge' },
        { position: new THREE.Vector3(1.5/12, 0, 0), type: 'edge' }
      ]
    },
    connections: [
      {
        type: 'mechanical',
        required: false,
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 1, 0)
      }
    ],
    codes: {
      fireRating: 1,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [],
    operational: {
      maintenanceAccess: 'all'
    },
    visual: { 
      color: '#696969', 
      material: 'steel' 
    },
    lifecycle: { 
      cost: 25, 
      lifespan: 50, 
      maintenanceInterval: 120 
    }
  },

  // Standard U-Channel 4" x 2"
  'u-channel-4x2': {
    id: 'u-channel-4x2',
    name: 'U-Channel 4" x 2"',
    category: 'structure',
    subcategory: 'channel',
    dimensions: { 
      width: 4 / 12,      // 4" converted to feet
      height: 2 / 12,     // 2" converted to feet
      depth: 10,          // 10 feet default length
      weight: 5.4         // lbs per foot
    },
    placement: {
      surfaces: ['floor', 'wall', 'ceiling', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(-2/12, 0, 0), type: 'edge' },
        { position: new THREE.Vector3(2/12, 0, 0), type: 'edge' }
      ]
    },
    connections: [
      {
        type: 'mechanical',
        required: false,
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 1, 0)
      }
    ],
    codes: {
      fireRating: 1,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [],
    operational: {
      maintenanceAccess: 'all'
    },
    visual: { 
      color: '#696969', 
      material: 'steel' 
    },
    lifecycle: { 
      cost: 35, 
      lifespan: 50, 
      maintenanceInterval: 120 
    }
  },

  // Hat Channel for drywall systems
  'hat-channel': {
    id: 'hat-channel',
    name: 'Hat Channel',
    category: 'structure',
    subcategory: 'channel',
    dimensions: { 
      width: 2.5 / 12,    // 2.5" converted to feet
      height: 0.5 / 12,   // 0.5" converted to feet
      depth: 10,          // 10 feet default length
      weight: 1.2         // lbs per foot
    },
    placement: {
      surfaces: ['wall', 'ceiling', 'beam'],
      orientation: 'rotatable',
      clearances: { front: 0.25, back: 0.25, left: 0.25, right: 0.25, top: 0.25, bottom: 0 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(-1.25/12, 0, 0), type: 'edge' },
        { position: new THREE.Vector3(1.25/12, 0, 0), type: 'edge' }
      ]
    },
    connections: [
      {
        type: 'mechanical',
        required: false,
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 1, 0)
      }
    ],
    codes: {
      fireRating: 0,
      accessibility: false,
      clearanceRequired: false
    },
    relationships: [],
    operational: {
      maintenanceAccess: 'all'
    },
    visual: { 
      color: '#708090', 
      material: 'galvanized-steel' 
    },
    lifecycle: { 
      cost: 8, 
      lifespan: 50, 
      maintenanceInterval: 120 
    }
  }
}

export const BRACKET_MODELS: Record<string, SemanticMetadata> = {
  // Standard Unistrut bracket
  'unistrut-bracket-p1010': {
    id: 'unistrut-bracket-p1010',
    name: 'Unistrut Bracket P1010',
    category: 'structure',
    subcategory: 'bracket',
    manufacturer: 'Unistrut',
    model: 'P1010',
    dimensions: { 
      width: 1.625 / 12,  // 1-5/8" converted to feet
      height: 1.625 / 12, // 1-5/8" converted to feet
      depth: 3 / 12,      // 3" converted to feet
      weight: 0.5         // total weight
    },
    placement: {
      surfaces: ['beam', 'wall'],
      orientation: 'rotatable',
      clearances: { front: 0, back: 0, left: 0, right: 0, top: 0, bottom: 0 },
      snapPoints: [
        { position: new THREE.Vector3(0, 0, 0), type: 'center' },
        { position: new THREE.Vector3(0, 0, -1.5/12), type: 'connection' },
        { position: new THREE.Vector3(0, 0, 1.5/12), type: 'connection' }
      ]
    },
    connections: [
      {
        type: 'mechanical',
        required: true,
        position: new THREE.Vector3(0, 0, 0),
        direction: new THREE.Vector3(0, 1, 0)
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
        targetId: 'unistrut-p1000',
        required: true,
        distance: { min: 0, max: 0 }
      },
      {
        type: 'connects_to',
        targetId: 'unistrut-p1001',
        required: true,
        distance: { min: 0, max: 0 }
      }
    ],
    operational: {
      maintenanceAccess: 'all'
    },
    visual: { 
      color: '#708090', 
      material: 'galvanized-steel' 
    },
    lifecycle: { 
      cost: 5, 
      lifespan: 50, 
      maintenanceInterval: 120 
    }
  }
}

// Combined export for all structural support models
export const STRUCTURAL_SUPPORT_MODELS = {
  ...UNISTRUT_MODELS,
  ...CHANNEL_MODELS,
  ...BRACKET_MODELS
}

/**
 * UTILITY FUNCTIONS FOR UNISTRUT/CHANNEL SYSTEMS
 */

// Calculate load capacity based on span and support conditions
export function calculateLoadCapacity(modelId: string, spanFeet: number, supportType: 'simple' | 'continuous' = 'simple'): number {
  const loadCapacities = {
    'unistrut-p1000': { simple: 1200, continuous: 1800 }, // lbs distributed load
    'unistrut-p1001': { simple: 1100, continuous: 1650 },
    'unistrut-p3000': { simple: 2400, continuous: 3600 },
    'c-channel-3x1.5': { simple: 2000, continuous: 3000 },
    'u-channel-4x2': { simple: 3200, continuous: 4800 }
  }
  
  const baseCapacity = loadCapacities[modelId as keyof typeof loadCapacities]?.[supportType] || 0
  
  // Reduce capacity based on span (simplified calculation)
  const spanFactor = Math.max(0.1, 1 - (spanFeet - 8) * 0.05)
  
  return Math.round(baseCapacity * spanFactor)
}

// Generate mounting hole pattern for unistrut
export function generateUnistrutholes(lengthFeet: number, spacing: number = 2): THREE.Vector3[] {
  const holes: THREE.Vector3[] = []
  const startZ = -lengthFeet / 2
  
  for (let i = 0; i <= lengthFeet / spacing; i++) {
    holes.push(new THREE.Vector3(0, 0, startZ + i * spacing))
  }
  
  return holes
}
