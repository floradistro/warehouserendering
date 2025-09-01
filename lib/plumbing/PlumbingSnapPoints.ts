import * as THREE from 'three'

/**
 * PLUMBING SNAP POINTS SYSTEM
 * 
 * Industry-standard snap points for plumbing design based on:
 * - Commercial plumbing codes and standards
 * - Typical fixture heights and spacing
 * - Wall penetration standards
 * - Support spacing requirements
 * - Equipment connection points
 */

export interface PlumbingSnapPoint {
  position: THREE.Vector3
  type: PlumbingSnapType
  description: string
  systemTypes: PlumbingSystemType[]
  confidence: number
  metadata?: {
    wallId?: string
    fixtureType?: string
    height?: number
    spacing?: number
    growApplication?: string
    wallPosition?: string
    corner?: string
    roomId?: string
    gridPosition?: string
    [key: string]: any // Allow additional properties
  }
}

export enum PlumbingSnapType {
  // Wall-mounted snap points
  WALL_CENTER = 'wall_center',
  WALL_CORNER = 'wall_corner',
  WALL_PENETRATION = 'wall_penetration',
  WALL_VALVE_HEIGHT = 'wall_valve_height',
  
  // Fixture snap points
  SINK_SUPPLY = 'sink_supply',
  SINK_DRAIN = 'sink_drain',
  TOILET_SUPPLY = 'toilet_supply',
  TOILET_DRAIN = 'toilet_drain',
  SHOWER_SUPPLY = 'shower_supply',
  SHOWER_DRAIN = 'shower_drain',
  
  // Floor/ceiling snap points
  FLOOR_DRAIN = 'floor_drain',
  CEILING_SUPPORT = 'ceiling_support',
  BASEMENT_CEILING = 'basement_ceiling',
  
  // Equipment snap points
  WATER_HEATER = 'water_heater',
  PUMP_CONNECTION = 'pump_connection',
  TANK_CONNECTION = 'tank_connection',
  
  // Support and spacing points
  PIPE_SUPPORT = 'pipe_support',
  BRANCH_CONNECTION = 'branch_connection',
  ACCESS_POINT = 'access_point'
}

export enum PlumbingSystemType {
  HOT_WATER = 'hot_water',
  COLD_WATER = 'cold_water',
  WASTE = 'waste',
  VENT = 'vent',
  GAS = 'gas',
  COMPRESSED_AIR = 'compressed_air'
}

export class PlumbingSnapPointGenerator {
  private floorplan: any
  private snapPoints: PlumbingSnapPoint[] = []

  // Industry standard heights (in feet)
  private readonly STANDARD_HEIGHTS = {
    // Supply line heights
    SINK_SUPPLY: 1.5,        // 18" above floor
    TOILET_SUPPLY: 0.5,      // 6" above floor
    SHOWER_SUPPLY: 4.0,      // 48" above floor (shower head)
    LAUNDRY_SUPPLY: 3.5,     // 42" above floor
    
    // Drain heights
    SINK_DRAIN: 1.25,        // 15" above floor
    TOILET_DRAIN: 0.0,       // Floor level
    SHOWER_DRAIN: 0.0,       // Floor level
    FLOOR_DRAIN: 0.0,        // Floor level
    
    // Vent heights
    VENT_CONNECTION: 6.0,    // 72" above floor (typical vent tie-in)
    
    // Support heights
    CEILING_SUPPORT: 8.0,    // Standard ceiling height
    BASEMENT_CEILING: 7.0,   // Lower ceiling in basement
    
    // Valve and access heights
    SHUTOFF_VALVE: 1.0,      // 12" above floor
    ACCESS_PANEL: 2.0,       // 24" above floor
    
    // Equipment heights
    WATER_HEATER: 0.5,       // 6" above floor (connections)
    PUMP: 1.0,               // 12" above floor
  }

  // Industry standard spacing (in feet)
  private readonly STANDARD_SPACING = {
    PIPE_SUPPORT_MAX: 8.0,     // Maximum 8' between supports
    PIPE_SUPPORT_TYPICAL: 4.0, // Typical 4' spacing
    WALL_PENETRATION: 2.0,     // 2' from corners minimum
    FIXTURE_SPACING: 2.5,      // Minimum 30" between fixtures
    BRANCH_SPACING: 1.0,       // 12" minimum from branches
  }

  constructor(floorplan: any) {
    this.floorplan = floorplan
    this.generateSnapPoints()
  }

  public getSnapPoints(): PlumbingSnapPoint[] {
    return this.snapPoints
  }

  public getSnapPointsNear(position: THREE.Vector3, radius: number = 2.0): PlumbingSnapPoint[] {
    return this.snapPoints.filter(point => 
      point.position.distanceTo(position) <= radius
    ).sort((a, b) => 
      a.position.distanceTo(position) - b.position.distanceTo(position)
    )
  }

  private generateSnapPoints() {
    this.snapPoints = []
    
    if (!this.floorplan?.elements) {
      console.warn('⚠️ No floorplan or elements available for snap point generation')
      return
    }

    console.log('🔧 Generating snap points from floorplan with', this.floorplan.elements.length, 'elements')

    try {
      // Generate different types of snap points
      this.generateWallSnapPoints()
      this.generateFixtureSnapPoints()
      this.generateFloorSnapPoints()
      this.generateSupportSnapPoints()
      this.generateEquipmentSnapPoints()
      
      console.log('✅ Generated', this.snapPoints.length, 'total snap points')
    } catch (error) {
      console.error('❌ Error generating snap points:', error)
      this.snapPoints = [] // Reset to empty array on error
    }
  }

  private generateWallSnapPoints() {
    const walls = this.floorplan.elements.filter((el: any) => el.type === 'wall')
    console.log('🌿 Generating cannabis grow plumbing snap points for', walls.length, 'walls')
    
    walls.forEach((wall: any) => {
      // Validate wall properties
      if (!wall.position || !wall.dimensions) {
        console.warn('⚠️ Wall missing position or dimensions:', wall)
        return
      }

      // Ensure we have valid coordinates
      const startX = wall.position.x || 0
      const startY = wall.position.y || 0
      const width = wall.dimensions.width || 1
      const height = wall.dimensions.height || 1
      const rotation = wall.rotation || 0

      const startPos = new THREE.Vector3(startX, 0, startY)
      const endPos = new THREE.Vector3(
        startX + width * Math.cos(rotation),
        0,
        startY + width * Math.sin(rotation)
      )

      const wallLength = startPos.distanceTo(endPos)
      console.log(`🌿 Processing wall ${wall.id}: length=${wallLength.toFixed(1)}ft`)

      // CANNABIS GROW SPECIFIC HEIGHTS - Common for irrigation, drainage, and equipment
      const growHeights = {
        // Floor level for drainage and waste lines
        FLOOR_DRAIN: 0.0,
        // Low level for irrigation supply lines
        IRRIGATION_LOW: 1.0,    // 12" above floor
        IRRIGATION_MID: 2.5,    // 30" above floor  
        IRRIGATION_HIGH: 4.0,   // 48" above floor
        // Equipment connection heights
        PUMP_CONNECTION: 1.5,   // 18" above floor
        TANK_CONNECTION: 2.0,   // 24" above floor
        ELECTRICAL: 3.0,        // 36" above floor for electrical/controls
        // Ventilation and air lines
        VENTILATION: 6.0,       // 72" above floor
        // Ceiling level for overhead systems
        CEILING: 8.0            // 96" above floor (8ft ceiling)
      }

      // Generate snap points every 4 feet along each wall for cannabis grow systems
      const snapSpacing = 4.0 // 4 feet spacing for grow operations
      const numSnapPoints = Math.max(1, Math.floor(wallLength / snapSpacing))
      
      for (let i = 0; i <= numSnapPoints; i++) {
        const t = numSnapPoints > 0 ? i / numSnapPoints : 0.5
        const snapPos = new THREE.Vector3().lerpVectors(startPos, endPos, t)
        
        // Add snap points at all grow-specific heights
        Object.entries(growHeights).forEach(([heightKey, heightValue]) => {
          // Determine system types based on height
          let systemTypes: PlumbingSystemType[] = []
          let snapType = PlumbingSnapType.WALL_CENTER
          let description = ''
          
          if (heightKey.includes('DRAIN')) {
            systemTypes = [PlumbingSystemType.WASTE]
            snapType = PlumbingSnapType.FLOOR_DRAIN
            description = `Floor drain connection`
          } else if (heightKey.includes('IRRIGATION')) {
            systemTypes = [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER]
            snapType = PlumbingSnapType.WALL_CENTER
            description = `Irrigation line - ${heightKey.toLowerCase()}`
          } else if (heightKey.includes('PUMP') || heightKey.includes('TANK')) {
            systemTypes = [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER, PlumbingSystemType.WASTE]
            snapType = PlumbingSnapType.PUMP_CONNECTION
            description = `${heightKey.toLowerCase().replace('_', ' ')} point`
          } else if (heightKey.includes('VENTILATION')) {
            systemTypes = [PlumbingSystemType.COMPRESSED_AIR, PlumbingSystemType.VENT]
            snapType = PlumbingSnapType.CEILING_SUPPORT
            description = `Ventilation connection`
          } else {
            systemTypes = [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER, PlumbingSystemType.WASTE]
            snapType = PlumbingSnapType.WALL_CENTER
            description = `${heightKey.toLowerCase().replace('_', ' ')} connection`
          }

          this.snapPoints.push({
            position: new THREE.Vector3(snapPos.x, heightValue, snapPos.z),
            type: snapType,
            description: `${description} (${heightValue}' height)`,
            systemTypes: systemTypes,
            confidence: 0.9, // High confidence for grow operations
            metadata: { 
              wallId: wall.id, 
              height: heightValue,
              spacing: snapSpacing,
              growApplication: heightKey,
              wallPosition: `${(t * 100).toFixed(0)}%` // Position along wall as percentage
            }
          })
        })
      }

      // Add corner points for equipment placement
      [startPos, endPos].forEach((cornerPos, index) => {
        // Equipment corners at key heights
        [growHeights.PUMP_CONNECTION, growHeights.TANK_CONNECTION, growHeights.ELECTRICAL].forEach(height => {
          this.snapPoints.push({
            position: new THREE.Vector3(cornerPos.x, height, cornerPos.z),
            type: PlumbingSnapType.WALL_CORNER,
            description: `Wall corner equipment connection (${height}' height)`,
            systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER, PlumbingSystemType.WASTE],
            confidence: 0.8,
            metadata: { 
              wallId: wall.id, 
              height,
              corner: index === 0 ? 'start' : 'end',
              growApplication: 'CORNER_EQUIPMENT'
            }
          })
        })
      })
    })
  }

  private generateFixtureSnapPoints() {
    // For cannabis grow operations, look for any rooms/areas that might need plumbing
    const rooms = this.floorplan.elements.filter((el: any) => el.type === 'room')

    rooms.forEach((room: any) => {
      // Validate room properties
      if (!room.position) {
        console.warn('⚠️ Room missing position:', room)
        return
      }

      const roomCenter = new THREE.Vector3(room.position.x || 0, 0, room.position.y || 0)
      
      // Generate grow-specific fixture points in center of rooms
      this.generateGrowFixtures(roomCenter, room)
    })
  }

  private generateGrowFixtures(center: THREE.Vector3, room: any) {
    console.log(`🌿 Adding grow fixtures for room: ${room.id}`)
    
    // Central irrigation manifold connection points
    this.snapPoints.push({
      position: new THREE.Vector3(center.x, 1.5, center.z), // 18" above floor
      type: PlumbingSnapType.PUMP_CONNECTION,
      description: 'Irrigation manifold connection',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
      confidence: 0.9,
      metadata: { fixtureType: 'irrigation_manifold', roomId: room.id }
    })

    // Drainage collection point
    this.snapPoints.push({
      position: new THREE.Vector3(center.x, 0.0, center.z), // Floor level
      type: PlumbingSnapType.FLOOR_DRAIN,
      description: 'Drainage collection point',
      systemTypes: [PlumbingSystemType.WASTE],
      confidence: 0.9,
      metadata: { fixtureType: 'drainage_collection', roomId: room.id }
    })

    // Nutrient tank connection
    this.snapPoints.push({
      position: new THREE.Vector3(center.x + 2, 2.0, center.z), // 24" above floor, offset
      type: PlumbingSnapType.TANK_CONNECTION,
      description: 'Nutrient tank connection',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
      confidence: 0.8,
      metadata: { fixtureType: 'nutrient_tank', roomId: room.id }
    })

    // Water supply connection
    this.snapPoints.push({
      position: new THREE.Vector3(center.x - 2, 1.0, center.z), // 12" above floor, offset
      type: PlumbingSnapType.WALL_CENTER,
      description: 'Water supply connection',
      systemTypes: [PlumbingSystemType.COLD_WATER],
      confidence: 0.8,
      metadata: { fixtureType: 'water_supply', roomId: room.id }
    })
  }

  private generateBathroomFixtures(center: THREE.Vector3, room: any) {
    const corners = this.getRoomCorners(room)
    
    // Toilet fixture points (typically in corner)
    corners.forEach((corner, index) => {
      if (index < 2) { // Only first two corners to avoid overcrowding
        this.snapPoints.push({
          position: new THREE.Vector3(corner.x, this.STANDARD_HEIGHTS.TOILET_SUPPLY, corner.z),
          type: PlumbingSnapType.TOILET_SUPPLY,
          description: 'Toilet supply connection',
          systemTypes: [PlumbingSystemType.COLD_WATER],
          confidence: 0.9
        })

        this.snapPoints.push({
          position: new THREE.Vector3(corner.x, this.STANDARD_HEIGHTS.TOILET_DRAIN, corner.z),
          type: PlumbingSnapType.TOILET_DRAIN,
          description: 'Toilet drain connection',
          systemTypes: [PlumbingSystemType.WASTE],
          confidence: 0.9
        })
      }
    })

    // Sink fixture points (typically along wall)
    const wallPoint = new THREE.Vector3(center.x + 2, this.STANDARD_HEIGHTS.SINK_SUPPLY, center.z)
    this.snapPoints.push({
      position: wallPoint,
      type: PlumbingSnapType.SINK_SUPPLY,
      description: 'Bathroom sink supply',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
      confidence: 0.8
    })

    this.snapPoints.push({
      position: new THREE.Vector3(wallPoint.x, this.STANDARD_HEIGHTS.SINK_DRAIN, wallPoint.z),
      type: PlumbingSnapType.SINK_DRAIN,
      description: 'Bathroom sink drain',
      systemTypes: [PlumbingSystemType.WASTE],
      confidence: 0.8
    })

    // Shower fixture points
    const showerPoint = new THREE.Vector3(center.x - 2, this.STANDARD_HEIGHTS.SHOWER_SUPPLY, center.z + 2)
    this.snapPoints.push({
      position: showerPoint,
      type: PlumbingSnapType.SHOWER_SUPPLY,
      description: 'Shower supply connection',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
      confidence: 0.7
    })

    this.snapPoints.push({
      position: new THREE.Vector3(showerPoint.x, this.STANDARD_HEIGHTS.SHOWER_DRAIN, showerPoint.z),
      type: PlumbingSnapType.SHOWER_DRAIN,
      description: 'Shower drain',
      systemTypes: [PlumbingSystemType.WASTE],
      confidence: 0.7
    })
  }

  private generateKitchenFixtures(center: THREE.Vector3, room: any) {
    // Kitchen sink (typically along wall)
    const sinkPoint = new THREE.Vector3(center.x, this.STANDARD_HEIGHTS.SINK_SUPPLY, center.z + 2)
    
    this.snapPoints.push({
      position: sinkPoint,
      type: PlumbingSnapType.SINK_SUPPLY,
      description: 'Kitchen sink supply',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
      confidence: 0.9
    })

    this.snapPoints.push({
      position: new THREE.Vector3(sinkPoint.x, this.STANDARD_HEIGHTS.SINK_DRAIN, sinkPoint.z),
      type: PlumbingSnapType.SINK_DRAIN,
      description: 'Kitchen sink drain',
      systemTypes: [PlumbingSystemType.WASTE],
      confidence: 0.9
    })

    // Dishwasher connection point
    const dishwasherPoint = new THREE.Vector3(center.x + 2, this.STANDARD_HEIGHTS.SINK_SUPPLY, center.z + 2)
    this.snapPoints.push({
      position: dishwasherPoint,
      type: PlumbingSnapType.SINK_SUPPLY,
      description: 'Dishwasher connection',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER, PlumbingSystemType.WASTE],
      confidence: 0.6
    })
  }

  private generateLaundryFixtures(center: THREE.Vector3, room: any) {
    // Washer connections
    const washerPoint = new THREE.Vector3(center.x, this.STANDARD_HEIGHTS.LAUNDRY_SUPPLY, center.z)
    
    this.snapPoints.push({
      position: washerPoint,
      type: PlumbingSnapType.SINK_SUPPLY,
      description: 'Washer supply connection',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
      confidence: 0.8
    })

    // Laundry sink
    const sinkPoint = new THREE.Vector3(center.x + 3, this.STANDARD_HEIGHTS.SINK_SUPPLY, center.z)
    this.snapPoints.push({
      position: sinkPoint,
      type: PlumbingSnapType.SINK_SUPPLY,
      description: 'Laundry sink supply',
      systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
      confidence: 0.7
    })

    // Floor drain
    this.snapPoints.push({
      position: new THREE.Vector3(center.x, this.STANDARD_HEIGHTS.FLOOR_DRAIN, center.z - 2),
      type: PlumbingSnapType.FLOOR_DRAIN,
      description: 'Laundry floor drain',
      systemTypes: [PlumbingSystemType.WASTE],
      confidence: 0.6
    })
  }

  private generateFloorSnapPoints() {
    // Generate floor drain points throughout grow facility - every grow room needs drainage
    const allAreas = this.floorplan.elements.filter((el: any) => el.type === 'room')
    
    // Also add floor drains in open areas (no rooms defined)
    if (allAreas.length === 0) {
      // If no rooms defined, add floor drains in a grid pattern across the facility
      const facilityWidth = this.floorplan.dimensions?.width || 200
      const facilityHeight = this.floorplan.dimensions?.height || 200
      const drainSpacing = 20 // Every 20 feet
      
      for (let x = drainSpacing; x < facilityWidth; x += drainSpacing) {
        for (let y = drainSpacing; y < facilityHeight; y += drainSpacing) {
          this.snapPoints.push({
            position: new THREE.Vector3(x, 0.0, y),
            type: PlumbingSnapType.FLOOR_DRAIN,
            description: `Floor drain - grid pattern`,
            systemTypes: [PlumbingSystemType.WASTE],
            confidence: 0.6,
            metadata: { growApplication: 'FACILITY_DRAINAGE', gridPosition: `${x},${y}` }
          })
        }
      }
    }

    // Add floor drains in all defined areas
    allAreas.forEach((room: any) => {
      // Validate room properties
      if (!room.position) {
        console.warn('⚠️ Room missing position:', room)
        return
      }

      const center = new THREE.Vector3(room.position.x || 0, 0.0, room.position.y || 0)
      
      this.snapPoints.push({
        position: center,
        type: PlumbingSnapType.FLOOR_DRAIN,
        description: `Floor drain - ${room.id}`,
        systemTypes: [PlumbingSystemType.WASTE],
        confidence: 0.8,
        metadata: { growApplication: 'ROOM_DRAINAGE', roomId: room.id }
      })

      // Add corner drains for larger rooms
      if (room.dimensions && (room.dimensions.width > 15 || room.dimensions.height > 15)) {
        const corners = this.getRoomCorners(room)
        corners.forEach((corner, index) => {
          this.snapPoints.push({
            position: new THREE.Vector3(corner.x, 0.0, corner.z),
            type: PlumbingSnapType.FLOOR_DRAIN,
            description: `Corner floor drain - ${room.id}`,
            systemTypes: [PlumbingSystemType.WASTE],
            confidence: 0.7,
            metadata: { 
              growApplication: 'CORNER_DRAINAGE', 
              roomId: room.id, 
              corner: index.toString() 
            }
          })
        })
      }
    })
  }

  private generateSupportSnapPoints() {
    // Generate pipe support points along potential pipe runs
    const walls = this.floorplan.elements.filter((el: any) => el.type === 'wall')
    
    walls.forEach((wall: any) => {
      const startPos = new THREE.Vector3(wall.position.x, 0, wall.position.y)
      const endPos = new THREE.Vector3(
        wall.position.x + wall.dimensions.width * Math.cos(wall.rotation || 0),
        0,
        wall.position.y + wall.dimensions.width * Math.sin(wall.rotation || 0)
      )

      const wallLength = startPos.distanceTo(endPos)
      const numSupports = Math.ceil(wallLength / this.STANDARD_SPACING.PIPE_SUPPORT_TYPICAL)

      for (let i = 1; i < numSupports; i++) {
        const t = i / numSupports
        const supportPos = new THREE.Vector3().lerpVectors(startPos, endPos, t)
        
        // Support points at ceiling level
        this.snapPoints.push({
          position: new THREE.Vector3(supportPos.x, this.STANDARD_HEIGHTS.CEILING_SUPPORT, supportPos.z),
          type: PlumbingSnapType.PIPE_SUPPORT,
          description: 'Pipe support point',
          systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER, PlumbingSystemType.WASTE],
          confidence: 0.5,
          metadata: { spacing: this.STANDARD_SPACING.PIPE_SUPPORT_TYPICAL }
        })
      }
    })
  }

  private generateEquipmentSnapPoints() {
    // Look for mechanical rooms or utility areas
    const mechanicalRooms = this.floorplan.elements.filter((el: any) => 
      el.type === 'room' && 
      ['mechanical', 'utility', 'equipment'].some(type => 
        el.name?.toLowerCase().includes(type)
      )
    )

    mechanicalRooms.forEach((room: any) => {
      // Validate room properties
      if (!room.position) {
        console.warn('⚠️ Room missing position:', room)
        return
      }

      const center = new THREE.Vector3(room.position.x || 0, 0, room.position.y || 0)
      
      // Water heater connection points
      const waterHeaterPoint = new THREE.Vector3(center.x, this.STANDARD_HEIGHTS.WATER_HEATER, center.z)
      this.snapPoints.push({
        position: waterHeaterPoint,
        type: PlumbingSnapType.WATER_HEATER,
        description: 'Water heater connection',
        systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER, PlumbingSystemType.GAS],
        confidence: 0.8,
        metadata: { fixtureType: 'water_heater' }
      })

      // Pump connection points
      const pumpPoint = new THREE.Vector3(center.x + 3, this.STANDARD_HEIGHTS.PUMP, center.z)
      this.snapPoints.push({
        position: pumpPoint,
        type: PlumbingSnapType.PUMP_CONNECTION,
        description: 'Pump connection',
        systemTypes: [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER],
        confidence: 0.6,
        metadata: { fixtureType: 'pump' }
      })
    })
  }

  private getRoomCorners(room: any): THREE.Vector3[] {
    // Validate room properties
    if (!room.position || !room.dimensions) {
      console.warn('⚠️ Room missing position or dimensions for corners:', room)
      return []
    }

    const center = new THREE.Vector3(room.position.x || 0, 0, room.position.y || 0)
    const halfWidth = (room.dimensions.width || 10) / 2
    const halfHeight = (room.dimensions.height || 10) / 2

    return [
      new THREE.Vector3(center.x - halfWidth, 0, center.z - halfHeight),
      new THREE.Vector3(center.x + halfWidth, 0, center.z - halfHeight),
      new THREE.Vector3(center.x + halfWidth, 0, center.z + halfHeight),
      new THREE.Vector3(center.x - halfWidth, 0, center.z + halfHeight)
    ]
  }

  private getSystemTypesForHeight(heightKey: string): PlumbingSystemType[] {
    if (heightKey.includes('SUPPLY')) {
      return [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER]
    } else if (heightKey.includes('DRAIN') || heightKey.includes('WASTE')) {
      return [PlumbingSystemType.WASTE]
    } else if (heightKey.includes('VENT')) {
      return [PlumbingSystemType.VENT]
    } else if (heightKey.includes('GAS')) {
      return [PlumbingSystemType.GAS]
    }
    
    return [PlumbingSystemType.HOT_WATER, PlumbingSystemType.COLD_WATER, PlumbingSystemType.WASTE]
  }

  // Update snap points when floorplan changes
  public updateFloorplan(newFloorplan: any) {
    this.floorplan = newFloorplan
    this.generateSnapPoints()
  }

  // Get snap points filtered by system type
  public getSnapPointsForSystemType(systemType: PlumbingSystemType): PlumbingSnapPoint[] {
    return this.snapPoints.filter(point => 
      point.systemTypes.includes(systemType)
    )
  }

  // Get snap points filtered by height range
  public getSnapPointsInHeightRange(minHeight: number, maxHeight: number): PlumbingSnapPoint[] {
    return this.snapPoints.filter(point => 
      point.position.y >= minHeight && point.position.y <= maxHeight
    )
  }
}
