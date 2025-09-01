// REALISTIC PIPE TEST - Run in Browser Console
// This creates multiple pipe systems to showcase realistic colors and sizes

console.log('🚰 Creating realistic pipe system showcase...')

// Test different materials and sizes
const pipeConfigs = [
  {
    name: '3/4" PEX Cold Water Main',
    material: 'pex',
    systemType: 'cold_water',
    diameter: 0.75,
    color: '#0066CC', // Bright blue
    path: [
      { x: 0, y: 0, z: 8 },
      { x: 25, y: 0, z: 8 },
      { x: 25, y: 20, z: 8 }
    ]
  },
  {
    name: '1/2" PEX Hot Water Branch',
    material: 'pex', 
    systemType: 'hot_water',
    diameter: 0.5,
    color: '#DC143C', // Red
    path: [
      { x: 5, y: 5, z: 8 },
      { x: 15, y: 5, z: 8 },
      { x: 15, y: 15, z: 8 }
    ]
  },
  {
    name: '3/4" Copper Water Line',
    material: 'copper',
    systemType: 'cold_water', 
    diameter: 0.75,
    color: '#CD7F32', // True copper bronze
    path: [
      { x: 30, y: 0, z: 8 },
      { x: 40, y: 0, z: 8 },
      { x: 40, y: 10, z: 8 }
    ]
  },
  {
    name: '2" PVC Waste Line',
    material: 'pvc',
    systemType: 'waste',
    diameter: 2.0,
    color: '#F8F8FF', // White for waste
    path: [
      { x: 10, y: 25, z: 3 },
      { x: 20, y: 25, z: 3 },
      { x: 20, y: 35, z: 3 }
    ]
  }
]

// Function to add all test pipes
function addRealisticPipeShowcase() {
  if (!window.warehouseCAD?.addElement) {
    console.error('❌ warehouseCAD.addElement not available')
    return
  }

  pipeConfigs.forEach((config, index) => {
    const pipeElement = {
      type: 'pipe_system',
      position: { x: config.path[0].x, y: config.path[0].y, z: config.path[0].z },
      dimensions: { 
        width: Math.abs(config.path[config.path.length-1].x - config.path[0].x) || 10,
        height: Math.abs(config.path[config.path.length-1].y - config.path[0].y) || 10,
        depth: config.diameter / 12 
      },
      material: config.material,
      color: config.color,
      pipeData: {
        systemType: config.systemType,
        diameter: config.diameter,
        path: config.path
      },
      metadata: {
        pipeSystem: true,
        name: config.name,
        totalLength: calculatePathLength(config.path),
        fittingsCount: config.path.length - 1
      }
    }
    
    window.warehouseCAD.addElement(pipeElement)
    console.log(`✅ Added ${config.name}`)
  })
  
  console.log('🎉 Realistic pipe showcase complete!')
  console.log('🔍 Look for:')
  console.log('  • Blue PEX cold water (3/4")')
  console.log('  • Red PEX hot water (1/2")')  
  console.log('  • Bronze copper water (3/4")')
  console.log('  • White PVC waste (2")')
}

// Helper function
function calculatePathLength(path) {
  let length = 0
  for (let i = 0; i < path.length - 1; i++) {
    const dx = path[i+1].x - path[i].x
    const dy = path[i+1].y - path[i].y
    const dz = path[i+1].z - path[i].z
    length += Math.sqrt(dx*dx + dy*dy + dz*dz)
  }
  return length
}

// Auto-run the showcase
addRealisticPipeShowcase()

// Also expose for manual testing
window.addRealisticPipeShowcase = addRealisticPipeShowcase
