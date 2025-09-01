import * as THREE from 'three'

/**
 * PLUMBING SYSTEM - Path-Based Pipe System
 * 
 * This module implements intelligent path-based pipes that replace individual fixtures
 * with smart routing, automatic fitting insertion, and material-based rendering.
 * 
 * Key Features:
 * - Path-based pipe creation with start, bends, and end points
 * - Automatic pipe segment generation between points
 * - Smart elbow/tee fitting insertion at direction changes
 * - Support for multiple materials (PEX, copper, PVC)
 * - Diameter sizing (1/2", 3/4", 1", etc.)
 * - Color coding by system type and material
 */

export interface PipePoint {
  x: number
  y: number
  z: number
  /** Optional fitting type at this point */
  fitting?: 'elbow' | 'tee' | 'coupling' | 'reducer' | 'cap'
  /** Optional connection info for branching */
  connections?: PipeConnection[]
}

export interface PipeConnection {
  /** Connected pipe system ID */
  systemId: string
  /** Connection diameter */
  diameter: number
  /** Connection type */
  type: 'inlet' | 'outlet' | 'branch'
}

export interface PipeMaterial {
  name: string
  color: string
  roughness: number
  metalness: number
  /** Cost per foot */
  costPerFoot: number
  /** Maximum working pressure (PSI) */
  maxPressure: number
  /** Temperature range */
  temperatureRange: { min: number, max: number }
  /** Minimum bend radius multiplier (x diameter) */
  minBendRadius: number
}

export interface PlumbingSystemConfig {
  id: string
  name: string
  systemType: 'hot_water' | 'cold_water' | 'waste' | 'vent' | 'gas' | 'compressed_air'
  material: 'pex' | 'copper' | 'pvc' | 'cpvc' | 'steel' | 'cast_iron'
  diameter: 0.5 | 0.75 | 1.0 | 1.25 | 1.5 | 2.0 | 2.5 | 3.0 | 4.0 | 6.0
  path: PipePoint[]
  /** Working pressure (PSI) */
  pressure?: number
  /** Insulation required */
  insulated?: boolean
  /** Support spacing (inches) */
  supportSpacing?: number
}

export class PlumbingSystem {
  private config: PlumbingSystemConfig
  private geometry: THREE.Group
  private materials: Map<string, PipeMaterial>
  private pipeSegments: THREE.Mesh[] = []
  private fittings: THREE.Mesh[] = []

  constructor(config: PlumbingSystemConfig) {
    this.config = config
    this.geometry = new THREE.Group()
    this.materials = new Map()
    this.initializeMaterials()
    // Don't generate geometry here - let SmartPipeRenderer handle it
  }

  private initializeMaterials() {
    // PEX Materials - Realistic bright colors
    this.materials.set('pex', {
      name: 'PEX Cross-linked Polyethylene',
      color: this.config.systemType === 'hot_water' ? '#FF2222' : '#0055FF', // Very bright red and blue for visibility
      roughness: 0.4, // Smoother surface
      metalness: 0.0,
      costPerFoot: 0.75,
      maxPressure: this.config.systemType === 'hot_water' ? 80 : 160,
      temperatureRange: { min: 32, max: 200 },
      minBendRadius: 5.0
    })

    // Copper Materials - Realistic shiny copper
    this.materials.set('copper', {
      name: 'Type L Copper',
      color: '#D2691E', // Rich copper color
      roughness: 0.1, // Very shiny
      metalness: 0.95, // Highly metallic
      costPerFoot: 2.50,
      maxPressure: 200,
      temperatureRange: { min: 32, max: 400 },
      minBendRadius: 3.0
    })

    // PVC Materials - Realistic white/gray PVC
    this.materials.set('pvc', {
      name: 'PVC Schedule 40',
      color: this.config.systemType === 'waste' ? '#DDDDDD' : '#F8F8FF', // Light gray for waste, off-white for supply
      roughness: 0.3, // Smooth plastic surface
      metalness: 0.0,
      costPerFoot: 1.25,
      maxPressure: 200,
      temperatureRange: { min: 32, max: 140 },
      minBendRadius: 6.0
    })

    // CPVC Materials
    this.materials.set('cpvc', {
      name: 'CPVC Schedule 80',
      color: '#F5DEB3',
      roughness: 0.9,
      metalness: 0.0,
      costPerFoot: 1.75,
      maxPressure: 400,
      temperatureRange: { min: 32, max: 200 },
      minBendRadius: 4.0
    })

    // Steel Materials
    this.materials.set('steel', {
      name: 'Galvanized Steel',
      color: '#708090',
      roughness: 0.4,
      metalness: 0.7,
      costPerFoot: 3.00,
      maxPressure: 300,
      temperatureRange: { min: 32, max: 400 },
      minBendRadius: 2.5
    })

    // Cast Iron Materials
    this.materials.set('cast_iron', {
      name: 'Cast Iron',
      color: '#2F4F4F',
      roughness: 0.6,
      metalness: 0.5,
      costPerFoot: 4.00,
      maxPressure: 150,
      temperatureRange: { min: 32, max: 300 },
      minBendRadius: 4.0
    })
  }

  private generatePipeSystem() {
    this.geometry.clear()
    this.pipeSegments = []
    this.fittings = []

    if (this.config.path.length < 2) {
      console.warn('PlumbingSystem: Path must have at least 2 points')
      return
    }

    // Generate pipe segments between points
    for (let i = 0; i < this.config.path.length - 1; i++) {
      const startPoint = this.config.path[i]
      const endPoint = this.config.path[i + 1]
      
      // Create pipe segment
      const segment = this.createPipeSegment(startPoint, endPoint)
      this.pipeSegments.push(segment)
      this.geometry.add(segment)

      // Create fitting at end point if direction changes or specified
      if (i < this.config.path.length - 2 || endPoint.fitting) {
        const fitting = this.createFitting(endPoint, i)
        if (fitting) {
          this.fittings.push(fitting)
          this.geometry.add(fitting)
        }
      }
    }

    // Add fittings at start point if specified
    if (this.config.path[0].fitting) {
      const startFitting = this.createFitting(this.config.path[0], 0)
      if (startFitting) {
        this.fittings.push(startFitting)
        this.geometry.add(startFitting)
      }
    }
  }

  private createPipeSegment(start: PipePoint, end: PipePoint): THREE.Mesh {
    const startVec = new THREE.Vector3(start.x, start.y, start.z)
    const endVec = new THREE.Vector3(end.x, end.y, end.z)
    const distance = startVec.distanceTo(endVec)
    const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize()

    // Create realistic pipe geometry - much thicker and more visible
    const radius = Math.max(this.config.diameter * 0.15, 0.12) // Much thicker pipes, minimum 0.12 units (about 1.5" visible)
    const geometry = new THREE.CylinderGeometry(radius, radius, distance, 24) // More segments for smoother pipes
    
    // Create realistic material with proper textures and lighting
    const materialConfig = this.materials.get(this.config.material)!
    const material = new THREE.MeshStandardMaterial({
      color: materialConfig.color,
      roughness: materialConfig.roughness,
      metalness: materialConfig.metalness,
      transparent: false, // Make pipes solid and opaque
      opacity: 1.0,
      // Add subtle material variations for realism
      envMapIntensity: materialConfig.metalness > 0.5 ? 0.8 : 0.2,
      // Add slight edge glow for better visibility without being unrealistic
      emissive: new THREE.Color(materialConfig.color).multiplyScalar(0.02),
      emissiveIntensity: 0.1,
      // Improve surface quality
      side: THREE.FrontSide,
      shadowSide: THREE.FrontSide
    })

    const pipe = new THREE.Mesh(geometry, material)

    // Position and orient the pipe
    const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)
    pipe.position.copy(midPoint)

    // Orient pipe along the direction vector
    const up = new THREE.Vector3(0, 1, 0)
    if (Math.abs(direction.dot(up)) > 0.99) {
      // Handle vertical pipes
      pipe.lookAt(endVec)
    } else {
      // Calculate rotation for non-vertical pipes
      const axis = new THREE.Vector3().crossVectors(up, direction).normalize()
      const angle = Math.acos(up.dot(direction))
      pipe.rotateOnAxis(axis, angle)
    }

    // Add metadata
    pipe.userData = {
      type: 'pipe_segment',
      systemId: this.config.id,
      material: this.config.material,
      diameter: this.config.diameter,
      length: distance,
      startPoint: start,
      endPoint: end
    }

    return pipe
  }

  private createFitting(point: PipePoint, index: number): THREE.Mesh | null {
    if (!point.fitting) {
      // Auto-determine fitting type based on path geometry
      if (index === 0) {
        point.fitting = 'cap' // Start cap
      } else if (index === this.config.path.length - 1) {
        point.fitting = 'cap' // End cap
      } else {
        // Check for direction change
        const prevPoint = this.config.path[index - 1]
        const nextPoint = this.config.path[index + 1]
        
        const dir1 = new THREE.Vector3(
          point.x - prevPoint.x,
          point.y - prevPoint.y,
          point.z - prevPoint.z
        ).normalize()
        
        const dir2 = new THREE.Vector3(
          nextPoint.x - point.x,
          nextPoint.y - point.y,
          nextPoint.z - point.z
        ).normalize()

        const angle = Math.acos(Math.max(-1, Math.min(1, dir1.dot(dir2))))
        const angleDegrees = (angle * 180) / Math.PI

        if (angleDegrees > 45) {
          point.fitting = 'elbow'
        } else {
          return null // No fitting needed for slight bends
        }
      }
    }

    return this.createFittingGeometry(point, point.fitting)
  }

  private createFittingGeometry(point: PipePoint, fittingType: string): THREE.Mesh {
    const radius = (this.config.diameter / 12) / 2
    const materialConfig = this.materials.get(this.config.material)!
    
    let geometry: THREE.BufferGeometry
    
    switch (fittingType) {
      case 'elbow':
        // Create 90-degree elbow using torus geometry
        geometry = new THREE.TorusGeometry(radius * 2, radius, 8, 16, Math.PI / 2)
        break
      case 'tee':
        // Create T-fitting using cylinder and sphere combination
        geometry = new THREE.SphereGeometry(radius * 1.5, 12, 8)
        break
      case 'coupling':
        // Create straight coupling
        geometry = new THREE.CylinderGeometry(radius * 1.2, radius * 1.2, radius * 2, 12)
        break
      case 'reducer':
        // Create reducer fitting
        geometry = new THREE.CylinderGeometry(radius, radius * 0.75, radius * 2, 12)
        break
      case 'cap':
        // Create end cap
        geometry = new THREE.SphereGeometry(radius, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2)
        break
      default:
        geometry = new THREE.SphereGeometry(radius, 8, 6)
    }

    // Create material with slightly different color for fittings
    const fittingColor = this.adjustColorBrightness(materialConfig.color, -0.2)
    const material = new THREE.MeshStandardMaterial({
      color: fittingColor,
      roughness: materialConfig.roughness,
      metalness: materialConfig.metalness,
      transparent: true,
      opacity: 0.9
    })

    const fitting = new THREE.Mesh(geometry, material)
    fitting.position.set(point.x, point.y, point.z)

    // Add metadata
    fitting.userData = {
      type: 'fitting',
      fittingType: fittingType,
      systemId: this.config.id,
      material: this.config.material,
      diameter: this.config.diameter,
      point: point
    }

    return fitting
  }

  private adjustColorBrightness(color: string, amount: number): string {
    const num = parseInt(color.replace('#', ''), 16)
    const amt = Math.round(2.55 * amount * 100)
    const R = (num >> 16) + amt
    const G = (num >> 8 & 0x00FF) + amt
    const B = (num & 0x0000FF) + amt
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1)
  }

  // Public methods
  public getGeometry(): THREE.Group {
    return this.geometry
  }

  public getConfig(): PlumbingSystemConfig {
    return { ...this.config }
  }

  public setSelected(selected: boolean) {
    // Highlight selected pipes with brighter colors and outline
    this.pipeSegments.forEach(segment => {
      const material = segment.material as THREE.MeshStandardMaterial
      if (selected) {
        material.emissiveIntensity = 0.2 // Brighter glow when selected
        material.opacity = 1.0
        // Add a slight outline effect
        segment.scale.setScalar(1.1)
      } else {
        material.emissiveIntensity = 0.05 // Normal glow
        material.opacity = 0.95
        segment.scale.setScalar(1.0)
      }
    })

    this.fittings.forEach(fitting => {
      const material = fitting.material as THREE.MeshStandardMaterial
      if (selected) {
        material.emissiveIntensity = 0.2
        material.opacity = 1.0
        fitting.scale.setScalar(1.1)
      } else {
        material.emissiveIntensity = 0.05
        material.opacity = 0.95
        fitting.scale.setScalar(1.0)
      }
    })
  }

  public updatePath(newPath: PipePoint[]) {
    this.config.path = newPath
    // Geometry will be updated by SmartPipeRenderer
  }

  public addPoint(point: PipePoint, index?: number) {
    if (index !== undefined) {
      this.config.path.splice(index, 0, point)
    } else {
      this.config.path.push(point)
    }
    // Geometry will be updated by SmartPipeRenderer
  }

  public removePoint(index: number) {
    if (index >= 0 && index < this.config.path.length) {
      this.config.path.splice(index, 1)
      // Geometry will be updated by SmartPipeRenderer
    }
  }

  public updatePoint(index: number, point: Partial<PipePoint>) {
    if (index >= 0 && index < this.config.path.length) {
      Object.assign(this.config.path[index], point)
      // Geometry will be updated by SmartPipeRenderer
    }
  }

  public changeMaterial(material: PlumbingSystemConfig['material']) {
    this.config.material = material
    // Geometry will be updated by SmartPipeRenderer
  }

  public changeDiameter(diameter: PlumbingSystemConfig['diameter']) {
    this.config.diameter = diameter
    // Geometry will be updated by SmartPipeRenderer
  }

  public calculateTotalLength(): number {
    let totalLength = 0
    for (let i = 0; i < this.config.path.length - 1; i++) {
      const start = this.config.path[i]
      const end = this.config.path[i + 1]
      const distance = Math.sqrt(
        Math.pow(end.x - start.x, 2) +
        Math.pow(end.y - start.y, 2) +
        Math.pow(end.z - start.z, 2)
      )
      totalLength += distance
    }
    return totalLength
  }

  public calculateTotalCost(): number {
    const materialConfig = this.materials.get(this.config.material)!
    const totalLength = this.calculateTotalLength()
    const pipeCost = totalLength * materialConfig.costPerFoot
    
    // Add fitting costs (estimated $5-25 per fitting depending on size)
    const fittingCost = this.fittings.length * (5 + this.config.diameter * 10)
    
    return pipeCost + fittingCost
  }

  public validateSystem(): { valid: boolean, errors: string[] } {
    const errors: string[] = []
    const materialConfig = this.materials.get(this.config.material)!

    // Check pressure rating
    if (this.config.pressure && this.config.pressure > materialConfig.maxPressure) {
      errors.push(`System pressure (${this.config.pressure} PSI) exceeds material limit (${materialConfig.maxPressure} PSI)`)
    }

    // Check minimum bend radius
    for (let i = 1; i < this.config.path.length - 1; i++) {
      const prevPoint = this.config.path[i - 1]
      const currentPoint = this.config.path[i]
      const nextPoint = this.config.path[i + 1]

      const dist1 = Math.sqrt(
        Math.pow(currentPoint.x - prevPoint.x, 2) +
        Math.pow(currentPoint.y - prevPoint.y, 2) +
        Math.pow(currentPoint.z - prevPoint.z, 2)
      )

      const dist2 = Math.sqrt(
        Math.pow(nextPoint.x - currentPoint.x, 2) +
        Math.pow(nextPoint.y - currentPoint.y, 2) +
        Math.pow(nextPoint.z - currentPoint.z, 2)
      )

      const minRadius = (this.config.diameter * materialConfig.minBendRadius) / 12
      if (dist1 < minRadius || dist2 < minRadius) {
        errors.push(`Bend at point ${i} violates minimum bend radius (${minRadius.toFixed(2)} ft)`)
      }
    }

    // Check path length
    if (this.config.path.length < 2) {
      errors.push('Path must have at least 2 points')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  public dispose() {
    // Clean up geometry and materials
    this.pipeSegments.forEach(segment => {
      segment.geometry.dispose()
      if (Array.isArray(segment.material)) {
        segment.material.forEach(mat => mat.dispose())
      } else {
        segment.material.dispose()
      }
    })

    this.fittings.forEach(fitting => {
      fitting.geometry.dispose()
      if (Array.isArray(fitting.material)) {
        fitting.material.forEach(mat => mat.dispose())
      } else {
        fitting.material.dispose()
      }
    })

    this.geometry.clear()
    this.pipeSegments = []
    this.fittings = []
  }
}

/**
 * PlumbingSystemManager - Manages multiple plumbing systems
 */
export class PlumbingSystemManager {
  private systems: Map<string, PlumbingSystem> = new Map()
  private scene: THREE.Group

  constructor() {
    this.scene = new THREE.Group()
    this.scene.name = 'PlumbingSystems'
  }

  public createSystem(config: PlumbingSystemConfig): PlumbingSystem {
    const system = new PlumbingSystem(config)
    this.systems.set(config.id, system)
    // Don't add to scene here - let SmartPipeRenderer handle rendering
    return system
  }

  public getSystem(id: string): PlumbingSystem | undefined {
    return this.systems.get(id)
  }

  public removeSystem(id: string): boolean {
    const system = this.systems.get(id)
    if (system) {
      // Don't remove from scene here - SmartPipeRenderer handles it
      system.dispose()
      return this.systems.delete(id)
    }
    return false
  }

  public getAllSystems(): PlumbingSystem[] {
    return Array.from(this.systems.values())
  }

  public getScene(): THREE.Group {
    return this.scene
  }

  public exportSystemsData(): PlumbingSystemConfig[] {
    return Array.from(this.systems.values()).map(system => system.getConfig())
  }

  public importSystemsData(configs: PlumbingSystemConfig[]) {
    // Clear existing systems
    this.systems.forEach(system => system.dispose())
    this.systems.clear()
    this.scene.clear()

    // Create new systems
    configs.forEach(config => this.createSystem(config))
  }

  public dispose() {
    this.systems.forEach(system => system.dispose())
    this.systems.clear()
    this.scene.clear()
  }
}
