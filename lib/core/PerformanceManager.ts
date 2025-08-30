import * as THREE from 'three'

// Level of Detail (LOD) system
export interface LODLevel {
  distance: number
  geometry?: THREE.BufferGeometry
  material?: THREE.Material
  visible: boolean
  useImpostor?: boolean // Use billboard/impostor instead of 3D geometry
}

export interface LODObject {
  id: string
  position: THREE.Vector3
  levels: LODLevel[]
  currentLevel: number
  lastUpdateDistance: number
}

// Performance statistics
export interface PerformanceStats {
  frameRate: number
  drawCalls: number
  triangles: number
  geometries: number
  textures: number
  programs: number
  visibleObjects: number
  culledObjects: number
  lodLevel0: number
  lodLevel1: number
  lodLevel2: number
  instancedObjects: number
}

// Frustum culling manager
export class FrustumCuller {
  private frustum = new THREE.Frustum()
  private cameraMatrix = new THREE.Matrix4()

  updateCamera(camera: THREE.Camera) {
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.cameraMatrix)
  }

  isVisible(boundingBox: THREE.Box3): boolean {
    return this.frustum.intersectsBox(boundingBox)
  }

  cullObjects(objects: Array<{ id: string; boundingBox: THREE.Box3 }>): {
    visible: string[]
    culled: string[]
  } {
    const visible: string[] = []
    const culled: string[] = []

    for (const obj of objects) {
      if (this.isVisible(obj.boundingBox)) {
        visible.push(obj.id)
      } else {
        culled.push(obj.id)
      }
    }

    return { visible, culled }
  }
}

// Level of Detail manager
export class LODManager {
  private lodObjects = new Map<string, LODObject>()
  private cameraPosition = new THREE.Vector3()
  
  // LOD distance thresholds
  private readonly LOD_DISTANCES = {
    HIGH: 50,    // Full detail
    MEDIUM: 150, // Reduced detail
    LOW: 400     // Impostor/billboard
  }

  addLODObject(
    id: string,
    position: THREE.Vector3,
    highDetailGeometry: THREE.BufferGeometry,
    mediumDetailGeometry?: THREE.BufferGeometry,
    lowDetailGeometry?: THREE.BufferGeometry,
    material?: THREE.Material
  ) {
    const levels: LODLevel[] = [
      {
        distance: this.LOD_DISTANCES.HIGH,
        geometry: highDetailGeometry,
        material,
        visible: true
      },
      {
        distance: this.LOD_DISTANCES.MEDIUM,
        geometry: mediumDetailGeometry || this.createSimplifiedGeometry(highDetailGeometry),
        material,
        visible: true
      },
      {
        distance: this.LOD_DISTANCES.LOW,
        geometry: lowDetailGeometry || this.createImpostorGeometry(),
        material,
        visible: true,
        useImpostor: !lowDetailGeometry
      }
    ]

    this.lodObjects.set(id, {
      id,
      position: position.clone(),
      levels,
      currentLevel: 0,
      lastUpdateDistance: 0
    })
  }

  updateLOD(cameraPosition: THREE.Vector3) {
    this.cameraPosition.copy(cameraPosition)

    Array.from(this.lodObjects.values()).forEach(lodObject => {
      const distance = lodObject.position.distanceTo(cameraPosition)
      lodObject.lastUpdateDistance = distance

      let newLevel = 0
      if (distance > this.LOD_DISTANCES.LOW) {
        newLevel = 2
      } else if (distance > this.LOD_DISTANCES.MEDIUM) {
        newLevel = 1
      }

      lodObject.currentLevel = newLevel
    })
  }

  getLODLevel(id: string): number {
    const obj = this.lodObjects.get(id)
    return obj ? obj.currentLevel : 0
  }

  getCurrentGeometry(id: string): THREE.BufferGeometry | undefined {
    const obj = this.lodObjects.get(id)
    if (!obj) return undefined

    return obj.levels[obj.currentLevel]?.geometry
  }

  private createSimplifiedGeometry(original: THREE.BufferGeometry): THREE.BufferGeometry {
    // Simple decimation - in a real implementation, you'd use a proper mesh decimation algorithm
    const positions = original.getAttribute('position')
    if (!positions) return original

    // For now, just return a box geometry as a placeholder
    const box = original.boundingBox || new THREE.Box3().setFromBufferAttribute(positions as THREE.BufferAttribute)
    const size = box.getSize(new THREE.Vector3())
    return new THREE.BoxGeometry(size.x, size.y, size.z)
  }

  private createImpostorGeometry(): THREE.BufferGeometry {
    // Create a simple plane for billboard impostors
    return new THREE.PlaneGeometry(2, 2)
  }

  removeLODObject(id: string) {
    this.lodObjects.delete(id)
  }

  clear() {
    this.lodObjects.clear()
  }

  getStats() {
    const stats = { lodLevel0: 0, lodLevel1: 0, lodLevel2: 0 }
    
    Array.from(this.lodObjects.values()).forEach(obj => {
      switch (obj.currentLevel) {
        case 0: stats.lodLevel0++; break
        case 1: stats.lodLevel1++; break
        case 2: stats.lodLevel2++; break
      }
    })

    return stats
  }
}

// Instanced rendering manager
export class InstancedRenderingManager {
  private instancedMeshes = new Map<string, THREE.InstancedMesh>()
  private instanceCounts = new Map<string, number>()
  private instanceMatrices = new Map<string, THREE.Matrix4[]>()

  createInstancedMesh(
    key: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    maxInstances: number
  ): THREE.InstancedMesh {
    const mesh = new THREE.InstancedMesh(geometry, material, maxInstances)
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    
    this.instancedMeshes.set(key, mesh)
    this.instanceCounts.set(key, 0)
    this.instanceMatrices.set(key, [])
    
    return mesh
  }

  addInstance(
    key: string,
    position: THREE.Vector3,
    rotation: THREE.Euler = new THREE.Euler(),
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
  ): number | null {
    const mesh = this.instancedMeshes.get(key)
    const currentCount = this.instanceCounts.get(key) || 0
    const matrices = this.instanceMatrices.get(key)

    if (!mesh || !matrices || currentCount >= mesh.count) {
      return null // Can't add more instances
    }

    const matrix = new THREE.Matrix4()
    matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
    
    mesh.setMatrixAt(currentCount, matrix)
    matrices[currentCount] = matrix
    
    this.instanceCounts.set(key, currentCount + 1)
    mesh.instanceMatrix.needsUpdate = true
    
    return currentCount
  }

  updateInstance(
    key: string,
    instanceIndex: number,
    position: THREE.Vector3,
    rotation: THREE.Euler = new THREE.Euler(),
    scale: THREE.Vector3 = new THREE.Vector3(1, 1, 1)
  ): boolean {
    const mesh = this.instancedMeshes.get(key)
    const matrices = this.instanceMatrices.get(key)

    if (!mesh || !matrices || instanceIndex >= (this.instanceCounts.get(key) || 0)) {
      return false
    }

    const matrix = new THREE.Matrix4()
    matrix.compose(position, new THREE.Quaternion().setFromEuler(rotation), scale)
    
    mesh.setMatrixAt(instanceIndex, matrix)
    matrices[instanceIndex] = matrix
    mesh.instanceMatrix.needsUpdate = true
    
    return true
  }

  getInstancedMesh(key: string): THREE.InstancedMesh | undefined {
    return this.instancedMeshes.get(key)
  }

  getInstanceCount(key: string): number {
    return this.instanceCounts.get(key) || 0
  }

  removeInstancedMesh(key: string) {
    this.instancedMeshes.delete(key)
    this.instanceCounts.delete(key)
    this.instanceMatrices.delete(key)
  }

  clear() {
    this.instancedMeshes.clear()
    this.instanceCounts.clear()
    this.instanceMatrices.clear()
  }

  getStats() {
    let totalInstances = 0
    Array.from(this.instanceCounts.values()).forEach(count => {
      totalInstances += count
    })

    return {
      instancedMeshTypes: this.instancedMeshes.size,
      totalInstances
    }
  }
}

// Main performance manager
export class PerformanceManager {
  private frustumCuller = new FrustumCuller()
  private lodManager = new LODManager()
  private instancedManager = new InstancedRenderingManager()
  
  private renderer?: THREE.WebGLRenderer
  private stats: PerformanceStats = {
    frameRate: 0,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    visibleObjects: 0,
    culledObjects: 0,
    lodLevel0: 0,
    lodLevel1: 0,
    lodLevel2: 0,
    instancedObjects: 0
  }

  private frameCount = 0
  private lastTime = 0
  private fpsUpdateInterval = 1000 // Update FPS every second

  constructor(renderer?: THREE.WebGLRenderer) {
    this.renderer = renderer
  }

  setRenderer(renderer: THREE.WebGLRenderer) {
    this.renderer = renderer
  }

  // Update performance systems
  update(camera: THREE.Camera, objects: Array<{ id: string; boundingBox: THREE.Box3 }>) {
    // Update frustum culling
    this.frustumCuller.updateCamera(camera)
    const cullingResult = this.frustumCuller.cullObjects(objects)
    
    this.stats.visibleObjects = cullingResult.visible.length
    this.stats.culledObjects = cullingResult.culled.length

    // Update LOD
    this.lodManager.updateLOD(camera.position)
    const lodStats = this.lodManager.getStats()
    this.stats.lodLevel0 = lodStats.lodLevel0
    this.stats.lodLevel1 = lodStats.lodLevel1
    this.stats.lodLevel2 = lodStats.lodLevel2

    // Update instancing stats
    const instanceStats = this.instancedManager.getStats()
    this.stats.instancedObjects = instanceStats.totalInstances

    // Update renderer stats
    if (this.renderer) {
      const renderInfo = this.renderer.info
      this.stats.drawCalls = renderInfo.render.calls
      this.stats.triangles = renderInfo.render.triangles
      this.stats.geometries = renderInfo.memory.geometries
      this.stats.textures = renderInfo.memory.textures
      this.stats.programs = renderInfo.programs?.length || 0
    }

    // Update FPS
    this.updateFPS()

    return cullingResult
  }

  private updateFPS() {
    this.frameCount++
    const currentTime = performance.now()
    
    if (currentTime - this.lastTime >= this.fpsUpdateInterval) {
      this.stats.frameRate = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime))
      this.frameCount = 0
      this.lastTime = currentTime
    }
  }

  // Optimize scene based on performance
  optimizeScene(targetFPS: number = 60): {
    recommendations: string[]
    actions: string[]
  } {
    const recommendations: string[] = []
    const actions: string[] = []

    if (this.stats.frameRate < targetFPS) {
      if (this.stats.drawCalls > 1000) {
        recommendations.push('Too many draw calls - consider instanced rendering')
        actions.push('enable-instancing')
      }

      if (this.stats.triangles > 1000000) {
        recommendations.push('High triangle count - increase LOD distances')
        actions.push('increase-lod-distances')
      }

      if (this.stats.visibleObjects > 500) {
        recommendations.push('Too many visible objects - improve culling')
        actions.push('aggressive-culling')
      }

      if (this.stats.lodLevel0 > this.stats.lodLevel1 + this.stats.lodLevel2) {
        recommendations.push('Most objects at highest LOD - adjust LOD distances')
        actions.push('adjust-lod-thresholds')
      }
    }

    return { recommendations, actions }
  }

  // Getters for managers
  getFrustumCuller(): FrustumCuller {
    return this.frustumCuller
  }

  getLODManager(): LODManager {
    return this.lodManager
  }

  getInstancedManager(): InstancedRenderingManager {
    return this.instancedManager
  }

  // Get performance statistics
  getStats(): PerformanceStats {
    return { ...this.stats }
  }

  // Memory cleanup
  dispose() {
    this.lodManager.clear()
    this.instancedManager.clear()
  }
}
