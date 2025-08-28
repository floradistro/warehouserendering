import * as THREE from 'three'

/**
 * Advanced Spiral Feeder Tank Model System
 * Creates photorealistic 1000-gallon Spiral Feeder Tank models
 */

export interface SpiralFeederTankOptions {
  position?: THREE.Vector3
  rotation?: THREE.Euler
  showFillLevel?: boolean
  fillLevel?: number // 0-1 (0 = empty, 1 = full)
  fillColor?: string
  labelText?: string
  weathered?: boolean
}

/**
 * Creates a detailed 1000-gallon Spiral Feeder Tank model
 * Typical dimensions: ~6ft diameter x 8ft height
 */
export function createDetailedSpiralFeederTank(options: SpiralFeederTankOptions = {}): THREE.Group {
  const {
    position = new THREE.Vector3(0, 0, 0),
    rotation = new THREE.Euler(0, 0, 0),
    showFillLevel = false,
    fillLevel = 0.7,
    fillColor = '#8B4513', // Brown for feed material
    labelText = '1000 GAL',
    weathered = false
  } = options

  const group = new THREE.Group()
  group.position.copy(position)
  group.rotation.copy(rotation)

  // Materials with PBR properties
  const tankMaterial = new THREE.MeshPhysicalMaterial({ 
    color: weathered ? 0xd8d8d8 : 0xf0f0f0,
    roughness: weathered ? 0.6 : 0.3,
    metalness: 0.8,
    clearcoat: weathered ? 0.1 : 0.3,
    clearcoatRoughness: weathered ? 0.8 : 0.2,
    envMapIntensity: 0.5
  })
  
  const coneBottomMaterial = new THREE.MeshPhysicalMaterial({ 
    color: weathered ? 0xc8c8c8 : 0xe0e0e0,
    roughness: weathered ? 0.7 : 0.4,
    metalness: 0.8,
    envMapIntensity: 0.5
  })
  
  const spiralMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x444444,
    roughness: 0.8,
    metalness: 0.9
  })

  const supportMaterial = new THREE.MeshStandardMaterial({ 
    color: weathered ? 0x555555 : 0x666666,
    roughness: 0.9,
    metalness: 0.7
  })

  const valveMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.4,
    metalness: 0.8
  })

  // Dimensions in feet (scaled for warehouse)
  const tankRadius = 3;         // 6ft diameter = 3ft radius
  const tankHeight = 7;         // 7ft cylindrical height
  const coneHeight = 2;         // 2ft cone height
  const totalHeight = tankHeight + coneHeight
  const supportHeight = 1.67    // ~20" leg height
  
  // Main cylindrical tank body
  const tankGeometry = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 32)
  const tank = new THREE.Mesh(tankGeometry, tankMaterial)
  tank.position.y = supportHeight + coneHeight + tankHeight/2
  tank.castShadow = true
  tank.receiveShadow = true
  group.add(tank)

  // Conical bottom
  const coneGeometry = new THREE.ConeGeometry(tankRadius, coneHeight, 32)
  const cone = new THREE.Mesh(coneGeometry, coneBottomMaterial)
  cone.position.y = supportHeight + coneHeight/2
  cone.castShadow = true
  cone.receiveShadow = true
  group.add(cone)

  // Tank top (flat lid with slight dome)
  const topGeometry = new THREE.CylinderGeometry(tankRadius + 0.06, tankRadius + 0.06, 0.15, 32)
  const top = new THREE.Mesh(topGeometry, tankMaterial)
  top.position.y = supportHeight + coneHeight + tankHeight + 0.075
  top.castShadow = true
  group.add(top)

  // Fill port on top
  const fillPortGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16)
  const fillPort = new THREE.Mesh(fillPortGeometry, valveMaterial)
  fillPort.position.set(1, supportHeight + coneHeight + tankHeight + 0.3, 1)
  fillPort.castShadow = true
  group.add(fillPort)

  // Fill port lid with handle
  const fillLidGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16)
  const fillLid = new THREE.Mesh(fillLidGeometry, valveMaterial)
  fillLid.position.set(1, supportHeight + coneHeight + tankHeight + 0.35, 1)
  fillLid.castShadow = true
  group.add(fillLid)

  // Lid handle
  const handleGeometry = new THREE.TorusGeometry(0.3, 0.05, 8, 16)
  const handle = new THREE.Mesh(handleGeometry, valveMaterial)
  handle.rotation.x = Math.PI/2
  handle.position.set(1, supportHeight + coneHeight + tankHeight + 0.45, 1)
  group.add(handle)

  // Support legs (4 heavy-duty legs)
  const legRadius = 0.15
  const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius * 1.2, supportHeight, 8)
  
  const legPositions = [
    [tankRadius * 0.7, 0, tankRadius * 0.7],
    [-tankRadius * 0.7, 0, tankRadius * 0.7],
    [tankRadius * 0.7, 0, -tankRadius * 0.7],
    [-tankRadius * 0.7, 0, -tankRadius * 0.7]
  ]

  legPositions.forEach(pos => {
    const leg = new THREE.Mesh(legGeometry, supportMaterial)
    leg.position.set(pos[0], supportHeight/2, pos[2])
    leg.castShadow = true
    leg.receiveShadow = true
    group.add(leg)

    // Foot pads
    const footGeometry = new THREE.CylinderGeometry(legRadius * 1.5, legRadius * 1.5, 0.1, 8)
    const foot = new THREE.Mesh(footGeometry, supportMaterial)
    foot.position.set(pos[0], 0.05, pos[2])
    foot.castShadow = true
    group.add(foot)
  })

  // Support ring around cone
  const supportRingGeometry = new THREE.TorusGeometry(tankRadius * 0.8, 0.1, 8, 32)
  const supportRing = new THREE.Mesh(supportRingGeometry, supportMaterial)
  supportRing.position.y = supportHeight + coneHeight * 0.3
  supportRing.rotation.x = Math.PI/2
  supportRing.castShadow = true
  group.add(supportRing)

  // Cross braces between legs
  const braceRadius = 0.08
  const braceLength = tankRadius * 1.4 * Math.sqrt(2)
  const braceGeometry = new THREE.CylinderGeometry(braceRadius, braceRadius, braceLength, 8)
  
  // X-pattern braces
  const brace1 = new THREE.Mesh(braceGeometry, supportMaterial)
  brace1.rotation.z = Math.PI/4
  brace1.rotation.y = Math.PI/4
  brace1.position.y = supportHeight * 0.3
  brace1.castShadow = true
  group.add(brace1)

  const brace2 = new THREE.Mesh(braceGeometry, supportMaterial)
  brace2.rotation.z = -Math.PI/4
  brace2.rotation.y = Math.PI/4
  brace2.position.y = supportHeight * 0.3
  brace2.castShadow = true
  group.add(brace2)

  // Internal spiral auger (visible indication)
  const spiralRadius = 0.06
  const spiralTurns = 8
  const spiralPoints = []
  const spiralHeight = tankHeight * 0.8
  
  for (let i = 0; i <= spiralTurns * 32; i++) {
    const angle = (i / 32) * 2 * Math.PI
    const y = (i / (spiralTurns * 32)) * spiralHeight
    const radius = tankRadius * 0.3 * (1 - y / spiralHeight * 0.5)
    
    spiralPoints.push(new THREE.Vector3(
      Math.cos(angle) * radius,
      supportHeight + coneHeight + y,
      Math.sin(angle) * radius
    ))
  }
  
  const spiralCurve = new THREE.CatmullRomCurve3(spiralPoints)
  const spiralTubeGeometry = new THREE.TubeGeometry(spiralCurve, spiralTurns * 32, spiralRadius, 8)
  const spiralTube = new THREE.Mesh(spiralTubeGeometry, spiralMaterial)
  spiralTube.castShadow = true
  group.add(spiralTube)

  // Central feed tube (vertical)
  const centralTubeGeometry = new THREE.CylinderGeometry(0.25, 0.25, tankHeight, 16)
  const centralTube = new THREE.Mesh(centralTubeGeometry, spiralMaterial)
  centralTube.position.y = supportHeight + coneHeight + tankHeight/2
  centralTube.castShadow = true
  group.add(centralTube)

  // Feed motor housing on top
  const motorHousingGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1, 16)
  const motorHousing = new THREE.Mesh(motorHousingGeometry, valveMaterial)
  motorHousing.position.y = supportHeight + coneHeight + tankHeight + 0.6
  motorHousing.castShadow = true
  group.add(motorHousing)

  // Motor mounting bracket
  const bracketGeometry = new THREE.BoxGeometry(1.5, 0.15, 1.5)
  const bracket = new THREE.Mesh(bracketGeometry, supportMaterial)
  bracket.position.y = supportHeight + coneHeight + tankHeight + 0.225
  bracket.castShadow = true
  group.add(bracket)

  // Outlet valve at cone bottom
  const outletGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.4, 12)
  const outlet = new THREE.Mesh(outletGeometry, valveMaterial)
  outlet.position.y = supportHeight - 0.2
  outlet.rotation.x = Math.PI/2
  outlet.castShadow = true
  group.add(outlet)

  // Outlet valve handle
  const valveHandleGeometry = new THREE.BoxGeometry(0.5, 0.06, 0.06)
  const valveHandle = new THREE.Mesh(valveHandleGeometry, valveMaterial)
  valveHandle.position.set(0, supportHeight - 0.2, 0.25)
  valveHandle.castShadow = true
  group.add(valveHandle)

  // Handle grip
  const gripGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8)
  const gripMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    roughness: 0.8,
    metalness: 0.1
  })
  const grip = new THREE.Mesh(gripGeometry, gripMaterial)
  grip.rotation.z = Math.PI/2
  grip.position.set(0.25, supportHeight - 0.2, 0.25)
  group.add(grip)

  // Level indicator on side
  const indicatorGeometry = new THREE.BoxGeometry(0.3, 1.2, 0.06)
  const indicator = new THREE.Mesh(indicatorGeometry, valveMaterial)
  indicator.position.set(tankRadius + 0.03, supportHeight + coneHeight + tankHeight * 0.6, 0)
  indicator.castShadow = true
  group.add(indicator)

  // Sight glass
  const sightGlassGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 16)
  const sightGlassMaterial = new THREE.MeshPhysicalMaterial({ 
    color: 0xaaffff,
    transparent: true,
    opacity: 0.6,
    transmission: 0.5,
    thickness: 0.1,
    roughness: 0.1,
    metalness: 0.0
  })
  const sightGlass = new THREE.Mesh(sightGlassGeometry, sightGlassMaterial)
  sightGlass.rotation.z = Math.PI/2
  sightGlass.position.set(tankRadius + 0.06, supportHeight + coneHeight + tankHeight * 0.6, 0)
  group.add(sightGlass)

  // Fill level indicator (if showing)
  if (showFillLevel && fillLevel > 0) {
    const levelHeight = tankHeight * fillLevel * 0.8
    const levelGeometry = new THREE.CylinderGeometry(0.08, 0.08, levelHeight, 16)
    const levelMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(fillColor),
      roughness: 0.8
    })
    const level = new THREE.Mesh(levelGeometry, levelMaterial)
    level.rotation.z = Math.PI/2
    level.position.set(
      tankRadius + 0.06, 
      supportHeight + coneHeight + levelHeight/2, 
      0
    )
    group.add(level)
  }

  // Access ladder
  const ladderHeight = totalHeight + supportHeight - 1
  const rungCount = Math.floor(ladderHeight / 1)
  
  for (let i = 0; i < rungCount; i++) {
    const rungGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8)
    const rung = new THREE.Mesh(rungGeometry, supportMaterial)
    rung.rotation.z = Math.PI/2
    rung.position.set(tankRadius * 0.8, supportHeight + i * 1, -tankRadius)
    rung.castShadow = true
    group.add(rung)
  }

  // Ladder side rails
  const railGeometry = new THREE.CylinderGeometry(0.06, 0.06, ladderHeight, 8)
  const rail1 = new THREE.Mesh(railGeometry, supportMaterial)
  rail1.position.set(tankRadius * 0.4, supportHeight + ladderHeight/2, -tankRadius)
  rail1.castShadow = true
  group.add(rail1)

  const rail2 = new THREE.Mesh(railGeometry, supportMaterial)
  rail2.position.set(tankRadius * 1.2, supportHeight + ladderHeight/2, -tankRadius)
  rail2.castShadow = true
  group.add(rail2)

  // Tank label/nameplate
  const labelGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.015)
  const labelMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x0066cc,
    roughness: 0.3,
    metalness: 0.5
  })
  const label = new THREE.Mesh(labelGeometry, labelMaterial)
  label.position.set(0, supportHeight + coneHeight + tankHeight * 0.3, tankRadius + 0.006)
  label.castShadow = true
  group.add(label)

  // Safety rail around top
  const railingGeometry = new THREE.TorusGeometry(tankRadius + 0.3, 0.06, 8, 32)
  const railing = new THREE.Mesh(railingGeometry, supportMaterial)
  railing.position.y = supportHeight + coneHeight + tankHeight + 0.3
  railing.castShadow = true
  group.add(railing)

  // Railing posts
  const postGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 8)
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const post = new THREE.Mesh(postGeometry, supportMaterial)
    post.position.set(
      Math.cos(angle) * (tankRadius + 0.3),
      supportHeight + coneHeight + tankHeight + 0.55,
      Math.sin(angle) * (tankRadius + 0.3)
    )
    post.castShadow = true
    group.add(post)
  }

  // Optional weathering effects
  if (weathered) {
    // Add rust spots
    const rustCount = 5
    for (let i = 0; i < rustCount; i++) {
      const rustGeometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.15, 8, 8)
      const rustMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(0.5 + Math.random() * 0.2, 0.3 + Math.random() * 0.1, 0.1),
        roughness: 1.0,
        metalness: 0.0,
        transparent: true,
        opacity: 0.4
      })
      const rust = new THREE.Mesh(rustGeometry, rustMaterial)
      const angle = Math.random() * Math.PI * 2
      rust.position.set(
        Math.cos(angle) * tankRadius,
        supportHeight + coneHeight + Math.random() * tankHeight,
        Math.sin(angle) * tankRadius
      )
      rust.scale.set(3, 0.2, 3)
      group.add(rust)
    }
  }

  return group
}

/**
 * Creates a simplified Spiral Feeder Tank for 2D floor plan view
 */
export function createSimpleSpiralFeederTank(): THREE.Group {
  const group = new THREE.Group()

  // Dimensions in feet
  const diameter = 6
  const height = 10.67 // Total height including support

  // Simple cylinder representation
  const geometry = new THREE.CylinderGeometry(diameter/2, diameter/2, height, 16)
  const material = new THREE.MeshStandardMaterial({
    color: 0xf0f0f0,
    roughness: 0.5,
    metalness: 0.7
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.y = height/2
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)

  // Simple edge lines
  const edges = new THREE.EdgesGeometry(geometry)
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0x666666 })
  const lineSegments = new THREE.LineSegments(edges, lineMaterial)
  lineSegments.position.y = height/2
  group.add(lineSegments)

  return group
}

/**
 * Helper function to create Spiral Feeder Tank element data for warehouse model
 */
export function createSpiralFeederTankElement(
  id: string,
  position: { x: number; y: number; z: number },
  options?: {
    rotation?: number
    fillLevel?: number
    weathered?: boolean
  }
) {
  return {
    id,
    type: 'fixture' as const,
    position,
    dimensions: {
      width: 6,      // 6 feet diameter
      height: 6,     // 6 feet footprint (circular)
      depth: 10.67   // 10.67 feet total height
    },
    rotation: options?.rotation || 0,
    material: 'spiral_feeder_tank' as const,
    color: '#f0f0f0',
    metadata: {
      category: 'storage',
      equipment_type: 'spiral_feeder_tank',
      capacity_gallons: 1000,
      fill_level: options?.fillLevel || 0,
      weathered: options?.weathered || false,
      material_tank: 'steel',
      feed_system: 'spiral_auger',
      description: '1000 Gallon Spiral Feeder Tank - Automated Feed Distribution System'
    }
  }
}
