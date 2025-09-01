'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { PlumbingSystem, PlumbingSystemConfig, PipePoint, PlumbingSystemManager } from './PlumbingSystem'

/**
 * PIPE PATH EDITOR
 * 
 * Advanced path modification system that allows users to:
 * - Select and move individual points in existing pipe paths
 * - Insert new points between existing points
 * - Delete points from paths
 * - Modify pipe properties (material, diameter, system type)
 * - Real-time validation and feedback
 */

export interface PathEditingState {
  isActive: boolean
  selectedSystemId: string | null
  selectedPointIndex: number | null
  isDragging: boolean
  dragOffset: THREE.Vector3 | null
  hoveredPointIndex: number | null
  hoveredSystemId: string | null
  insertionMode: boolean
  insertionPosition: { systemId: string, afterIndex: number } | null
}

interface PipePathEditorProps {
  plumbingManager: PlumbingSystemManager
  onSystemUpdated?: (system: PlumbingSystem) => void
  onValidationError?: (error: string) => void
  enabled?: boolean
}

export const PipePathEditor = React.forwardRef<any, PipePathEditorProps>(({
  plumbingManager,
  onSystemUpdated,
  onValidationError,
  enabled = true
}, ref) => {
  const { scene, camera, raycaster, pointer } = useThree()
  
  const [editingState, setEditingState] = useState<PathEditingState>({
    isActive: false,
    selectedSystemId: null,
    selectedPointIndex: null,
    isDragging: false,
    dragOffset: null,
    hoveredPointIndex: null,
    hoveredSystemId: null,
    insertionMode: false,
    insertionPosition: null
  })

  const editPointsGroupRef = useRef<THREE.Group | null>(null)
  const dragPlaneRef = useRef<THREE.Mesh | null>(null)
  const validationFeedbackRef = useRef<THREE.Group | null>(null)

  // Initialize editing visualization
  useEffect(() => {
    if (!enabled) return

    // Create edit points group
    editPointsGroupRef.current = new THREE.Group()
    editPointsGroupRef.current.name = 'PipeEditPoints'
    scene.add(editPointsGroupRef.current)

    // Create invisible drag plane
    const dragPlaneGeometry = new THREE.PlaneGeometry(1000, 1000)
    const dragPlaneMaterial = new THREE.MeshBasicMaterial({ 
      visible: false, 
      side: THREE.DoubleSide 
    })
    dragPlaneRef.current = new THREE.Mesh(dragPlaneGeometry, dragPlaneMaterial)
    dragPlaneRef.current.name = 'DragPlane'
    scene.add(dragPlaneRef.current)

    // Create validation feedback group
    validationFeedbackRef.current = new THREE.Group()
    validationFeedbackRef.current.name = 'ValidationFeedback'
    scene.add(validationFeedbackRef.current)

    return () => {
      if (editPointsGroupRef.current) {
        scene.remove(editPointsGroupRef.current)
      }
      if (dragPlaneRef.current) {
        scene.remove(dragPlaneRef.current)
        dragPlaneRef.current.geometry.dispose()
        if (Array.isArray(dragPlaneRef.current.material)) {
          dragPlaneRef.current.material.forEach(mat => mat.dispose())
        } else {
          dragPlaneRef.current.material.dispose()
        }
      }
      if (validationFeedbackRef.current) {
        scene.remove(validationFeedbackRef.current)
      }
    }
  }, [scene, enabled])

  // Update edit points visualization
  const updateEditPoints = useCallback(() => {
    if (!editPointsGroupRef.current) return

    // Clear existing points
    editPointsGroupRef.current.clear()

    if (!editingState.isActive) return

    // Add edit points for all systems
    plumbingManager.getAllSystems().forEach(system => {
      const config = system.getConfig()
      
      config.path.forEach((point, index) => {
        const isSelected = config.id === editingState.selectedSystemId && 
                          index === editingState.selectedPointIndex
        const isHovered = config.id === editingState.hoveredSystemId && 
                         index === editingState.hoveredPointIndex

        // Create point geometry
        const pointGeometry = new THREE.SphereGeometry(
          isSelected ? 0.15 : isHovered ? 0.12 : 0.08, 
          12, 
          8
        )
        
        let pointColor: number
        if (isSelected) {
          pointColor = 0xff4444 // Red for selected
        } else if (isHovered) {
          pointColor = 0xffaa00 // Orange for hovered
        } else if (index === 0) {
          pointColor = 0x44ff44 // Green for start
        } else if (index === config.path.length - 1) {
          pointColor = 0x4444ff // Blue for end
        } else {
          pointColor = 0xffff44 // Yellow for middle
        }

        const pointMaterial = new THREE.MeshBasicMaterial({ 
          color: pointColor,
          transparent: true,
          opacity: isSelected ? 1.0 : 0.8
        })
        
        const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
        pointMesh.position.set(point.x, point.y, point.z)
        
        // Add metadata for interaction
        pointMesh.userData = {
          type: 'edit_point',
          systemId: config.id,
          pointIndex: index,
          originalPosition: { x: point.x, y: point.y, z: point.z }
        }
        
        editPointsGroupRef.current!.add(pointMesh)

        // Add insertion points between existing points
        if (editingState.insertionMode && index < config.path.length - 1) {
          const nextPoint = config.path[index + 1]
          const midPoint = {
            x: (point.x + nextPoint.x) / 2,
            y: (point.y + nextPoint.y) / 2,
            z: (point.z + nextPoint.z) / 2
          }

          const insertGeometry = new THREE.RingGeometry(0.05, 0.1, 8)
          const insertMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
          })
          
          const insertMesh = new THREE.Mesh(insertGeometry, insertMaterial)
          insertMesh.position.set(midPoint.x, midPoint.y, midPoint.z)
          insertMesh.lookAt(camera.position)
          
          insertMesh.userData = {
            type: 'insert_point',
            systemId: config.id,
            afterIndex: index
          }
          
          editPointsGroupRef.current!.add(insertMesh)
        }
      })
    })
  }, [editingState, plumbingManager, camera])

  // Handle mouse interactions
  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!enabled || !editingState.isActive) return

    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(editPointsGroupRef.current?.children || [], false)

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object
      const userData = intersectedObject.userData

      if (userData.type === 'edit_point') {
        // Start dragging existing point
        setEditingState(prev => ({
          ...prev,
          selectedSystemId: userData.systemId,
          selectedPointIndex: userData.pointIndex,
          isDragging: true,
          dragOffset: intersects[0].point.clone().sub(intersectedObject.position)
        }))

        // Position drag plane at intersection point
        if (dragPlaneRef.current) {
          dragPlaneRef.current.position.copy(intersects[0].point)
          dragPlaneRef.current.lookAt(camera.position)
        }

        event.preventDefault()
        event.stopPropagation()

      } else if (userData.type === 'insert_point') {
        // Insert new point
        const system = plumbingManager.getSystem(userData.systemId)
        if (system) {
          const newPoint: PipePoint = {
            x: intersectedObject.position.x,
            y: intersectedObject.position.y,
            z: intersectedObject.position.z
          }
          
          system.addPoint(newPoint, userData.afterIndex + 1)
          onSystemUpdated?.(system)
          
          // Select the newly inserted point
          setEditingState(prev => ({
            ...prev,
            selectedSystemId: userData.systemId,
            selectedPointIndex: userData.afterIndex + 1,
            insertionMode: false
          }))
        }
      }
    } else {
      // Deselect if clicking on empty space
      setEditingState(prev => ({
        ...prev,
        selectedSystemId: null,
        selectedPointIndex: null,
        isDragging: false,
        dragOffset: null
      }))
    }
  }, [enabled, editingState, raycaster, pointer, camera, plumbingManager, onSystemUpdated])

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled || !editingState.isActive) return

    if (editingState.isDragging && editingState.selectedSystemId && editingState.selectedPointIndex !== null) {
      // Handle point dragging
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObject(dragPlaneRef.current!, false)

      if (intersects.length > 0) {
        const newPosition = intersects[0].point.clone()
        if (editingState.dragOffset) {
          newPosition.sub(editingState.dragOffset)
        }

        // Update the system with new point position
        const system = plumbingManager.getSystem(editingState.selectedSystemId)
        if (system) {
          system.updatePoint(editingState.selectedPointIndex, {
            x: newPosition.x,
            y: newPosition.y,
            z: newPosition.z
          })

          // Validate the system
          const validation = system.validateSystem()
          if (!validation.valid) {
            showValidationFeedback(validation.errors)
          } else {
            clearValidationFeedback()
          }

          onSystemUpdated?.(system)
        }
      }
    } else {
      // Handle hover detection
      raycaster.setFromCamera(pointer, camera)
      const intersects = raycaster.intersectObjects(editPointsGroupRef.current?.children || [], false)

      if (intersects.length > 0) {
        const userData = intersects[0].object.userData
        if (userData.type === 'edit_point') {
          setEditingState(prev => ({
            ...prev,
            hoveredSystemId: userData.systemId,
            hoveredPointIndex: userData.pointIndex
          }))
        } else {
          setEditingState(prev => ({
            ...prev,
            hoveredSystemId: null,
            hoveredPointIndex: null
          }))
        }
      } else {
        setEditingState(prev => ({
          ...prev,
          hoveredSystemId: null,
          hoveredPointIndex: null
        }))
      }
    }
  }, [enabled, editingState, raycaster, pointer, camera, plumbingManager, onSystemUpdated])

  const handleMouseUp = useCallback(() => {
    if (editingState.isDragging) {
      // Finish dragging
      setEditingState(prev => ({
        ...prev,
        isDragging: false,
        dragOffset: null
      }))

      // Final validation
      if (editingState.selectedSystemId) {
        const system = plumbingManager.getSystem(editingState.selectedSystemId)
        if (system) {
          const validation = system.validateSystem()
          if (!validation.valid) {
            onValidationError?.(validation.errors.join(', '))
          }
        }
      }
    }
  }, [editingState, plumbingManager, onValidationError])

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled || !editingState.isActive) return

    switch (event.code) {
      case 'Delete':
      case 'Backspace':
        if (editingState.selectedSystemId && editingState.selectedPointIndex !== null) {
          deleteSelectedPoint()
        }
        break
      case 'KeyI':
        toggleInsertionMode()
        break
      case 'Escape':
        exitEditingMode()
        break
    }
  }, [enabled, editingState])

  const deleteSelectedPoint = useCallback(() => {
    if (!editingState.selectedSystemId || editingState.selectedPointIndex === null) return

    const system = plumbingManager.getSystem(editingState.selectedSystemId)
    if (system) {
      const config = system.getConfig()
      
      // Don't allow deletion if it would leave less than 2 points
      if (config.path.length <= 2) {
        onValidationError?.('Cannot delete point: pipe must have at least 2 points')
        return
      }

      system.removePoint(editingState.selectedPointIndex)
      onSystemUpdated?.(system)

      // Clear selection
      setEditingState(prev => ({
        ...prev,
        selectedSystemId: null,
        selectedPointIndex: null
      }))
    }
  }, [editingState, plumbingManager, onSystemUpdated, onValidationError])

  const toggleInsertionMode = useCallback(() => {
    setEditingState(prev => ({
      ...prev,
      insertionMode: !prev.insertionMode
    }))
  }, [])

  const exitEditingMode = useCallback(() => {
    setEditingState({
      isActive: false,
      selectedSystemId: null,
      selectedPointIndex: null,
      isDragging: false,
      dragOffset: null,
      hoveredPointIndex: null,
      hoveredSystemId: null,
      insertionMode: false,
      insertionPosition: null
    })
    clearValidationFeedback()
  }, [])

  const showValidationFeedback = useCallback((errors: string[]) => {
    if (!validationFeedbackRef.current) return

    validationFeedbackRef.current.clear()

    // Show error indicators at problematic points
    errors.forEach((error, index) => {
      if (error.includes('bend') && editingState.selectedPointIndex !== null) {
        const errorGeometry = new THREE.RingGeometry(0.2, 0.25, 8)
        const errorMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xff0000,
          transparent: true,
          opacity: 0.8
        })
        
        const errorMesh = new THREE.Mesh(errorGeometry, errorMaterial)
        
        if (editingState.selectedSystemId) {
          const system = plumbingManager.getSystem(editingState.selectedSystemId)
          if (system) {
            const point = system.getConfig().path[editingState.selectedPointIndex]
            errorMesh.position.set(point.x, point.y, point.z)
            errorMesh.lookAt(camera.position)
            validationFeedbackRef.current!.add(errorMesh)
          }
        }
      }
    })
  }, [editingState, plumbingManager, camera])

  const clearValidationFeedback = useCallback(() => {
    if (validationFeedbackRef.current) {
      validationFeedbackRef.current.clear()
    }
  }, [])

  // Event listeners
  useEffect(() => {
    if (!enabled) return

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
    }
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mouseup', handleMouseUp)
      }
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [enabled, handleMouseDown, handleMouseMove, handleMouseUp, handleKeyPress])

  // Update visualization when state changes
  useEffect(() => {
    updateEditPoints()
  }, [editingState, updateEditPoints])

  // Public API
  const startEditing = useCallback(() => {
    setEditingState(prev => ({ ...prev, isActive: true }))
  }, [])

  const stopEditing = useCallback(() => {
    exitEditingMode()
  }, [exitEditingMode])

  const selectPoint = useCallback((systemId: string, pointIndex: number) => {
    setEditingState(prev => ({
      ...prev,
      selectedSystemId: systemId,
      selectedPointIndex: pointIndex
    }))
  }, [])

  // Expose public API
  React.useImperativeHandle(ref, () => ({
    startEditing,
    stopEditing,
    selectPoint,
    deleteSelectedPoint,
    toggleInsertionMode,
    getState: () => editingState
  }))

  return null // This component doesn't render anything visible
})

// React component for the path editing toolbar
interface PipePathEditorToolbarProps {
  pathEditor: React.RefObject<any>
  plumbingManager: PlumbingSystemManager
  onModeChange?: (mode: 'view' | 'edit') => void
}

export const PipePathEditorToolbar: React.FC<PipePathEditorToolbarProps> = ({
  pathEditor,
  plumbingManager,
  onModeChange
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [selectedSystem, setSelectedSystem] = useState<string>('')
  const [systems, setSystems] = useState<PlumbingSystem[]>([])

  useEffect(() => {
    // Update systems list
    setSystems(plumbingManager.getAllSystems())
  }, [plumbingManager])

  const handleStartEditing = () => {
    pathEditor.current?.startEditing()
    setIsEditing(true)
    onModeChange?.('edit')
  }

  const handleStopEditing = () => {
    pathEditor.current?.stopEditing()
    setIsEditing(false)
    onModeChange?.('view')
  }

  const handleDeleteSystem = () => {
    if (selectedSystem) {
      plumbingManager.removeSystem(selectedSystem)
      setSystems(plumbingManager.getAllSystems())
      setSelectedSystem('')
    }
  }

  const handleSystemPropertyChange = (property: string, value: any) => {
    if (!selectedSystem) return

    const system = plumbingManager.getSystem(selectedSystem)
    if (system) {
      switch (property) {
        case 'material':
          system.changeMaterial(value)
          break
        case 'diameter':
          system.changeDiameter(value)
          break
      }
    }
  }

  const selectedSystemConfig = selectedSystem ? 
    plumbingManager.getSystem(selectedSystem)?.getConfig() : null

  return (
    <div className="pipe-path-editor-toolbar bg-white border rounded-lg shadow-lg p-4 m-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={isEditing ? handleStopEditing : handleStartEditing}
            className={`px-4 py-2 rounded font-medium ${
              isEditing 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {isEditing ? 'Stop Editing' : 'Edit Pipes'}
          </button>

          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Select System</label>
            <select
              value={selectedSystem}
              onChange={(e) => setSelectedSystem(e.target.value)}
              className="border rounded px-2 py-1 min-w-[200px]"
            >
              <option value="">Select a pipe system...</option>
              {systems.map(system => {
                const config = system.getConfig()
                return (
                  <option key={config.id} value={config.id}>
                    {config.name}
                  </option>
                )
              })}
            </select>
          </div>

          {selectedSystem && (
            <button
              onClick={handleDeleteSystem}
              className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete System
            </button>
          )}
        </div>

        {isEditing && (
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            <div className="font-medium mb-2">Editing Controls:</div>
            <div>• Click and drag points to move them</div>
            <div>• Press 'I' to toggle insertion mode</div>
            <div>• Press Delete/Backspace to remove selected point</div>
            <div>• Press Esc to exit editing mode</div>
          </div>
        )}

        {selectedSystemConfig && (
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">System Properties</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Material</label>
                <select
                  value={selectedSystemConfig.material}
                  onChange={(e) => handleSystemPropertyChange('material', e.target.value)}
                  className="border rounded px-2 py-1"
                >
                  <option value="pex">PEX</option>
                  <option value="copper">Copper</option>
                  <option value="pvc">PVC</option>
                  <option value="cpvc">CPVC</option>
                  <option value="steel">Steel</option>
                  <option value="cast_iron">Cast Iron</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Diameter</label>
                <select
                  value={selectedSystemConfig.diameter}
                  onChange={(e) => handleSystemPropertyChange('diameter', parseFloat(e.target.value))}
                  className="border rounded px-2 py-1"
                >
                  <option value={0.5}>1/2"</option>
                  <option value={0.75}>3/4"</option>
                  <option value={1.0}>1"</option>
                  <option value={1.25}>1-1/4"</option>
                  <option value={1.5}>1-1/2"</option>
                  <option value={2.0}>2"</option>
                  <option value={2.5}>2-1/2"</option>
                  <option value={3.0}>3"</option>
                  <option value={4.0}>4"</option>
                  <option value={6.0}>6"</option>
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">System Info</label>
                <div className="text-sm text-gray-600">
                  <div>Length: {plumbingManager.getSystem(selectedSystem)?.calculateTotalLength().toFixed(1)} ft</div>
                  <div>Cost: ${plumbingManager.getSystem(selectedSystem)?.calculateTotalCost().toFixed(0)}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
