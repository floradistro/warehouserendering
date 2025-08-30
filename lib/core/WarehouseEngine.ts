import * as THREE from 'three'
import { SpatialIndex } from '../spatial/SpatialIndex'
import { ConstraintSolver } from '../placement/ConstraintSolver'
import { CommandAPI } from '../commands/CommandAPI'
import { PerformanceManager } from './PerformanceManager'

// Main warehouse engine that coordinates all systems
export class WarehouseEngine {
  private spatialIndex: SpatialIndex
  private constraintSolver: ConstraintSolver
  private commandAPI: CommandAPI
  private performanceManager: PerformanceManager
  private scene: THREE.Scene
  private camera?: THREE.Camera
  private renderer?: THREE.WebGLRenderer

  // Engine state
  private isInitialized = false
  private bounds = new THREE.Box3(
    new THREE.Vector3(-500, -10, -500),
    new THREE.Vector3(500, 50, 500)
  )

  constructor(scene: THREE.Scene, renderer?: THREE.WebGLRenderer) {
    this.scene = scene
    this.renderer = renderer

    // Initialize core systems
    this.spatialIndex = new SpatialIndex(this.bounds)
    this.constraintSolver = new ConstraintSolver()
    this.commandAPI = new CommandAPI(this.spatialIndex, this.constraintSolver)
    this.performanceManager = new PerformanceManager(renderer)
  }

  // Initialize the engine
  initialize(camera: THREE.Camera) {
    this.camera = camera
    this.isInitialized = true
    
    console.log('🚀 WarehouseEngine initialized')
    console.log('📊 Spatial bounds:', this.bounds)
    console.log('🎯 Constraint solver ready with', this.constraintSolver.getConstraints().length, 'constraints')
  }

  // Update engine systems every frame
  update() {
    if (!this.isInitialized || !this.camera) return

    // Get all objects for performance optimization
    const allObjects = this.spatialIndex.getAllObjects().map(obj => ({
      id: obj.id,
      boundingBox: obj.boundingBox
    }))

    // Update performance systems
    const cullingResult = this.performanceManager.update(this.camera, allObjects)

    // Auto-optimize if performance is poor
    const stats = this.performanceManager.getStats()
    if (stats.frameRate < 30) {
      this.autoOptimize()
    }

    return {
      visibleObjects: cullingResult.visible,
      culledObjects: cullingResult.culled,
      stats
    }
  }

  // Auto-optimization based on performance
  private autoOptimize() {
    const optimization = this.performanceManager.optimizeScene(30)
    
    if (optimization.actions.includes('increase-lod-distances')) {
      // Automatically adjust LOD distances
      console.log('🔧 Auto-optimizing: Increasing LOD distances')
    }
    
    if (optimization.actions.includes('aggressive-culling')) {
      // Enable more aggressive culling
      console.log('🔧 Auto-optimizing: Enabling aggressive culling')
    }
  }

  // High-level AI commands
  async placeObjectIntelligently(
    type: string,
    preferredPosition: { x: number; y: number; z?: number },
    options: {
      allowAutoPosition?: boolean
      enforceConstraints?: boolean
      snapToGrid?: boolean
    } = {}
  ) {
    console.log(`🤖 AI Placement Request: ${type} at (${preferredPosition.x}, ${preferredPosition.y}, ${preferredPosition.z || 0})`)

    // Validate placement first
    const validation = this.commandAPI.validatePlacement(type, preferredPosition, {
      enforceConstraints: options.enforceConstraints !== false,
      snapToGrid: options.snapToGrid !== false
    })

    if (validation.success) {
      // Direct placement is valid
      const result = this.commandAPI.placeObject(type, preferredPosition, {
        enforceConstraints: options.enforceConstraints !== false,
        snapToGrid: options.snapToGrid !== false
      })
      
      console.log(`✅ Direct placement successful:`, result)
      return result
    }

    // If auto-positioning is allowed, find better location
    if (options.allowAutoPosition) {
      console.log(`🔍 Finding alternative position for ${type}...`)
      
      const alternativePosition = await this.findOptimalPosition(type, preferredPosition)
      if (alternativePosition) {
        const result = this.commandAPI.placeObject(type, alternativePosition, {
          enforceConstraints: true,
          snapToGrid: options.snapToGrid !== false
        })
        
        console.log(`✅ Alternative placement successful:`, result)
        return result
      }
    }

    console.log(`❌ Placement failed:`, validation)
    return validation
  }

  // Find optimal position for an object
  private async findOptimalPosition(
    type: string,
    preferredPosition: { x: number; y: number; z?: number }
  ): Promise<{ x: number; y: number; z: number } | null> {
    const searchRadius = 50
    const gridSize = 2
    const maxAttempts = 100
    
    const basePos = new THREE.Vector3(preferredPosition.x, preferredPosition.y, preferredPosition.z || 0)
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Spiral search pattern
      const angle = attempt * 0.618 * Math.PI * 2 // Golden angle
      const radius = Math.sqrt(attempt) * gridSize
      
      const testPosition = {
        x: basePos.x + Math.cos(angle) * radius,
        y: basePos.y,
        z: basePos.z + Math.sin(angle) * radius
      }
      
      // Snap to grid
      testPosition.x = Math.round(testPosition.x / gridSize) * gridSize
      testPosition.z = Math.round(testPosition.z / gridSize) * gridSize
      
      // Test this position
      const validation = this.commandAPI.validatePlacement(type, testPosition, {
        enforceConstraints: true,
        snapToGrid: true
      })
      
      if (validation.success) {
        console.log(`🎯 Found optimal position after ${attempt + 1} attempts:`, testPosition)
        return testPosition
      }
    }
    
    console.log(`❌ No valid position found after ${maxAttempts} attempts`)
    return null
  }

  // Create room with AI assistance
  async createRoomIntelligently(
    corners: Array<{ x: number; y: number; z?: number }>,
    options: {
      wallHeight?: number
      wallThickness?: number
      includeFloor?: boolean
      includeCeiling?: boolean
      autoCorrectCorners?: boolean
    } = {}
  ) {
    console.log(`🏗️ AI Room Creation: ${corners.length} corners`)

    let finalCorners = corners

    // Auto-correct corners if requested
    if (options.autoCorrectCorners) {
      finalCorners = this.correctRoomCorners(corners)
      console.log(`🔧 Corrected corners:`, finalCorners)
    }

    const result = this.commandAPI.createRoom(finalCorners, {
      wallHeight: options.wallHeight || 8,
      wallThickness: options.wallThickness || 0.5,
      includeFloor: options.includeFloor !== false,
      includeCeiling: options.includeCeiling || false
    })

    if (result.success) {
      console.log(`✅ Room created successfully:`, result)
      
      // Auto-suggest furniture placement
      const suggestions = await this.suggestFurniturePlacement(finalCorners)
      result.suggestions.push(...suggestions)
    }

    return result
  }

  // Correct room corners to ensure proper geometry
  private correctRoomCorners(corners: Array<{ x: number; y: number; z?: number }>) {
    // Simple corner correction - snap to grid and ensure minimum distances
    const gridSize = 1
    const minDistance = 3

    return corners.map((corner, index) => {
      const corrected = {
        x: Math.round(corner.x / gridSize) * gridSize,
        y: corner.y,
        z: Math.round((corner.z || 0) / gridSize) * gridSize
      }

      // Ensure minimum distance from previous corner
      if (index > 0) {
        const prev = corners[index - 1]
        const distance = Math.sqrt(
          Math.pow(corrected.x - prev.x, 2) + 
          Math.pow(corrected.z - (prev.z || 0), 2)
        )

        if (distance < minDistance) {
          // Adjust position to maintain minimum distance
          const angle = Math.atan2(corrected.z - (prev.z || 0), corrected.x - prev.x)
          corrected.x = prev.x + Math.cos(angle) * minDistance
          corrected.z = (prev.z || 0) + Math.sin(angle) * minDistance
        }
      }

      return corrected
    })
  }

  // Suggest furniture placement for a room
  private async suggestFurniturePlacement(
    corners: Array<{ x: number; y: number; z?: number }>
  ): Promise<string[]> {
    const suggestions: string[] = []

    // Calculate room bounds
    const bounds = new THREE.Box3()
    corners.forEach(corner => {
      bounds.expandByPoint(new THREE.Vector3(corner.x, corner.y, corner.z || 0))
    })

    const roomSize = bounds.getSize(new THREE.Vector3())
    const roomCenter = bounds.getCenter(new THREE.Vector3())

    // Suggest based on room size
    if (roomSize.x * roomSize.z > 100) { // Large room
      suggestions.push(`Consider placing a table at center (${roomCenter.x.toFixed(1)}, ${roomCenter.z.toFixed(1)})`)
      suggestions.push(`Add chairs around the perimeter for ${Math.floor(roomSize.x * roomSize.z / 20)} people`)
    } else if (roomSize.x * roomSize.z > 50) { // Medium room
      suggestions.push(`Place storage along the walls`)
      suggestions.push(`Central workspace table recommended`)
    } else { // Small room
      suggestions.push(`Compact furniture recommended`)
      suggestions.push(`Wall-mounted storage to save space`)
    }

    return suggestions
  }

  // Batch operations for complex layouts
  async createWarehouseLayout(layout: {
    rooms: Array<{
      name: string
      corners: Array<{ x: number; y: number; z?: number }>
      furniture?: Array<{ type: string; position: { x: number; y: number; z?: number } }>
    }>
    corridors?: Array<{
      start: { x: number; y: number; z?: number }
      end: { x: number; y: number; z?: number }
      width: number
    }>
  }) {
    console.log(`🏭 Creating warehouse layout with ${layout.rooms.length} rooms`)

    const results = {
      rooms: [] as any[],
      furniture: [] as any[],
      corridors: [] as any[],
      totalObjects: 0,
      errors: [] as string[],
      warnings: [] as string[]
    }

    // Create rooms
    for (const room of layout.rooms) {
      try {
        const roomResult = await this.createRoomIntelligently(room.corners, {
          autoCorrectCorners: true
        })

        results.rooms.push({
          name: room.name,
          result: roomResult
        })

        if (roomResult.success) {
          results.totalObjects += roomResult.objectIds.length
        } else {
          results.errors.push(`Failed to create room ${room.name}`)
        }

        // Add furniture if specified
        if (room.furniture) {
          for (const furniture of room.furniture) {
            const furnitureResult = await this.placeObjectIntelligently(
              furniture.type,
              furniture.position,
              { allowAutoPosition: true }
            )

            results.furniture.push({
              room: room.name,
              type: furniture.type,
              result: furnitureResult
            })

            if (furnitureResult.success) {
              results.totalObjects += furnitureResult.objectIds.length
            }
          }
        }

      } catch (error) {
        results.errors.push(`Error creating room ${room.name}: ${error}`)
      }
    }

    // Create corridors
    if (layout.corridors) {
      for (const corridor of layout.corridors) {
        try {
          // Create corridor as a series of walls
          const corridorResult = this.commandAPI.placeWall(corridor.start, corridor.end, {
            thickness: corridor.width,
            height: 8
          })

          results.corridors.push(corridorResult)

          if (corridorResult.success) {
            results.totalObjects += corridorResult.objectIds.length
          }

        } catch (error) {
          results.errors.push(`Error creating corridor: ${error}`)
        }
      }
    }

    console.log(`✅ Warehouse layout complete: ${results.totalObjects} objects created`)
    if (results.errors.length > 0) {
      console.log(`❌ Errors:`, results.errors)
    }

    return results
  }

  // Get engine statistics
  getStats() {
    return {
      spatial: this.spatialIndex.getStats(),
      performance: this.performanceManager.getStats(),
      constraints: this.constraintSolver.getConstraints().length,
      objects: this.commandAPI.getAllObjects().length,
      isInitialized: this.isInitialized
    }
  }

  // Get command API for direct access
  getCommandAPI(): CommandAPI {
    return this.commandAPI
  }

  // Get spatial index for direct access
  getSpatialIndex(): SpatialIndex {
    return this.spatialIndex
  }

  // Get performance manager
  getPerformanceManager(): PerformanceManager {
    return this.performanceManager
  }

  // Cleanup
  dispose() {
    this.spatialIndex.clear()
    this.performanceManager.dispose()
    this.isInitialized = false
  }
}
