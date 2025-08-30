import * as THREE from 'three'
import { SemanticObject } from '../models/SemanticModel'

// 2D geometric primitives
export interface Point2D {
  x: number
  y: number
}

export interface Line2D {
  start: Point2D
  end: Point2D
  thickness?: number
}

export interface Shape2D {
  id: string
  type: 'rectangle' | 'circle' | 'polygon' | 'line' | 'arc'
  position: Point2D
  rotation: number
  scale: { x: number; y: number }
  properties: Record<string, any>
}

export interface Rectangle2D extends Shape2D {
  type: 'rectangle'
  width: number
  height: number
}

export interface Circle2D extends Shape2D {
  type: 'circle'
  radius: number
}

export interface Polygon2D extends Shape2D {
  type: 'polygon'
  points: Point2D[]
}

export interface Line2D extends Shape2D {
  type: 'line'
  start: Point2D
  end: Point2D
  thickness: number
}

// 2D floor plan representation
export interface FloorPlan2D {
  id: string
  name: string
  bounds: { min: Point2D; max: Point2D }
  scale: number // Units per pixel
  grid: {
    enabled: boolean
    size: number
    subdivisions: number
  }
  layers: Map<string, FloorPlanLayer>
  shapes: Shape2D[]
  annotations: Annotation2D[]
  metadata: {
    created: Date
    modified: Date
    version: string
    units: 'feet' | 'meters' | 'inches'
  }
}

export interface FloorPlanLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  color: string
  opacity: number
  shapes: string[] // Shape IDs
}

export interface Annotation2D {
  id: string
  type: 'dimension' | 'label' | 'note' | 'area'
  position: Point2D
  text: string
  style: {
    fontSize: number
    color: string
    background?: string
    arrow?: boolean
  }
}

// Wall creation and management
export interface Wall2D {
  id: string
  start: Point2D
  end: Point2D
  thickness: number
  height: number
  material: string
  openings: Opening2D[]
  properties: {
    isExterior: boolean
    fireRating?: number
    insulation?: string
  }
}

export interface Opening2D {
  id: string
  type: 'door' | 'window' | 'opening'
  position: number // 0-1 along wall
  width: number
  height: number
  properties: Record<string, any>
}

// Room definition
export interface Room2D {
  id: string
  name: string
  boundary: Point2D[]
  area: number
  perimeter: number
  centroid: Point2D
  properties: {
    type: 'office' | 'storage' | 'production' | 'utility' | 'circulation'
    occupancy?: number
    ventilation?: boolean
    climate?: 'conditioned' | 'unconditioned'
  }
}

// Main Floor Plan Engine
export class FloorPlanEngine {
  private floorPlan: FloorPlan2D
  private semantic3DObjects: Map<string, SemanticObject> = new Map()
  private shape3DMapping: Map<string, string> = new Map() // 2D shape ID -> 3D object ID
  private object2DMapping: Map<string, string> = new Map() // 3D object ID -> 2D shape ID

  constructor(name: string = 'Warehouse Floor Plan') {
    this.floorPlan = this.createEmptyFloorPlan(name)
  }

  private createEmptyFloorPlan(name: string): FloorPlan2D {
    return {
      id: `floorplan_${Date.now()}`,
      name,
      bounds: { 
        min: { x: -500, y: -500 }, 
        max: { x: 500, y: 500 } 
      },
      scale: 1, // 1 unit = 1 foot
      grid: {
        enabled: true,
        size: 1,
        subdivisions: 4
      },
      layers: new Map([
        ['walls', { id: 'walls', name: 'Walls', visible: true, locked: false, color: '#000000', opacity: 1, shapes: [] }],
        ['doors', { id: 'doors', name: 'Doors & Windows', visible: true, locked: false, color: '#8B4513', opacity: 1, shapes: [] }],
        ['equipment', { id: 'equipment', name: 'Equipment', visible: true, locked: false, color: '#4169E1', opacity: 1, shapes: [] }],
        ['furniture', { id: 'furniture', name: 'Furniture', visible: true, locked: false, color: '#228B22', opacity: 1, shapes: [] }],
        ['utilities', { id: 'utilities', name: 'Utilities', visible: true, locked: false, color: '#FF4500', opacity: 1, shapes: [] }],
        ['annotations', { id: 'annotations', name: 'Annotations', visible: true, locked: false, color: '#696969', opacity: 1, shapes: [] }]
      ]),
      shapes: [],
      annotations: [],
      metadata: {
        created: new Date(),
        modified: new Date(),
        version: '1.0',
        units: 'feet'
      }
    }
  }

  // Convert 3D scene to 2D floor plan
  generate2DFromScene(objects: SemanticObject[]): FloorPlan2D {
    console.log(`🔄 Generating 2D floor plan from ${objects.length} 3D objects`)

    // Clear existing shapes and mappings
    this.floorPlan.shapes = []
    this.shape3DMapping.clear()
    this.object2DMapping.clear()

    // Process each 3D object
    for (const obj of objects) {
      this.semantic3DObjects.set(obj.metadata.id, obj)
      const shape2D = this.convert3DTo2D(obj)
      
      if (shape2D) {
        this.floorPlan.shapes.push(shape2D)
        this.shape3DMapping.set(shape2D.id, obj.metadata.id)
        this.object2DMapping.set(obj.metadata.id, shape2D.id)

        // Add to appropriate layer
        const layerId = this.getLayerForObject(obj)
        const layer = this.floorPlan.layers.get(layerId)
        if (layer) {
          layer.shapes.push(shape2D.id)
        }
      }
    }

    // Generate rooms from walls
    this.generateRoomsFromWalls()

    // Add dimensions and annotations
    this.generateAnnotations()

    this.floorPlan.metadata.modified = new Date()
    console.log(`✅ Generated 2D floor plan with ${this.floorPlan.shapes.length} shapes`)

    return this.floorPlan
  }

  private convert3DTo2D(obj: SemanticObject): Shape2D | null {
    const pos = obj.transform.position
    const rot = obj.transform.rotation
    const dims = obj.metadata.dimensions

    // Project 3D position to 2D (top-down view)
    const position2D: Point2D = { x: pos.x, y: pos.z }

    switch (obj.metadata.category) {
      case 'structure':
        return this.convertStructureTo2D(obj, position2D, rot, dims)
      
      case 'equipment':
      case 'furniture':
      case 'storage':
        return this.convertObjectTo2D(obj, position2D, rot, dims)
      
      case 'utility':
        return this.convertUtilityTo2D(obj, position2D, rot, dims)
      
      case 'lighting':
        return this.convertLightingTo2D(obj, position2D, rot, dims)
      
      default:
        return this.convertGenericTo2D(obj, position2D, rot, dims)
    }
  }

  private convertStructureTo2D(
    obj: SemanticObject, 
    position: Point2D, 
    rotation: THREE.Euler, 
    dimensions: any
  ): Shape2D {
    if (obj.metadata.subcategory === 'wall') {
      // Convert wall to line
      const length = dimensions.width
      const thickness = dimensions.depth
      const angle = rotation.y

      const halfLength = length / 2
      const start: Point2D = {
        x: position.x - Math.cos(angle) * halfLength,
        y: position.y - Math.sin(angle) * halfLength
      }
      const end: Point2D = {
        x: position.x + Math.cos(angle) * halfLength,
        y: position.y + Math.sin(angle) * halfLength
      }

      return {
        id: `wall_2d_${obj.metadata.id}`,
        type: 'line',
        position,
        rotation: angle,
        scale: { x: 1, y: 1 },
        start,
        end,
        thickness,
        properties: {
          height: dimensions.height,
          material: obj.metadata.visual.material,
          isExterior: obj.metadata.subcategory === 'exterior-wall'
        }
      } as Line2D
    } else {
      // Convert other structures to rectangles
      return {
        id: `struct_2d_${obj.metadata.id}`,
        type: 'rectangle',
        position,
        rotation: rotation.y,
        scale: { x: 1, y: 1 },
        width: dimensions.width,
        height: dimensions.depth,
        properties: {
          category: obj.metadata.category,
          subcategory: obj.metadata.subcategory,
          material: obj.metadata.visual.material
        }
      } as Rectangle2D
    }
  }

  private convertObjectTo2D(
    obj: SemanticObject, 
    position: Point2D, 
    rotation: THREE.Euler, 
    dimensions: any
  ): Shape2D {
    if (obj.metadata.subcategory === 'tank' && dimensions.width === dimensions.depth) {
      // Circular tanks
      return {
        id: `obj_2d_${obj.metadata.id}`,
        type: 'circle',
        position,
        rotation: rotation.y,
        scale: { x: 1, y: 1 },
        radius: dimensions.width / 2,
        properties: {
          category: obj.metadata.category,
          subcategory: obj.metadata.subcategory,
          name: obj.metadata.name
        }
      } as Circle2D
    } else {
      // Rectangular objects
      return {
        id: `obj_2d_${obj.metadata.id}`,
        type: 'rectangle',
        position,
        rotation: rotation.y,
        scale: { x: 1, y: 1 },
        width: dimensions.width,
        height: dimensions.depth,
        properties: {
          category: obj.metadata.category,
          subcategory: obj.metadata.subcategory,
          name: obj.metadata.name
        }
      } as Rectangle2D
    }
  }

  private convertUtilityTo2D(
    obj: SemanticObject, 
    position: Point2D, 
    rotation: THREE.Euler, 
    dimensions: any
  ): Shape2D {
    return {
      id: `util_2d_${obj.metadata.id}`,
      type: 'rectangle',
      position,
      rotation: rotation.y,
      scale: { x: 1, y: 1 },
      width: dimensions.width,
      height: dimensions.depth,
      properties: {
        category: obj.metadata.category,
        subcategory: obj.metadata.subcategory,
        name: obj.metadata.name,
        connections: obj.metadata.connections.map(conn => conn.type)
      }
    } as Rectangle2D
  }

  private convertLightingTo2D(
    obj: SemanticObject, 
    position: Point2D, 
    rotation: THREE.Euler, 
    dimensions: any
  ): Shape2D {
    return {
      id: `light_2d_${obj.metadata.id}`,
      type: 'circle',
      position,
      rotation: rotation.y,
      scale: { x: 1, y: 1 },
      radius: Math.max(dimensions.width, dimensions.depth) / 2,
      properties: {
        category: obj.metadata.category,
        subcategory: obj.metadata.subcategory,
        name: obj.metadata.name,
        powerConsumption: obj.metadata.operational?.powerConsumption
      }
    } as Circle2D
  }

  private convertGenericTo2D(
    obj: SemanticObject, 
    position: Point2D, 
    rotation: THREE.Euler, 
    dimensions: any
  ): Shape2D {
    return {
      id: `generic_2d_${obj.metadata.id}`,
      type: 'rectangle',
      position,
      rotation: rotation.y,
      scale: { x: 1, y: 1 },
      width: dimensions.width,
      height: dimensions.depth,
      properties: {
        category: obj.metadata.category,
        name: obj.metadata.name
      }
    } as Rectangle2D
  }

  private getLayerForObject(obj: SemanticObject): string {
    switch (obj.metadata.category) {
      case 'structure':
        return obj.metadata.subcategory === 'wall' ? 'walls' : 'walls'
      case 'equipment':
        return 'equipment'
      case 'furniture':
        return 'furniture'
      case 'utility':
        return 'utilities'
      case 'lighting':
        return 'utilities'
      case 'opening':
        return 'doors'
      default:
        return 'equipment'
    }
  }

  // Generate rooms from wall layout
  private generateRoomsFromWalls(): Room2D[] {
    const walls = this.floorPlan.shapes.filter(shape => shape.type === 'line') as Line2D[]
    const rooms: Room2D[] = []

    // Simplified room detection - find enclosed areas
    const wallSegments = walls.map(wall => ({
      start: wall.start,
      end: wall.end,
      wall
    }))

    // Use a simple polygon tracing algorithm
    const enclosedPolygons = this.findEnclosedPolygons(wallSegments)

    for (const [index, polygon] of enclosedPolygons.entries()) {
      const room: Room2D = {
        id: `room_${index}`,
        name: `Room ${index + 1}`,
        boundary: polygon,
        area: this.calculatePolygonArea(polygon),
        perimeter: this.calculatePolygonPerimeter(polygon),
        centroid: this.calculatePolygonCentroid(polygon),
        properties: {
          type: this.classifyRoom(polygon),
          occupancy: 0,
          ventilation: false,
          climate: 'unconditioned'
        }
      }
      rooms.push(room)
    }

    return rooms
  }

  private findEnclosedPolygons(segments: Array<{ start: Point2D; end: Point2D }>): Point2D[][] {
    // Simplified polygon detection
    // In a real implementation, this would use a proper polygon tracing algorithm
    const polygons: Point2D[][] = []
    
    // For now, return empty array - this would need a complex geometric algorithm
    return polygons
  }

  private calculatePolygonArea(points: Point2D[]): number {
    if (points.length < 3) return 0
    
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].y
      area -= points[j].x * points[i].y
    }
    return Math.abs(area) / 2
  }

  private calculatePolygonPerimeter(points: Point2D[]): number {
    let perimeter = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      const dx = points[j].x - points[i].x
      const dy = points[j].y - points[i].y
      perimeter += Math.sqrt(dx * dx + dy * dy)
    }
    return perimeter
  }

  private calculatePolygonCentroid(points: Point2D[]): Point2D {
    let cx = 0, cy = 0
    for (const point of points) {
      cx += point.x
      cy += point.y
    }
    return { x: cx / points.length, y: cy / points.length }
  }

  private classifyRoom(boundary: Point2D[]): Room2D['properties']['type'] {
    const area = this.calculatePolygonArea(boundary)
    
    if (area < 100) return 'utility'
    if (area < 500) return 'office'
    if (area < 2000) return 'storage'
    return 'production'
  }

  // Generate automatic annotations
  private generateAnnotations() {
    const annotations: Annotation2D[] = []

    // Add wall dimensions
    const walls = this.floorPlan.shapes.filter(shape => shape.type === 'line') as Line2D[]
    for (const wall of walls) {
      const length = Math.sqrt(
        Math.pow(wall.end.x - wall.start.x, 2) + 
        Math.pow(wall.end.y - wall.start.y, 2)
      )
      
      const midpoint: Point2D = {
        x: (wall.start.x + wall.end.x) / 2,
        y: (wall.start.y + wall.end.y) / 2
      }

      annotations.push({
        id: `dim_${wall.id}`,
        type: 'dimension',
        position: midpoint,
        text: `${length.toFixed(1)}'`,
        style: {
          fontSize: 12,
          color: '#000000',
          arrow: true
        }
      })
    }

    // Add area labels for large objects
    const largeObjects = this.floorPlan.shapes.filter(shape => {
      if (shape.type === 'rectangle') {
        const rect = shape as Rectangle2D
        return rect.width * rect.height > 50
      }
      if (shape.type === 'circle') {
        const circle = shape as Circle2D
        return Math.PI * circle.radius * circle.radius > 50
      }
      return false
    })

    for (const obj of largeObjects) {
      annotations.push({
        id: `label_${obj.id}`,
        type: 'label',
        position: obj.position,
        text: obj.properties.name || obj.properties.category || 'Object',
        style: {
          fontSize: 10,
          color: '#333333',
          background: '#FFFFFF'
        }
      })
    }

    this.floorPlan.annotations = annotations
  }

  // Sync 2D changes back to 3D
  sync2DTo3D(shape2D: Shape2D): SemanticObject | null {
    const objectId = this.shape3DMapping.get(shape2D.id)
    if (!objectId) return null

    const obj3D = this.semantic3DObjects.get(objectId)
    if (!obj3D) return null

    // Update 3D object transform from 2D shape
    const newPosition = new THREE.Vector3(
      shape2D.position.x,
      obj3D.transform.position.y, // Keep original Y
      shape2D.position.y
    )

    const newRotation = new THREE.Euler(
      obj3D.transform.rotation.x,
      shape2D.rotation,
      obj3D.transform.rotation.z
    )

    obj3D.updateTransform(newPosition, newRotation)

    console.log(`🔄 Synced 2D shape ${shape2D.id} to 3D object ${objectId}`)
    return obj3D
  }

  // Create walls from 2D path
  createWallsFromPath(path: Point2D[], thickness: number = 0.5, height: number = 17): Wall2D[] {
    const walls: Wall2D[] = []

    for (let i = 0; i < path.length - 1; i++) {
      const wall: Wall2D = {
        id: `wall_${i}_${Date.now()}`,
        start: path[i],
        end: path[i + 1],
        thickness,
        height,
        material: 'drywall',
        openings: [],
        properties: {
          isExterior: false,
          fireRating: 1
        }
      }
      walls.push(wall)
    }

    // Add walls to floor plan
    for (const wall of walls) {
      const shape2D: Line2D = {
        id: `shape_${wall.id}`,
        type: 'line',
        position: { 
          x: (wall.start.x + wall.end.x) / 2, 
          y: (wall.start.y + wall.end.y) / 2 
        },
        rotation: Math.atan2(wall.end.y - wall.start.y, wall.end.x - wall.start.x),
        scale: { x: 1, y: 1 },
        start: wall.start,
        end: wall.end,
        thickness: wall.thickness,
        properties: {
          height: wall.height,
          material: wall.material,
          isExterior: wall.properties.isExterior
        }
      }

      this.floorPlan.shapes.push(shape2D)
      const wallsLayer = this.floorPlan.layers.get('walls')
      if (wallsLayer) {
        wallsLayer.shapes.push(shape2D.id)
      }
    }

    return walls
  }

  // Auto-join walls at intersections
  autoJoinWalls(): void {
    const walls = this.floorPlan.shapes.filter(shape => shape.type === 'line') as Line2D[]
    const tolerance = 0.1

    for (let i = 0; i < walls.length; i++) {
      for (let j = i + 1; j < walls.length; j++) {
        const wall1 = walls[i]
        const wall2 = walls[j]

        // Check if walls should be joined
        if (this.pointsNearby(wall1.end, wall2.start, tolerance)) {
          wall1.end = wall2.start
        } else if (this.pointsNearby(wall1.end, wall2.end, tolerance)) {
          wall1.end = wall2.end
        } else if (this.pointsNearby(wall1.start, wall2.start, tolerance)) {
          wall1.start = wall2.start
        } else if (this.pointsNearby(wall1.start, wall2.end, tolerance)) {
          wall1.start = wall2.end
        }
      }
    }
  }

  private pointsNearby(p1: Point2D, p2: Point2D, tolerance: number): boolean {
    const dx = p1.x - p2.x
    const dy = p1.y - p2.y
    return Math.sqrt(dx * dx + dy * dy) < tolerance
  }

  // Export floor plan
  exportFloorPlan(): FloorPlan2D {
    return JSON.parse(JSON.stringify(this.floorPlan))
  }

  // Import floor plan
  importFloorPlan(floorPlan: FloorPlan2D): void {
    this.floorPlan = floorPlan
  }

  // Get statistics
  getStats() {
    return {
      shapes: this.floorPlan.shapes.length,
      annotations: this.floorPlan.annotations.length,
      layers: this.floorPlan.layers.size,
      mappings: {
        shape3D: this.shape3DMapping.size,
        object2D: this.object2DMapping.size
      },
      bounds: this.floorPlan.bounds,
      scale: this.floorPlan.scale
    }
  }

  // Getters
  getFloorPlan(): FloorPlan2D {
    return this.floorPlan
  }

  getShape(id: string): Shape2D | undefined {
    return this.floorPlan.shapes.find(shape => shape.id === id)
  }

  getShapesByLayer(layerId: string): Shape2D[] {
    const layer = this.floorPlan.layers.get(layerId)
    if (!layer) return []

    return this.floorPlan.shapes.filter(shape => layer.shapes.includes(shape.id))
  }

  get3DObjectFromShape(shapeId: string): SemanticObject | undefined {
    const objectId = this.shape3DMapping.get(shapeId)
    return objectId ? this.semantic3DObjects.get(objectId) : undefined
  }

  getShapeFrom3DObject(objectId: string): Shape2D | undefined {
    const shapeId = this.object2DMapping.get(objectId)
    return shapeId ? this.getShape(shapeId) : undefined
  }
}
