import * as THREE from 'three'
import { AdvancedWarehouseEngine } from '../core/AdvancedWarehouseEngine'
import { ModelLibrary } from '../models/ModelLibrary'
import { useAppStore } from '../store'

// Integration layer for existing WarehouseCAD application
export class WarehouseCADIntegration {
  private engine: AdvancedWarehouseEngine
  private scene: THREE.Scene
  private isInitialized = false

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    this.scene = scene
    this.engine = new AdvancedWarehouseEngine(scene, renderer)
    this.initializeModelLibrary()
  }

  private initializeModelLibrary() {
    // Ensure model library is initialized
    ModelLibrary.initialize()
    console.log('📚 Model Library initialized with', ModelLibrary.getAllModels().size, 'models')
  }

  // Initialize the engine with camera
  initialize(camera: THREE.Camera) {
    if (this.isInitialized) return

    this.engine.initialize(camera)
    this.isInitialized = true
    
    // Expose globally for AI commands
    ;(window as any).warehouseCAD = {
      ...((window as any).warehouseCAD || {}),
      engine: this.engine,
      integration: this,
      
      // AI Command Functions
      placeObject: this.aiPlaceObject.bind(this),
      createRoom: this.aiCreateRoom.bind(this),
      generateLayout: this.aiGenerateLayout.bind(this),
      optimizeLayout: this.aiOptimizeLayout.bind(this),
      validateCompliance: this.aiValidateCompliance.bind(this),
      analyzeLayout: this.aiAnalyzeLayout.bind(this),
      get2DPlan: this.aiGet2DPlan.bind(this),
      
      // Model Library Access
      getAvailableModels: () => Array.from(ModelLibrary.getAllModels().keys()),
      getModelInfo: (id: string) => ModelLibrary.getModel(id),
      searchModels: (query: string) => ModelLibrary.searchModels(query),
      
      // Performance and Stats
      getStats: () => this.engine.getStats(),
      getPerformanceStats: () => this.engine.getPerformanceManager().getStats()
    }

    console.log('🚀 WarehouseCAD Integration initialized')
    console.log('🤖 AI commands available:', Object.keys((window as any).warehouseCAD).filter(key => key.startsWith('ai') || ['placeObject', 'createRoom'].includes(key)))
  }

  // Update engine every frame
  update() {
    if (!this.isInitialized) return
    return this.engine.update()
  }

  // AI Command Implementations
  async aiPlaceObject(
    type: string,
    x: number,
    y: number,
    z: number = 0,
    options: any = {}
  ) {
    console.log(`🤖 AI Command: Place ${type} at (${x}, ${y}, ${z})`)
    
    try {
      const result = await this.engine.placeObjectIntelligently(type, { x, y, z }, {
        allowAutoPosition: true,
        enforceConstraints: true,
        snapToGrid: true,
        ...options
      })
      
      console.log('✅ Placement result:', result.success ? 'SUCCESS' : 'FAILED')
      if (!result.success) {
        console.log('❌ Errors:', result.errors)
        console.log('⚠️ Warnings:', result.warnings)
        console.log('💡 Suggestions:', result.suggestions)
      }
      
      return result
    } catch (error) {
      console.error('❌ AI placement failed:', error)
      return { success: false, error: (error as Error).message || 'Unknown error' }
    }
  }

  async aiCreateRoom(
    corners: Array<{ x: number; y: number; z?: number }>,
    options: any = {}
  ) {
    console.log(`🤖 AI Command: Create room with ${corners.length} corners`)
    
    try {
      const result = await this.engine.createRoomIntelligently(corners, {
        autoCorrectCorners: true,
        wallHeight: 8,
        includeFloor: true,
        ...options
      })
      
      console.log('✅ Room creation result:', result.success ? 'SUCCESS' : 'FAILED')
      return result
    } catch (error) {
      console.error('❌ AI room creation failed:', error)
      return { success: false, error: (error as Error).message || 'Unknown error' }
    }
  }

  async aiGenerateLayout(
    width: number,
    height: number,
    type: 'storage' | 'production' | 'mixed' = 'storage',
    requirements?: any
  ) {
    console.log(`🤖 AI Command: Generate ${type} layout ${width}x${height}`)
    
    try {
      const result = await this.engine.generateWarehouseLayout(width, height, type, requirements)
      
      console.log('✅ Layout generation result:', result.success ? 'SUCCESS' : 'FAILED')
      console.log('📊 Compliance score:', result.compliance.score)
      console.log('🎯 Confidence:', result.confidence)
      
      return result
    } catch (error) {
      console.error('❌ AI layout generation failed:', error)
      return { success: false, error: (error as Error).message || 'Unknown error' }
    }
  }

  async aiOptimizeLayout() {
    console.log('🤖 AI Command: Optimize current layout')
    
    try {
      const result = await this.engine.optimizeCurrentLayout()
      
      console.log('✅ Optimization result:', result.success ? 'SUCCESS' : 'FAILED')
      console.log('💡 Recommendations:', result.recommendations)
      
      return result
    } catch (error) {
      console.error('❌ AI optimization failed:', error)
      return { success: false, error: (error as Error).message || 'Unknown error' }
    }
  }

  async aiValidateCompliance(codes?: string[]) {
    console.log('🤖 AI Command: Validate compliance', codes || 'all codes')
    
    try {
      const result = await this.engine.validateCompliance(codes)
      
      console.log('✅ Compliance validation result:', result.success ? 'SUCCESS' : 'FAILED')
      console.log('📊 Compliance score:', result.compliance.score)
      console.log('⚠️ Issues found:', result.compliance.issues.length)
      
      return result
    } catch (error) {
      console.error('❌ AI compliance validation failed:', error)
      return { success: false, error: (error as Error).message || 'Unknown error' }
    }
  }

  async aiAnalyzeLayout() {
    console.log('🤖 AI Command: Analyze current layout')
    
    try {
      const result = await this.engine.analyzeCurrentLayout()
      
      console.log('✅ Analysis result:', result.success ? 'SUCCESS' : 'FAILED')
      console.log('📈 Analysis:', result.result.analysis)
      
      return result
    } catch (error) {
      console.error('❌ AI analysis failed:', error)
      return { success: false, error: (error as Error).message || 'Unknown error' }
    }
  }

  aiGet2DPlan() {
    console.log('🤖 AI Command: Get 2D floor plan')
    
    try {
      const floorPlan = this.engine.get2DFloorPlan()
      
      console.log('✅ 2D floor plan generated')
      console.log('📐 Plan stats:', this.engine.getFloorPlanEngine().getStats())
      
      return {
        success: true,
        floorPlan,
        stats: this.engine.getFloorPlanEngine().getStats()
      }
    } catch (error) {
      console.error('❌ 2D floor plan generation failed:', error)
      return { success: false, error: (error as Error).message || 'Unknown error' }
    }
  }

  // Integration with existing store
  syncWithAppStore() {
    const store = useAppStore.getState()
    
    // Sync current floorplan elements with engine
    if (store.currentFloorplan) {
      console.log('🔄 Syncing existing floorplan with engine...')
      
      // Convert existing elements to semantic objects
      for (const element of store.currentFloorplan.elements) {
        try {
          // This would need to be implemented based on existing element structure
          this.convertElementToSemanticObject(element)
        } catch (error) {
          console.warn('⚠️ Failed to convert element:', element.id, error)
        }
      }
    }
  }

  private convertElementToSemanticObject(element: any) {
    // Convert existing floorplan element to semantic object
    // This would need to map existing element types to model library types
    const modelType = this.mapElementTypeToModel(element.type)
    const model = ModelLibrary.getModel(modelType)
    
    if (model) {
      // Place object using engine
      this.engine.placeObjectIntelligently(
        modelType,
        { x: element.position.x, y: element.position.y, z: element.position.z || 0 },
        { enforceConstraints: false } // Don't enforce constraints for existing objects
      )
    }
  }

  private mapElementTypeToModel(elementType: string): string {
    // Map existing element types to model library types
    const typeMap: Record<string, string> = {
      'wall': 'wall-standard',
      'fixture': 'storage-rack',
      'equipment': 'storage-tank',
      'beam': 'steel-ibeam',
      'column': 'concrete-column'
    }
    
    return typeMap[elementType] || 'wall-standard'
  }

  // Cleanup
  dispose() {
    this.engine.dispose()
    this.isInitialized = false
    
    // Clean up global references
    if ((window as any).warehouseCAD?.engine === this.engine) {
      delete (window as any).warehouseCAD.engine
      delete (window as any).warehouseCAD.integration
    }
  }

  // Getters
  getEngine(): AdvancedWarehouseEngine {
    return this.engine
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

// Helper function to initialize integration in existing components
export function initializeWarehouseCAD(scene: THREE.Scene, camera: THREE.Camera, renderer?: THREE.WebGLRenderer) {
  const integration = new WarehouseCADIntegration(scene, renderer)
  integration.initialize(camera)
  integration.syncWithAppStore()
  
  return integration
}

// Demo functions for testing
export const demoCommands = {
  async createSampleWarehouse() {
    const warehouseCAD = (window as any).warehouseCAD
    if (!warehouseCAD) {
      console.error('❌ WarehouseCAD not initialized')
      return
    }

    console.log('🏭 Creating sample warehouse...')
    
    // Generate a complete warehouse layout
    const result = await warehouseCAD.generateLayout(200, 150, 'storage', {
      occupancy: 50,
      sprinklers: true,
      fireAlarm: true
    })
    
    if (result.success) {
      console.log('✅ Sample warehouse created successfully!')
      console.log('📊 Layout includes:', result.result.objects.length, 'objects')
      console.log('🎯 Confidence:', result.confidence + '%')
      console.log('📈 Compliance score:', result.compliance.score + '%')
    } else {
      console.error('❌ Failed to create sample warehouse')
    }
    
    return result
  },

  async placeStorageRacks() {
    const warehouseCAD = (window as any).warehouseCAD
    if (!warehouseCAD) {
      console.error('❌ WarehouseCAD not initialized')
      return
    }

    console.log('📦 Placing storage racks...')
    
    const positions = [
      { x: 20, y: 0, z: 20 },
      { x: 40, y: 0, z: 20 },
      { x: 60, y: 0, z: 20 },
      { x: 20, y: 0, z: 40 },
      { x: 40, y: 0, z: 40 },
      { x: 60, y: 0, z: 40 }
    ]

    const results = []
    for (const pos of positions) {
      const result = await warehouseCAD.placeObject('storage-rack', pos.x, pos.y, pos.z)
      results.push(result)
    }

    const successCount = results.filter(r => r.success).length
    console.log(`✅ Placed ${successCount}/${positions.length} storage racks`)
    
    return results
  },

  async createOfficeArea() {
    const warehouseCAD = (window as any).warehouseCAD
    if (!warehouseCAD) {
      console.error('❌ WarehouseCAD not initialized')
      return
    }

    console.log('🏢 Creating office area...')
    
    // Create office room
    const roomResult = await warehouseCAD.createRoom([
      { x: 150, y: 0, z: 10 },
      { x: 190, y: 0, z: 10 },
      { x: 190, y: 0, z: 40 },
      { x: 150, y: 0, z: 40 }
    ], { wallHeight: 10, includeFloor: true })

    if (roomResult.success) {
      // Add office furniture
      await warehouseCAD.placeObject('office-table', 170, 0, 25)
      await warehouseCAD.placeObject('office-chair', 168, 0, 25)
      await warehouseCAD.placeObject('office-chair', 172, 0, 25)
    }

    return roomResult
  },

  async runComplianceCheck() {
    const warehouseCAD = (window as any).warehouseCAD
    if (!warehouseCAD) {
      console.error('❌ WarehouseCAD not initialized')
      return
    }

    console.log('📋 Running compliance check...')
    
    const result = await warehouseCAD.validateCompliance(['ibc-2021', 'osha-general'])
    
    console.log('📊 Compliance Results:')
    console.log(`   Score: ${result.compliance.score}%`)
    console.log(`   Issues: ${result.compliance.issues.length}`)
    
    if (result.compliance.issues.length > 0) {
      console.log('⚠️ Issues found:')
      result.compliance.issues.forEach((issue: any, index: number) => {
        console.log(`   ${index + 1}. ${issue.description}`)
        console.log(`      Suggestion: ${issue.suggestion}`)
      })
    }
    
    return result
  },

  async optimizeCurrentLayout() {
    const warehouseCAD = (window as any).warehouseCAD
    if (!warehouseCAD) {
      console.error('❌ WarehouseCAD not initialized')
      return
    }

    console.log('⚡ Optimizing current layout...')
    
    const result = await warehouseCAD.optimizeLayout()
    
    console.log('💡 Optimization Suggestions:')
    result.recommendations.forEach((rec: string, index: number) => {
      console.log(`   ${index + 1}. ${rec}`)
    })
    
    return result
  }
}

// Expose demo commands globally
;(window as any).warehouseDemo = demoCommands
