import * as THREE from 'three'
import { WarehouseEngine } from '../core/WarehouseEngine'

/**
 * Demonstration of how to use the new WarehouseEngine for AI-driven placement
 * This shows the improved capabilities for complex renderings and accurate placement
 */

export async function demonstrateWarehouseEngine() {
  // Create a basic Three.js scene
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer()

  // Initialize the WarehouseEngine
  const engine = new WarehouseEngine(scene, renderer)
  engine.initialize(camera)

  console.log('🚀 WarehouseEngine Demo Starting...')
  console.log('📊 Engine Stats:', engine.getStats())

  // Example 1: AI-Assisted Object Placement
  console.log('\n=== AI-Assisted Object Placement ===')
  
  // Try to place a table - the engine will find the optimal position
  const tableResult = await engine.placeObjectIntelligently('table', 
    { x: 10, y: 0, z: 10 }, 
    { 
      allowAutoPosition: true,
      enforceConstraints: true,
      snapToGrid: true 
    }
  )
  
  console.log('Table placement result:', tableResult)

  // Place chairs around the table automatically
  const chairPositions = [
    { x: 8, y: 0, z: 10 },
    { x: 12, y: 0, z: 10 },
    { x: 10, y: 0, z: 8 },
    { x: 10, y: 0, z: 12 }
  ]

  for (const [index, pos] of chairPositions.entries()) {
    const chairResult = await engine.placeObjectIntelligently('chair', pos, {
      allowAutoPosition: true,
      enforceConstraints: true
    })
    console.log(`Chair ${index + 1} placement:`, chairResult.success ? '✅' : '❌')
  }

  // Example 2: Intelligent Room Creation
  console.log('\n=== Intelligent Room Creation ===')
  
  const roomCorners = [
    { x: 0, y: 0, z: 0 },
    { x: 20, y: 0, z: 0 },
    { x: 20, y: 0, z: 15 },
    { x: 0, y: 0, z: 15 }
  ]

  const roomResult = await engine.createRoomIntelligently(roomCorners, {
    wallHeight: 10,
    wallThickness: 0.5,
    includeFloor: true,
    autoCorrectCorners: true
  })

  console.log('Room creation result:', roomResult)

  // Example 3: Complex Warehouse Layout
  console.log('\n=== Complex Warehouse Layout ===')
  
  const warehouseLayout = {
    rooms: [
      {
        name: 'Storage Area A',
        corners: [
          { x: 0, y: 0, z: 0 },
          { x: 30, y: 0, z: 0 },
          { x: 30, y: 0, z: 20 },
          { x: 0, y: 0, z: 20 }
        ],
        furniture: [
          { type: 'storage-tank', position: { x: 10, y: 0, z: 10 } },
          { type: 'electrical-panel', position: { x: 2, y: 0, z: 2 } }
        ]
      },
      {
        name: 'Office Area',
        corners: [
          { x: 35, y: 0, z: 0 },
          { x: 50, y: 0, z: 0 },
          { x: 50, y: 0, z: 15 },
          { x: 35, y: 0, z: 15 }
        ],
        furniture: [
          { type: 'table', position: { x: 42, y: 0, z: 7 } },
          { type: 'chair', position: { x: 40, y: 0, z: 7 } },
          { type: 'chair', position: { x: 44, y: 0, z: 7 } }
        ]
      }
    ],
    corridors: [
      {
        start: { x: 30, y: 0, z: 10 },
        end: { x: 35, y: 0, z: 10 },
        width: 3
      }
    ]
  }

  const layoutResult = await engine.createWarehouseLayout(warehouseLayout)
  console.log('Warehouse layout result:', layoutResult)

  // Example 4: Performance Monitoring
  console.log('\n=== Performance Monitoring ===')
  
  // Simulate frame updates
  for (let i = 0; i < 10; i++) {
    const updateResult = engine.update()
    console.log(`Frame ${i + 1}:`, {
      visible: updateResult?.visibleObjects.length || 0,
      culled: updateResult?.culledObjects.length || 0,
      fps: updateResult?.stats.frameRate || 0
    })
    
    // Simulate some time passing
    await new Promise(resolve => setTimeout(resolve, 16)) // ~60fps
  }

  // Final stats
  console.log('\n=== Final Engine Stats ===')
  console.log(engine.getStats())

  // Example 5: Direct Command API Usage
  console.log('\n=== Direct Command API Usage ===')
  
  const commandAPI = engine.getCommandAPI()
  
  // Validate placement before committing
  const validation = commandAPI.validatePlacement('electrical-panel', { x: 5, y: 0, z: 5 })
  console.log('Validation result:', validation)
  
  if (validation.success) {
    const placement = commandAPI.placeObject('electrical-panel', { x: 5, y: 0, z: 5 })
    console.log('Direct placement result:', placement)
  }

  // Cleanup
  engine.dispose()
  
  console.log('\n🎉 WarehouseEngine Demo Complete!')
  
  return {
    tableResult,
    roomResult,
    layoutResult,
    finalStats: engine.getStats()
  }
}

// Example of how to integrate with existing ThreeRenderer
export function integrateWithExistingRenderer(scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) {
  const engine = new WarehouseEngine(scene, renderer)
  engine.initialize(camera)
  
  // In your render loop, call engine.update()
  const animate = () => {
    // Update engine systems
    const updateResult = engine.update()
    
    // Your existing render code
    renderer.render(scene, camera)
    
    // Optional: Display performance stats
    if (updateResult) {
      const stats = updateResult.stats
      if (stats.frameRate < 30) {
        console.warn('⚠️ Low FPS detected:', stats.frameRate)
      }
    }
    
    requestAnimationFrame(animate)
  }
  
  animate()
  
  // Expose engine globally for AI commands
  ;(window as any).warehouseEngine = engine
  
  return engine
}

// Example AI command function that can be called by Cursor AI
export async function aiPlaceObject(
  type: string, 
  x: number, 
  y: number, 
  z: number = 0,
  options: any = {}
) {
  const engine = (window as any).warehouseEngine as WarehouseEngine
  
  if (!engine) {
    console.error('❌ WarehouseEngine not initialized')
    return { success: false, error: 'Engine not initialized' }
  }
  
  console.log(`🤖 AI Command: Place ${type} at (${x}, ${y}, ${z})`)
  
  const result = await engine.placeObjectIntelligently(type, { x, y, z }, {
    allowAutoPosition: true,
    enforceConstraints: true,
    snapToGrid: true,
    ...options
  })
  
  console.log('🎯 AI Placement Result:', result)
  return result
}

// Example AI room creation function
export async function aiCreateRoom(
  corners: Array<{ x: number; y: number; z?: number }>,
  options: any = {}
) {
  const engine = (window as any).warehouseEngine as WarehouseEngine
  
  if (!engine) {
    console.error('❌ WarehouseEngine not initialized')
    return { success: false, error: 'Engine not initialized' }
  }
  
  console.log(`🤖 AI Command: Create room with ${corners.length} corners`)
  
  const result = await engine.createRoomIntelligently(corners, {
    autoCorrectCorners: true,
    wallHeight: 8,
    includeFloor: true,
    ...options
  })
  
  console.log('🏗️ AI Room Result:', result)
  return result
}
