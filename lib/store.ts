import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { modelManager, ModelOperationResult } from './model-manager'
import { createElement } from './element-tools'

export interface FloorplanElement {
  id: string
  type: 'wall' | 'door' | 'window' | 'room' | 'fixture' | 'pipe_system'
  position: { x: number; y: number; z?: number }
  dimensions: { width: number; height: number; depth?: number }
  rotation?: number
  color?: string
  material?: 'steel' | 'concrete' | 'wood' | 'fabric' | 'pex' | 'copper' | 'pvc' | string
  metadata?: Record<string, any>
  // Pipe-specific properties
  pipeData?: {
    systemType: 'hot_water' | 'cold_water' | 'waste' | 'vent' | 'gas' | 'compressed_air'
    diameter: number
    path: Array<{ x: number; y: number; z: number }>
    fittings?: Array<{ position: { x: number; y: number; z: number }, type: string }>
  }
}

export interface FloorplanData {
  id: string
  name: string
  dimensions: { width: number; height: number }
  elements: FloorplanElement[]
  scale: number
  units: 'feet' | 'meters' | 'inches'
  createdAt: Date
  updatedAt: Date
}

export interface ChatMessage {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  floorplanData?: FloorplanData
}

interface AppState {
  // Chat state
  messages: ChatMessage[]
  isProcessing: boolean
  inputValue: string
  
  // Floorplan state
  currentFloorplan: FloorplanData | null
  viewMode: '2d' | '3d'
  selectedElements: string[]
  
  // Legacy measurement state removed - replaced by professional measurement system
  
  // Renderer state
  cameraPosition: [number, number, number]
  cameraTarget: [number, number, number]
  showMeasurements: boolean
  firstPersonMode: boolean
  
  // Layer visibility state
  hiddenLayers: Set<string>
  layerGroups: Record<string, string[]> // layer name -> element IDs
  
  // Model management state
  availableModels: Array<{ id: string; name: string; updatedAt: Date }>
  lastError: string | null
  undoRedoStatus: { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number }
  
  // Advanced placement state
  isPlacing: boolean
  placementTemplate: string | null
  previewElement: FloorplanElement | null
  placementRotation: number
  placementDimensions: { width: number; height: number; depth: number }
  isRotationLocked: boolean
  
  // Element editing state
  isEditing: boolean
  editingElement: FloorplanElement | null
  originalEditingElement: FloorplanElement | null
  snapPoints: Array<{
    position: { x: number; y: number; z: number }
    type: string
    confidence: number
  }>
  activeSnapPoint: {
    position: { x: number; y: number; z: number }
    type: string
    confidence: number
    description?: string
    suggestedRotation?: number
    suggestedDimensions?: { width: number; height: number; depth: number }
  } | null
  showSnapIndicators: boolean
  snapTolerance: number
  
  // Simple guide lines for dragging
  dragGuides: Array<{
    type: 'horizontal' | 'vertical'
    position: number
    color: string
    elements: string[]
  }>
  
  // Wall movement state
  isDragging: boolean
  dragStartPosition: { x: number; y: number; z: number } | null
  dragCurrentPosition: { x: number; y: number; z: number } | null
  dragOffset: { x: number; y: number; z: number } | null
  
  // Clipboard state
  clipboard: FloorplanElement[]
  clipboardMode: 'copy' | 'cut' | null
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setInputValue: (value: string) => void
  setIsProcessing: (value: boolean) => void
  setCurrentFloorplan: (floorplan: FloorplanData | null) => void
  updateFloorplan: (updates: Partial<FloorplanData>) => void
  setViewMode: (mode: '2d' | '3d') => void
  toggleMeasurements: () => void
  // Legacy measurement actions removed - replaced by professional measurement system
  
  // Camera actions
  toggleFirstPersonMode: () => void
  
  // Model management actions
  loadCurrentModel: () => void
  switchModel: (id: string) => void
  createNewModel: (template?: 'EMPTY' | 'BASIC') => void
  deleteModel: (id: string) => void
  refreshModelList: () => void
  
  // Element management actions
  addElement: (element: Omit<FloorplanElement, 'id'>) => void
  updateElement: (id: string, updates: Partial<FloorplanElement>) => void
  removeElement: (id: string) => void
  duplicateElement: (id: string) => void
  
  // Undo/Redo actions
  undo: () => void
  redo: () => void
  refreshUndoRedoStatus: () => void
  
  // Error handling
  setError: (error: string | null) => void
  clearError: () => void
  
  // Advanced placement actions
  startPlacement: (templateId: string) => void
  updatePreview: (element: FloorplanElement | null) => void
  updateSnapPoints: (snapPoints: any[], activeSnapPoint: any) => void
  rotatePlacementElement: (direction: 'clockwise' | 'counterclockwise') => void
  updatePlacementDimensions: (dimensions: { width?: number; height?: number; depth?: number }) => void
  setSnapTolerance: (tolerance: number) => void
  expandPlacementWall: () => void
  finalizePlacement: (position: { x: number; y: number; z?: number }) => void
  cancelPlacement: () => void
  
  // Element editing actions
  startElementEdit: (element: FloorplanElement) => void
  updateElementEdit: (updates: Partial<FloorplanElement>) => void
  finalizeElementEdit: () => void
  cancelElementEdit: () => void
  
  // Wall movement actions
  startDrag: (element: FloorplanElement, worldPosition: { x: number; y: number; z: number }) => void
  updateDrag: (worldPosition: { x: number; y: number; z: number }) => void
  finalizeDrag: () => void
  cancelDrag: () => void
  
  // Clipboard actions
  copyElements: (elementIds?: string[]) => void
  cutElements: (elementIds?: string[]) => void
  pasteElements: (position?: { x: number; y: number; z?: number }) => void
  clearClipboard: () => void
  hasClipboard: () => boolean
  
  // Selection actions
  toggleElementSelection: (elementId: string) => void
  clearSelection: () => void
  selectElementWithSnap: (elementId: string) => void
  
  // Camera lock system
  lockedTarget: string | null
  setLockedTarget: (elementId: string | null) => void
  
  // Legacy measurement actions removed - replaced by professional measurement system

  
  // Camera actions
  setCameraPosition: (position: [number, number, number]) => void
  setCameraTarget: (target: [number, number, number]) => void
  
  // Layer visibility actions
  toggleLayerVisibility: (layerName: string) => void
  hideLayer: (layerName: string) => void
  showLayer: (layerName: string) => void
  isLayerVisible: (layerName: string) => boolean
  updateLayerGroups: () => void
  selectElementGroup: (elementId: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isProcessing: false,
      inputValue: '',
      
      currentFloorplan: null,
      viewMode: '3d',
      selectedElements: [],
      
      cameraPosition: [150, 100, 200],
      cameraTarget: [69.375, 0, 124],
      showMeasurements: false,
      firstPersonMode: false,
      
      // Camera lock system
      lockedTarget: null,
      
      // Layer visibility initial state
      hiddenLayers: new Set<string>(['roof-panels']),
      layerGroups: {},
      
      // Model management state
      availableModels: [],
      lastError: null,
      undoRedoStatus: { canUndo: false, canRedo: false, undoCount: 0, redoCount: 0 },
      
      // Advanced placement state
      isPlacing: false,
      placementTemplate: null,
      previewElement: null,
      placementRotation: 0,
      placementDimensions: { width: 20, height: 1, depth: 12 },
      isRotationLocked: false,
      
      // Element editing initial state
      isEditing: false,
      editingElement: null,
      originalEditingElement: null,
      
      snapPoints: [],
      activeSnapPoint: null,
      showSnapIndicators: true,
      snapTolerance: 1.2, // Slightly increased for easier 1-foot grid snapping
      
      // Simple guide lines initial state
      dragGuides: [],
      
      // Wall movement initial state
      isDragging: false,
      dragStartPosition: null,
      dragCurrentPosition: null,
      dragOffset: null,
    
    // Clipboard initial state
    clipboard: [],
    clipboardMode: null,
  
      // Actions
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          ...message,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        }],
      })),
      
      setInputValue: (value) => set({ inputValue: value }),
      
      setIsProcessing: (value) => set({ isProcessing: value }),
      
      setCurrentFloorplan: (floorplan) => set({ currentFloorplan: floorplan }),
      
      updateFloorplan: (updates) => set((state) => ({
        currentFloorplan: state.currentFloorplan ? {
          ...state.currentFloorplan,
          ...updates,
          updatedAt: new Date(),
        } : null,
      })),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      
      toggleMeasurements: () => set((state) => ({
        showMeasurements: !state.showMeasurements,
      })),
  
      // Measurement actions (moved to end of file)
      



      
      toggleFirstPersonMode: () => set((state) => ({
        firstPersonMode: !state.firstPersonMode,
      })),

      // Model management actions
      loadCurrentModel: () => {
        const result = modelManager.getCurrentModel()
        if (result.success && result.data) {
          set({ 
            currentFloorplan: result.data,
            lastError: null 
          })
          get().refreshModelList()
          get().refreshUndoRedoStatus()
        } else {
          set({ lastError: result.error || 'Failed to load model' })
        }
      },

      switchModel: (id: string) => {
        const result = modelManager.setCurrentModel(id)
        if (result.success && result.data) {
          set({ 
            currentFloorplan: result.data,
            lastError: null,
            selectedElements: [],
            // Measurement mode removed during optimization
          })
          get().refreshUndoRedoStatus()
        } else {
          set({ lastError: result.error || 'Failed to switch model' })
        }
      },

      createNewModel: (template = 'EMPTY') => {
        const result = modelManager.createModel(template)
        if (result.success && result.data) {
          get().switchModel(result.data.id)
          get().refreshModelList()
        } else {
          set({ lastError: result.error || 'Failed to create model' })
        }
      },

      deleteModel: (id: string) => {
        const result = modelManager.deleteModel(id)
        if (result.success) {
          get().refreshModelList()
          get().loadCurrentModel()
        } else {
          set({ lastError: result.error || 'Failed to delete model' })
        }
      },

      refreshModelList: () => {
        const result = modelManager.listModels()
        if (result.success && result.data) {
          set({ availableModels: result.data })
        }
      },

      // Element management actions
      addElement: (element) => {
        const result = modelManager.addElement(element)
        if (result.success) {
          get().loadCurrentModel()
          get().refreshUndoRedoStatus()
          set({ lastError: null })
        } else {
          set({ lastError: result.error || 'Failed to add element' })
        }
      },

      updateElement: (id: string, updates) => {
        const result = modelManager.updateElement(id, updates)
        if (result.success) {
          get().loadCurrentModel()
          get().refreshUndoRedoStatus()
          set({ lastError: null })
        } else {
          set({ lastError: result.error || 'Failed to update element' })
        }
      },

      removeElement: (id: string) => {
        const result = modelManager.removeElement(id)
        if (result.success) {
          get().loadCurrentModel()
          get().refreshUndoRedoStatus()
          set({ 
            lastError: null,
            selectedElements: get().selectedElements.filter(elId => elId !== id)
          })
        } else {
          set({ lastError: result.error || 'Failed to remove element' })
        }
      },

      duplicateElement: (id: string) => {
        const result = modelManager.duplicateElement(id)
        if (result.success) {
          get().loadCurrentModel()
          get().refreshUndoRedoStatus()
          set({ lastError: null })
        } else {
          set({ lastError: result.error || 'Failed to duplicate element' })
        }
      },

      // Undo/Redo actions
      undo: () => {
        const result = modelManager.undo()
        if (result.success && result.data) {
          set({ 
            currentFloorplan: result.data,
            lastError: null 
          })
          get().refreshUndoRedoStatus()
        } else {
          set({ lastError: result.error || 'Nothing to undo' })
        }
      },

      redo: () => {
        const result = modelManager.redo()
        if (result.success && result.data) {
          set({ 
            currentFloorplan: result.data,
            lastError: null 
          })
          get().refreshUndoRedoStatus()
        } else {
          set({ lastError: result.error || 'Nothing to redo' })
        }
      },

      refreshUndoRedoStatus: () => {
        const status = modelManager.getUndoRedoStatus()
        set({ undoRedoStatus: status })
      },

      // Error handling
      setError: (error: string | null) => set({ lastError: error }),
      
      clearError: () => set({ lastError: null }),
      
      // Advanced placement actions
      startPlacement: (templateId: string) => {
        const template = require('@/lib/element-tools').ELEMENT_TEMPLATES[templateId]
        const defaultDimensions = template ? {
          width: template.defaultDimensions.width,
          height: template.defaultDimensions.height,
          depth: template.defaultDimensions.depth || 8
        } : { width: 20, height: 1, depth: 12 }

        set({ 
          isPlacing: true, 
          placementTemplate: templateId,
          previewElement: null,
          placementRotation: 0,
          placementDimensions: defaultDimensions,
          isRotationLocked: false,
          snapPoints: [],
          activeSnapPoint: null,
          // Measurement mode removed during optimization
          selectedElements: [] // Clear selection when placing
        })
      },
      
      updatePreview: (element: FloorplanElement | null) => {
        set({ previewElement: element })
      },

      updateSnapPoints: (snapPoints: any[], activeSnapPoint: any) => {
        set({ 
          snapPoints: snapPoints.map(sp => ({
            position: { x: sp.position.x, y: sp.position.y, z: sp.position.z },
            type: sp.type,
            confidence: sp.confidence
          })),
          activeSnapPoint: activeSnapPoint ? {
            position: { x: activeSnapPoint.position.x, y: activeSnapPoint.position.y, z: activeSnapPoint.position.z },
            type: activeSnapPoint.type,
            confidence: activeSnapPoint.confidence,
            description: activeSnapPoint.description,
            suggestedRotation: activeSnapPoint.suggestedRotation,
            suggestedDimensions: activeSnapPoint.suggestedDimensions
          } : null
        })
      },

      rotatePlacementElement: (direction: 'clockwise' | 'counterclockwise') => {
        const { placementRotation } = get()
        const step = Math.PI / 2 // 90 degrees
        const newRotation = direction === 'clockwise' 
          ? (placementRotation + step) % (Math.PI * 2)
          : (placementRotation - step + Math.PI * 2) % (Math.PI * 2)
        
        // Lock rotation when user explicitly rotates - prevents snap overrides
        set({ 
          placementRotation: newRotation,
          isRotationLocked: true
        })
      },

      updatePlacementDimensions: (dimensions: { width?: number; height?: number; depth?: number }) => {
        const { placementDimensions } = get()
        set({ 
          placementDimensions: { 
            ...placementDimensions, 
            ...dimensions 
          } 
        })
      },

      setSnapTolerance: (tolerance: number) => {
        set({ snapTolerance: tolerance })
      },
      
      expandPlacementWall: () => {
        const state = get()
        if (!state.isPlacing || !state.previewElement || !state.currentFloorplan) {
          console.log('⚠️ Cannot expand: not placing or missing preview')
          return
        }
        
        // Only expand walls
        if (state.previewElement.type !== 'wall') {
          console.log('⚠️ Can only expand walls, current type:', state.previewElement.type)
          return
        }
        
        try {
          console.log('🔧 Expanding wall placement...')
          
          const { WallExpander } = require('./wall-expansion')
          
          const expansionResult = WallExpander.expandWall(
            state.previewElement.position,
            state.previewElement.dimensions,
            state.previewElement.rotation || 0,
            state.currentFloorplan.elements.filter(el => !el.metadata?.isPreview), // Exclude preview elements
            state.currentFloorplan.dimensions
          )
          
          console.log('📏 Wall expansion result:', expansionResult)
          
          // Validate the expansion result
          if (expansionResult.newDimensions.width < 0.5 || expansionResult.newDimensions.height < 0.5) {
            console.log('⚠️ Invalid expansion dimensions, skipping')
            return
          }
          
          // Update placement dimensions
          set({
            placementDimensions: {
              width: Math.max(0.5, expansionResult.newDimensions.width),
              height: Math.max(0.5, expansionResult.newDimensions.height),
              depth: expansionResult.newDimensions.depth
            }
          })
          
          // Update preview element with expanded dimensions - PRESERVE ROTATION
          const expandedPreview = {
            ...state.previewElement,
            position: {
              x: expansionResult.newPosition.x,
              y: expansionResult.newPosition.y,
              z: expansionResult.newPosition.z
            },
            dimensions: {
              width: Math.max(0.5, expansionResult.newDimensions.width),
              height: Math.max(0.5, expansionResult.newDimensions.height),
              depth: expansionResult.newDimensions.depth
            },
            rotation: state.previewElement.rotation, // PRESERVE USER'S ROTATION
            metadata: {
              ...state.previewElement.metadata,
              isExpanded: true,
              expansionDirection: expansionResult.expansionDirection,
              hitElements: expansionResult.hitElements.map((el: any) => el.id)
            }
          }
          
          // Use updatePreview to apply the changes
          get().updatePreview(expandedPreview)
          console.log('✅ Wall expansion completed successfully')
          
        } catch (error) {
          console.error('❌ Wall expansion failed:', error)
        }
      },
      
      // Clipboard actions
      copyElements: (elementIds?: string[]) => {
        const state = get()
        const targetIds = elementIds || state.selectedElements
        
        if (targetIds.length === 0 || !state.currentFloorplan) return
        
        const elementsToCopy = state.currentFloorplan.elements.filter(el => 
          targetIds.includes(el.id)
        )
        
        if (elementsToCopy.length > 0) {
          set({ 
            clipboard: elementsToCopy.map(el => ({ ...el })), // Deep copy
            clipboardMode: 'copy' 
          })
          console.log(`📋 Copied ${elementsToCopy.length} elements to clipboard`)
        }
      },
      
      cutElements: (elementIds?: string[]) => {
        const state = get()
        const targetIds = elementIds || state.selectedElements
        
        if (targetIds.length === 0 || !state.currentFloorplan) return
        
        const elementsToCut = state.currentFloorplan.elements.filter(el => 
          targetIds.includes(el.id)
        )
        
        if (elementsToCut.length > 0) {
          // Copy to clipboard
          set({ 
            clipboard: elementsToCut.map(el => ({ ...el })), // Deep copy
            clipboardMode: 'cut' 
          })
          
          // Remove from floorplan
          for (const elementId of targetIds) {
            const result = modelManager.removeElement(elementId)
            if (result.success) {
              const currentModelResult = modelManager.getCurrentModel()
              if (currentModelResult.success && currentModelResult.data) {
                set({ currentFloorplan: currentModelResult.data })
              }
            }
          }
          
          // Clear selection
          set({ selectedElements: [] })
          console.log(`✂️ Cut ${elementsToCut.length} elements to clipboard`)
        }
      },
      
      pasteElements: (position?: { x: number; y: number; z?: number }) => {
        const state = get()
        
        if (state.clipboard.length === 0 || !state.currentFloorplan) return
        
        const pastePosition = position || { x: 10, y: 10, z: 0 } // Default offset
        const newElementIds: string[] = []
        
        // Calculate offset from original positions
        const firstElement = state.clipboard[0]
        const offsetX = pastePosition.x - firstElement.position.x
        const offsetY = pastePosition.y - firstElement.position.y
        const offsetZ = (pastePosition.z || 0) - (firstElement.position.z || 0)
        
        // Paste each element with offset
        for (const element of state.clipboard) {
          const newElement: Omit<FloorplanElement, 'id'> = {
            ...element,
            position: {
              x: element.position.x + offsetX,
              y: element.position.y + offsetY,
              z: (element.position.z || 0) + offsetZ
            },
            metadata: {
              ...element.metadata,
              pastedFrom: element.id,
              pastedAt: new Date().toISOString()
            }
          }
          
          const result = modelManager.addElement(newElement)
          if (result.success && result.data) {
            newElementIds.push(result.data.id)
          }
        }
        
        if (newElementIds.length > 0) {
          // Update floorplan and select pasted elements
          const currentModelResult = modelManager.getCurrentModel()
          if (currentModelResult.success && currentModelResult.data) {
            set({ 
              currentFloorplan: currentModelResult.data,
              selectedElements: newElementIds
            })
          }
          
          console.log(`📌 Pasted ${newElementIds.length} elements at position (${pastePosition.x}, ${pastePosition.y})`)
        }
      },
      
      clearClipboard: () => {
        set({ clipboard: [], clipboardMode: null })
        console.log('🗑️ Clipboard cleared')
      },
      
      hasClipboard: () => {
        const state = get()
        return state.clipboard.length > 0
      },
      
      // Element editing actions
      startElementEdit: (element: FloorplanElement) => {
        console.log('🔧 Starting element edit for:', element.id, 'type:', element.type)
        
        // Cancel any active placement first
        set({ isPlacing: false, placementTemplate: null })
        
        // Set up editing state with element data
        set({
          isEditing: true,
          editingElement: { ...element }, // Deep copy for editing
          originalEditingElement: { ...element }, // Deep copy for restore on cancel
          placementDimensions: {
            width: element.dimensions.width,
            height: element.dimensions.height,
            depth: element.dimensions.depth || 12
          },
          placementRotation: element.rotation || 0,
          selectedElements: [element.id] // Select the element being edited
        })
      },
      
      updateElementEdit: (updates: Partial<FloorplanElement>) => {
        const state = get()
        if (!state.isEditing || !state.editingElement || !state.currentFloorplan) return
        
        let finalUpdates = { ...updates }
        
        // CENTER-BASED RESIZING: Adjust position when dimensions change to keep element centered
        if (updates.dimensions && state.editingElement) {
          const oldDims = state.editingElement.dimensions
          const newDims = { ...oldDims, ...updates.dimensions }
          
          // Calculate position adjustment to maintain center point
          const deltaWidth = (newDims.width - oldDims.width) / 2
          const deltaHeight = (newDims.height - oldDims.height) / 2
          
          // Adjust position to compensate for dimension change
          finalUpdates.position = {
            x: state.editingElement.position.x - deltaWidth,
            y: state.editingElement.position.y - deltaHeight,
            z: state.editingElement.position.z
          }
        }
        
        const updatedElement = { ...state.editingElement, ...finalUpdates }
        set({ editingElement: updatedElement })
        
        // REAL-TIME UPDATE: Also update the actual element in the floorplan for immediate visualization
        const elementIndex = state.currentFloorplan.elements.findIndex(el => el.id === state.editingElement?.id)
        if (elementIndex !== -1) {
          const updatedElements = [...state.currentFloorplan.elements]
          updatedElements[elementIndex] = { ...updatedElements[elementIndex], ...finalUpdates }
          
          set({
            currentFloorplan: {
              ...state.currentFloorplan,
              elements: updatedElements,
              updatedAt: new Date()
            }
          })
        }
        
        // Update dimensions in placement state for toolbar consistency
        if (updates.dimensions) {
          set({
            placementDimensions: {
              width: updates.dimensions.width || state.placementDimensions.width,
              height: updates.dimensions.height || state.placementDimensions.height,
              depth: updates.dimensions.depth || state.placementDimensions.depth
            }
          })
        }
        
        // Update rotation in placement state
        if (updates.rotation !== undefined) {
          set({ placementRotation: updates.rotation })
        }
      },
      
      finalizeElementEdit: () => {
        const state = get()
        if (!state.isEditing || !state.editingElement) return
        
        console.log('✅ Finalizing element edit:', state.editingElement.id, 'type:', state.editingElement.type)
        
        // Update the element in the model
        const result = modelManager.updateElement(state.editingElement.id, {
          dimensions: state.editingElement.dimensions,
          position: state.editingElement.position,
          rotation: state.editingElement.rotation,
          color: state.editingElement.color,
          metadata: {
            ...state.editingElement.metadata,
            lastEdited: new Date().toISOString()
          }
        })
        
        if (result.success) {
          const currentModelResult = modelManager.getCurrentModel()
          if (currentModelResult.success && currentModelResult.data) {
            set({
              currentFloorplan: currentModelResult.data,
              isEditing: false,
              editingElement: null,
              originalEditingElement: null,
              selectedElements: [] // Clear selection
            })
            console.log('🎉 Element edit completed successfully')
          }
        } else {
          console.error('❌ Element edit failed:', result.error)
        }
      },
      
      cancelElementEdit: () => {
        console.log('❌ Canceling element edit')
        const state = get()
        
        // RESTORE ORIGINAL: Revert the element back to its original state in the floorplan
        if (state.originalEditingElement && state.currentFloorplan) {
          const elementIndex = state.currentFloorplan.elements.findIndex(el => el.id === state.originalEditingElement!.id)
          if (elementIndex !== -1) {
            const updatedElements = [...state.currentFloorplan.elements]
            updatedElements[elementIndex] = { ...state.originalEditingElement }
            
            set({
              currentFloorplan: {
                ...state.currentFloorplan,
                elements: updatedElements,
                updatedAt: new Date()
              }
            })
          }
        }
        
        set({
          isEditing: false,
          editingElement: null,
          originalEditingElement: null,
          selectedElements: [] // Clear selection
        })
      },
      
      // Wall movement actions
      startDrag: (element: FloorplanElement, worldPosition: { x: number; y: number; z: number }) => {
        console.log('🔄 Starting drag for element:', element.id)
        
        // Calculate offset from element's position to cursor
        const offset = {
          x: worldPosition.x - element.position.x,
          y: worldPosition.y - element.position.y,
          z: worldPosition.z - (element.position.z || 0)
        }
        
        set({
          isDragging: true,
          dragStartPosition: { ...element.position, z: element.position.z || 0 },
          dragCurrentPosition: worldPosition,
          dragOffset: offset,
          selectedElements: [element.id] // Ensure element is selected
        })
      },
      
      updateDrag: (worldPosition: { x: number; y: number; z: number }) => {
        const { SimpleGuideSystem } = require('./simple-guides')
        const state = get()
        if (!state.isDragging || !state.dragOffset || !state.currentFloorplan) return
        
        // Calculate new position accounting for offset
        const rawPosition = {
          x: worldPosition.x - state.dragOffset.x,
          y: worldPosition.y - state.dragOffset.y,
          z: worldPosition.z - state.dragOffset.z
        }
        
        // Simple guide-based snapping
        let finalPosition = rawPosition
        const selectedElementId = state.selectedElements[0]
        
        if (selectedElementId) {
          const draggedElement = state.currentFloorplan.elements.find(el => el.id === selectedElementId)
          if (draggedElement) {
            // Create temporary element with raw position
            const tempElement = {
              position: rawPosition,
              dimensions: draggedElement.dimensions
            }
            
            // Get other elements
            const otherElements = state.currentFloorplan.elements.filter(el => 
              el.id !== selectedElementId && !el.metadata?.isPreview
            )
            
            // Find alignment guides
            const guideSystem = new SimpleGuideSystem()
            const guides = guideSystem.findGuides(tempElement, otherElements)
            
            // Update guides in store for rendering
            set({ dragGuides: guides })
            
            // Check if we should snap to a guide
            const snapPosition = guideSystem.getSnapPosition(tempElement, guides)
            if (snapPosition) {
              finalPosition = snapPosition
            } else {
              // Grid snapping as fallback
              finalPosition = {
                x: Math.round(rawPosition.x),
                y: Math.round(rawPosition.y),
                z: Math.round(rawPosition.z)
              }
            }
          }
        } else {
          // Grid snapping as fallback
          finalPosition = {
            x: Math.round(rawPosition.x),
            y: Math.round(rawPosition.y),
            z: Math.round(rawPosition.z)
          }
        }
        
        // Update the element position in real-time
        if (!selectedElementId) return
        
        const elementIndex = state.currentFloorplan.elements.findIndex(el => el.id === selectedElementId)
        if (elementIndex === -1) return
        
        const updatedElements = [...state.currentFloorplan.elements]
        updatedElements[elementIndex] = {
          ...updatedElements[elementIndex],
          position: finalPosition
        }
        
        set({
          dragCurrentPosition: worldPosition,
          currentFloorplan: {
            ...state.currentFloorplan,
            elements: updatedElements,
            updatedAt: new Date()
          }
        })
      },
      
      finalizeDrag: () => {
        const state = get()
        if (!state.isDragging) return
        
        console.log('✅ Drag finalized')
        
        // Save to model manager for undo/redo support
        const selectedElementId = state.selectedElements[0]
        if (selectedElementId && state.currentFloorplan) {
          const element = state.currentFloorplan.elements.find(el => el.id === selectedElementId)
          if (element) {
            modelManager.updateElement(selectedElementId, {
              position: element.position
            })
          }
        }
        
        set({
          isDragging: false,
          dragStartPosition: null,
          dragCurrentPosition: null,
          dragOffset: null,
          dragGuides: [] // Clear guides when drag ends
        })
      },
      
      cancelDrag: () => {
        const state = get()
        if (!state.isDragging || !state.dragStartPosition || !state.currentFloorplan) return
        
        console.log('❌ Drag cancelled, reverting position')
        
        // Restore original position
        const selectedElementId = state.selectedElements[0]
        if (selectedElementId) {
          const elementIndex = state.currentFloorplan.elements.findIndex(el => el.id === selectedElementId)
          if (elementIndex !== -1) {
            const updatedElements = [...state.currentFloorplan.elements]
            updatedElements[elementIndex] = {
              ...updatedElements[elementIndex],
              position: state.dragStartPosition!
            }
            
            set({
              currentFloorplan: {
                ...state.currentFloorplan,
                elements: updatedElements,
                updatedAt: new Date()
              },
              isDragging: false,
              dragStartPosition: null,
              dragCurrentPosition: null,
              dragOffset: null,
              dragGuides: [] // Clear guides when canceling drag
            })
          }
        }
      },
      
      finalizePlacement: (position: { x: number; y: number; z?: number }) => {
        const { placementTemplate, placementRotation, placementDimensions, activeSnapPoint, previewElement } = get()
        if (!placementTemplate) return
        
        // Use intelligent suggestions if available (from preview element)
        const finalDimensions = previewElement?.metadata?.isIntelligentSnap 
          ? previewElement.dimensions 
          : placementDimensions
        
        const finalRotation = previewElement?.rotation !== undefined 
          ? previewElement.rotation 
          : placementRotation
        
        console.log('Finalizing placement with:', {
          dimensions: finalDimensions,
          rotation: finalRotation,
          isIntelligent: previewElement?.metadata?.isIntelligentSnap
        })
        
        const element = createElement({
          position,
          templateId: placementTemplate,
          customDimensions: finalDimensions
        })
        
        if (element) {
          if (finalRotation !== 0) {
            element.rotation = finalRotation
          }
          
          // Add metadata about intelligent placement
          if (previewElement?.metadata?.isIntelligentSnap) {
            element.metadata = {
              ...element.metadata,
              intelligentlyPlaced: true,
              snapType: previewElement.metadata.snapType,
              snapDescription: previewElement.metadata.snapDescription
            }
          }
          
          get().addElement(element)
        }
        
        set({ 
          isPlacing: false, 
          placementTemplate: null,
          previewElement: null,
          placementRotation: 0,
          placementDimensions: { width: 20, height: 1, depth: 12 },
          snapPoints: [],
          activeSnapPoint: null
        })
      },
      
      cancelPlacement: () => {
        set({ 
          isPlacing: false, 
          placementTemplate: null,
          previewElement: null,
          placementRotation: 0,
          snapPoints: [],
          activeSnapPoint: null
        })
      },

      // Selection actions
      toggleElementSelection: (elementId: string) => {
        const { selectedElements } = get()
        const isSelected = selectedElements.includes(elementId)
        
        if (isSelected) {
          set({ selectedElements: selectedElements.filter(id => id !== elementId) })
        } else {
          set({ selectedElements: [...selectedElements, elementId] })
        }
      },

      clearSelection: () => {
        set({ selectedElements: [] })
      },

      // Camera lock system
      setLockedTarget: (elementId: string | null) => {
        console.log('🔓 Setting locked target to:', elementId)
        if (!elementId) {
          // Unlock - reset to default warehouse center and clear all selections
          set({ 
            lockedTarget: null,
            selectedElements: [], // Clear selection when unlocking
            cameraTarget: [69.375, 0, 124]
          })
        } else {
          set({ lockedTarget: elementId })
        }
      },

      // Double-click selection with view snapping - single selection only
      selectElementWithSnap: (elementId: string) => {
        const { selectedElements, currentFloorplan, lockedTarget } = get()
        const isSelected = selectedElements.includes(elementId)
        
        if (isSelected && lockedTarget === elementId) {
          // Deselect and unlock if already selected and locked
          console.log('🔓 Deselecting locked target:', elementId)
          set({ 
            selectedElements: [],
            lockedTarget: null,
            cameraTarget: [69.375, 0, 124] // Reset to warehouse center
          })
        } else {
          // Quick switch: clear previous selection and select new object
          console.log('🎯 Quick switching to new selection:', elementId)
          set({ 
            selectedElements: [elementId], // Only this element selected
            lockedTarget: elementId
          })
          
          // Find the element to get its position
          const element = currentFloorplan?.elements.find(el => el.id === elementId)
          if (element) {
            // Calculate element center position
            const centerX = element.position.x + element.dimensions.width / 2
            const centerZ = element.position.y + element.dimensions.height / 2
            const centerY = (element.position.z || 0) + (element.dimensions.depth || 8) / 2
            
            console.log('🎯 Locking orbit to element:', elementId, 'at center:', [centerX, centerY, centerZ])
            
            // Update camera target to focus on and orbit around the object
            set({ 
              cameraTarget: [centerX, centerY, centerZ]
            })
          }
        }
      },

      // Measurement actions removed during optimization



      // Camera actions
      setCameraPosition: (position: [number, number, number]) => {
        set({ cameraPosition: position })
      },

      setCameraTarget: (target: [number, number, number]) => {
        set({ cameraTarget: target })
      },
      
      // Layer visibility actions
      toggleLayerVisibility: (layerName: string) => {
        const { hiddenLayers } = get()
        const newHiddenLayers = new Set(hiddenLayers)
        
        if (newHiddenLayers.has(layerName)) {
          newHiddenLayers.delete(layerName)
          console.log(`🔍 Layer "${layerName}" is now VISIBLE`)
        } else {
          newHiddenLayers.add(layerName)
          console.log(`🔍 Layer "${layerName}" is now HIDDEN`)
        }
        
        set({ hiddenLayers: newHiddenLayers })
        console.log('🔍 Current hidden layers:', Array.from(newHiddenLayers))
      },
      
      hideLayer: (layerName: string) => {
        const { hiddenLayers } = get()
        const newHiddenLayers = new Set(hiddenLayers)
        newHiddenLayers.add(layerName)
        set({ hiddenLayers: newHiddenLayers })
      },
      
      showLayer: (layerName: string) => {
        const { hiddenLayers } = get()
        const newHiddenLayers = new Set(hiddenLayers)
        newHiddenLayers.delete(layerName)
        set({ hiddenLayers: newHiddenLayers })
      },
      
      isLayerVisible: (layerName: string) => {
        const { hiddenLayers } = get()
        return !hiddenLayers.has(layerName)
      },
      
      updateLayerGroups: () => {
        const { currentFloorplan } = get()
        if (!currentFloorplan) return
        
        const layerGroups: Record<string, string[]> = {}
        
        currentFloorplan.elements.forEach(element => {
          // Group I-beams
          if (element.material === 'steel' && element.metadata?.beam_type === 'I-beam') {
            if (!layerGroups['steel-ibeams']) layerGroups['steel-ibeams'] = []
            layerGroups['steel-ibeams'].push(element.id)
          }
          
          // Group Support Trusses
          if (element.material === 'steel' && element.metadata?.truss_type === 'support_truss') {
            if (!layerGroups['support-trusses']) layerGroups['support-trusses'] = []
            layerGroups['support-trusses'].push(element.id)
          }
          
          // Group TJI Beams
          if (element.material === 'tji_beam' && element.metadata?.equipment_type === 'tji_ijoist') {
            if (!layerGroups['tji-beams']) layerGroups['tji-beams'] = []
            layerGroups['tji-beams'].push(element.id)
          }
          
          // Group Room Walls
          if (element.metadata?.category === 'room-walls') {
            if (!layerGroups['room-walls']) layerGroups['room-walls'] = []
            layerGroups['room-walls'].push(element.id)
          }
          
          // Group by category
          const category = element.metadata?.category
          if (category) {
            const layerKey = `category-${category}`
            if (!layerGroups[layerKey]) layerGroups[layerKey] = []
            layerGroups[layerKey].push(element.id)
          }
          
          // Group by type
          const layerKey = `type-${element.type}`
          if (!layerGroups[layerKey]) layerGroups[layerKey] = []
          layerGroups[layerKey].push(element.id)
        })
        
        console.log('🔍 Updated layer groups:', layerGroups)
        set({ layerGroups })
      },
      
      selectElementGroup: (elementId: string) => {
        const { currentFloorplan, layerGroups } = get()
        if (!currentFloorplan) return
        
        const element = currentFloorplan.elements.find(el => el.id === elementId)
        if (!element) return
        
        // If it's an I-beam, select all I-beams
        if (element.material === 'steel' && element.metadata?.beam_type === 'I-beam') {
          const iBeamIds = layerGroups['steel-ibeams'] || []
          set({ selectedElements: iBeamIds })
          console.log(`🎯 Selected ${iBeamIds.length} I-beams as a group`)
          return
        }
        
        // Otherwise, normal single selection
        set({ selectedElements: [elementId] })
      },
    }),
    {
      name: 'warehouse-storage', // This is the actual storage key being used
      partialize: (state) => ({
        viewMode: state.viewMode,
        showMeasurements: state.showMeasurements,
        cameraPosition: state.cameraPosition,
        cameraTarget: state.cameraTarget,
      })
    }
  )
)
