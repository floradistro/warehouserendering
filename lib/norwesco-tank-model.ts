import * as THREE from 'three'

/**
 * Norwesco 40152 - 1000 Gallon Vertical Storage Tank
 * Exact model matching the NTO Tank website image
 * Dimensions: 64" diameter × 80" height
 */

interface NorwescoTankOptions {
  showLiquid?: boolean
  liquidLevel?: number // 0-1, percentage of tank filled
}

/**
 * Creates a detailed 3D model of the Norwesco 1000 gallon tank
 * Includes all visual details from the reference image
 */
export function createDetailedNorwescoTank(options: NorwescoTankOptions = {}): THREE.Group {
  const { showLiquid = false, liquidLevel = 0 } = options
  const group = new THREE.Group()

  // Convert dimensions from inches to feet (matching the warehouse scale)
  // The warehouse uses feet as the base unit, not meters
  const tankRadius = 64 / 2 / 12  // 64" diameter = 32" radius = 2.67 feet
  const tankHeight = 80 / 12      // 80" height = 6.67 feet

  // Materials
  const tankMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xe8e8e8,  // Light gray/white like in image
    shininess: 30,
    transparent: false
  })
  
  const blackMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x1a1a1a,  // Dark black for lid
    shininess: 20
  })

  const fittingMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,  // Dark gray for fitting
    shininess: 40
  })

  const markingMaterial = new THREE.MeshPhongMaterial({ 
    color: 0xd0d0d0,  // Slightly darker for molded markings
    transparent: true,
    opacity: 0.3
  })

  // Main cylindrical tank body - perfectly cylindrical like in image
  const tankGeometry = new THREE.CylinderGeometry(tankRadius, tankRadius, tankHeight, 64)
  const tank = new THREE.Mesh(tankGeometry, tankMaterial)
  tank.position.y = tankHeight / 2
  tank.castShadow = true
  tank.receiveShadow = true
  group.add(tank)

  // Flat bottom
  const bottomGeometry = new THREE.CylinderGeometry(tankRadius, tankRadius, 0.02, 64)
  const bottom = new THREE.Mesh(bottomGeometry, tankMaterial)
  bottom.position.y = 0.01
  bottom.castShadow = true
  bottom.receiveShadow = true
  group.add(bottom)

  // Slightly rounded top shoulder (like in image)
  const shoulderHeight = 6 / 12  // 6" shoulder = 0.5 feet
  const shoulderGeometry = new THREE.CylinderGeometry(tankRadius * 0.5, tankRadius, shoulderHeight, 64)
  const shoulder = new THREE.Mesh(shoulderGeometry, tankMaterial)
  shoulder.position.y = tankHeight + shoulderHeight / 2
  shoulder.castShadow = true
  shoulder.receiveShadow = true
  group.add(shoulder)

  // Top cap area (narrower like in image - 16" manway)
  const capRadius = 16 / 2 / 12  // 16" manway = 8" radius = 0.67 feet
  const capHeight = 8 / 12  // 8" height = 0.67 feet
  const capGeometry = new THREE.CylinderGeometry(capRadius, capRadius, capHeight, 32)
  const cap = new THREE.Mesh(capGeometry, tankMaterial)
  cap.position.y = tankHeight + shoulderHeight + capHeight / 2
  cap.castShadow = true
  cap.receiveShadow = true
  group.add(cap)

  // Black lid on top (like in image - simple and flat)
  const lidRadius = capRadius * 0.9
  const lidThickness = 2 / 12  // 2" thick lid = 0.167 feet
  const lidGeometry = new THREE.CylinderGeometry(lidRadius, lidRadius, lidThickness, 32)
  const lid = new THREE.Mesh(lidGeometry, blackMaterial)
  lid.position.y = tankHeight + shoulderHeight + capHeight + lidThickness / 2
  lid.castShadow = true
  lid.receiveShadow = true
  group.add(lid)

  // Two black handles/latches on lid (visible in image)
  const handleGeometry = new THREE.BoxGeometry(4/12, 1/12, 2/12)  // 4" x 1" x 2" handles
  const handleYPosition = tankHeight + shoulderHeight + capHeight + lidThickness + 0.5/12  // Slightly above lid
  const handle1 = new THREE.Mesh(handleGeometry, blackMaterial)
  handle1.position.set(lidRadius * 0.6, handleYPosition, 0)
  handle1.castShadow = true
  group.add(handle1)

  const handle2 = new THREE.Mesh(handleGeometry, blackMaterial)
  handle2.position.set(-lidRadius * 0.6, handleYPosition, 0)
  handle2.castShadow = true
  group.add(handle2)

  // Bottom outlet fitting (dark gray, hexagonal like in image)
  const fittingRadius = 2 / 12  // 2" diameter fitting = 0.167 feet
  const fittingHeight = 3 / 12  // 3" height = 0.25 feet
  const fittingGeometry = new THREE.CylinderGeometry(fittingRadius, fittingRadius, fittingHeight, 6)
  const fitting = new THREE.Mesh(fittingGeometry, fittingMaterial)
  fitting.position.set(0, fittingHeight / 2, 0)
  fitting.castShadow = true
  group.add(fitting)

  // Minimal gallon markings (subtle lines like would be molded in)
  for (let i = 1; i <= 4; i++) {
    const markingGeometry = new THREE.CylinderGeometry(
      tankRadius + 0.001, 
      tankRadius + 0.001, 
      0.003, 
      64
    )
    const marking = new THREE.Mesh(markingGeometry, markingMaterial)
    marking.position.y = (tankHeight * i) / 5
    group.add(marking)
  }

  // Liquid inside tank (if specified)
  if (showLiquid && liquidLevel > 0) {
    const liquidHeight = tankHeight * Math.min(liquidLevel, 0.95) // Cap at 95% to show it's not overflowing
    const liquidMaterial = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.7,
      shininess: 100
    })
    
    const liquidGeometry = new THREE.CylinderGeometry(
      tankRadius * 0.98, // Slightly smaller than tank
      tankRadius * 0.98,
      liquidHeight,
      32
    )
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial)
    liquid.position.y = liquidHeight / 2
    group.add(liquid)
  }

  return group
}

/**
 * Creates a simplified 2D representation of the Norwesco tank
 * Used for top-down views and performance optimization
 */
export function createSimpleNorwescoTank(): THREE.Group {
  const group = new THREE.Group()

  // Simple cylinder for 2D view - using correct scale in feet
  const tankRadius = 64 / 2 / 12  // 2.67 feet radius
  const geometry = new THREE.CylinderGeometry(tankRadius, tankRadius, 0.1, 32)
  const material = new THREE.MeshBasicMaterial({ 
    color: 0xe8e8e8,
    opacity: 0.9,
    transparent: true
  })
  const tank = new THREE.Mesh(geometry, material)
  tank.position.y = 0.05
  group.add(tank)

  // Center fitting indicator
  const fittingGeometry = new THREE.CylinderGeometry(2/12, 2/12, 0.11, 6)  // 2" fitting
  const fittingMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 })
  const fitting = new THREE.Mesh(fittingGeometry, fittingMaterial)
  fitting.position.y = 0.055
  group.add(fitting)

  // Capacity label (visible from top)
  const labelGeometry = new THREE.PlaneGeometry(0.5, 0.2)
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = '#e8e8e8'
    context.fillRect(0, 0, 256, 128)
    context.fillStyle = '#333333'
    context.font = 'bold 48px Arial'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText('1000 GAL', 128, 64)
  }
  const labelTexture = new THREE.CanvasTexture(canvas)
  const labelMaterial = new THREE.MeshBasicMaterial({ 
    map: labelTexture, 
    transparent: true 
  })
  const label = new THREE.Mesh(labelGeometry, labelMaterial)
  label.rotation.x = -Math.PI / 2
  label.position.y = 0.11
  group.add(label)

  return group
}

/**
 * Creates the Norwesco tank model based on view type
 * @param is2D - Whether to create a simplified 2D version
 * @param options - Additional options for the tank
 */
export function createNorwescoTankModel(
  is2D: boolean = false,
  options: NorwescoTankOptions = {}
): THREE.Group {
  if (is2D) {
    return createSimpleNorwescoTank()
  } else {
    return createDetailedNorwescoTank(options)
  }
}
