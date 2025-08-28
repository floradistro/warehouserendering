import { FloorplanData, FloorplanElement } from './store'
import { 
  MAIN_WAREHOUSE_MODEL, 
  validateWarehouseModel, 
  cloneModel, 
  touchModel,
  MODEL_TEMPLATES,
  ModelValidationResult 
} from './warehouse-models'

/**
 * WAREHOUSE MODEL MANAGER
 * Provides CRUD operations and model management functionality
 */

export interface ModelOperationResult<T = any> {
  success: boolean
  data?: T
  error?: string
  validation?: ModelValidationResult
}

export interface ElementUpdateData {
  position?: { x?: number; y?: number; z?: number }
  dimensions?: { width?: number; height?: number; depth?: number }
  color?: string
  material?: string
  rotation?: number
  metadata?: Record<string, any>
}

export class WarehouseModelManager {
  private models: Map<string, FloorplanData> = new Map()
  private currentModelId: string | null = null
  private undoStack: FloorplanData[] = []
  private redoStack: FloorplanData[] = []
  private maxUndoSteps = 50

  constructor() {
    // Load the main warehouse model
    this.models.set(MAIN_WAREHOUSE_MODEL.id, MAIN_WAREHOUSE_MODEL)
    this.currentModelId = MAIN_WAREHOUSE_MODEL.id
  }

  // === MODEL CRUD OPERATIONS ===

  /**
   * Creates a new warehouse model
   */
  createModel(template: 'EMPTY' | 'BASIC' | 'CUSTOM' = 'EMPTY', customData?: Partial<FloorplanData>): ModelOperationResult<FloorplanData> {
    try {
      let newModel: FloorplanData

      if (template === 'CUSTOM' && customData) {
        newModel = {
          id: customData.id || `warehouse-${Date.now()}`,
          name: customData.name || 'New Warehouse',
          dimensions: customData.dimensions || { width: 100, height: 50 },
          elements: customData.elements || [],
          scale: customData.scale || 1,
          units: customData.units || 'feet',
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      } else {
        // Map template names to actual MODEL_TEMPLATES keys
        const templateMap = {
          'EMPTY': 'EMPTY_1000',
          'BASIC': 'BASIC_100'
        }
        const templateKey = template === 'CUSTOM' ? 'EMPTY_1000' : templateMap[template] || 'EMPTY_1000'
        // Convert readonly template to mutable FloorplanData
        const templateModel = MODEL_TEMPLATES[templateKey as keyof typeof MODEL_TEMPLATES]
        newModel = cloneModel({
          ...templateModel,
          elements: [...templateModel.elements] // Convert readonly array to mutable
        } as FloorplanData)
        newModel.id = `warehouse-${Date.now()}`
        newModel.createdAt = new Date()
        newModel.updatedAt = new Date()
      }

      const validation = validateWarehouseModel(newModel)
      
      this.models.set(newModel.id, newModel)
      
      return {
        success: true,
        data: newModel,
        validation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create model'
      }
    }
  }

  /**
   * Gets a model by ID
   */
  getModel(id: string): ModelOperationResult<FloorplanData> {
    const model = this.models.get(id)
    if (!model) {
      return {
        success: false,
        error: `Model with ID '${id}' not found`
      }
    }

    return {
      success: true,
      data: cloneModel(model)
    }
  }

  /**
   * Gets the current active model
   */
  getCurrentModel(): ModelOperationResult<FloorplanData> {
    if (!this.currentModelId) {
      return {
        success: false,
        error: 'No current model set'
      }
    }

    return this.getModel(this.currentModelId)
  }

  /**
   * Sets the current active model
   */
  setCurrentModel(id: string): ModelOperationResult<FloorplanData> {
    if (!this.models.has(id)) {
      return {
        success: false,
        error: `Model with ID '${id}' not found`
      }
    }

    this.currentModelId = id
    this.clearUndoRedo() // Clear undo/redo when switching models
    
    return this.getCurrentModel()
  }

  /**
   * Updates a model
   */
  updateModel(id: string, updates: Partial<FloorplanData>): ModelOperationResult<FloorplanData> {
    const model = this.models.get(id)
    if (!model) {
      return {
        success: false,
        error: `Model with ID '${id}' not found`
      }
    }

    try {
      // Save current state for undo
      if (id === this.currentModelId) {
        this.saveUndoState(model)
      }

      const updatedModel = touchModel({
        ...model,
        ...updates,
        id: model.id, // Prevent ID changes
        createdAt: model.createdAt, // Preserve creation date
      })

      const validation = validateWarehouseModel(updatedModel)
      
      this.models.set(id, updatedModel)
      
      return {
        success: true,
        data: cloneModel(updatedModel),
        validation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update model'
      }
    }
  }

  /**
   * Deletes a model
   */
  deleteModel(id: string): ModelOperationResult<boolean> {
    if (id === MAIN_WAREHOUSE_MODEL.id) {
      return {
        success: false,
        error: 'Cannot delete the main warehouse model'
      }
    }

    if (!this.models.has(id)) {
      return {
        success: false,
        error: `Model with ID '${id}' not found`
      }
    }

    this.models.delete(id)
    
    // If this was the current model, switch to main warehouse
    if (this.currentModelId === id) {
      this.currentModelId = MAIN_WAREHOUSE_MODEL.id
      this.clearUndoRedo()
    }

    return {
      success: true,
      data: true
    }
  }

  /**
   * Lists all available models
   */
  listModels(): ModelOperationResult<Array<{ id: string; name: string; updatedAt: Date }>> {
    const modelList = Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      updatedAt: model.updatedAt
    }))

    return {
      success: true,
      data: modelList.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    }
  }

  // === ELEMENT CRUD OPERATIONS ===

  /**
   * Adds an element to the current model
   */
  addElement(element: Omit<FloorplanElement, 'id'>): ModelOperationResult<FloorplanElement> {
    console.log('ModelManager: Adding element', element)
    console.log('ModelManager: Current model ID', this.currentModelId)
    
    const currentResult = this.getCurrentModel()
    console.log('ModelManager: Current model result', currentResult)
    
    if (!currentResult.success || !currentResult.data) {
      console.error('ModelManager: No current model available')
      return {
        success: false,
        error: currentResult.error || 'No current model available'
      }
    }

    try {
      const newElement: FloorplanElement = {
        ...element,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
      
      console.log('ModelManager: Created new element with ID', newElement.id)

      const updatedElements = [...currentResult.data.elements, newElement]
      console.log('ModelManager: Updated elements array length', updatedElements.length)
      
      const updateResult = this.updateModel(this.currentModelId!, {
        elements: updatedElements
      })
      
      console.log('ModelManager: Update model result', updateResult)

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update model'
        }
      }

      return {
        success: true,
        data: newElement,
        validation: updateResult.validation
      }
    } catch (error) {
      console.error('ModelManager: Error adding element', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add element'
      }
    }
  }

  /**
   * Updates an element in the current model
   */
  updateElement(elementId: string, updates: ElementUpdateData): ModelOperationResult<FloorplanElement> {
    const currentResult = this.getCurrentModel()
    if (!currentResult.success || !currentResult.data) {
      return {
        success: false,
        error: currentResult.error || 'No current model available'
      }
    }

    try {
      const elementIndex = currentResult.data.elements.findIndex(e => e.id === elementId)
      if (elementIndex === -1) {
        return {
          success: false,
          error: `Element with ID '${elementId}' not found`
        }
      }

      const currentElement = currentResult.data.elements[elementIndex]
      const updatedElement: FloorplanElement = {
        ...currentElement,
        position: { ...currentElement.position, ...updates.position },
        dimensions: { ...currentElement.dimensions, ...updates.dimensions },
        color: updates.color ?? currentElement.color,
        material: updates.material ?? currentElement.material,
        rotation: updates.rotation ?? currentElement.rotation,
        metadata: updates.metadata ? { ...currentElement.metadata, ...updates.metadata } : currentElement.metadata
      }

      const updatedElements = [...currentResult.data.elements]
      updatedElements[elementIndex] = updatedElement

      const updateResult = this.updateModel(this.currentModelId!, {
        elements: updatedElements
      })

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update model'
        }
      }

      return {
        success: true,
        data: updatedElement,
        validation: updateResult.validation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update element'
      }
    }
  }

  /**
   * Removes an element from the current model
   */
  removeElement(elementId: string): ModelOperationResult<boolean> {
    const currentResult = this.getCurrentModel()
    if (!currentResult.success || !currentResult.data) {
      return {
        success: false,
        error: currentResult.error || 'No current model available'
      }
    }

    try {
      const elementExists = currentResult.data.elements.some(e => e.id === elementId)
      if (!elementExists) {
        return {
          success: false,
          error: `Element with ID '${elementId}' not found`
        }
      }

      const updatedElements = currentResult.data.elements.filter(e => e.id !== elementId)
      
      const updateResult = this.updateModel(this.currentModelId!, {
        elements: updatedElements
      })

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update model'
        }
      }

      return {
        success: true,
        data: true,
        validation: updateResult.validation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove element'
      }
    }
  }

  /**
   * Gets an element by ID from the current model
   */
  getElement(elementId: string): ModelOperationResult<FloorplanElement> {
    const currentResult = this.getCurrentModel()
    if (!currentResult.success || !currentResult.data) {
      return {
        success: false,
        error: currentResult.error || 'No current model available'
      }
    }

    const element = currentResult.data.elements.find(e => e.id === elementId)
    if (!element) {
      return {
        success: false,
        error: `Element with ID '${elementId}' not found`
      }
    }

    return {
      success: true,
      data: { ...element }
    }
  }

  /**
   * Duplicates an element in the current model
   */
  duplicateElement(elementId: string, offset: { x?: number; y?: number; z?: number } = { x: 5, y: 5 }): ModelOperationResult<FloorplanElement> {
    const elementResult = this.getElement(elementId)
    if (!elementResult.success || !elementResult.data) {
      return elementResult
    }

    const originalElement = elementResult.data
    const duplicatedElement = {
      ...originalElement,
      position: {
        x: originalElement.position.x + (offset.x || 0),
        y: originalElement.position.y + (offset.y || 0),
        z: (originalElement.position.z || 0) + (offset.z || 0)
      }
    }

    // Remove the ID so addElement will generate a new one
    const { id, ...elementWithoutId } = duplicatedElement
    
    return this.addElement(elementWithoutId)
  }

  // === UNDO/REDO OPERATIONS ===

  /**
   * Saves current model state to undo stack
   */
  private saveUndoState(model: FloorplanData) {
    this.undoStack.push(cloneModel(model))
    if (this.undoStack.length > this.maxUndoSteps) {
      this.undoStack.shift()
    }
    this.redoStack = [] // Clear redo stack when new action is performed
  }

  /**
   * Undoes the last action
   */
  undo(): ModelOperationResult<FloorplanData> {
    if (!this.currentModelId) {
      return {
        success: false,
        error: 'No current model set'
      }
    }

    if (this.undoStack.length === 0) {
      return {
        success: false,
        error: 'Nothing to undo'
      }
    }

    const currentModel = this.models.get(this.currentModelId)
    if (currentModel) {
      this.redoStack.push(cloneModel(currentModel))
    }

    const previousState = this.undoStack.pop()!
    this.models.set(this.currentModelId, previousState)

    return {
      success: true,
      data: cloneModel(previousState)
    }
  }

  /**
   * Redoes the last undone action
   */
  redo(): ModelOperationResult<FloorplanData> {
    if (!this.currentModelId) {
      return {
        success: false,
        error: 'No current model set'
      }
    }

    if (this.redoStack.length === 0) {
      return {
        success: false,
        error: 'Nothing to redo'
      }
    }

    const currentModel = this.models.get(this.currentModelId)
    if (currentModel) {
      this.undoStack.push(cloneModel(currentModel))
    }

    const nextState = this.redoStack.pop()!
    this.models.set(this.currentModelId, nextState)

    return {
      success: true,
      data: cloneModel(nextState)
    }
  }

  /**
   * Clears undo/redo stacks
   */
  private clearUndoRedo() {
    this.undoStack = []
    this.redoStack = []
  }

  /**
   * Gets undo/redo status
   */
  getUndoRedoStatus(): { canUndo: boolean; canRedo: boolean; undoCount: number; redoCount: number } {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length
    }
  }

  // === UTILITY OPERATIONS ===

  /**
   * Validates the current model
   */
  validateCurrentModel(): ModelOperationResult<ModelValidationResult> {
    const currentResult = this.getCurrentModel()
    if (!currentResult.success || !currentResult.data) {
      return {
        success: false,
        error: currentResult.error || 'No current model available'
      }
    }

    const validation = validateWarehouseModel(currentResult.data)
    
    return {
      success: true,
      data: validation
    }
  }

  /**
   * Exports a model to JSON
   */
  exportModel(id: string): ModelOperationResult<string> {
    const modelResult = this.getModel(id)
    if (!modelResult.success || !modelResult.data) {
      return {
        success: false,
        error: modelResult.error || 'Model not found'
      }
    }

    try {
      const jsonString = JSON.stringify(modelResult.data, null, 2)
      return {
        success: true,
        data: jsonString
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export model'
      }
    }
  }

  /**
   * Imports a model from JSON
   */
  importModel(jsonString: string): ModelOperationResult<FloorplanData> {
    try {
      const modelData = JSON.parse(jsonString) as FloorplanData
      
      // Ensure required fields
      if (!modelData.id || !modelData.name || !modelData.dimensions || !Array.isArray(modelData.elements)) {
        return {
          success: false,
          error: 'Invalid model format'
        }
      }

      // Generate new ID to avoid conflicts
      const importedModel: FloorplanData = {
        ...modelData,
        id: `imported-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const validation = validateWarehouseModel(importedModel)
      
      this.models.set(importedModel.id, importedModel)
      
      return {
        success: true,
        data: importedModel,
        validation
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import model'
      }
    }
  }

  /**
   * Gets model statistics
   */
  getModelStats(id?: string): ModelOperationResult<{
    totalElements: number
    elementsByType: Record<string, number>
    elementsByCategory: Record<string, number>
    totalArea: number
    rooms: string[]
  }> {
    const modelId = id || this.currentModelId
    if (!modelId) {
      return {
        success: false,
        error: 'No model specified'
      }
    }

    const modelResult = this.getModel(modelId)
    if (!modelResult.success || !modelResult.data) {
      return modelResult as any
    }

    const model = modelResult.data
    const elements = model.elements

    const elementsByType: Record<string, number> = {}
    const elementsByCategory: Record<string, number> = {}
    const rooms = new Set<string>()

    elements.forEach(element => {
      // Count by type
      elementsByType[element.type] = (elementsByType[element.type] || 0) + 1
      
      // Count by category
      const category = element.metadata?.category || 'uncategorized'
      elementsByCategory[category] = (elementsByCategory[category] || 0) + 1
      
      // Collect rooms
      if (element.metadata?.room) {
        rooms.add(element.metadata.room)
      }
    })

    const totalArea = model.dimensions.width * model.dimensions.height

    return {
      success: true,
      data: {
        totalElements: elements.length,
        elementsByType,
        elementsByCategory,
        totalArea,
        rooms: Array.from(rooms).sort()
      }
    }
  }
}

// Create singleton instance
export const modelManager = new WarehouseModelManager()
