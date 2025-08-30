import * as THREE from 'three'

// Spatial indexing for efficient collision detection and queries
export interface SpatialObject {
  id: string
  boundingBox: THREE.Box3
  position: THREE.Vector3
  userData: Record<string, any>
}

// Octree node for spatial partitioning
class OctreeNode {
  public bounds: THREE.Box3
  public objects: SpatialObject[] = []
  public children: OctreeNode[] = []
  public isLeaf = true
  public level: number

  constructor(bounds: THREE.Box3, level = 0) {
    this.bounds = bounds
    this.level = level
  }

  subdivide() {
    if (!this.isLeaf) return

    const center = this.bounds.getCenter(new THREE.Vector3())
    const size = this.bounds.getSize(new THREE.Vector3())
    const halfSize = size.clone().multiplyScalar(0.5)

    // Create 8 child nodes
    const childBounds = [
      // Bottom 4
      new THREE.Box3(
        new THREE.Vector3(this.bounds.min.x, this.bounds.min.y, this.bounds.min.z),
        new THREE.Vector3(center.x, center.y, center.z)
      ),
      new THREE.Box3(
        new THREE.Vector3(center.x, this.bounds.min.y, this.bounds.min.z),
        new THREE.Vector3(this.bounds.max.x, center.y, center.z)
      ),
      new THREE.Box3(
        new THREE.Vector3(this.bounds.min.x, this.bounds.min.y, center.z),
        new THREE.Vector3(center.x, center.y, this.bounds.max.z)
      ),
      new THREE.Box3(
        new THREE.Vector3(center.x, this.bounds.min.y, center.z),
        new THREE.Vector3(this.bounds.max.x, center.y, this.bounds.max.z)
      ),
      // Top 4
      new THREE.Box3(
        new THREE.Vector3(this.bounds.min.x, center.y, this.bounds.min.z),
        new THREE.Vector3(center.x, this.bounds.max.y, center.z)
      ),
      new THREE.Box3(
        new THREE.Vector3(center.x, center.y, this.bounds.min.z),
        new THREE.Vector3(this.bounds.max.x, this.bounds.max.y, center.z)
      ),
      new THREE.Box3(
        new THREE.Vector3(this.bounds.min.x, center.y, center.z),
        new THREE.Vector3(center.x, this.bounds.max.y, this.bounds.max.z)
      ),
      new THREE.Box3(
        new THREE.Vector3(center.x, center.y, center.z),
        new THREE.Vector3(this.bounds.max.x, this.bounds.max.y, this.bounds.max.z)
      )
    ]

    this.children = childBounds.map(bounds => new OctreeNode(bounds, this.level + 1))
    this.isLeaf = false

    // Redistribute objects to children
    for (const obj of this.objects) {
      this.insertIntoChildren(obj)
    }
    this.objects = []
  }

  private insertIntoChildren(obj: SpatialObject) {
    for (const child of this.children) {
      if (child.bounds.intersectsBox(obj.boundingBox)) {
        child.insert(obj)
      }
    }
  }

  insert(obj: SpatialObject) {
    if (!this.bounds.intersectsBox(obj.boundingBox)) {
      return false
    }

    if (this.isLeaf) {
      this.objects.push(obj)
      
      // Subdivide if we have too many objects and haven't reached max depth
      if (this.objects.length > 8 && this.level < 6) {
        this.subdivide()
      }
      return true
    }

    // Insert into appropriate children
    let inserted = false
    for (const child of this.children) {
      if (child.insert(obj)) {
        inserted = true
      }
    }
    return inserted
  }

  query(bounds: THREE.Box3, results: SpatialObject[] = []): SpatialObject[] {
    if (!this.bounds.intersectsBox(bounds)) {
      return results
    }

    if (this.isLeaf) {
      for (const obj of this.objects) {
        if (bounds.intersectsBox(obj.boundingBox)) {
          results.push(obj)
        }
      }
    } else {
      for (const child of this.children) {
        child.query(bounds, results)
      }
    }

    return results
  }

  queryPoint(point: THREE.Vector3, results: SpatialObject[] = []): SpatialObject[] {
    if (!this.bounds.containsPoint(point)) {
      return results
    }

    if (this.isLeaf) {
      for (const obj of this.objects) {
        if (obj.boundingBox.containsPoint(point)) {
          results.push(obj)
        }
      }
    } else {
      for (const child of this.children) {
        child.queryPoint(point, results)
      }
    }

    return results
  }

  remove(objId: string): boolean {
    if (this.isLeaf) {
      const index = this.objects.findIndex(obj => obj.id === objId)
      if (index !== -1) {
        this.objects.splice(index, 1)
        return true
      }
    } else {
      for (const child of this.children) {
        if (child.remove(objId)) {
          return true
        }
      }
    }
    return false
  }

  clear() {
    this.objects = []
    this.children = []
    this.isLeaf = true
  }

  // Get statistics for debugging
  getStats(): { totalNodes: number; leafNodes: number; totalObjects: number; maxDepth: number } {
    let totalNodes = 1
    let leafNodes = this.isLeaf ? 1 : 0
    let totalObjects = this.objects.length
    let maxDepth = this.level

    if (!this.isLeaf) {
      for (const child of this.children) {
        const childStats = child.getStats()
        totalNodes += childStats.totalNodes
        leafNodes += childStats.leafNodes
        totalObjects += childStats.totalObjects
        maxDepth = Math.max(maxDepth, childStats.maxDepth)
      }
    }

    return { totalNodes, leafNodes, totalObjects, maxDepth }
  }
}

export class SpatialIndex {
  private root: OctreeNode
  private objectMap = new Map<string, SpatialObject>()

  constructor(bounds: THREE.Box3) {
    this.root = new OctreeNode(bounds)
  }

  // Add object to spatial index
  addObject(obj: SpatialObject) {
    this.objectMap.set(obj.id, obj)
    this.root.insert(obj)
  }

  // Remove object from spatial index
  removeObject(id: string): boolean {
    const obj = this.objectMap.get(id)
    if (!obj) return false

    this.objectMap.delete(id)
    return this.root.remove(id)
  }

  // Update object position
  updateObject(id: string, newBoundingBox: THREE.Box3, newPosition: THREE.Vector3) {
    const obj = this.objectMap.get(id)
    if (!obj) return false

    // Remove from old position
    this.root.remove(id)

    // Update object
    obj.boundingBox = newBoundingBox
    obj.position = newPosition

    // Re-insert at new position
    this.root.insert(obj)
    return true
  }

  // Query objects in bounding box
  queryBounds(bounds: THREE.Box3): SpatialObject[] {
    return this.root.query(bounds)
  }

  // Query objects at point
  queryPoint(point: THREE.Vector3): SpatialObject[] {
    return this.root.queryPoint(point)
  }

  // Query objects within radius of point
  queryRadius(center: THREE.Vector3, radius: number): SpatialObject[] {
    const bounds = new THREE.Box3().setFromCenterAndSize(
      center,
      new THREE.Vector3(radius * 2, radius * 2, radius * 2)
    )
    
    const candidates = this.queryBounds(bounds)
    
    // Filter by actual distance
    return candidates.filter(obj => {
      const distance = center.distanceTo(obj.position)
      return distance <= radius
    })
  }

  // Raycast against all objects
  raycast(ray: THREE.Ray, maxDistance = Infinity): Array<{object: SpatialObject, distance: number, point: THREE.Vector3}> {
    const results: Array<{object: SpatialObject, distance: number, point: THREE.Vector3}> = []
    
    // Create bounding box along ray
    const rayEnd = ray.origin.clone().add(ray.direction.clone().multiplyScalar(maxDistance))
    const bounds = new THREE.Box3().setFromPoints([ray.origin, rayEnd])
    
    const candidates = this.queryBounds(bounds)
    
    for (const obj of candidates) {
      const intersection = ray.intersectBox(obj.boundingBox, new THREE.Vector3())
      if (intersection) {
        const distance = ray.origin.distanceTo(intersection)
        if (distance <= maxDistance) {
          results.push({
            object: obj,
            distance,
            point: intersection
          })
        }
      }
    }
    
    // Sort by distance
    results.sort((a, b) => a.distance - b.distance)
    return results
  }

  // Check for collisions
  checkCollisions(bounds: THREE.Box3, excludeId?: string): SpatialObject[] {
    const candidates = this.queryBounds(bounds)
    return candidates.filter(obj => 
      obj.id !== excludeId && 
      bounds.intersectsBox(obj.boundingBox)
    )
  }

  // Get all objects
  getAllObjects(): SpatialObject[] {
    return Array.from(this.objectMap.values())
  }

  // Clear all objects
  clear() {
    this.objectMap.clear()
    this.root.clear()
  }

  // Get statistics
  getStats() {
    return {
      ...this.root.getStats(),
      totalTrackedObjects: this.objectMap.size
    }
  }

  // Rebuild index (useful after many updates)
  rebuild() {
    const objects = Array.from(this.objectMap.values())
    this.root.clear()
    
    for (const obj of objects) {
      this.root.insert(obj)
    }
  }
}
