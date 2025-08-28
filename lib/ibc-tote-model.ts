import * as THREE from 'three'

/**
 * Advanced IBC Tote Model System
 * Creates photorealistic 330-gallon IBC Tote models with detailed geometry
 */

export interface IBCToteOptions {
  position?: THREE.Vector3
  rotation?: THREE.Euler
  showLiquid?: boolean
  liquidLevel?: number // 0-1 (0 = empty, 1 = full)
  liquidColor?: string
  labelText?: string
  weathered?: boolean
}

/**
 * Creates a highly detailed IBC Tote model
 * Dimensions: 48"×40"×46" (122×102×117 cm)
 */
export function createDetailedIBCTote(options: IBCToteOptions = {}): THREE.Group {
  const {
    position = new THREE.Vector3(0, 0, 0),
    rotation = new THREE.Euler(0, 0, 0),
    showLiquid = false,
    liquidLevel = 0.7,
    liquidColor = '#3b82f6',
    labelText = '330 GAL',
    weathered = false
  } = options

  const group = new THREE.Group()
  group.position.copy(position)
  group.rotation.copy(rotation)

  // Dimensions in feet to match warehouse scale
  // IBC Tote actual dimensions: 48"×40"×46" = 4'×3.33'×3.83'
  const tankWidth = 3.33   // 40" = 3.33 feet wide
  const tankDepth = 4.0    // 48" = 4 feet deep  
  const tankHeight = 3.1   // ~37" tank height in feet
  const totalHeight = 3.83 // 46" = 3.83 feet total height
  const palletHeight = 0.5 // 6" = 0.5 feet pallet

  // Materials with PBR properties
  const tankMaterial = new THREE.MeshPhysicalMaterial({ 
    color: weathered ? 0xd8d8d8 : 0xf0f0f0,
    transparent: true,
    opacity: showLiquid ? 0.85 : 0.95,
    roughness: weathered ? 0.6 : 0.3,
    metalness: 0.0,
    clearcoat: weathered ? 0.1 : 0.3,
    clearcoatRoughness: weathered ? 0.8 : 0.2,
    transmission: showLiquid ? 0.1 : 0,
    thickness: 0.05,
    envMapIntensity: 0.5
  })
  
  const cageMaterial = new THREE.MeshStandardMaterial({ 
    color: weathered ? 0x595959 : 0x666666,
    roughness: weathered ? 0.8 : 0.4,
    metalness: 0.9,
    envMapIntensity: 1.0
  })
  
  const palletMaterial = new THREE.MeshStandardMaterial({ 
    color: weathered ? 0x2a2a2a : 0x333333,
    roughness: 0.9,
    metalness: 0.1
  })

  const valveMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x1a1a1a,
    roughness: 0.3,
    metalness: 0.8
  })

  // Main tank - use simple box geometry for better control
  const tankGeometry = new THREE.BoxGeometry(tankWidth, tankHeight, tankDepth)
  const tank = new THREE.Mesh(tankGeometry, tankMaterial)
  tank.position.y = palletHeight + tankHeight/2  // Center the tank properly on pallet
  tank.castShadow = true
  tank.receiveShadow = true
  group.add(tank)

  // Liquid inside tank (if enabled)
  if (showLiquid && liquidLevel > 0) {
    const liquidHeight = tankHeight * liquidLevel * 0.95 // Slightly less than tank
    const liquidGeometry = new THREE.BoxGeometry(
      tankWidth * 0.96, 
      liquidHeight, 
      tankDepth * 0.96
    )
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(liquidColor),
      transparent: true,
      opacity: 0.8,
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.3,
      thickness: 0.5,
      envMapIntensity: 0.3
    })
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
    liquid.position.y = palletHeight + liquidHeight/2  // Liquid properly positioned inside tank
    group.add(liquid)
  }

  // Detailed pallet base with slats
  const palletGroup = new THREE.Group()
  
  // Main pallet deck
  const palletDeckGeometry = new THREE.BoxGeometry(tankWidth + 0.05, palletHeight * 0.4, tankDepth + 0.05)
  const palletDeck = new THREE.Mesh(palletDeckGeometry, palletMaterial)
  palletDeck.position.y = palletHeight * 0.7
  palletDeck.castShadow = true
  palletDeck.receiveShadow = true
  palletGroup.add(palletDeck)

  // Pallet slats
  const slatWidth = 0.3
  const slatCount = 7
  const slatSpacing = tankDepth / slatCount
  for (let i = 0; i < slatCount; i++) {
    const slatGeometry = new THREE.BoxGeometry(tankWidth + 0.15, palletHeight * 0.15, slatWidth)
    const slat = new THREE.Mesh(slatGeometry, palletMaterial)
    slat.position.set(0, palletHeight * 0.9, -tankDepth/2 + (i + 0.5) * slatSpacing)
    slat.castShadow = true
    palletGroup.add(slat)
  }

  // Pallet runners (3 support beams underneath)
  const runnerHeight = 0.25
  const runnerWidth = 0.4
  const runnerGeometry = new THREE.BoxGeometry(tankWidth + 0.15, runnerHeight, runnerWidth)
  
  const runnerPositions = [-tankDepth/3, 0, tankDepth/3]
  runnerPositions.forEach(zPos => {
    const runner = new THREE.Mesh(runnerGeometry, palletMaterial)
    runner.position.set(0, runnerHeight/2, zPos)
    runner.castShadow = true
    palletGroup.add(runner)
  })

  group.add(palletGroup)

  // Detailed metal cage frame
  const barRadius = 0.05 // Scaled up for feet
  const barSegments = 8
  
  // Vertical corner bars
  const cornerBarGeometry = new THREE.CylinderGeometry(barRadius, barRadius, totalHeight - palletHeight, barSegments)
  const corners = [
    [-tankWidth/2, -tankDepth/2],
    [tankWidth/2, -tankDepth/2],
    [-tankWidth/2, tankDepth/2],
    [tankWidth/2, tankDepth/2]
  ]

  corners.forEach(([x, z]) => {
    const bar = new THREE.Mesh(cornerBarGeometry, cageMaterial)
    bar.position.set(x, palletHeight + (totalHeight - palletHeight)/2, z)
    bar.castShadow = true
    group.add(bar)
  })

  // Mid-point vertical bars
  const midBarGeometry = new THREE.CylinderGeometry(barRadius * 0.9, barRadius * 0.9, totalHeight - palletHeight, barSegments)
  const midPoints = [
    [0, -tankDepth/2],
    [0, tankDepth/2],
    [-tankWidth/2, 0],
    [tankWidth/2, 0]
  ]

  midPoints.forEach(([x, z]) => {
    const bar = new THREE.Mesh(midBarGeometry, cageMaterial)
    bar.position.set(x, palletHeight + (totalHeight - palletHeight)/2, z)
    bar.castShadow = true
    group.add(bar)
  })

  // Horizontal cage bands (3 levels)
  const bandHeights = [0.3, 0.6, 0.9]
  const horizontalBarRadius = barRadius * 0.8
  
  bandHeights.forEach(heightRatio => {
    const height = palletHeight + heightRatio * (totalHeight - palletHeight)
    
    // Front and back horizontal bars
    const frontBackGeometry = new THREE.CylinderGeometry(
      horizontalBarRadius, 
      horizontalBarRadius, 
      tankWidth, 
      barSegments
    )
    
    ;[-tankDepth/2, tankDepth/2].forEach(z => {
      const bar = new THREE.Mesh(frontBackGeometry, cageMaterial)
      bar.rotation.z = Math.PI/2
      bar.position.set(0, height, z)
      bar.castShadow = true
      group.add(bar)
    })

    // Side horizontal bars
    const sideGeometry = new THREE.CylinderGeometry(
      horizontalBarRadius, 
      horizontalBarRadius, 
      tankDepth, 
      barSegments
    )
    
    ;[-tankWidth/2, tankWidth/2].forEach(x => {
      const bar = new THREE.Mesh(sideGeometry, cageMaterial)
      bar.rotation.x = Math.PI/2
      bar.position.set(x, height, 0)
      bar.castShadow = true
      group.add(bar)
    })

    // Diagonal cross-bracing on sides
    if (heightRatio === 0.6) {
      const diagonalLength = Math.sqrt(Math.pow(tankDepth, 2) + Math.pow(0.6, 2))
      const diagonalGeometry = new THREE.CylinderGeometry(
        horizontalBarRadius * 0.7,
        horizontalBarRadius * 0.7,
        diagonalLength,
        barSegments
      )

      // Left side diagonals
      const diagonal1 = new THREE.Mesh(diagonalGeometry, cageMaterial)
      diagonal1.position.set(-tankWidth/2, palletHeight + 0.45, 0)
      diagonal1.rotation.x = Math.atan2(0.6, tankDepth)
      group.add(diagonal1)

      const diagonal2 = new THREE.Mesh(diagonalGeometry, cageMaterial)
      diagonal2.position.set(-tankWidth/2, palletHeight + 0.45, 0)
      diagonal2.rotation.x = -Math.atan2(0.6, tankDepth)
      group.add(diagonal2)
    }
  })

   // Top frame reinforcement
  const topFrameThickness = 0.12
  const topFrameHeight = 0.09
  
  // Top frame bars
  const topFrameGeometry1 = new THREE.BoxGeometry(tankWidth + 0.09, topFrameHeight, topFrameThickness)
  const topFrame1 = new THREE.Mesh(topFrameGeometry1, cageMaterial)
  topFrame1.position.set(0, totalHeight - topFrameHeight/2, -tankDepth/2)
  topFrame1.castShadow = true
  group.add(topFrame1)

  const topFrame2 = new THREE.Mesh(topFrameGeometry1, cageMaterial)
  topFrame2.position.set(0, totalHeight - topFrameHeight/2, tankDepth/2)
  topFrame2.castShadow = true
  group.add(topFrame2)

  const topFrameGeometry2 = new THREE.BoxGeometry(topFrameThickness, topFrameHeight, tankDepth + 0.09)
  const topFrame3 = new THREE.Mesh(topFrameGeometry2, cageMaterial)
  topFrame3.position.set(-tankWidth/2, totalHeight - topFrameHeight/2, 0)
  topFrame3.castShadow = true
  group.add(topFrame3)

  const topFrame4 = new THREE.Mesh(topFrameGeometry2, cageMaterial)
  topFrame4.position.set(tankWidth/2, totalHeight - topFrameHeight/2, 0)
  topFrame4.castShadow = true
  group.add(topFrame4)

  // Top cap/fill port with detail
  const capGroup = new THREE.Group()
  
  // Main cap body
  const capBodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.12, 16)
  const capBody = new THREE.Mesh(capBodyGeometry, valveMaterial)
  capBody.castShadow = true
  capGroup.add(capBody)

  // Cap threads
  const threadGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.03, 16)
  const thread = new THREE.Mesh(threadGeometry, valveMaterial)
  thread.position.y = -0.045
  capGroup.add(thread)

  // Cap handle
  const handleGeometry = new THREE.TorusGeometry(0.18, 0.025, 8, 16)
  const handle = new THREE.Mesh(handleGeometry, valveMaterial)
  handle.rotation.x = Math.PI/2
  handle.position.y = 0.08
  capGroup.add(handle)

  capGroup.position.set(0.6, totalHeight + 0.06, 0.6)
  group.add(capGroup)

  // Valve assembly with butterfly valve detail
  const valveGroup = new THREE.Group()

  // Valve body
  const valveBodyGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.3, 12)
  const valveBody = new THREE.Mesh(valveBodyGeometry, valveMaterial)
  valveBody.rotation.x = Math.PI/2
  valveBody.castShadow = true
  valveGroup.add(valveBody)

  // Valve flange
  const flangeGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.03, 16)
  const flange = new THREE.Mesh(flangeGeometry, valveMaterial)
  flange.rotation.x = Math.PI/2
  flange.position.z = 0.135
  valveGroup.add(flange)

  // Valve handle stem
  const stemGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.25, 8)
  const stem = new THREE.Mesh(stemGeometry, valveMaterial)
  stem.position.y = 0.12
  valveGroup.add(stem)

  // Butterfly valve handle
  const handleLength = 0.4
  const handleGeometry2 = new THREE.BoxGeometry(handleLength, 0.05, 0.08)
  const valveHandle = new THREE.Mesh(handleGeometry2, valveMaterial)
  valveHandle.position.y = 0.25
  valveHandle.castShadow = true
  valveGroup.add(valveHandle)

  // Handle grip
  const gripGeometry = new THREE.CylinderGeometry(0.06, 0.055, 0.12, 8)
  const gripMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    roughness: 0.8,
    metalness: 0.1
  })
  const grip = new THREE.Mesh(gripGeometry, gripMaterial)
  grip.rotation.z = Math.PI/2
  grip.position.set(handleLength/2 - 0.06, 0.25, 0)
  valveGroup.add(grip)

  valveGroup.position.set(1.0, palletHeight + 0.5, tankDepth/2 - 0.06)
  group.add(valveGroup)

  // UN/DOT certification label
  const labelGroup = new THREE.Group()
  
  // Label backing plate
  const labelGeometry = new THREE.BoxGeometry(0.6, 0.45, 0.006)
  const labelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xffffff,
    roughness: 0.9,
    metalness: 0.0
  })
  const label = new THREE.Mesh(labelGeometry, labelMaterial)
  label.castShadow = true
  labelGroup.add(label)

  // Add text using a simple plane (in production, use TextGeometry or texture)
  const textPlaneGeometry = new THREE.PlaneGeometry(0.18, 0.03)
  const textMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    side: THREE.DoubleSide
  })
  
  // UN marking
  const unText = new THREE.Mesh(textPlaneGeometry, textMaterial)
  unText.position.set(0, 0.04, 0.002)
  unText.scale.set(0.5, 0.3, 1)
  labelGroup.add(unText)

  // Capacity text
  const capacityText = new THREE.Mesh(textPlaneGeometry, textMaterial)
  capacityText.position.set(0, 0, 0.002)
  labelGroup.add(capacityText)

  // Hazard diamond placeholder
  const diamondGeometry = new THREE.PlaneGeometry(0.05, 0.05)
  const diamondMaterial = new THREE.MeshStandardMaterial({
    color: 0xffaa00,
    side: THREE.DoubleSide
  })
  const diamond = new THREE.Mesh(diamondGeometry, diamondMaterial)
  diamond.rotation.z = Math.PI/4
  diamond.position.set(0, -0.04, 0.002)
  labelGroup.add(diamond)

  labelGroup.position.set(0, palletHeight + tankHeight * 0.6, tankDepth/2 + 0.003)
  group.add(labelGroup)

  // Optional weathering details
  if (weathered) {
    // Add rust spots or stains as small colored patches
    const stainCount = 5
    for (let i = 0; i < stainCount; i++) {
      const stainGeometry = new THREE.SphereGeometry(0.02 + Math.random() * 0.03, 8, 8)
      const stainMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.4 + Math.random() * 0.2, 0.2 + Math.random() * 0.1, 0.1),
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.3
      })
      const stain = new THREE.Mesh(stainGeometry, stainMaterial)
      stain.position.set(
        (Math.random() - 0.5) * tankWidth,
        palletHeight + Math.random() * tankHeight,
        tankDepth/2
      )
      stain.scale.set(2, 0.1, 2)
      group.add(stain)
    }
  }

  // Set up proper shadows for all meshes
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return group
}

/**
 * Creates a simplified IBC Tote for 2D floor plan view
 */
export function createSimpleIBCTote(): THREE.Group {
  const group = new THREE.Group()

  // Dimensions in feet (matching detailed model)
  const width = 3.33   // 40" = 3.33 feet
  const depth = 4.0    // 48" = 4 feet
  const height = 3.83  // 46" = 3.83 feet

  // Simple box representation
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({
    color: 0xe0e0e0,
    roughness: 0.7,
    metalness: 0.3
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = height/2  // Position from ground up
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)

  // Simple cage lines
  const edges = new THREE.EdgesGeometry(geometry)
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 })
  const lineSegments = new THREE.LineSegments(edges, lineMaterial)
  lineSegments.position.y = height/2
  group.add(lineSegments)

  return group
}

/**
 * Helper function to create IBC Tote element data for warehouse model
 */
export function createIBCToteElement(
  id: string,
  position: { x: number; y: number; z: number },
  options?: {
    rotation?: number
    liquidLevel?: number
    weathered?: boolean
  }
) {
  return {
    id,
    type: 'fixture' as const,
    position,
    dimensions: {
      width: 4,      // 48 inches = 4 feet
      height: 3.33,  // 40 inches = 3.33 feet
      depth: 3.83    // 46 inches = 3.83 feet
    },
    rotation: options?.rotation || 0,
    material: 'ibc_tote' as const,
    color: '#f0f0f0',
    metadata: {
      category: 'storage',
      equipment_type: 'ibc_tote',
      capacity_gallons: 330,
      liquid_level: options?.liquidLevel || 0,
      weathered: options?.weathered || false,
      material_tank: 'HDPE',
      material_cage: 'steel',
      description: '330 Gallon IBC Tote - Industrial Bulk Container'
    }
  }
}
