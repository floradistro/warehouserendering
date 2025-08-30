import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

// Scene object interface
export interface SceneObject {
  id: string
  type: string
  position: THREE.Vector3
  rotation: THREE.Euler
  scale: THREE.Vector3
  visible: boolean
  userData: Record<string, any>
  boundingBox?: THREE.Box3
  parent?: string
  children?: string[]
}

// Camera state
export interface CameraState {
  position: THREE.Vector3
  target: THREE.Vector3
  lockedTarget: THREE.Vector3 | null
}

// Scene state interface
interface SceneState {
  // Objects
  objects: Map<string, SceneObject>
  selectedIds: Set<string>
  
  // Tools and modes
  activeToolId: string
  isPlacing: boolean
  placementTemplate: any
  placementRotation: number
  
  // Grid and snapping
  gridEnabled: boolean
  snapEnabled: boolean
  gridSize: number
  snapTolerance: number
  
  // Camera
  camera: CameraState
  
  // Layer visibility
  hiddenLayers: Set<string>
  
  // Actions
  addObject: (object: SceneObject) => void
  removeObject: (id: string) => void
  updateObject: (id: string, updates: Partial<SceneObject>) => void
  selectObjects: (ids: string[]) => void
  clearSelection: () => void
  toggleSelection: (id: string) => void
  
  // Tool actions
  setActiveTool: (toolId: string) => void
  startPlacement: (template: any) => void
  finalizePlacement: () => void
  cancelPlacement: () => void
  
  // Grid and snap actions
  setGridEnabled: (enabled: boolean) => void
  setSnapEnabled: (enabled: boolean) => void
  setGridSize: (size: number) => void
  setSnapTolerance: (tolerance: number) => void
  
  // Camera actions
  setCameraPosition: (position: THREE.Vector3) => void
  setCameraTarget: (target: THREE.Vector3) => void
  setLockedTarget: (target: THREE.Vector3 | null) => void
  
  // Layer actions
  setLayerVisible: (layer: string, visible: boolean) => void
  isLayerVisible: (layer: string) => boolean
  
  // Utility actions
  getObjectById: (id: string) => SceneObject | undefined
  getSelectedObjects: () => SceneObject[]
  getBoundingBox: () => THREE.Box3 | null
}

export const useSceneStore = create<SceneState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    objects: new Map(),
    selectedIds: new Set(),
    
    activeToolId: 'select',
    isPlacing: false,
    placementTemplate: null,
    placementRotation: 0,
    
    gridEnabled: true,
    snapEnabled: true,
    gridSize: 1,
    snapTolerance: 2,
    
    camera: {
      position: new THREE.Vector3(150, 100, 200),
      target: new THREE.Vector3(0, 0, 0),
      lockedTarget: null
    },
    
    hiddenLayers: new Set(),
    
    // Object management
    addObject: (object) => set((state) => {
      const newObjects = new Map(state.objects)
      newObjects.set(object.id, object)
      return { objects: newObjects }
    }),
    
    removeObject: (id) => set((state) => {
      const newObjects = new Map(state.objects)
      const newSelectedIds = new Set(state.selectedIds)
      
      newObjects.delete(id)
      newSelectedIds.delete(id)
      
      return { 
        objects: newObjects,
        selectedIds: newSelectedIds
      }
    }),
    
    updateObject: (id, updates) => set((state) => {
      const newObjects = new Map(state.objects)
      const existing = newObjects.get(id)
      
      if (existing) {
        newObjects.set(id, { ...existing, ...updates })
      }
      
      return { objects: newObjects }
    }),
    
    // Selection management
    selectObjects: (ids) => set({
      selectedIds: new Set(ids)
    }),
    
    clearSelection: () => set({
      selectedIds: new Set()
    }),
    
    toggleSelection: (id) => set((state) => {
      const newSelectedIds = new Set(state.selectedIds)
      
      if (newSelectedIds.has(id)) {
        newSelectedIds.delete(id)
      } else {
        newSelectedIds.add(id)
      }
      
      return { selectedIds: newSelectedIds }
    }),
    
    // Tool management
    setActiveTool: (toolId) => set({ activeToolId: toolId }),
    
    startPlacement: (template) => set({
      isPlacing: true,
      placementTemplate: template,
      placementRotation: 0
    }),
    
    finalizePlacement: () => set({
      isPlacing: false,
      placementTemplate: null,
      placementRotation: 0
    }),
    
    cancelPlacement: () => set({
      isPlacing: false,
      placementTemplate: null,
      placementRotation: 0
    }),
    
    // Grid and snap
    setGridEnabled: (enabled) => set({ gridEnabled: enabled }),
    setSnapEnabled: (enabled) => set({ snapEnabled: enabled }),
    setGridSize: (size) => set({ gridSize: size }),
    setSnapTolerance: (tolerance) => set({ snapTolerance: tolerance }),
    
    // Camera
    setCameraPosition: (position) => set((state) => ({
      camera: { ...state.camera, position }
    })),
    
    setCameraTarget: (target) => set((state) => ({
      camera: { ...state.camera, target }
    })),
    
    setLockedTarget: (target) => set((state) => ({
      camera: { ...state.camera, lockedTarget: target }
    })),
    
    // Layer management
    setLayerVisible: (layer, visible) => set((state) => {
      const newHiddenLayers = new Set(state.hiddenLayers)
      
      if (visible) {
        newHiddenLayers.delete(layer)
      } else {
        newHiddenLayers.add(layer)
      }
      
      return { hiddenLayers: newHiddenLayers }
    }),
    
    isLayerVisible: (layer) => !get().hiddenLayers.has(layer),
    
    // Utility functions
    getObjectById: (id) => get().objects.get(id),
    
    getSelectedObjects: () => {
      const { objects, selectedIds } = get()
      return Array.from(selectedIds)
        .map(id => objects.get(id))
        .filter((obj): obj is SceneObject => obj !== undefined)
    },
    
    getBoundingBox: () => {
      const objects = Array.from(get().objects.values())
      
      if (objects.length === 0) return null
      
      const box = new THREE.Box3()
      
      objects.forEach(obj => {
        if (obj.boundingBox) {
          box.union(obj.boundingBox)
        }
      })
      
      return box.isEmpty() ? null : box
    }
  }))
)
