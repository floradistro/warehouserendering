import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Vector3 } from 'three'
import { measurementEngine } from './MeasurementEngine'
import {
  Measurement,
  MeasurementGroup,
  MeasurementType,
  Unit,
  SnapPoint,
  LinearMeasurement,
  AngularMeasurement,
  AreaMeasurement,
  VolumeMeasurement,
  RadiusMeasurement,
  DiameterMeasurement,
  PathMeasurement,
  ClearanceMeasurement,
  DEFAULT_STYLES
} from './MeasurementTypes'

// Measurement state interface
interface MeasurementState {
  // Core data
  measurements: Record<string, Measurement>
  groups: Record<string, MeasurementGroup>
  
  // Current measurement session
  activeTool: MeasurementType | null
  isEditing: boolean
  editingMeasurement: string | null
  
  // Multi-point measurement state
  currentPoints: Vector3[]
  previewMeasurement: Partial<Measurement> | null
  
  // Snapping system
  snapPoints: SnapPoint[]
  activeSnapPoint: SnapPoint | null
  snapEnabled: boolean
  snapTolerance: number
  
  // Units and precision
  defaultUnit: Unit
  defaultPrecision: number
  
  // Visual settings
  showAllMeasurements: boolean
  showSnapIndicators: boolean
  globalOpacity: number
  
  // Undo/Redo
  history: Array<{
    measurements: Record<string, Measurement>
    groups: Record<string, MeasurementGroup>
    timestamp: Date
    action: string
  }>
  historyIndex: number
  maxHistorySize: number
  
  // Actions
  // Tool Management
  setActiveTool: (tool: MeasurementType | null) => void
  
  // Measurement CRUD
  addMeasurement: (measurement: Omit<Measurement, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateMeasurement: (id: string, updates: Partial<Measurement>) => void
  deleteMeasurement: (id: string) => void
  duplicateMeasurement: (id: string) => string | null
  
  // Point management for multi-point measurements
  addPoint: (point: Vector3) => void
  removeLastPoint: () => void
  clearPoints: () => void
  finalizeMeasurement: () => void
  cancelMeasurement: () => void
  
  // Measurement editing
  startEdit: (measurementId: string) => void
  finishEdit: () => void
  cancelEdit: () => void
  
  // Snapping
  updateSnapPoints: (points: SnapPoint[]) => void
  setActiveSnapPoint: (point: SnapPoint | null) => void
  toggleSnap: () => void
  setSnapTolerance: (tolerance: number) => void
  
  // Group management
  createGroup: (name: string, measurementIds?: string[]) => string
  updateGroup: (id: string, updates: Partial<MeasurementGroup>) => void
  deleteGroup: (id: string) => void
  addToGroup: (groupId: string, measurementId: string) => void
  removeFromGroup: (groupId: string, measurementId: string) => void
  
  // Bulk operations
  selectAll: () => string[]
  deleteSelected: (measurementIds: string[]) => void
  showSelected: (measurementIds: string[]) => void
  hideSelected: (measurementIds: string[]) => void
  
  // Import/Export
  exportMeasurements: (format: 'json' | 'csv') => string
  importMeasurements: (data: string, format: 'json') => void
  
  // Units and settings
  setDefaultUnit: (unit: Unit) => void
  setDefaultPrecision: (precision: number) => void
  convertAllUnits: (fromUnit: Unit, toUnit: Unit) => void
  
  // Visibility
  toggleMeasurementVisibility: (id: string) => void
  toggleAllMeasurements: () => void
  setGlobalOpacity: (opacity: number) => void
  
  // Undo/Redo
  undo: () => boolean
  redo: () => boolean
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
  
  // Utility
  getMeasurement: (id: string) => Measurement | undefined
  getAllMeasurements: () => Measurement[]
  getMeasurementsByType: (type: MeasurementType) => Measurement[]
  getMeasurementsByGroup: (groupId: string) => Measurement[]
  searchMeasurements: (query: string) => Measurement[]
  getTotalDistance: () => number
  getTotalArea: () => number
  getTotalVolume: () => number
  
  // Validation
  validateMeasurement: (measurement: Partial<Measurement>) => string[]
  isValidPoint: (point: Vector3) => boolean
}

// Helper function to generate unique IDs
const generateId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

// Helper function to create measurement with defaults
const createMeasurementBase = (
  type: MeasurementType,
  overrides: Partial<Measurement> = {}
): any => ({
  type,
  name: `${type.charAt(0).toUpperCase()}${type.slice(1)} Measurement`,
  visible: true,
  locked: false,
  style: DEFAULT_STYLES[type],
  ...overrides
})

// Create measurement store
export const useMeasurementStore = create<MeasurementState>()(
  persist(
    (set, get) => ({
      // Initial state
      measurements: {},
      groups: {},
      
      activeTool: null,
      isEditing: false,
      editingMeasurement: null,
      
      currentPoints: [],
      previewMeasurement: null,
      
      snapPoints: [],
      activeSnapPoint: null,
      snapEnabled: true,
      snapTolerance: 0.5,
      
      defaultUnit: 'feet',
      defaultPrecision: 2,
      
      showAllMeasurements: true,
      showSnapIndicators: true,
      globalOpacity: 1.0,
      
      history: [],
      historyIndex: -1,
      maxHistorySize: 50,
      
      // Tool Management
      setActiveTool: (tool) => {
        // Save state when switching tools
        const state = get()
        if (state.activeTool !== tool) {
          get().clearPoints()
        }
        set({ activeTool: tool, previewMeasurement: null })
      },
      
      // Measurement CRUD
      addMeasurement: (measurementData) => {
        const id = generateId()
        const now = new Date()
        const measurement = {
          ...measurementData,
          id,
          createdAt: now,
          updatedAt: now
        } as Measurement
        
        // Save to history before changing
        const state = get()
        const historyEntry = {
          measurements: { ...state.measurements },
          groups: { ...state.groups },
          timestamp: now,
          action: `Add ${measurement.type} measurement`
        }
        
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(historyEntry)
        
        if (newHistory.length > state.maxHistorySize) {
          newHistory.shift()
        }
        
        set({
          measurements: {
            ...state.measurements,
            [id]: measurement
          },
          history: newHistory,
          historyIndex: newHistory.length - 1
        })
        
        return id
      },
      
      updateMeasurement: (id, updates) => {
        const state = get()
        const existing = state.measurements[id]
        if (!existing) return
        
        // Save to history
        const now = new Date()
        const historyEntry = {
          measurements: { ...state.measurements },
          groups: { ...state.groups },
          timestamp: now,
          action: `Update ${existing.type} measurement`
        }
        
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(historyEntry)
        
        if (newHistory.length > state.maxHistorySize) {
          newHistory.shift()
        }
        
        set({
          measurements: {
            ...state.measurements,
            [id]: {
              ...existing,
              ...updates,
              updatedAt: now
            }
          } as any,
          history: newHistory,
          historyIndex: newHistory.length - 1
        })
      },
      
      deleteMeasurement: (id) => {
        const state = get()
        const measurement = state.measurements[id]
        if (!measurement) return
        
        // Save to history
        const now = new Date()
        const historyEntry = {
          measurements: { ...state.measurements },
          groups: { ...state.groups },
          timestamp: now,
          action: `Delete ${measurement.type} measurement`
        }
        
        const newHistory = state.history.slice(0, state.historyIndex + 1)
        newHistory.push(historyEntry)
        
        if (newHistory.length > state.maxHistorySize) {
          newHistory.shift()
        }
        
        const { [id]: deleted, ...remainingMeasurements } = state.measurements
        
        // Remove from groups
        const updatedGroups = { ...state.groups }
        Object.values(updatedGroups).forEach(group => {
          group.measurements = group.measurements.filter(mid => mid !== id)
        })
        
        set({
          measurements: remainingMeasurements,
          groups: updatedGroups,
          history: newHistory,
          historyIndex: newHistory.length - 1
        })
      },
      
      duplicateMeasurement: (id) => {
        const state = get()
        const original = state.measurements[id]
        if (!original) return null
        
        const { id: _, createdAt, updatedAt, ...measurementData } = original
        const duplicateData = {
          ...measurementData,
          name: `${original.name} (Copy)`
        }
        
        return get().addMeasurement(duplicateData)
      },
      
      // Point management
        addPoint: (point) => {
    const state = get()
    const newPoints = [...state.currentPoints, point]
    console.log('📍 Adding point:', point, 'Total points:', newPoints.length)
    set({ currentPoints: newPoints })
    
    // Update preview if we have enough points
    const activeTool = state.activeTool
    if (activeTool && newPoints.length >= 2) {
      console.log('🔄 Updating preview measurement for tool:', activeTool)
      // Preview measurement update removed
    }
  },
      
      removeLastPoint: () => {
        const state = get()
        if (state.currentPoints.length > 0) {
          const newPoints = state.currentPoints.slice(0, -1)
          set({ currentPoints: newPoints })
          // Preview measurement update removed
        }
      },
      
      clearPoints: () => {
        set({ 
          currentPoints: [], 
          previewMeasurement: null 
        })
      },
      
      finalizeMeasurement: () => {
        const state = get()
        if (state.previewMeasurement && state.activeTool) {
          get().addMeasurement(state.previewMeasurement as Omit<Measurement, 'id' | 'createdAt' | 'updatedAt'>)
          get().clearPoints()
          set({ activeTool: null })
        }
      },
      
      cancelMeasurement: () => {
        get().clearPoints()
        set({ activeTool: null })
      },
      
      // Preview measurement update
      updatePreviewMeasurement: () => {
        const state = get()
        console.log('🔄 updatePreviewMeasurement called:', { 
          activeTool: state.activeTool, 
          pointCount: state.currentPoints.length 
        })
        
        if (!state.activeTool || state.currentPoints.length < 2) {
          console.log('🔄 No preview - insufficient points or no active tool')
          set({ previewMeasurement: null })
          return
        }
        
        const points = state.currentPoints
        let preview: Partial<Measurement> | null = null
        console.log('🔄 Creating preview for tool:', state.activeTool, 'with points:', points.length)
        
        switch (state.activeTool) {
          case 'linear':
            if (points.length >= 2) {
              const segments = []
              let totalDistance = 0
              
              for (let i = 0; i < points.length - 1; i++) {
                // Use measurement engine for consistent horizontal calculation
                const p1 = points[i]
                const p2 = points[i + 1]
                const horizontalDistance = measurementEngine.calculateHorizontalDistance(p1, p2, state.defaultUnit)
                
                totalDistance += horizontalDistance
                segments.push({
                  startPoint: points[i],
                  endPoint: points[i + 1],
                  distance: horizontalDistance
                })
              }
              
              preview = createMeasurementBase('linear', {
                points: [...points],
                segments,
                totalDistance,
                unit: state.defaultUnit,
                precision: state.defaultPrecision,
                showSegments: points.length > 2,
                chainDimensions: points.length > 2
              }) as Partial<LinearMeasurement>
            }
            break
            
          case 'angular':
            if (points.length >= 3) {
              const vertex = points[1]
              const startPoint = points[0]
              const endPoint = points[2]
              
              const v1 = new Vector3().subVectors(startPoint, vertex).normalize()
              const v2 = new Vector3().subVectors(endPoint, vertex).normalize()
              const angle = v1.angleTo(v2)
              
              preview = createMeasurementBase('angular', {
                vertex,
                startPoint,
                endPoint,
                angle,
                unit: 'degrees',
                precision: 1,
                clockwise: false
              }) as Partial<AngularMeasurement>
            }
            break
            
          case 'area':
            if (points.length >= 3) {
              // Simple polygon area calculation using shoelace formula
              let area = 0
              for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length
                area += points[i].x * points[j].z - points[j].x * points[i].z
              }
              area = Math.abs(area) / 2
              
              // Calculate perimeter
              let perimeter = 0
              for (let i = 0; i < points.length; i++) {
                const j = (i + 1) % points.length
                perimeter += points[i].distanceTo(points[j])
              }
              
              // Calculate centroid
              const centroid = new Vector3()
              points.forEach(p => centroid.add(p))
              centroid.divideScalar(points.length)
              
              preview = createMeasurementBase('area', {
                boundary: [...points],
                area,
                perimeter,
                centroid,
                unit: 'sqft',
                precision: state.defaultPrecision,
                showPerimeter: true,
                showCentroid: true
              }) as Partial<AreaMeasurement>
            }
            break
            
          case 'radius':
            if (points.length >= 2) {
              const center = points[0]
              const edgePoint = points[1]
              const radius = center.distanceTo(edgePoint)
              
              preview = createMeasurementBase('radius', {
                center,
                edgePoint,
                radius,
                unit: state.defaultUnit,
                precision: state.defaultPrecision,
                showCenter: true
              }) as Partial<RadiusMeasurement>
            }
            break
            
          case 'diameter':
            if (points.length >= 3) {
              const center = points[1]
              const startPoint = points[0]
              const endPoint = points[2]
              const diameter = startPoint.distanceTo(endPoint)
              
              preview = createMeasurementBase('diameter', {
                center,
                startPoint,
                endPoint,
                diameter,
                unit: state.defaultUnit,
                precision: state.defaultPrecision,
                showCenter: true
              }) as Partial<DiameterMeasurement>
            }
            break
            
          case 'path':
            if (points.length >= 2) {
              const segments = []
              let totalDistance = 0
              
              for (let i = 0; i < points.length - 1; i++) {
                const distance = points[i].distanceTo(points[i + 1])
                const direction = new Vector3().subVectors(points[i + 1], points[i]).normalize()
                totalDistance += distance
                segments.push({
                  startPoint: points[i],
                  endPoint: points[i + 1],
                  distance,
                  direction
                })
              }
              
              preview = createMeasurementBase('path', {
                waypoints: [...points],
                segments,
                totalDistance,
                unit: state.defaultUnit,
                precision: state.defaultPrecision,
                showWaypoints: true
              }) as Partial<PathMeasurement>
            }
            break
        }
        
        console.log('🔄 Setting preview measurement:', preview?.type, preview)
        set({ previewMeasurement: preview })
      },
      
      // Editing
      startEdit: (measurementId) => {
        const measurement = get().measurements[measurementId]
        if (measurement && !measurement.locked) {
          set({
            isEditing: true,
            editingMeasurement: measurementId
          })
        }
      },
      
      finishEdit: () => {
        set({
          isEditing: false,
          editingMeasurement: null
        })
      },
      
      cancelEdit: () => {
        set({
          isEditing: false,
          editingMeasurement: null
        })
      },
      
      // Snapping
      updateSnapPoints: (points) => {
        set({ snapPoints: points })
      },
      
      setActiveSnapPoint: (point) => {
        set({ activeSnapPoint: point })
      },
      
      toggleSnap: () => {
        set(state => ({ snapEnabled: !state.snapEnabled }))
      },
      
      setSnapTolerance: (tolerance) => {
        set({ snapTolerance: Math.max(0.1, Math.min(5.0, tolerance)) })
      },
      
      // Group management
      createGroup: (name, measurementIds = []) => {
        const id = generateId()
        const now = new Date()
        const group: MeasurementGroup = {
          id,
          name,
          color: '#ffffff',
          visible: true,
          locked: false,
          measurements: measurementIds,
          createdAt: now,
          updatedAt: now
        }
        
        set(state => ({
          groups: {
            ...state.groups,
            [id]: group
          }
        }))
        
        return id
      },
      
      updateGroup: (id, updates) => {
        const state = get()
        const existing = state.groups[id]
        if (!existing) return
        
        set({
          groups: {
            ...state.groups,
            [id]: {
              ...existing,
              ...updates,
              updatedAt: new Date()
            }
          }
        })
      },
      
      deleteGroup: (id) => {
        const { [id]: deleted, ...remainingGroups } = get().groups
        set({ groups: remainingGroups })
      },
      
      addToGroup: (groupId, measurementId) => {
        const state = get()
        const group = state.groups[groupId]
        if (group && !group.measurements.includes(measurementId)) {
          get().updateGroup(groupId, {
            measurements: [...group.measurements, measurementId]
          })
        }
      },
      
      removeFromGroup: (groupId, measurementId) => {
        const state = get()
        const group = state.groups[groupId]
        if (group) {
          get().updateGroup(groupId, {
            measurements: group.measurements.filter(id => id !== measurementId)
          })
        }
      },
      
      // Bulk operations
      selectAll: () => {
        return Object.keys(get().measurements)
      },
      
      deleteSelected: (measurementIds) => {
        measurementIds.forEach(id => get().deleteMeasurement(id))
      },
      
      showSelected: (measurementIds) => {
        measurementIds.forEach(id => {
          get().updateMeasurement(id, { visible: true })
        })
      },
      
      hideSelected: (measurementIds) => {
        measurementIds.forEach(id => {
          get().updateMeasurement(id, { visible: false })
        })
      },
      
      // Import/Export
      exportMeasurements: (format) => {
        const state = get()
        
        if (format === 'json') {
          return JSON.stringify({
            measurements: state.measurements,
            groups: state.groups,
            exportedAt: new Date().toISOString(),
            version: '1.0'
          }, null, 2)
        } else if (format === 'csv') {
          const measurements = Object.values(state.measurements)
          const headers = ['ID', 'Type', 'Name', 'Value', 'Unit', 'Created', 'Updated']
          const rows = measurements.map(m => {
            let value = ''
            switch (m.type) {
              case 'linear':
                value = (m as LinearMeasurement).totalDistance.toString()
                break
              case 'angular':
                value = (m as AngularMeasurement).angle.toString()
                break
              case 'area':
                value = (m as AreaMeasurement).area.toString()
                break
              case 'volume':
                value = (m as VolumeMeasurement).volume.toString()
                break
            }
            return [
              m.id,
              m.type,
              m.name,
              value,
              (m as any).unit || '',
              m.createdAt.toISOString(),
              m.updatedAt.toISOString()
            ]
          })
          
          return [headers, ...rows].map(row => row.join(',')).join('\n')
        }
        
        return ''
      },
      
      importMeasurements: (data, format) => {
        if (format === 'json') {
          try {
            const imported = JSON.parse(data)
            if (imported.measurements && imported.groups) {
              set({
                measurements: { ...get().measurements, ...imported.measurements },
                groups: { ...get().groups, ...imported.groups }
              })
            }
          } catch (error) {
            console.error('Failed to import measurements:', error)
          }
        }
      },
      
      // Units and settings
      setDefaultUnit: (unit) => {
        set({ defaultUnit: unit })
      },
      
      setDefaultPrecision: (precision) => {
        set({ defaultPrecision: Math.max(0, Math.min(6, precision)) })
      },
      
      convertAllUnits: (fromUnit, toUnit) => {
        // Implementation for unit conversion would go here
        // This is a complex operation that would need to convert all measurements
        console.log(`Converting all measurements from ${fromUnit} to ${toUnit}`)
      },
      
      // Visibility
      toggleMeasurementVisibility: (id) => {
        const measurement = get().measurements[id]
        if (measurement) {
          get().updateMeasurement(id, { visible: !measurement.visible })
        }
      },
      
      toggleAllMeasurements: () => {
        const state = get()
        const newVisibility = !state.showAllMeasurements
        set({ showAllMeasurements: newVisibility })
        
        // Update all measurements
        Object.keys(state.measurements).forEach(id => {
          get().updateMeasurement(id, { visible: newVisibility })
        })
      },
      
      setGlobalOpacity: (opacity) => {
        set({ globalOpacity: Math.max(0, Math.min(1, opacity)) })
      },
      
      // Undo/Redo
      undo: () => {
        const state = get()
        if (state.historyIndex > 0) {
          const previousState = state.history[state.historyIndex - 1]
          set({
            measurements: previousState.measurements,
            groups: previousState.groups,
            historyIndex: state.historyIndex - 1
          })
          return true
        }
        return false
      },
      
      redo: () => {
        const state = get()
        if (state.historyIndex < state.history.length - 1) {
          const nextState = state.history[state.historyIndex + 1]
          set({
            measurements: nextState.measurements,
            groups: nextState.groups,
            historyIndex: state.historyIndex + 1
          })
          return true
        }
        return false
      },
      
      canUndo: () => {
        return get().historyIndex > 0
      },
      
      canRedo: () => {
        const state = get()
        return state.historyIndex < state.history.length - 1
      },
      
      clearHistory: () => {
        set({ history: [], historyIndex: -1 })
      },
      
      // Utility functions
      getMeasurement: (id) => {
        return get().measurements[id]
      },
      
      getAllMeasurements: () => {
        return Object.values(get().measurements)
      },
      
      getMeasurementsByType: (type) => {
        return Object.values(get().measurements).filter(m => m.type === type)
      },
      
      getMeasurementsByGroup: (groupId) => {
        const state = get()
        const group = state.groups[groupId]
        if (!group) return []
        
        return group.measurements
          .map(id => state.measurements[id])
          .filter(Boolean)
      },
      
      searchMeasurements: (query) => {
        const measurements = Object.values(get().measurements)
        const lowercaseQuery = query.toLowerCase()
        
        return measurements.filter(m => 
          m.name.toLowerCase().includes(lowercaseQuery) ||
          m.description?.toLowerCase().includes(lowercaseQuery) ||
          m.type.toLowerCase().includes(lowercaseQuery)
        )
      },
      
      getTotalDistance: () => {
        const measurements = Object.values(get().measurements)
        return measurements
          .filter(m => m.type === 'linear' || m.type === 'path')
          .reduce((total, m) => {
            if (m.type === 'linear') {
              return total + (m as LinearMeasurement).totalDistance
            } else if (m.type === 'path') {
              return total + (m as PathMeasurement).totalDistance
            }
            return total
          }, 0)
      },
      
      getTotalArea: () => {
        const measurements = Object.values(get().measurements)
        return measurements
          .filter(m => m.type === 'area')
          .reduce((total, m) => total + (m as AreaMeasurement).area, 0)
      },
      
      getTotalVolume: () => {
        const measurements = Object.values(get().measurements)
        return measurements
          .filter(m => m.type === 'volume')
          .reduce((total, m) => total + (m as VolumeMeasurement).volume, 0)
      },
      
      // Validation
      validateMeasurement: (measurement) => {
        const errors: string[] = []
        
        if (!measurement.name || measurement.name.trim().length === 0) {
          errors.push('Name is required')
        }
        
        if (!measurement.type) {
          errors.push('Type is required')
        }
        
        // Type-specific validation
        if (measurement.type === 'linear') {
          const linear = measurement as Partial<LinearMeasurement>
          if (!linear.points || linear.points.length < 2) {
            errors.push('Linear measurement requires at least 2 points')
          }
        }
        
        if (measurement.type === 'angular') {
          const angular = measurement as Partial<AngularMeasurement>
          if (!angular.vertex || !angular.startPoint || !angular.endPoint) {
            errors.push('Angular measurement requires vertex, start and end points')
          }
        }
        
        if (measurement.type === 'area') {
          const area = measurement as Partial<AreaMeasurement>
          if (!area.boundary || area.boundary.length < 3) {
            errors.push('Area measurement requires at least 3 boundary points')
          }
        }
        
        return errors
      },
      
      isValidPoint: (point) => {
        return !isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
               isFinite(point.x) && isFinite(point.y) && isFinite(point.z)
      }
    }),
    {
      name: 'measurement-storage',
      partialize: (state) => ({
        measurements: state.measurements,
        groups: state.groups,
        defaultUnit: state.defaultUnit,
        defaultPrecision: state.defaultPrecision,
        snapEnabled: state.snapEnabled,
        snapTolerance: state.snapTolerance,
        showAllMeasurements: state.showAllMeasurements,
        showSnapIndicators: state.showSnapIndicators,
        globalOpacity: state.globalOpacity
      }),
      // Handle date serialization/deserialization
      onRehydrateStorage: () => (state) => {
        if (state?.measurements) {
          // Convert date strings back to Date objects
          Object.values(state.measurements).forEach((measurement: any) => {
            if (measurement.createdAt && typeof measurement.createdAt === 'string') {
              measurement.createdAt = new Date(measurement.createdAt)
            }
            if (measurement.updatedAt && typeof measurement.updatedAt === 'string') {
              measurement.updatedAt = new Date(measurement.updatedAt)
            }
          })
        }
        if (state?.groups) {
          Object.values(state.groups).forEach((group: any) => {
            if (group.createdAt && typeof group.createdAt === 'string') {
              group.createdAt = new Date(group.createdAt)
            }
            if (group.updatedAt && typeof group.updatedAt === 'string') {
              group.updatedAt = new Date(group.updatedAt)
            }
          })
        }
      }
    }
  )
)

// Export helper hooks for common operations
export const useMeasurements = () => {
  const measurements = useMeasurementStore(state => state.measurements)
  return Object.values(measurements)
}

export const useVisibleMeasurements = () => {
  const measurements = useMeasurements()
  const showAll = useMeasurementStore(state => state.showAllMeasurements)
  return measurements.filter(m => m.visible && showAll)
}

export const useActiveTool = () => {
  return useMeasurementStore(state => state.activeTool)
}

export const useSnapPoints = () => {
  const snapPoints = useMeasurementStore(state => state.snapPoints)
  const snapEnabled = useMeasurementStore(state => state.snapEnabled)
  return snapEnabled ? snapPoints : []
}
