import * as THREE from 'three'
import { FloorplanElement } from './store'
import { WallOpening, getWallOpenings, hasWallOpenings } from './wall-with-openings'

/**
 * WALL FRAMING SYSTEM - 2x4 Studs at 16" On Center
 * Creates detailed framing inside walls with proper headers and king studs
 */

export interface StudFraming {
  studs: THREE.Mesh[]
  plates: THREE.Mesh[]
  headers: THREE.Mesh[]
  kingStuds: THREE.Mesh[]
}

export interface FramingConfig {
  studSize: { width: number; height: number } // 2x4 = 1.5" x 3.5" = 0.125' x 0.292'
  studSpacing: number // 16" = 1.333' on center
  plateHeight: { top: number; bottom: number } // Top and bottom plates
  headerDepth: number // Header beam depth for openings
  showFraming: boolean // Toggle framing visibility
  minLOD: number // Minimum camera distance to show framing
}

// Types for the drywall finishing system
export interface DrywallSheets {
  sheets: THREE.Mesh[]
}

export interface DrywallConfig {
  sheetSize: { width: number; height: number } // 4x8 = 4' x 8'
  thickness: number // 0.5" = 0.042'
  showDrywall: boolean // Toggle drywall visibility
  minLOD: number // Minimum camera distance to show drywall
}

// Standard 2x4 framing configuration
export const STANDARD_FRAMING_CONFIG: FramingConfig = {
  studSize: { 
    width: 0.125,  // 1.5" = 0.125'
    height: 0.292  // 3.5" = 0.292' 
  },
  studSpacing: 16 / 12, // 16" = 1.333'
  plateHeight: { 
    top: 0.125,    // 1.5" top plate
    bottom: 0.125  // 1.5" bottom plate
  },
  headerDepth: 0.75,  // 9" header depth for openings
  showFraming: true, // Toggled manually with F key
  minLOD: 200 // Show framing at all distances when enabled
}

// Standard 4x8 drywall configuration with proper LOD
export const STANDARD_DRYWALL_CONFIG: DrywallConfig = {
  sheetSize: { 
    width: 4,   // 4' wide
    height: 8   // 8' tall
  },
  thickness: 0.04, // 0.5" = 0.04' thin like real drywall
  showDrywall: false, // Toggled manually with G key
  minLOD: 1000 // Show drywall at all distances when enabled (debug)
}

/**
 * Creates 2x4 stud framing for a wall element
 */
export function createWallFraming(
  wallElement: FloorplanElement, 
  config: FramingConfig = STANDARD_FRAMING_CONFIG,
  isSelected: boolean = false
): StudFraming {
  
  // Detect wall orientation based on dimensions
  const { width, height, depth = 8 } = wallElement.dimensions
  
  // Determine if this is a north-south wall (long dimension in height) or east-west wall (long dimension in width)
  const isNorthSouthWall = height > width
  const wallLength = isNorthSouthWall ? height : width
  const wallThickness = isNorthSouthWall ? width : height
  const wallHeight = depth
  
  const wallOpenings = hasWallOpenings(wallElement) ? getWallOpenings(wallElement) : []
  
  console.log(`🔨 Creating framing for wall ${wallElement.id}:`)
  console.log(`📐 Wall type: ${isNorthSouthWall ? 'North-South (vertical)' : 'East-West (horizontal)'}`)
  console.log(`📏 Dimensions - Length: ${wallLength}', Thickness: ${wallThickness}', Height: ${wallHeight}'`)
  console.log(`📍 Original dims - Width: ${width}', Height: ${height}', Depth: ${depth}`)
  console.log(`🚪 Found ${wallOpenings.length} openings in wall`)
  
  const studGroup: StudFraming = {
    studs: [],
    plates: [],
    headers: [],
    kingStuds: []
  }
  
  // Create material for framing based on wall material and selection state
  const framingMaterial = createFramingMaterial(wallElement, isSelected)
  
  function createFramingMaterial(element: FloorplanElement, isSelected: boolean = false): THREE.MeshLambertMaterial {
    
    // If selected, always use yellow for framing regardless of material
    if (isSelected) {
      return new THREE.MeshLambertMaterial({ 
        color: '#FFFF00', // Bright yellow for selected framing
        transparent: false
      })
    }
    
    // Use wall material to determine framing appearance
    switch(element.material) {
      case 'brick':
        return new THREE.MeshLambertMaterial({ 
          color: '#8B4513', // Saddle brown - masonry/brick framing
          transparent: false
        })
      case 'concrete':
        return new THREE.MeshLambertMaterial({ 
          color: '#696969', // Dim gray - concrete framing
          transparent: false
        })
      case 'steel':
        return new THREE.MeshLambertMaterial({ 
          color: '#4682B4', // Steel blue - steel framing
          transparent: false
        })
      default: // Wood or unknown
        return new THREE.MeshLambertMaterial({ 
          color: '#D2B48C', // Tan wood color - traditional framing
          transparent: false
        })
    }
  }

  // Check if this is a brick wall and use individual brick framing system
  if (wallElement.material === 'brick') {
    console.log('🧱 Using individual brick skeleton framing system')
    return createBrickSkeletonFraming(wallElement, wallLength, wallThickness, wallHeight, isNorthSouthWall, wallOpenings, isSelected)
  }
  
  // 1. CREATE BOTTOM AND TOP PLATES (run full length of wall)
  // Plates must be oriented to match the wall's coordinate system
  const plateGeometry = isNorthSouthWall 
    ? new THREE.BoxGeometry(
        config.studSize.height,        // X: plate width (3.5")
        config.plateHeight.bottom,     // Y: plate thickness (1.5")
        wallLength                     // Z: plate runs along wall length
      )
    : new THREE.BoxGeometry(
        wallLength,                    // X: plate runs along wall length  
        config.plateHeight.bottom,     // Y: plate thickness (1.5")
        config.studSize.height         // Z: plate width (3.5")
      )
  
  // Bottom plate - positioned at bottom of wall (relative to wall center)
  const bottomPlate = new THREE.Mesh(plateGeometry, framingMaterial)
  bottomPlate.position.set(
    0,                                    // X: centered 
    -wallHeight/2 + config.plateHeight.bottom/2,  // Y: at bottom of wall
    0                                     // Z: centered
  )
  bottomPlate.castShadow = true
  studGroup.plates.push(bottomPlate)
  
  // Top plate - positioned at top of wall (relative to wall center)
  const topPlate = new THREE.Mesh(plateGeometry, framingMaterial)
  topPlate.position.set(
    0,                                    // X: centered
    wallHeight/2 - config.plateHeight.top/2,   // Y: at top of wall
    0                                     // Z: centered
  )
  topPlate.castShadow = true
  studGroup.plates.push(topPlate)
  
  // 2. CALCULATE STUD POSITIONS (16" on center)
  const studPositions = calculateStudPositions(wallLength, config.studSpacing, wallOpenings)
  
  // 3. CREATE STUDS
  const studHeight = wallHeight - config.plateHeight.top - config.plateHeight.bottom
  // Studs are vertical 2x4s, oriented to match wall direction
  const studGeometry = isNorthSouthWall
    ? new THREE.BoxGeometry(
        config.studSize.height,  // X: stud width (3.5" - wide dimension)
        studHeight,              // Y: stud height (vertical - between plates)
        config.studSize.width    // Z: stud thickness (1.5" - narrow dimension)
      )
    : new THREE.BoxGeometry(
        config.studSize.width,   // X: stud thickness (1.5" - narrow dimension)
        studHeight,              // Y: stud height (vertical - between plates)  
        config.studSize.height   // Z: stud width (3.5" - wide dimension)
      )
  
  studPositions.forEach((position, index) => {
    const stud = new THREE.Mesh(studGeometry, framingMaterial)
    
    if (isNorthSouthWall) {
      // For north-south walls, studs are spaced along Z-axis
      stud.position.set(
        0,                             // X: centered
        0,                             // Y: centered vertically between plates
        position.x - wallLength / 2   // Z: position along wall length
      )
    } else {
      // For east-west walls, studs are spaced along X-axis
      stud.position.set(
        position.x - wallLength / 2,  // X: position along wall length
        0,                            // Y: centered vertically between plates
        0                             // Z: centered
      )
    }
    
    stud.castShadow = true
    stud.userData = { type: 'stud', index, isKingStud: position.isKingStud }
    
    if (position.isKingStud) {
      studGroup.kingStuds.push(stud)
    } else {
      studGroup.studs.push(stud)
    }
  })
  
  // 4. CREATE HEADERS OVER OPENINGS
  wallOpenings.forEach((opening, index) => {
    const header = createOpeningHeader(opening, wallLength, wallHeight, config, framingMaterial, isNorthSouthWall)
    if (header) {
      studGroup.headers.push(header)
    }
  })
  
  console.log(`✅ Created framing: ${studGroup.studs.length} studs, ${studGroup.kingStuds.length} king studs, ${studGroup.headers.length} headers`)
  
  return studGroup
}

/**
 * Calculate stud positions along wall, accounting for openings
 */
function calculateStudPositions(
  wallLength: number, 
  studSpacing: number,
  openings: WallOpening[]
): Array<{ x: number; isKingStud: boolean }> {
  
  const positions: Array<{ x: number; isKingStud: boolean }> = []
  
  // Start from one end and work across at 16" intervals
  const numStuds = Math.ceil(wallLength / studSpacing) + 1 // +1 for end stud
  
  for (let i = 0; i <= numStuds; i++) {
    const studX = i * studSpacing
    
    // Skip if stud would be beyond wall
    if (studX > wallLength) continue
    
    // Check if this stud interferes with any opening
    let skipStud = false
    let makeKingStud = false
    
    for (const opening of openings) {
      const openingLeft = opening.position.x - opening.dimensions.width / 2
      const openingRight = opening.position.x + opening.dimensions.width / 2
      const kingStudOffset = 0.125 // 1.5" king stud spacing from opening
      
      // Skip studs that fall inside opening
      if (studX > openingLeft + kingStudOffset && studX < openingRight - kingStudOffset) {
        skipStud = true
        break
      }
      
      // Make king studs at opening edges
      if (Math.abs(studX - openingLeft) < kingStudOffset || 
          Math.abs(studX - openingRight) < kingStudOffset) {
        makeKingStud = true
      }
    }
    
    if (!skipStud) {
      positions.push({ x: studX, isKingStud: makeKingStud })
    }
  }
  
  // Always add king studs at opening edges
  openings.forEach(opening => {
    const openingLeft = opening.position.x - opening.dimensions.width / 2
    const openingRight = opening.position.x + opening.dimensions.width / 2
    
    // Left king stud
    positions.push({ x: openingLeft, isKingStud: true })
    // Right king stud  
    positions.push({ x: openingRight, isKingStud: true })
  })
  
  // Sort positions and remove duplicates
  const uniquePositions = positions
    .filter((pos, index, arr) => 
      arr.findIndex(p => Math.abs(p.x - pos.x) < 0.1) === index
    )
    .sort((a, b) => a.x - b.x)
  
  return uniquePositions
}

/**
 * Create header beam over an opening
 */
function createOpeningHeader(
  opening: WallOpening,
  wallLength: number,
  wallHeight: number,
  config: FramingConfig,
  material: THREE.Material,
  isNorthSouthWall: boolean = false
): THREE.Mesh | null {
  
  // Header spans the opening width plus king studs
  const headerWidth = opening.dimensions.width + (config.studSize.width * 2)
  const headerHeight = config.studSize.height // Same as stud width (3.5")
  const headerDepth = config.headerDepth // 9" deep header
  
  // Position header above opening (relative to wall center)
  const headerY = opening.position.z + opening.dimensions.height + headerDepth / 2 - wallHeight/2
  
  // Don't create header if it would go above wall
  if (headerY + headerDepth / 2 > wallHeight/2) return null
  
  // Headers span horizontally across openings, oriented for wall type
  const headerGeometry = isNorthSouthWall
    ? new THREE.BoxGeometry(
        headerHeight,   // X: header depth (3.5")
        headerDepth,    // Y: header thickness (vertical beam depth)
        headerWidth     // Z: header width (spans opening + king studs)
      )
    : new THREE.BoxGeometry(
        headerWidth,    // X: header width (spans opening + king studs)
        headerDepth,    // Y: header thickness (vertical beam depth)
        headerHeight    // Z: header depth (3.5")
      )
  const header = new THREE.Mesh(headerGeometry, material)
  
  if (isNorthSouthWall) {
    header.position.set(
      0,                                   // X: centered
      headerY,                             // Y: vertical position above opening
      opening.position.x - wallLength / 2 // Z: position along wall length
    )
  } else {
    header.position.set(
      opening.position.x - wallLength / 2, // X: position along wall length
      headerY,                             // Y: vertical position above opening
      0                                    // Z: centered
    )
  }
  
  header.castShadow = true
  header.userData = { type: 'header', openingId: opening.id }
  
  return header
}

/**
 * Create a complete framed wall group
 */
export function createFramedWallGroup(
  wallElement: FloorplanElement,
  config: FramingConfig = STANDARD_FRAMING_CONFIG,
  isSelected: boolean = false,
  drywallConfig?: DrywallConfig
): THREE.Group {
  
  const wallGroup = new THREE.Group()
  
  // Create the wall shell (existing wall geometry) 
  // Must match exactly how standard walls are rendered in ThreeRenderer
  const { width, height, depth = 8 } = wallElement.dimensions
  const wallGeometry = new THREE.BoxGeometry(width, depth, height)
  
  console.log(`🧱 Creating wall shell: W=${width}' x D=${depth}' x H=${height}'`)
  
  // Make wall semi-transparent to show framing inside
  const wallMaterial = new THREE.MeshLambertMaterial({
    color: wallElement.color || '#ffffff',
    transparent: true,
    opacity: config.showFraming ? 0.3 : 1.0
  })
  
  console.log(`🎨 Wall material opacity: ${config.showFraming ? 0.3 : 1.0}`)
  
  const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial)
  wallMesh.position.set(0, 0, 0)  // Centered in the group
  wallMesh.castShadow = true
  wallMesh.receiveShadow = true
  wallGroup.add(wallMesh)
  
  // Add framing if enabled
  if (config.showFraming) {
    const framing = createWallFraming(wallElement, config, isSelected)
    
    // Add all framing components to group
    framing.studs.forEach(stud => wallGroup.add(stud))
    framing.plates.forEach(plate => wallGroup.add(plate))
    framing.headers.forEach(header => wallGroup.add(header))
    framing.kingStuds.forEach(kingStud => wallGroup.add(kingStud))
  }
  
  // Add drywall if enabled
  if (drywallConfig && drywallConfig.showDrywall) {
    console.log(`🏠 Adding drywall to wall group for wall ${wallElement.id}`)
    const drywall = createWallDrywall(wallElement, drywallConfig, isSelected, config.showFraming)
    
    // Add all drywall sheets to group
    drywall.sheets.forEach(sheet => {
      console.log(`🏠 Adding drywall piece: ${sheet.userData?.type || 'unknown'} to wall group`)
      wallGroup.add(sheet)
    })
    console.log(`🏠 Added ${drywall.sheets.length} drywall pieces to wall group`)
  }
  
  return wallGroup
}

/**
 * Creates optimized 4x8 drywall sheets using instanced rendering for performance
 */
export function createWallDrywall(
  wallElement: FloorplanElement,
  config: DrywallConfig = STANDARD_DRYWALL_CONFIG,
  isSelected: boolean = false,
  showFraming: boolean = false
): DrywallSheets {
  
  const { width, height, depth = 8 } = wallElement.dimensions
  
  const drywallSheets: DrywallSheets = {
    sheets: []
  }
  
  // Create shared materials (reuse instances to reduce GPU state changes)
  // Make drywall transparent when structural elements are also visible
  const isTransparent = showFraming
  const opacity = isTransparent ? 0.7 : 1.0
  
  const normalMaterial = new THREE.MeshLambertMaterial({ 
    color: isSelected ? '#FFFF00' : '#F8F8F8',
    transparent: isTransparent,
    opacity: opacity
  })
  
  const cutMaterial = new THREE.MeshLambertMaterial({ 
    color: isSelected ? '#FFAA00' : '#E8E8E8',
    transparent: isTransparent,
    opacity: opacity
  })
  
  // High-contrast outline material for visibility at all zoom levels
  const seamMaterial = new THREE.MeshBasicMaterial({ 
    color: '#FF0000', // Bright red outlines for debugging visibility
    transparent: false
  })
  
  // CORRECTED: Create drywall sheets on BOTH sides of interior walls
  const isNorthSouthWall = height > width
  const wallLength = isNorthSouthWall ? height : width
  const wallHeight = depth
  
  // Calculate optimal sheet layout 
  const sheetsHorizontal = Math.ceil(wallLength / config.sheetSize.width)
  const sheetsVertical = Math.ceil(wallHeight / config.sheetSize.height)
  
  // Create shared geometries to reduce memory usage
  const standardSheetGeometry = isNorthSouthWall 
    ? new THREE.BoxGeometry(config.thickness, config.sheetSize.height, config.sheetSize.width)
    : new THREE.BoxGeometry(config.sheetSize.width, config.sheetSize.height, config.thickness)
  
  // Create drywall sheets on BOTH sides of the wall
  const sides = ['side1', 'side2']
  
  sides.forEach((side, sideIndex) => {
    console.log(`🏠 Creating drywall sheets on ${side} of wall`)
    
    for (let row = 0; row < sheetsVertical; row++) {
      for (let col = 0; col < sheetsHorizontal; col++) {
        
        const sheetWidth = Math.min(config.sheetSize.width, wallLength - (col * config.sheetSize.width))
        const sheetHeight = Math.min(config.sheetSize.height, wallHeight - (row * config.sheetSize.height))
        const isPartialSheet = sheetWidth < config.sheetSize.width || sheetHeight < config.sheetSize.height
        
        let sheet: THREE.Mesh
        
        if (isPartialSheet) {
          // Create custom geometry only for cut sheets
          const customGeometry = isNorthSouthWall 
            ? new THREE.BoxGeometry(config.thickness, sheetHeight, sheetWidth)
            : new THREE.BoxGeometry(sheetWidth, sheetHeight, config.thickness)
          sheet = new THREE.Mesh(customGeometry, cutMaterial)
        } else {
          // Reuse standard geometry for full sheets
          sheet = new THREE.Mesh(standardSheetGeometry, normalMaterial)
        }
        
        // Position sheet on appropriate side
        if (isNorthSouthWall) {
          const xOffset = sideIndex === 0 
            ? wallElement.dimensions.width/2 + config.thickness/2    // Side 1 (positive X)
            : -wallElement.dimensions.width/2 - config.thickness/2   // Side 2 (negative X)
          
          sheet.position.set(
            xOffset,
            -wallHeight/2 + row * config.sheetSize.height + sheetHeight/2,
            -wallLength/2 + col * config.sheetSize.width + sheetWidth/2
          )
        } else {
          const zOffset = sideIndex === 0 
            ? wallElement.dimensions.height/2 + config.thickness/2    // Side 1 (positive Z)
            : -wallElement.dimensions.height/2 - config.thickness/2   // Side 2 (negative Z)
          
          sheet.position.set(
            -wallLength/2 + col * config.sheetSize.width + sheetWidth/2,
            -wallHeight/2 + row * config.sheetSize.height + sheetHeight/2,
            zOffset
          )
        }
        
        sheet.castShadow = true
        sheet.receiveShadow = true
        sheet.userData = { 
          type: 'drywall-sheet',
          side: side,
          row: row, 
          column: col,
          dimensions: { width: sheetWidth, height: sheetHeight },
          isPartialSheet: isPartialSheet
        }
        
        drywallSheets.sheets.push(sheet)
      }
    }
  })
  
  // Create complete rectangular outline for each individual drywall sheet on BOTH sides
  const outlineThickness = 0.1 // Extra thick for debugging visibility
  const outlineOffset = 0.01 // Larger offset from drywall surface
  
  console.log(`🏠 Creating outlines for ${sheetsHorizontal}×${sheetsVertical} drywall sheets on BOTH sides`)
  
  // Create outlines for sheets on both sides
  sides.forEach((side, sideIndex) => {
    console.log(`🏠 Creating outlines on ${side} of wall`)
    
    for (let row = 0; row < sheetsVertical; row++) {
      for (let col = 0; col < sheetsHorizontal; col++) {
        
        const sheetWidth = Math.min(config.sheetSize.width, wallLength - (col * config.sheetSize.width))
        const sheetHeight = Math.min(config.sheetSize.height, wallHeight - (row * config.sheetSize.height))
        
        // Calculate sheet center position on appropriate side
        let sheetCenterX: number, sheetCenterY: number, sheetCenterZ: number
        
        if (isNorthSouthWall) {
          const xOffset = sideIndex === 0 
            ? wallElement.dimensions.width/2 + config.thickness/2 + outlineOffset    // Side 1
            : -wallElement.dimensions.width/2 - config.thickness/2 - outlineOffset   // Side 2
          
          sheetCenterX = xOffset
          sheetCenterY = -wallHeight/2 + row * config.sheetSize.height + sheetHeight/2
          sheetCenterZ = -wallLength/2 + col * config.sheetSize.width + sheetWidth/2
        } else {
          const zOffset = sideIndex === 0 
            ? wallElement.dimensions.height/2 + config.thickness/2 + outlineOffset    // Side 1
            : -wallElement.dimensions.height/2 - config.thickness/2 - outlineOffset   // Side 2
          
          sheetCenterX = -wallLength/2 + col * config.sheetSize.width + sheetWidth/2
          sheetCenterY = -wallHeight/2 + row * config.sheetSize.height + sheetHeight/2
          sheetCenterZ = zOffset
        }
        
        // Create complete rectangular outline for this sheet
        // Top edge
        const topOutlineGeometry = isNorthSouthWall 
          ? new THREE.BoxGeometry(outlineThickness, outlineThickness, sheetWidth + outlineThickness)
          : new THREE.BoxGeometry(sheetWidth + outlineThickness, outlineThickness, outlineThickness)
        
        const topOutline = new THREE.Mesh(topOutlineGeometry, seamMaterial)
        topOutline.position.set(sheetCenterX, sheetCenterY + sheetHeight/2, sheetCenterZ)
        topOutline.userData = { 
          type: 'drywall-sheet-outline', 
          edge: 'top', 
          side: side,
          row: row, 
          col: col 
        }
        drywallSheets.sheets.push(topOutline)
        
        // Bottom edge
        const bottomOutlineGeometry = isNorthSouthWall 
          ? new THREE.BoxGeometry(outlineThickness, outlineThickness, sheetWidth + outlineThickness)
          : new THREE.BoxGeometry(sheetWidth + outlineThickness, outlineThickness, outlineThickness)
        
        const bottomOutline = new THREE.Mesh(bottomOutlineGeometry, seamMaterial)
        bottomOutline.position.set(sheetCenterX, sheetCenterY - sheetHeight/2, sheetCenterZ)
        bottomOutline.userData = { 
          type: 'drywall-sheet-outline', 
          edge: 'bottom', 
          side: side,
          row: row, 
          col: col 
        }
        drywallSheets.sheets.push(bottomOutline)
        
        // Left edge
        const leftOutlineGeometry = isNorthSouthWall 
          ? new THREE.BoxGeometry(outlineThickness, sheetHeight + outlineThickness, outlineThickness)
          : new THREE.BoxGeometry(outlineThickness, sheetHeight + outlineThickness, outlineThickness)
        
        const leftOutline = new THREE.Mesh(leftOutlineGeometry, seamMaterial)
        if (isNorthSouthWall) {
          leftOutline.position.set(sheetCenterX, sheetCenterY, sheetCenterZ - sheetWidth/2)
        } else {
          leftOutline.position.set(sheetCenterX - sheetWidth/2, sheetCenterY, sheetCenterZ)
        }
        leftOutline.userData = { 
          type: 'drywall-sheet-outline', 
          edge: 'left', 
          side: side,
          row: row, 
          col: col 
        }
        drywallSheets.sheets.push(leftOutline)
        
        // Right edge
        const rightOutlineGeometry = isNorthSouthWall 
          ? new THREE.BoxGeometry(outlineThickness, sheetHeight + outlineThickness, outlineThickness)
          : new THREE.BoxGeometry(outlineThickness, sheetHeight + outlineThickness, outlineThickness)
        
        const rightOutline = new THREE.Mesh(rightOutlineGeometry, seamMaterial)
        if (isNorthSouthWall) {
          rightOutline.position.set(sheetCenterX, sheetCenterY, sheetCenterZ + sheetWidth/2)
        } else {
          rightOutline.position.set(sheetCenterX + sheetWidth/2, sheetCenterY, sheetCenterZ)
        }
        rightOutline.userData = { 
          type: 'drywall-sheet-outline', 
          edge: 'right', 
          side: side,
          row: row, 
          col: col 
        }
        drywallSheets.sheets.push(rightOutline)
      }
    }
  })
  
  console.log(`🏠 Created ${drywallSheets.sheets.length} total drywall pieces (sheets + outlines on BOTH sides)`)
  console.log(`🏠 Sheet breakdown: ${(sheetsHorizontal * sheetsVertical) * 2} sheets (both sides) + ${(sheetsHorizontal * sheetsVertical) * 2 * 4} outline edges`)
  
  return drywallSheets
}

/**
 * Check if camera is close enough to show framing detail
 */
export function shouldShowFraming(cameraPosition: THREE.Vector3, wallPosition: THREE.Vector3, config: FramingConfig): boolean {
  const distance = cameraPosition.distanceTo(wallPosition)
  return distance <= config.minLOD && config.showFraming
}

/**
 * Check if camera is close enough to show drywall detail with performance optimization
 */
export function shouldShowDrywall(cameraPosition: THREE.Vector3, wallPosition: THREE.Vector3, config: DrywallConfig): boolean {
  if (!config.showDrywall) return false
  const distance = cameraPosition.distanceTo(wallPosition)
  return distance <= config.minLOD
}

/**
 * Creates individual brick skeleton framing for brick walls
 */
function createBrickSkeletonFraming(
  wallElement: FloorplanElement, 
  wallLength: number,
  wallThickness: number, 
  wallHeight: number,
  isNorthSouthWall: boolean,
  wallOpenings: WallOpening[],
  isSelected: boolean = false
): StudFraming {
  
  const framing: StudFraming = {
    studs: [], // Will contain individual brick courses
    plates: [], // Will contain mortar bed joints
    headers: [], // Will contain brick lintels over openings
    kingStuds: [] // Will contain corner/end bricks
  }
  
  // Standard modular brick dimensions
  const brickWidth = 7.625 / 12    // 7 5/8" = 0.635'
  const brickHeight = 2.25 / 12    // 2 1/4" = 0.1875'  
  const brickDepth = 3.625 / 12    // 3 5/8" = 0.302'
  const mortarThickness = 0.375 / 12 // 3/8" mortar joint = 0.031'
  
  // Calculate brick layout
  const courseHeight = brickHeight + mortarThickness
  const brickLength = brickWidth + mortarThickness
  
  // Performance optimization - limit brick count for smooth rendering
  const maxCoursesLimit = Math.min(Math.floor(wallHeight / courseHeight), 35) // Max 35 courses
  const maxBricksPerCourse = Math.min(Math.floor(wallLength / brickLength), 60) // Max 60 bricks per course
  
  const totalBricks = maxCoursesLimit * maxBricksPerCourse
  console.log(`🧱 Creating ${totalBricks} individual bricks (${maxCoursesLimit} courses × ${maxBricksPerCourse} bricks) for ${wallLength}' × ${wallHeight}' wall`)
  
  // Create brick materials - use yellow when selected
  const brickMaterial = new THREE.MeshLambertMaterial({ 
    color: isSelected ? '#FFFF00' : '#B22222', // Bright yellow when selected, fire brick red otherwise
    transparent: false
  })
  
  const mortarMaterial = new THREE.MeshLambertMaterial({ 
    color: isSelected ? '#FFFF00' : '#C0C0C0', // Bright yellow when selected, silver otherwise
    transparent: false
  })
  
  // Create single brick geometry for instancing
  const brickGeometry = isNorthSouthWall
    ? new THREE.BoxGeometry(brickDepth, brickHeight, brickWidth)  // N-S wall orientation
    : new THREE.BoxGeometry(brickWidth, brickHeight, brickDepth)  // E-W wall orientation
  
  // Create instanced mesh for all bricks (MASSIVE performance boost)
  const brickInstancedMesh = new THREE.InstancedMesh(brickGeometry, brickMaterial, totalBricks)
  const matrix = new THREE.Matrix4()
  let instanceIndex = 0
  
  // Create brick courses with running bond pattern
  for (let course = 0; course < maxCoursesLimit; course++) {
    const courseY = -wallHeight/2 + (course * courseHeight) + brickHeight/2
    
    // Alternate brick pattern (running bond) - every other course is offset
    const isOffsetCourse = course % 2 === 1
    const startOffset = isOffsetCourse ? -brickLength/2 : 0
    
    for (let brick = 0; brick < maxBricksPerCourse; brick++) {
      if (instanceIndex >= totalBricks) break
      
      // Position brick in course
      const brickX = isNorthSouthWall ? 0 : (-wallLength/2 + (brick * brickLength) + brickWidth/2 + startOffset)
      const brickZ = isNorthSouthWall ? (-wallLength/2 + (brick * brickLength) + brickWidth/2 + startOffset) : 0
      
      // Skip bricks that would interfere with openings
      let skipBrick = false
      for (const opening of wallOpenings) {
        const openingStart = opening.position.x - opening.dimensions.width/2
        const openingEnd = opening.position.x + opening.dimensions.width/2
        const openingBottom = opening.position.z
        const openingTop = opening.position.z + opening.dimensions.height
        
        const brickPos = isNorthSouthWall ? brickZ + wallLength/2 : brickX + wallLength/2
        const brickBottom = courseY - brickHeight/2 + wallHeight/2
        const brickTop = courseY + brickHeight/2 + wallHeight/2
        
        if (brickPos >= openingStart && brickPos <= openingEnd && 
            brickBottom < openingTop && brickTop > openingBottom) {
          skipBrick = true
          break
        }
      }
      
      if (!skipBrick) {
        // Set matrix for this instance
        matrix.setPosition(brickX, courseY, brickZ)
        brickInstancedMesh.setMatrixAt(instanceIndex, matrix)
      }
      instanceIndex++
    }
  }
  
  // Update instance matrices
  brickInstancedMesh.instanceMatrix.needsUpdate = true
  
  // Add the instanced mesh to framing (single object, thousands of bricks!)
  framing.studs.push(brickInstancedMesh)
  
  // Create horizontal mortar joints between courses (skeleton appearance)
  for (let course = 1; course < maxCoursesLimit; course++) {
    const courseY = -wallHeight/2 + (course * courseHeight) - mortarThickness/2
    
    const mortarGeometry = isNorthSouthWall
      ? new THREE.BoxGeometry(brickDepth, mortarThickness, wallLength)
      : new THREE.BoxGeometry(wallLength, mortarThickness, brickDepth)
      
    const mortarMesh = new THREE.Mesh(mortarGeometry, mortarMaterial)
    mortarMesh.position.set(0, courseY, 0)
    framing.plates.push(mortarMesh)
  }
  
  // Create brick lintels for openings
  wallOpenings.forEach(opening => {
    const lintelGeometry = isNorthSouthWall
      ? new THREE.BoxGeometry(brickDepth, brickHeight * 3, opening.dimensions.width + brickWidth)
      : new THREE.BoxGeometry(opening.dimensions.width + brickWidth, brickHeight * 3, brickDepth)
      
    const lintel = new THREE.Mesh(lintelGeometry, brickMaterial)
    const lintelY = opening.position.z + opening.dimensions.height + (brickHeight * 1.5) - wallHeight/2
    
    if (isNorthSouthWall) {
      lintel.position.set(0, lintelY, opening.position.x - wallLength/2)
    } else {
      lintel.position.set(opening.position.x - wallLength/2, lintelY, 0)
    }
    
    framing.headers.push(lintel)
  })
  
  console.log(`🧱 Created ${totalBricks} individual bricks via InstancedMesh, ${framing.plates.length} mortar joints, ${framing.headers.length} lintels`)
  
  return framing
}

/**
 * Update framing visibility based on camera distance
 */
export function updateFramingLOD(
  framingGroup: THREE.Group,
  cameraPosition: THREE.Vector3, 
  wallPosition: THREE.Vector3,
  config: FramingConfig
): void {
  
  const shouldShow = shouldShowFraming(cameraPosition, wallPosition, config)
  
  framingGroup.children.forEach(child => {
    if (child.userData?.type && ['stud', 'plate', 'header', 'kingStud'].includes(child.userData.type)) {
      child.visible = shouldShow
    }
  })
  
  // Adjust wall transparency based on framing visibility
  const wallMesh = framingGroup.children.find(child => !child.userData?.type)
  if (wallMesh && wallMesh instanceof THREE.Mesh && wallMesh.material instanceof THREE.Material) {
    if ('opacity' in wallMesh.material) {
      (wallMesh.material as any).opacity = shouldShow ? 0.3 : 1.0
    }
  }
}

/**
 * Update drywall visibility based on camera distance for performance
 */
export function updateDrywallLOD(
  framingGroup: THREE.Group,
  cameraPosition: THREE.Vector3, 
  wallPosition: THREE.Vector3,
  config: DrywallConfig
): void {
  
  const shouldShow = shouldShowDrywall(cameraPosition, wallPosition, config)
  
  framingGroup.children.forEach(child => {
    if (child.userData?.type && 
        ['drywall-sheet', 'drywall-sheet-outline'].includes(child.userData.type)) {
      child.visible = shouldShow
    }
  })
}
