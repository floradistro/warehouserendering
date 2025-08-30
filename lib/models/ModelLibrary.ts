import * as THREE from 'three'
import { SemanticMetadata, ConnectionPoint, PlacementRule } from './SemanticModel'

// Predefined semantic models for warehouse objects
export class ModelLibrary {
  private static models: Map<string, SemanticMetadata> = new Map()

  static initialize() {
    this.registerStructuralModels()
    this.registerStructuralSupports()
    this.registerUtilityModels()
    this.registerEquipmentModels()
    this.registerFurnitureModels()
    this.registerStorageModels()
    this.registerSafetyModels()
    this.registerLightingModels()
  }

  private static registerStructuralModels() {
    // Standard Wall
    this.models.set('wall-standard', {
      id: 'wall-standard',
      name: 'Standard Wall',
      category: 'structure',
      subcategory: 'wall',
      dimensions: { width: 10, height: 8, depth: 0.5, weight: 500 },
      placement: {
        surfaces: ['floor'],
        orientation: 'rotatable',
        clearances: { front: 0, back: 0, left: 0, right: 0, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(-5, 0, 0), type: 'corner' },
          { position: new THREE.Vector3(5, 0, 0), type: 'corner' },
          { position: new THREE.Vector3(0, 4, 0), type: 'center' }
        ]
      },
      connections: [],
      codes: {
        fireRating: 1,
        accessibility: false,
        clearanceRequired: false
      },
      relationships: [],
      visual: { color: '#cccccc', material: 'drywall' },
      lifecycle: { cost: 15, lifespan: 30, maintenanceInterval: 60 }
    })

    // Steel I-Beam
    this.models.set('steel-ibeam', {
      id: 'steel-ibeam',
      name: 'Steel I-Beam',
      category: 'structure',
      subcategory: 'beam',
      dimensions: { width: 0.5, height: 12, depth: 0.5, weight: 200 },
      placement: {
        surfaces: ['floor', 'beam'],
        orientation: 'fixed',
        clearances: { front: 1, back: 1, left: 1, right: 1, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, -6, 0), type: 'corner' },
          { position: new THREE.Vector3(0, 6, 0), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 0), type: 'center' }
        ]
      },
      connections: [],
      codes: {
        fireRating: 2,
        accessibility: false,
        clearanceRequired: true
      },
      relationships: [],
      visual: { color: '#666666', material: 'steel' },
      lifecycle: { cost: 50, lifespan: 50, maintenanceInterval: 120 }
    })

    // Concrete Column
    this.models.set('concrete-column', {
      id: 'concrete-column',
      name: 'Concrete Column',
      category: 'structure',
      subcategory: 'column',
      dimensions: { width: 2, height: 12, depth: 2, weight: 2000 },
      placement: {
        surfaces: ['floor'],
        orientation: 'fixed',
        clearances: { front: 2, back: 2, left: 2, right: 2, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(0, 12, 0), type: 'corner' }
        ]
      },
      connections: [],
      codes: {
        fireRating: 3,
        accessibility: false,
        clearanceRequired: true
      },
      relationships: [],
      visual: { color: '#999999', material: 'concrete' },
      lifecycle: { cost: 100, lifespan: 100, maintenanceInterval: 240 }
    })
  }

  private static registerStructuralSupports() {
    // Unistrut P1000 - Standard
    this.models.set('unistrut-p1000', {
      id: 'unistrut-p1000',
      name: 'Unistrut P1000 Standard',
      category: 'structure',
      subcategory: 'support-system',
      manufacturer: 'Unistrut',
      model: 'P1000',
      dimensions: { width: 1.625, height: 1.625, depth: 10, weight: 2.27 },
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
      visual: { color: '#708090', material: 'galvanized-steel' },
      lifecycle: { cost: 12, lifespan: 50, maintenanceInterval: 120 }
    })

    // Unistrut P1001 - Slotted
    this.models.set('unistrut-p1001', {
      id: 'unistrut-p1001',
      name: 'Unistrut P1001 Slotted',
      category: 'structure',
      subcategory: 'support-system',
      manufacturer: 'Unistrut',
      model: 'P1001',
      dimensions: { width: 1.625, height: 1.625, depth: 10, weight: 2.15 },
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
      visual: { color: '#708090', material: 'galvanized-steel' },
      lifecycle: { cost: 11, lifespan: 50, maintenanceInterval: 120 }
    })

    // Unistrut P3000 - Heavy Duty
    this.models.set('unistrut-p3000', {
      id: 'unistrut-p3000',
      name: 'Unistrut P3000 Heavy Duty',
      category: 'structure',
      subcategory: 'support-system',
      manufacturer: 'Unistrut',
      model: 'P3000',
      dimensions: { width: 2.5, height: 1.625, depth: 10, weight: 3.42 },
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
      visual: { color: '#708090', material: 'galvanized-steel' },
      lifecycle: { cost: 18, lifespan: 50, maintenanceInterval: 120 }
    })

    // C-Channel 3x1.5
    this.models.set('c-channel-3x1.5', {
      id: 'c-channel-3x1.5',
      name: 'C-Channel 3" x 1.5"',
      category: 'structure',
      subcategory: 'channel',
      dimensions: { width: 3, height: 1.5, depth: 10, weight: 3.85 },
      placement: {
        surfaces: ['floor', 'wall', 'ceiling', 'beam'],
        orientation: 'rotatable',
        clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(-1.5, 0, 0), type: 'edge' },
          { position: new THREE.Vector3(1.5, 0, 0), type: 'edge' }
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
      visual: { color: '#696969', material: 'steel' },
      lifecycle: { cost: 25, lifespan: 50, maintenanceInterval: 120 }
    })

    // U-Channel 4x2
    this.models.set('u-channel-4x2', {
      id: 'u-channel-4x2',
      name: 'U-Channel 4" x 2"',
      category: 'structure',
      subcategory: 'channel',
      dimensions: { width: 4, height: 2, depth: 10, weight: 5.4 },
      placement: {
        surfaces: ['floor', 'wall', 'ceiling', 'beam'],
        orientation: 'rotatable',
        clearances: { front: 0.5, back: 0.5, left: 0.5, right: 0.5, top: 0.5, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(-2, 0, 0), type: 'edge' },
          { position: new THREE.Vector3(2, 0, 0), type: 'edge' }
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
      visual: { color: '#696969', material: 'steel' },
      lifecycle: { cost: 35, lifespan: 50, maintenanceInterval: 120 }
    })

    // Hat Channel
    this.models.set('hat-channel', {
      id: 'hat-channel',
      name: 'Hat Channel',
      category: 'structure',
      subcategory: 'channel',
      dimensions: { width: 2.5, height: 0.5, depth: 10, weight: 1.2 },
      placement: {
        surfaces: ['wall', 'ceiling', 'beam'],
        orientation: 'rotatable',
        clearances: { front: 0.25, back: 0.25, left: 0.25, right: 0.25, top: 0.25, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, -5), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 5), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(-1.25, 0, 0), type: 'edge' },
          { position: new THREE.Vector3(1.25, 0, 0), type: 'edge' }
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
      visual: { color: '#708090', material: 'galvanized-steel' },
      lifecycle: { cost: 8, lifespan: 50, maintenanceInterval: 120 }
    })

    // Unistrut Bracket P1010
    this.models.set('unistrut-bracket-p1010', {
      id: 'unistrut-bracket-p1010',
      name: 'Unistrut Bracket P1010',
      category: 'structure',
      subcategory: 'bracket',
      manufacturer: 'Unistrut',
      model: 'P1010',
      dimensions: { width: 1.625, height: 1.625, depth: 3, weight: 0.5 },
      placement: {
        surfaces: ['beam', 'wall'],
        orientation: 'rotatable',
        clearances: { front: 0, back: 0, left: 0, right: 0, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(0, 0, -1.5), type: 'connection' },
          { position: new THREE.Vector3(0, 0, 1.5), type: 'connection' }
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
      visual: { color: '#708090', material: 'galvanized-steel' },
      lifecycle: { cost: 5, lifespan: 50, maintenanceInterval: 120 }
    })
  }

  private static registerUtilityModels() {
    // Electrical Panel
    this.models.set('electrical-panel', {
      id: 'electrical-panel',
      name: 'Electrical Panel',
      category: 'utility',
      subcategory: 'panel',
      dimensions: { width: 2, height: 4, depth: 0.5, weight: 100 },
      placement: {
        surfaces: ['wall'],
        orientation: 'fixed',
        clearances: { front: 3, back: 0, left: 1, right: 1, top: 1, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0.25), type: 'center', normal: new THREE.Vector3(0, 0, 1) }
        ]
      },
      connections: [
        {
          type: 'electrical',
          voltage: 480,
          amperage: 200,
          required: true,
          position: new THREE.Vector3(0, -1, 0.25),
          direction: new THREE.Vector3(0, 0, 1)
        }
      ],
      codes: {
        fireRating: 1,
        accessibility: true,
        clearanceRequired: true,
        emergencyAccess: true
      },
      relationships: [],
      operational: {
        powerConsumption: 0,
        heatGeneration: 500,
        noiseLevel: 40,
        maintenanceAccess: 'front'
      },
      visual: { color: '#333333', material: 'metal' },
      lifecycle: { cost: 500, lifespan: 25, maintenanceInterval: 12 }
    })

    // HVAC Unit
    this.models.set('hvac-unit', {
      id: 'hvac-unit',
      name: 'HVAC Unit',
      category: 'utility',
      subcategory: 'hvac',
      dimensions: { width: 4, height: 3, depth: 2, weight: 300 },
      placement: {
        surfaces: ['floor', 'ceiling'],
        orientation: 'rotatable',
        clearances: { front: 3, back: 2, left: 2, right: 2, top: 2, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' }
        ]
      },
      connections: [
        {
          type: 'electrical',
          voltage: 240,
          amperage: 30,
          required: true,
          position: new THREE.Vector3(-1.5, 0, 0),
          direction: new THREE.Vector3(-1, 0, 0)
        },
        {
          type: 'hvac',
          diameter: 12,
          required: true,
          position: new THREE.Vector3(0, 1.5, 0),
          direction: new THREE.Vector3(0, 1, 0)
        }
      ],
      codes: {
        fireRating: 1,
        accessibility: false,
        clearanceRequired: true,
        ventilationRequired: true
      },
      relationships: [],
      operational: {
        powerConsumption: 3000,
        heatGeneration: 2000,
        noiseLevel: 65,
        operatingTemperature: { min: -10, max: 120 },
        maintenanceAccess: 'all'
      },
      visual: { color: '#4a4a4a', material: 'metal' },
      lifecycle: { cost: 2500, lifespan: 15, maintenanceInterval: 6 }
    })
  }

  private static registerEquipmentModels() {
    // Storage Tank
    this.models.set('storage-tank', {
      id: 'storage-tank',
      name: 'Storage Tank',
      category: 'equipment',
      subcategory: 'tank',
      dimensions: { width: 8, height: 10, depth: 8, weight: 5000 },
      placement: {
        surfaces: ['floor'],
        orientation: 'fixed',
        clearances: { front: 3, back: 3, left: 3, right: 3, top: 2, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(4, 0, 0), type: 'edge' },
          { position: new THREE.Vector3(-4, 0, 0), type: 'edge' }
        ]
      },
      connections: [
        {
          type: 'plumbing',
          diameter: 4,
          pressure: 150,
          required: true,
          position: new THREE.Vector3(0, -4, 3),
          direction: new THREE.Vector3(0, -1, 0)
        }
      ],
      codes: {
        fireRating: 2,
        accessibility: false,
        clearanceRequired: true,
        emergencyAccess: true
      },
      relationships: [],
      operational: {
        powerConsumption: 500,
        heatGeneration: 200,
        noiseLevel: 45,
        maintenanceAccess: 'all'
      },
      visual: { color: '#708090', material: 'steel' },
      lifecycle: { cost: 10000, lifespan: 20, maintenanceInterval: 12 }
    })

    // Conveyor Belt
    this.models.set('conveyor-belt', {
      id: 'conveyor-belt',
      name: 'Conveyor Belt',
      category: 'equipment',
      subcategory: 'conveyor',
      dimensions: { width: 20, height: 3, depth: 2, weight: 1000 },
      placement: {
        surfaces: ['floor'],
        orientation: 'rotatable',
        clearances: { front: 2, back: 2, left: 1, right: 1, top: 3, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(-10, 0, 0), type: 'corner' },
          { position: new THREE.Vector3(10, 0, 0), type: 'corner' },
          { position: new THREE.Vector3(0, 0, 0), type: 'center' }
        ]
      },
      connections: [
        {
          type: 'electrical',
          voltage: 480,
          amperage: 20,
          required: true,
          position: new THREE.Vector3(0, 0, -1),
          direction: new THREE.Vector3(0, 0, -1)
        }
      ],
      codes: {
        fireRating: 1,
        accessibility: false,
        clearanceRequired: true,
        emergencyAccess: true
      },
      relationships: [],
      operational: {
        powerConsumption: 2000,
        heatGeneration: 1000,
        noiseLevel: 70,
        maintenanceAccess: 'sides'
      },
      visual: { color: '#2F4F4F', material: 'metal' },
      lifecycle: { cost: 15000, lifespan: 10, maintenanceInterval: 3 }
    })
  }

  private static registerFurnitureModels() {
    // Office Table
    this.models.set('office-table', {
      id: 'office-table',
      name: 'Office Table',
      category: 'furniture',
      subcategory: 'table',
      dimensions: { width: 4, height: 2.5, depth: 2, weight: 100 },
      placement: {
        surfaces: ['floor'],
        orientation: 'rotatable',
        clearances: { front: 2, back: 1, left: 1, right: 1, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(2, 0, 1), type: 'corner' },
          { position: new THREE.Vector3(-2, 0, -1), type: 'corner' }
        ]
      },
      connections: [
        {
          type: 'electrical',
          voltage: 120,
          amperage: 15,
          required: false,
          position: new THREE.Vector3(0, 0, 0.8),
          direction: new THREE.Vector3(0, -1, 0)
        }
      ],
      codes: {
        accessibility: true,
        clearanceRequired: false
      },
      relationships: [],
      visual: { color: '#8B4513', material: 'wood' },
      lifecycle: { cost: 300, lifespan: 15, maintenanceInterval: 36 }
    })

    // Office Chair
    this.models.set('office-chair', {
      id: 'office-chair',
      name: 'Office Chair',
      category: 'furniture',
      subcategory: 'chair',
      dimensions: { width: 2, height: 3, depth: 2, weight: 50 },
      placement: {
        surfaces: ['floor'],
        orientation: 'rotatable',
        clearances: { front: 1, back: 1, left: 0.5, right: 0.5, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' }
        ]
      },
      connections: [],
      codes: {
        accessibility: true,
        clearanceRequired: false
      },
      relationships: [
        {
          type: 'adjacent_to',
          targetId: 'office-table',
          required: false,
          distance: { min: 1, max: 3 }
        }
      ],
      visual: { color: '#000080', material: 'fabric' },
      lifecycle: { cost: 200, lifespan: 10, maintenanceInterval: 24 }
    })
  }

  private static registerStorageModels() {
    // Storage Rack
    this.models.set('storage-rack', {
      id: 'storage-rack',
      name: 'Storage Rack',
      category: 'storage',
      subcategory: 'rack',
      dimensions: { width: 8, height: 10, depth: 2, weight: 500 },
      placement: {
        surfaces: ['floor'],
        orientation: 'rotatable',
        clearances: { front: 3, back: 1, left: 1, right: 1, top: 2, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' },
          { position: new THREE.Vector3(-4, 0, 0), type: 'edge' },
          { position: new THREE.Vector3(4, 0, 0), type: 'edge' }
        ]
      },
      connections: [],
      codes: {
        fireRating: 1,
        accessibility: true,
        clearanceRequired: true
      },
      relationships: [],
      visual: { color: '#FF8C00', material: 'metal' },
      lifecycle: { cost: 800, lifespan: 20, maintenanceInterval: 24 }
    })

    // IBC Tote
    this.models.set('ibc-tote', {
      id: 'ibc-tote',
      name: 'IBC Tote',
      category: 'storage',
      subcategory: 'container',
      dimensions: { width: 4, height: 4, depth: 4, weight: 2200 },
      placement: {
        surfaces: ['floor', 'rack'],
        orientation: 'fixed',
        clearances: { front: 2, back: 2, left: 2, right: 2, top: 1, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0), type: 'center' }
        ]
      },
      connections: [
        {
          type: 'plumbing',
          diameter: 2,
          required: false,
          position: new THREE.Vector3(0, -2, 1.5),
          direction: new THREE.Vector3(0, -1, 0)
        }
      ],
      codes: {
        fireRating: 1,
        accessibility: false,
        clearanceRequired: true
      },
      relationships: [],
      visual: { color: '#FFFFFF', material: 'plastic' },
      lifecycle: { cost: 200, lifespan: 5, maintenanceInterval: 12 }
    })
  }

  private static registerSafetyModels() {
    // Fire Extinguisher
    this.models.set('fire-extinguisher', {
      id: 'fire-extinguisher',
      name: 'Fire Extinguisher',
      category: 'safety',
      subcategory: 'fire-safety',
      dimensions: { width: 0.5, height: 2, depth: 0.5, weight: 20 },
      placement: {
        surfaces: ['wall', 'floor'],
        orientation: 'fixed',
        clearances: { front: 3, back: 0, left: 1, right: 1, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0.25), type: 'center', normal: new THREE.Vector3(0, 0, 1) }
        ]
      },
      connections: [],
      codes: {
        fireRating: 0,
        accessibility: true,
        clearanceRequired: true,
        emergencyAccess: true
      },
      relationships: [],
      visual: { color: '#FF0000', material: 'metal' },
      lifecycle: { cost: 50, lifespan: 10, maintenanceInterval: 12 }
    })

    // Emergency Exit Sign
    this.models.set('exit-sign', {
      id: 'exit-sign',
      name: 'Emergency Exit Sign',
      category: 'safety',
      subcategory: 'signage',
      dimensions: { width: 1, height: 0.5, depth: 0.1, weight: 5 },
      placement: {
        surfaces: ['wall', 'ceiling'],
        orientation: 'fixed',
        clearances: { front: 0, back: 0, left: 0, right: 0, top: 0, bottom: 0 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0, 0.05), type: 'center', normal: new THREE.Vector3(0, 0, 1) }
        ]
      },
      connections: [
        {
          type: 'electrical',
          voltage: 120,
          amperage: 1,
          required: true,
          position: new THREE.Vector3(0, 0, -0.05),
          direction: new THREE.Vector3(0, 0, -1)
        }
      ],
      codes: {
        fireRating: 0,
        accessibility: true,
        clearanceRequired: false,
        emergencyAccess: true
      },
      relationships: [],
      operational: {
        powerConsumption: 5,
        heatGeneration: 0,
        noiseLevel: 0
      },
      visual: { color: '#00FF00', material: 'plastic', emissive: true },
      lifecycle: { cost: 25, lifespan: 10, maintenanceInterval: 24 }
    })
  }

  private static registerLightingModels() {
    // LED High Bay Light
    this.models.set('led-highbay', {
      id: 'led-highbay',
      name: 'LED High Bay Light',
      category: 'lighting',
      subcategory: 'industrial',
      dimensions: { width: 2, height: 1, depth: 2, weight: 30 },
      placement: {
        surfaces: ['ceiling', 'beam'],
        orientation: 'fixed',
        clearances: { front: 0, back: 0, left: 2, right: 2, top: 0, bottom: 8 },
        snapPoints: [
          { position: new THREE.Vector3(0, 0.5, 0), type: 'center', normal: new THREE.Vector3(0, 1, 0) }
        ]
      },
      connections: [
        {
          type: 'electrical',
          voltage: 120,
          amperage: 2,
          required: true,
          position: new THREE.Vector3(0, 0.5, 0),
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
        powerConsumption: 150,
        heatGeneration: 50,
        noiseLevel: 20,
        operatingTemperature: { min: -20, max: 104 }
      },
      visual: { color: '#C0C0C0', material: 'metal', emissive: true },
      lifecycle: { cost: 150, lifespan: 10, maintenanceInterval: 36, energyEfficiency: 'A+' }
    })
  }

  // Public methods
  static getModel(id: string): SemanticMetadata | undefined {
    return this.models.get(id)
  }

  static getAllModels(): Map<string, SemanticMetadata> {
    return new Map(this.models)
  }

  static getModelsByCategory(category: string): SemanticMetadata[] {
    return Array.from(this.models.values()).filter(model => model.category === category)
  }

  static getModelsBySubcategory(subcategory: string): SemanticMetadata[] {
    return Array.from(this.models.values()).filter(model => model.subcategory === subcategory)
  }

  static searchModels(query: string): SemanticMetadata[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.models.values()).filter(model => 
      model.name.toLowerCase().includes(lowerQuery) ||
      model.category.toLowerCase().includes(lowerQuery) ||
      (model.subcategory && model.subcategory.toLowerCase().includes(lowerQuery))
    )
  }

  static addCustomModel(model: SemanticMetadata) {
    this.models.set(model.id, model)
  }

  static removeModel(id: string): boolean {
    return this.models.delete(id)
  }

  static getModelCategories(): string[] {
    const categories = new Set<string>()
    this.models.forEach(model => categories.add(model.category))
    return Array.from(categories)
  }

  static getModelSubcategories(category?: string): string[] {
    const subcategories = new Set<string>()
    this.models.forEach(model => {
      if (!category || model.category === category) {
        if (model.subcategory) {
          subcategories.add(model.subcategory)
        }
      }
    })
    return Array.from(subcategories)
  }

  static getCompatibleModels(modelId: string): SemanticMetadata[] {
    const model = this.models.get(modelId)
    if (!model) return []

    const compatible: SemanticMetadata[] = []
    
    for (const otherModel of this.models.values()) {
      if (otherModel.id === modelId) continue

      // Check if models can connect
      const canConnect = model.connections.some(conn1 =>
        otherModel.connections.some(conn2 => conn1.type === conn2.type)
      )

      // Check if models have compatible relationships
      const hasRelationship = model.relationships.some(rel => 
        rel.targetId === otherModel.id || rel.targetId === otherModel.category
      )

      if (canConnect || hasRelationship) {
        compatible.push(otherModel)
      }
    }

    return compatible
  }
}

// Initialize the library
ModelLibrary.initialize()
