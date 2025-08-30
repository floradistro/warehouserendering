import { Vector3, Ray, Raycaster, Object3D, Geometry, BufferGeometry, Mesh } from 'three'
import {
  Measurement,
  LinearMeasurement,
  AngularMeasurement,
  AreaMeasurement,
  VolumeMeasurement,
  RadiusMeasurement,
  DiameterMeasurement,
  PathMeasurement,
  ClearanceMeasurement,
  SnapPoint,
  SnapPointType,
  Unit,
  UNIT_CONVERSIONS
} from './MeasurementTypes'

/**
 * Core measurement engine that handles all measurement calculations,
 * geometric analysis, and precision operations
 */
export class MeasurementEngine {
  private raycaster: Raycaster
  private tempVector3: Vector3
  private epsilon: number = 1e-10
  
  constructor() {
    this.raycaster = new Raycaster()
    this.tempVector3 = new Vector3()
  }
  
  // ===== DISTANCE CALCULATIONS =====
  
  /**
   * Calculate distance between two points with unit conversion
   */
  calculateDistance(point1: Vector3, point2: Vector3, unit: Unit = 'feet'): number {
    const distance = point1.distanceTo(point2)
    return this.convertUnit(distance, 'feet', unit)
  }
  
  /**
   * Calculate HORIZONTAL distance only (ignores Y differences)
   * This is the default for warehouse measurements
   */
  calculateHorizontalDistance(point1: Vector3, point2: Vector3, unit: Unit = 'feet'): number {
    const horizontalDistance = Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.z - point1.z, 2)
    )
    return this.convertUnit(horizontalDistance, 'feet', unit)
  }
  
  /**
   * Calculate multi-point chain distance
   */
  calculateChainDistance(points: Vector3[], unit: Unit = 'feet'): {
    totalDistance: number
    segments: Array<{ distance: number; startPoint: Vector3; endPoint: Vector3 }>
  } {
    let totalDistance = 0
    const segments = []
    
    for (let i = 0; i < points.length - 1; i++) {
      const distance = this.calculateDistance(points[i], points[i + 1], unit)
      totalDistance += distance
      segments.push({
        distance,
        startPoint: points[i].clone(),
        endPoint: points[i + 1].clone()
      })
    }
    
    return { totalDistance, segments }
  }
  
  /**
   * Calculate perpendicular distance from point to line
   */
  calculatePerpendicularDistance(
    point: Vector3, 
    lineStart: Vector3, 
    lineEnd: Vector3,
    unit: Unit = 'feet'
  ): number {
    const lineVector = new Vector3().subVectors(lineEnd, lineStart)
    const pointVector = new Vector3().subVectors(point, lineStart)
    
    const lineLength = lineVector.length()
    if (lineLength < this.epsilon) return this.calculateDistance(point, lineStart, unit)
    
    const projection = pointVector.dot(lineVector) / lineLength
    const projectionClamped = Math.max(0, Math.min(lineLength, projection))
    
    const closestPoint = lineStart.clone().add(
      lineVector.normalize().multiplyScalar(projectionClamped)
    )
    
    return this.calculateDistance(point, closestPoint, unit)
  }
  
  // ===== ANGULAR CALCULATIONS =====
  
  /**
   * Calculate angle between three points (vertex in middle)
   */
  calculateAngle(startPoint: Vector3, vertex: Vector3, endPoint: Vector3): number {
    const v1 = new Vector3().subVectors(startPoint, vertex).normalize()
    const v2 = new Vector3().subVectors(endPoint, vertex).normalize()
    
    // Handle edge cases
    if (v1.length() < this.epsilon || v2.length() < this.epsilon) return 0
    
    const dot = v1.dot(v2)
    const clampedDot = Math.max(-1, Math.min(1, dot)) // Clamp to avoid numerical errors
    return Math.acos(clampedDot)
  }
  
  /**
   * Calculate angle between two vectors
   */
  calculateVectorAngle(vector1: Vector3, vector2: Vector3): number {
    const dot = vector1.normalize().dot(vector2.normalize())
    const clampedDot = Math.max(-1, Math.min(1, dot))
    return Math.acos(clampedDot)
  }
  
  /**
   * Calculate signed angle in a specific plane
   */
  calculateSignedAngle(
    startPoint: Vector3,
    vertex: Vector3,
    endPoint: Vector3,
    normal: Vector3
  ): number {
    const v1 = new Vector3().subVectors(startPoint, vertex).normalize()
    const v2 = new Vector3().subVectors(endPoint, vertex).normalize()
    
    const angle = this.calculateAngle(startPoint, vertex, endPoint)
    const cross = new Vector3().crossVectors(v1, v2)
    const sign = Math.sign(cross.dot(normal))
    
    return angle * sign
  }
  
  // ===== AREA CALCULATIONS =====
  
  /**
   * Calculate area of a polygon using shoelace formula (2D projection)
   */
  calculatePolygonArea(points: Vector3[], unit: 'sqft' | 'sqm' = 'sqft'): number {
    if (points.length < 3) return 0
    
    // Project to XZ plane (assuming Y is up)
    let area = 0
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length
      area += points[i].x * points[j].z - points[j].x * points[i].z
    }
    area = Math.abs(area) / 2
    
    // Convert units if needed
    if (unit === 'sqm') {
      area = area * 0.092903 // ft² to m²
    }
    
    return area
  }
  
  /**
   * Calculate 3D polygon area using cross product
   */
  calculate3DPolygonArea(points: Vector3[], unit: 'sqft' | 'sqm' = 'sqft'): number {
    if (points.length < 3) return 0
    
    let area = 0
    const normal = new Vector3()
    
    // Calculate normal using Newell's method for robustness
    for (let i = 0; i < points.length; i++) {
      const current = points[i]
      const next = points[(i + 1) % points.length]
      
      normal.x += (current.y - next.y) * (current.z + next.z)
      normal.y += (current.z - next.z) * (current.x + next.x)
      normal.z += (current.x - next.x) * (current.y + next.y)
    }
    
    area = normal.length() / 2
    
    // Convert units if needed
    if (unit === 'sqm') {
      area = area * 0.092903 // ft² to m²
    }
    
    return area
  }
  
  /**
   * Calculate perimeter of a polygon
   */
  calculatePerimeter(points: Vector3[], unit: Unit = 'feet'): number {
    if (points.length < 2) return 0
    
    let perimeter = 0
    for (let i = 0; i < points.length; i++) {
      const next = (i + 1) % points.length
      perimeter += this.calculateDistance(points[i], points[next], unit)
    }
    
    return perimeter
  }
  
  /**
   * Calculate centroid of a polygon
   */
  calculateCentroid(points: Vector3[]): Vector3 {
    if (points.length === 0) return new Vector3()
    
    const centroid = new Vector3()
    points.forEach(point => centroid.add(point))
    centroid.divideScalar(points.length)
    
    return centroid
  }
  
  // ===== VOLUME CALCULATIONS =====
  
  /**
   * Calculate volume of a bounding box
   */
  calculateBoxVolume(min: Vector3, max: Vector3, unit: 'cuft' | 'cum' = 'cuft'): number {
    const dimensions = new Vector3().subVectors(max, min)
    let volume = Math.abs(dimensions.x * dimensions.y * dimensions.z)
    
    // Convert units if needed
    if (unit === 'cum') {
      volume = volume * 0.0283168 // ft³ to m³
    }
    
    return volume
  }
  
  /**
   * Calculate volume using convex hull (approximate for complex shapes)
   */
  calculateConvexHullVolume(points: Vector3[], unit: 'cuft' | 'cum' = 'cuft'): number {
    // Simplified implementation - in a real scenario, you'd use a proper convex hull algorithm
    if (points.length < 4) return 0
    
    // Find bounding box as approximation
    const min = new Vector3(Infinity, Infinity, Infinity)
    const max = new Vector3(-Infinity, -Infinity, -Infinity)
    
    points.forEach(point => {
      min.min(point)
      max.max(point)
    })
    
    return this.calculateBoxVolume(min, max, unit)
  }
  
  // ===== CLEARANCE CALCULATIONS =====
  
  /**
   * Calculate minimum clearance between objects
   */
  calculateMinimumClearance(
    object1Points: Vector3[],
    object2Points: Vector3[],
    unit: Unit = 'feet'
  ): {
    distance: number
    closestPoints: { point1: Vector3; point2: Vector3 }
  } {
    let minDistance = Infinity
    let closestPoint1 = new Vector3()
    let closestPoint2 = new Vector3()
    
    // Brute force approach - in production, use spatial indexing
    for (const p1 of object1Points) {
      for (const p2 of object2Points) {
        const distance = this.calculateDistance(p1, p2, unit)
        if (distance < minDistance) {
          minDistance = distance
          closestPoint1 = p1.clone()
          closestPoint2 = p2.clone()
        }
      }
    }
    
    return {
      distance: minDistance,
      closestPoints: {
        point1: closestPoint1,
        point2: closestPoint2
      }
    }
  }
  
  // ===== SNAP POINT GENERATION =====
  
  /**
   * Generate snap points for a given geometry
   */
  generateSnapPoints(
    object: Object3D,
    tolerance: number = 0.5
  ): SnapPoint[] {
    const snapPoints: SnapPoint[] = []
    
    // Handle different object types
    if (object instanceof Mesh) {
      const geometry = object.geometry
      const position = geometry.attributes.position
      
      if (position) {
        // Corner points
        const bounds = geometry.boundingBox
        if (bounds) {
          const corners = [
            new Vector3(bounds.min.x, bounds.min.y, bounds.min.z),
            new Vector3(bounds.max.x, bounds.min.y, bounds.min.z),
            new Vector3(bounds.max.x, bounds.max.y, bounds.min.z),
            new Vector3(bounds.min.x, bounds.max.y, bounds.min.z),
            new Vector3(bounds.min.x, bounds.min.y, bounds.max.z),
            new Vector3(bounds.max.x, bounds.min.y, bounds.max.z),
            new Vector3(bounds.max.x, bounds.max.y, bounds.max.z),
            new Vector3(bounds.min.x, bounds.max.y, bounds.max.z),
          ]
          
          corners.forEach((corner, index) => {
            snapPoints.push({
              position: corner.applyMatrix4(object.matrixWorld),
              type: 'corner' as SnapPointType,
              confidence: 1.0,
              description: `Corner ${index + 1}`,
              elementId: object.userData.id
            })
          })
          
          // Center point
          const center = new Vector3().addVectors(bounds.min, bounds.max).multiplyScalar(0.5)
          snapPoints.push({
            position: center.applyMatrix4(object.matrixWorld),
            type: 'center' as SnapPointType,
            confidence: 1.0,
            description: 'Center',
            elementId: object.userData.id
          })
          
          // Midpoints of edges
          const midpoints = [
            new Vector3((bounds.min.x + bounds.max.x) / 2, bounds.min.y, bounds.min.z),
            new Vector3((bounds.min.x + bounds.max.x) / 2, bounds.max.y, bounds.min.z),
            new Vector3((bounds.min.x + bounds.max.x) / 2, bounds.min.y, bounds.max.z),
            new Vector3((bounds.min.x + bounds.max.x) / 2, bounds.max.y, bounds.max.z),
            new Vector3(bounds.min.x, (bounds.min.y + bounds.max.y) / 2, bounds.min.z),
            new Vector3(bounds.max.x, (bounds.min.y + bounds.max.y) / 2, bounds.min.z),
            new Vector3(bounds.min.x, (bounds.min.y + bounds.max.y) / 2, bounds.max.z),
            new Vector3(bounds.max.x, (bounds.min.y + bounds.max.y) / 2, bounds.max.z),
          ]
          
          midpoints.forEach((midpoint, index) => {
            snapPoints.push({
              position: midpoint.applyMatrix4(object.matrixWorld),
              type: 'midpoint' as SnapPointType,
              confidence: 0.8,
              description: `Midpoint ${index + 1}`,
              elementId: object.userData.id
            })
          })
        }
      }
    }
    
    return snapPoints
  }
  
  /**
   * Find the closest snap point to a given position
   */
  findClosestSnapPoint(
    position: Vector3,
    snapPoints: SnapPoint[],
    tolerance: number = 0.5
  ): SnapPoint | null {
    let closestPoint: SnapPoint | null = null
    let minDistance = Infinity
    
    for (const snapPoint of snapPoints) {
      const distance = position.distanceTo(snapPoint.position)
      if (distance < tolerance && distance < minDistance) {
        minDistance = distance
        closestPoint = snapPoint
      }
    }
    
    return closestPoint
  }
  
  /**
   * Generate grid snap points
   */
  generateGridSnapPoints(
    center: Vector3,
    gridSize: number = 1,
    extent: number = 10,
    plane: 'xy' | 'xz' | 'yz' = 'xz'
  ): SnapPoint[] {
    const snapPoints: SnapPoint[] = []
    const halfExtent = extent / 2
    
    for (let i = -halfExtent; i <= halfExtent; i += gridSize) {
      for (let j = -halfExtent; j <= halfExtent; j += gridSize) {
        let position: Vector3
        
        switch (plane) {
          case 'xy':
            position = new Vector3(center.x + i, center.y + j, center.z)
            break
          case 'xz':
            position = new Vector3(center.x + i, center.y, center.z + j)
            break
          case 'yz':
            position = new Vector3(center.x, center.y + i, center.z + j)
            break
        }
        
        snapPoints.push({
          position,
          type: 'grid' as SnapPointType,
          confidence: 0.6,
          description: `Grid (${i}, ${j})`
        })
      }
    }
    
    return snapPoints
  }
  
  // ===== PRECISION AND ROUNDING =====
  
  /**
   * Round to precision based on unit and display preferences
   */
  roundToPrecision(value: number, precision: number): number {
    const factor = Math.pow(10, precision)
    return Math.round(value * factor) / factor
  }
  
  /**
   * Snap to nearest increment (e.g., nearest 1/16 inch)
   */
  snapToIncrement(value: number, increment: number): number {
    return Math.round(value / increment) * increment
  }
  
  // ===== UNIT CONVERSIONS =====
  
  /**
   * Convert between different units
   */
  convertUnit(value: number, fromUnit: Unit, toUnit: Unit): number {
    if (fromUnit === toUnit) return value
    
    // Convert to feet first (base unit)
    let inFeet = value
    if (fromUnit !== 'feet') {
      const conversion = UNIT_CONVERSIONS.toFeet[fromUnit as keyof typeof UNIT_CONVERSIONS.toFeet]
      if (conversion) {
        inFeet = value * conversion
      }
    }
    
    // Convert from feet to target unit
    if (toUnit !== 'feet') {
      const conversion = UNIT_CONVERSIONS.toFeet[toUnit as keyof typeof UNIT_CONVERSIONS.toFeet]
      if (conversion) {
        return inFeet / conversion
      }
    }
    
    return inFeet
  }
  
  // ===== GEOMETRIC UTILITIES =====
  
  /**
   * Check if a point is inside a polygon (2D, using ray casting)
   */
  isPointInPolygon(point: Vector3, polygon: Vector3[]): boolean {
    let inside = false
    const x = point.x
    const z = point.z
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x
      const zi = polygon[i].z
      const xj = polygon[j].x
      const zj = polygon[j].z
      
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) {
        inside = !inside
      }
    }
    
    return inside
  }
  
  /**
   * Calculate intersection point of two lines (2D)
   */
  calculateLineIntersection(
    line1Start: Vector3,
    line1End: Vector3,
    line2Start: Vector3,
    line2End: Vector3
  ): Vector3 | null {
    const x1 = line1Start.x, y1 = line1Start.z
    const x2 = line1End.x, y2 = line1End.z
    const x3 = line2Start.x, y3 = line2Start.z
    const x4 = line2End.x, y4 = line2End.z
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
    
    if (Math.abs(denom) < this.epsilon) return null // Lines are parallel
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      // Intersection exists within both line segments
      const intersectX = x1 + t * (x2 - x1)
      const intersectZ = y1 + t * (y2 - y1)
      
      // Use average Y coordinate
      const intersectY = (line1Start.y + line1End.y + line2Start.y + line2End.y) / 4
      
      return new Vector3(intersectX, intersectY, intersectZ)
    }
    
    return null
  }
  
  /**
   * Calculate the closest point on a line segment to a given point
   */
  getClosestPointOnLine(
    point: Vector3,
    lineStart: Vector3,
    lineEnd: Vector3
  ): Vector3 {
    const lineVector = new Vector3().subVectors(lineEnd, lineStart)
    const lineLength = lineVector.length()
    
    if (lineLength < this.epsilon) {
      return lineStart.clone()
    }
    
    const pointVector = new Vector3().subVectors(point, lineStart)
    const projection = pointVector.dot(lineVector) / (lineLength * lineLength)
    const clampedProjection = Math.max(0, Math.min(1, projection))
    
    return lineStart.clone().add(lineVector.multiplyScalar(clampedProjection))
  }
  
  // ===== VALIDATION =====
  
  /**
   * Validate that a measurement has valid geometry
   */
  validateMeasurement(measurement: Partial<Measurement>): string[] {
    const errors: string[] = []
    
    switch (measurement.type) {
      case 'linear':
        const linear = measurement as Partial<LinearMeasurement>
        if (!linear.points || linear.points.length < 2) {
          errors.push('Linear measurement requires at least 2 points')
        }
        if (linear.points && linear.points.some(p => !this.isValidPoint(p))) {
          errors.push('All points must have valid coordinates')
        }
        break
        
      case 'angular':
        const angular = measurement as Partial<AngularMeasurement>
        if (!angular.vertex || !angular.startPoint || !angular.endPoint) {
          errors.push('Angular measurement requires vertex, start, and end points')
        }
        if (angular.vertex && angular.startPoint && 
            angular.vertex.distanceTo(angular.startPoint) < this.epsilon) {
          errors.push('Vertex and start point cannot be the same')
        }
        if (angular.vertex && angular.endPoint && 
            angular.vertex.distanceTo(angular.endPoint) < this.epsilon) {
          errors.push('Vertex and end point cannot be the same')
        }
        break
        
      case 'area':
        const area = measurement as Partial<AreaMeasurement>
        if (!area.boundary || area.boundary.length < 3) {
          errors.push('Area measurement requires at least 3 boundary points')
        }
        break
        
      case 'volume':
        const volume = measurement as Partial<VolumeMeasurement>
        if (!volume.boundingBox) {
          errors.push('Volume measurement requires a bounding box')
        }
        break
    }
    
    return errors
  }
  
  /**
   * Check if a point has valid coordinates
   */
  isValidPoint(point: Vector3): boolean {
    return !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
           isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
  }
}

// Export singleton instance
export const measurementEngine = new MeasurementEngine()
