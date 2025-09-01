'use client'

import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { PlumbingSystem, PlumbingSystemConfig, PipePoint, PlumbingSystemManager } from './PlumbingSystem'
import { SmartPipeRenderer } from './SmartPipeRenderer'
import { PlumbingSnapPointGenerator, PlumbingSnapPoint, PlumbingSystemType } from './PlumbingSnapPoints'
import PipeAlignmentGuides from '@/components/PipeAlignmentGuides'
import { PipeAlignmentDetector, AlignmentResult } from './AlignmentDetection'

/**
 * PIPE ROUTING TOOL
 * 
 * Interactive click-to-route pipe creation tool that allows users to:
 * - Click points in 3D space to create pipe paths
 * - Auto-insert elbows at direction changes
 * - Choose materials and diameters
 * - Modify existing paths
 * - Delete pipe systems
 */

export interface PipeRoutingState {
  isActive: boolean
  currentPath: PipePoint[]
  currentSystemId: string | null
  selectedMaterial: PlumbingSystemConfig['material']
  selectedDiameter: PlumbingSystemConfig['diameter']
  selectedSystemType: PlumbingSystemConfig['systemType']
  mode: 'create' | 'edit' | 'delete' | 'view'
  editingSystemId: string | null
  editingPointIndex: number | null
}

interface PipeRoutingToolProps {
  plumbingManager: PlumbingSystemManager
  onSystemCreated?: (system: PlumbingSystem) => void
  onSystemUpdated?: (system: PlumbingSystem) => void
  onSystemDeleted?: (systemId: string) => void
  enabled?: boolean
  floorplan?: any // For generating snap points
  onActiveSnapPointChange?: (snapPoint: PlumbingSnapPoint | null) => void
  showAlignmentGuides?: boolean
}

export const PipeRoutingTool = React.forwardRef<any, PipeRoutingToolProps>(({
  plumbingManager,
  onSystemCreated,
  onSystemUpdated,
  onSystemDeleted,
  enabled = true,
  floorplan,
  onActiveSnapPointChange,
  showAlignmentGuides = true
}, ref) => {
  const { scene, camera, raycaster, pointer } = useThree()
  
  const [routingState, setRoutingState] = useState<PipeRoutingState>({
    isActive: false,
    currentPath: [],
    currentSystemId: null,
    selectedMaterial: 'pex',
    selectedDiameter: 0.5,
    selectedSystemType: 'cold_water',
    mode: 'view',
    editingSystemId: null,
    editingPointIndex: null
  })

  const [previewPath, setPreviewPath] = useState<PipePoint[]>([])
  const [hoverPoint, setHoverPoint] = useState<THREE.Vector3 | null>(null)
  const [activeSnapPoint, setActiveSnapPoint] = useState<PlumbingSnapPoint | null>(null)
  const [currentAlignment, setCurrentAlignment] = useState<AlignmentResult | null>(null)
  
  const previewLineRef = useRef<THREE.Group | null>(null)
  const previewPointsRef = useRef<THREE.Group | null>(null)
  const snapPointsRef = useRef<THREE.Group | null>(null)
  const snapPointGeneratorRef = useRef<PlumbingSnapPointGenerator | null>(null)
  const alignmentDetectorRef = useRef<PipeAlignmentDetector>(new PipeAlignmentDetector(0.25, 1.0))

  // Initialize preview objects
  useEffect(() => {
    if (!enabled) return

    // Create preview line group for realistic pipe preview
    previewLineRef.current = new THREE.Group()
    previewLineRef.current.name = 'PipePreviewGroup'
    scene.add(previewLineRef.current)

    // Create preview points group
    previewPointsRef.current = new THREE.Group()
    previewPointsRef.current.name = 'PipePreviewPoints'
    scene.add(previewPointsRef.current)

    // Create snap points group
    snapPointsRef.current = new THREE.Group()
    snapPointsRef.current.name = 'PipeSnapPoints'
    scene.add(snapPointsRef.current)

    // Initialize snap point generator if floorplan is available
    if (floorplan && !snapPointGeneratorRef.current) {
      snapPointGeneratorRef.current = new PlumbingSnapPointGenerator(floorplan)
      console.log('🔧 Generated plumbing snap points:', snapPointGeneratorRef.current.getSnapPoints().length)
    }

    return () => {
      if (previewLineRef.current) {
        // Dispose of all preview pipe geometries and materials
        previewLineRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose())
            } else {
              child.material.dispose()
            }
          }
        })
        scene.remove(previewLineRef.current)
      }
      if (previewPointsRef.current) {
        scene.remove(previewPointsRef.current)
      }
      if (snapPointsRef.current) {
        scene.remove(snapPointsRef.current)
      }
    }
  }, [scene, enabled, floorplan])

  // Update snap points when floorplan changes
  useEffect(() => {
    if (floorplan && snapPointGeneratorRef.current) {
      snapPointGeneratorRef.current.updateFloorplan(floorplan)
      console.log('🔧 Updated plumbing snap points:', snapPointGeneratorRef.current.getSnapPoints().length)
    }
  }, [floorplan])

  // Simplified - no complex drag detection

  // Double-click handler for placing plumbing points
  const handleDoubleClick = useCallback((event: MouseEvent) => {
    if (!enabled || !routingState.isActive) return

    // Prevent default double-click behavior (object selection)
    event.preventDefault()
    event.stopPropagation()

    console.log('✅ Processing double-click for pipe routing')

    // Simple raycasting
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)
    
    if (intersects.length > 0) {
      const intersection = intersects[0]
      
      // Use the same snapping logic as mouse move for consistency
      let snappedPoint = new THREE.Vector3(
        Math.round(intersection.point.x * 4) / 4, // Quarter-foot increments
        Math.round(intersection.point.y * 4) / 4, 
        Math.round(intersection.point.z * 4) / 4  
      )
      
      // Check for snap points
      if (snapPointGeneratorRef.current) {
        const snapPoints = snapPointGeneratorRef.current.getSnapPoints()
        const snapRadius = 0.75
        
        for (let i = 0; i < Math.min(snapPoints.length, 5); i++) {
          const snapPoint = snapPoints[i]
          const snapPos = new THREE.Vector3(snapPoint.position.x, snapPoint.position.y, snapPoint.position.z)
          const distance = intersection.point.distanceTo(snapPos)
          
          if (distance < snapRadius) {
            snappedPoint.copy(snapPos)
            break
          }
        }
      }

      const point: PipePoint = {
        x: snappedPoint.x,
        y: snappedPoint.y,
        z: snappedPoint.z
      }

      if (routingState.mode === 'create') {
        handleCreateModeClick(point)
      }
    }
  }, [enabled, routingState, raycaster, pointer, camera, scene])

  const handleCreateModeClick = useCallback((point: PipePoint) => {
    // Apply the same snapping as mouse move for consistency
    const snappedPoint: PipePoint = {
      x: Math.round(point.x * 2) / 2, // Snap to half-foot increments
      y: Math.round(point.y * 4) / 4, // Snap to quarter-foot increments for height
      z: Math.round(point.z * 2) / 2  // Snap to half-foot increments
    }

    console.log(`✅ Adding pipe point at (${snappedPoint.x.toFixed(1)}, ${snappedPoint.y.toFixed(1)}, ${snappedPoint.z.toFixed(1)})`)

    setRoutingState(prev => {
      const newPath = [...prev.currentPath, snappedPoint]
      
      // Auto-detect fitting type at previous point if we have enough points
      if (newPath.length >= 3) {
        const prevIndex = newPath.length - 2
        const prevPoint = newPath[prevIndex - 1]
        const currentPoint = newPath[prevIndex]
        const nextPoint = newPath[prevIndex + 1]
        
        // Calculate angle between segments
        const dir1 = new THREE.Vector3(
          currentPoint.x - prevPoint.x,
          currentPoint.y - prevPoint.y,
          currentPoint.z - prevPoint.z
        ).normalize()
        
        const dir2 = new THREE.Vector3(
          nextPoint.x - currentPoint.x,
          nextPoint.y - currentPoint.y,
          nextPoint.z - currentPoint.z
        ).normalize()
        
        const angle = Math.acos(Math.max(-1, Math.min(1, dir1.dot(dir2))))
        const angleDegrees = (angle * 180) / Math.PI
        
        // Auto-assign fitting based on angle
        if (angleDegrees > 70 && angleDegrees < 110) {
          newPath[prevIndex].fitting = 'elbow'
        } else if (angleDegrees > 30) {
          newPath[prevIndex].fitting = 'elbow'
        }
      }
      
      return {
        ...prev,
        currentPath: newPath
      }
    })
    
    updatePreviewLine()
  }, [])

  const handleEditModeClick = useCallback((point: PipePoint, intersection: THREE.Intersection) => {
    // Check if clicking on an existing pipe system
    const clickedObject = intersection.object
    const systemId = clickedObject.userData?.systemId
    
    if (systemId) {
      const system = plumbingManager.getSystem(systemId)
      if (system) {
        // Start editing this system
        setRoutingState(prev => ({
          ...prev,
          editingSystemId: systemId,
          currentPath: [...system.getConfig().path]
        }))
      }
    }
  }, [plumbingManager])

  const handleDeleteModeClick = useCallback((intersection: THREE.Intersection) => {
    const clickedObject = intersection.object
    const systemId = clickedObject.userData?.systemId
    
    if (systemId) {
      plumbingManager.removeSystem(systemId)
      onSystemDeleted?.(systemId)
    }
  }, [plumbingManager, onSystemDeleted])

  // Handle mouse movement for preview - with enhanced stability
  const lastMouseMoveRef = useRef(0)
  const mouseMoveThrottleRef = useRef(16) // ~60fps throttling
  const stableHoverPointRef = useRef<THREE.Vector3 | null>(null)
  const alignmentStabilityRef = useRef({ type: '', count: 0, threshold: 3 })

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!enabled || !routingState.isActive) return

    // Add minimal throttling for stability (60fps max)
    const now = Date.now()
    if (now - lastMouseMoveRef.current < 16) {
      return
    }
    lastMouseMoveRef.current = now

    // Raycasting for 3D position
    raycaster.setFromCamera(pointer, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)
    
    if (intersects.length > 0) {
      const point = intersects[0].point
      
      // Grid snapping with better precision
      let candidatePoint = new THREE.Vector3(
        Math.round(point.x * 4) / 4, // Snap to quarter-foot increments for better precision
        Math.round(point.y * 4) / 4, // Snap to quarter-foot increments for height
        Math.round(point.z * 4) / 4  // Snap to quarter-foot increments
      )
      
      // Apply alignment detection for smooth snapping
      let finalPoint = candidatePoint.clone()
      let activeSnapPoint = null
      let alignmentType = 'none'
      
      if (routingState.currentPath.length > 0) {
        // Use alignment detector for professional snapping
        const alignment = alignmentDetectorRef.current.detectAlignment(
          candidatePoint,
          routingState.currentPath,
          [], // existingPipes - can be added later
          snapPointGeneratorRef.current?.getSnapPoints() || []
        )
        
        if (alignment.isAligned && alignment.confidence > 0.7) {
          alignmentType = alignment.alignmentType
          
          // Stability check - only snap if we've been hovering over this alignment for a few frames
          if (alignmentStabilityRef.current.type === alignmentType) {
            alignmentStabilityRef.current.count++
          } else {
            alignmentStabilityRef.current.type = alignmentType
            alignmentStabilityRef.current.count = 1
          }
          
          // Only apply snap if we've been stable for threshold frames
          if (alignmentStabilityRef.current.count >= alignmentStabilityRef.current.threshold) {
            finalPoint.copy(alignment.snapPosition)
            
            // Store current alignment for smooth transitions
            setCurrentAlignment(alignment)
          }
        } else {
          // Reset stability counter if no alignment
          alignmentStabilityRef.current.type = 'none'
          alignmentStabilityRef.current.count = 0
          setCurrentAlignment(null)
        }
        
        // Quick snap point check for fixtures/equipment
        if (snapPointGeneratorRef.current) {
          const snapPoints = snapPointGeneratorRef.current.getSnapPoints()
          const snapRadius = 0.75
          
          // Only check nearby snap points for performance
          for (const snapPoint of snapPoints) {
            const snapPos = new THREE.Vector3(snapPoint.position.x, snapPoint.position.y, snapPoint.position.z)
            const distance = candidatePoint.distanceTo(snapPos)
            
            if (distance < snapRadius) {
              finalPoint.copy(snapPos)
              activeSnapPoint = snapPoint
              break
            }
          }
        }
      }
      
      // Only update if position actually changed significantly (reduce jitter)
      const positionChanged = !stableHoverPointRef.current || 
        stableHoverPointRef.current.distanceTo(finalPoint) > 0.01
      
      if (positionChanged) {
        stableHoverPointRef.current = finalPoint.clone()
        setHoverPoint(finalPoint)
        
        // Update active snap point
        if (onActiveSnapPointChange) {
          onActiveSnapPointChange(activeSnapPoint)
        }
        
        // Update preview path with stable point
        if (routingState.currentPath.length > 0) {
          const previewPath = [...routingState.currentPath, {
            x: finalPoint.x,
            y: finalPoint.y,
            z: finalPoint.z
          }]
          setPreviewPath(previewPath)
          updatePreviewLine(previewPath)
        }
      }
    }
  }, [enabled, routingState, raycaster, pointer, camera, scene, onActiveSnapPointChange])

  // Handle keyboard shortcuts
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!enabled || !routingState.isActive) return

    switch (event.code) {
      case 'Enter':
        finishCurrentPath()
        break
      case 'Escape':
        cancelCurrentPath()
        break
      case 'Backspace':
        removeLastPoint()
        break
      case 'KeyM':
        cycleMaterial()
        break
      case 'KeyD':
        cycleDiameter()
        break
    }
  }, [enabled, routingState])

  // Event listeners
  useEffect(() => {
    if (!enabled) return

    const canvas = document.querySelector('canvas')
    if (canvas) {
      // Use capture phase to intercept double-clicks before they reach mesh objects
      canvas.addEventListener('dblclick', handleDoubleClick, { capture: true })
      canvas.addEventListener('mousemove', handleMouseMove)
      
      // Disable default double-click selection when in plumbing mode
      if (routingState.isActive) {
        canvas.style.userSelect = 'none'
        canvas.addEventListener('selectstart', (e) => e.preventDefault())
      }
    }
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      if (canvas) {
        canvas.removeEventListener('dblclick', handleDoubleClick, { capture: true })
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('selectstart', (e) => e.preventDefault())
        
        // Restore selection when not in plumbing mode
        if (!routingState.isActive) {
          canvas.style.userSelect = ''
        }
      }
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [enabled, handleDoubleClick, handleMouseMove, handleKeyPress, routingState.isActive])

  const updatePreviewLine = useCallback((path?: PipePoint[]) => {
    if (!previewLineRef.current) return
    
    const pathToUse = path || routingState.currentPath
    
    // Don't clear and recreate if we're just updating the last segment
    // This prevents flickering during mouse movement
    const expectedSegments = Math.max(0, pathToUse.length - 1)
    const currentSegments = previewLineRef.current.children.length
    const shouldFullRebuild = currentSegments !== expectedSegments
    
    if (shouldFullRebuild) {
      previewLineRef.current.clear()
    }
    
    if (pathToUse.length < 2) {
      previewLineRef.current.visible = false
      return
    }

    // Create pipe segments for ENTIRE path - with smart updating to reduce flickering
    for (let i = 0; i < pathToUse.length - 1; i++) {
      const start = pathToUse[i]
      const end = pathToUse[i + 1]
      
      const startVec = new THREE.Vector3(start.x, start.y, start.z)
      const endVec = new THREE.Vector3(end.x, end.y, end.z)
      const distance = startVec.distanceTo(endVec)
      const direction = new THREE.Vector3().subVectors(endVec, startVec).normalize()
      
      if (distance < 0.1) continue // Skip very short segments
      
      // Calculate pipe angle for feedback
      const isLevel = Math.abs(direction.y) < 0.05 // Slightly relaxed for smoother transitions
      const isVertical = Math.abs(direction.y) > 0.95 // Slightly relaxed for smoother transitions
      
      // Choose pipe color - make existing segments more solid, current segment brighter
      const isCurrentSegment = i === pathToUse.length - 2
      let pipeColor = getMaterialColor(routingState.selectedMaterial, routingState.selectedSystemType)
      let opacity = isCurrentSegment ? 0.9 : 0.7 // Current segment more opaque
      
      // Use alignment-aware coloring for smooth feedback
      if (isCurrentSegment && currentAlignment) {
        switch (currentAlignment.alignmentType) {
          case 'horizontal':
            pipeColor = 0x00FF88 // Bright green for horizontal alignment
            break
          case 'vertical':
            pipeColor = 0xFF6600 // Orange for vertical alignment
            break
          case 'height':
            pipeColor = 0xFFFF00 // Yellow for height alignment
            break
          default:
            // Keep material color
        }
      } else if (isLevel) {
        pipeColor = 0x00AA00 // Darker green for level (less bright)
      } else if (isVertical) {
        pipeColor = 0x0066CC // Darker blue for vertical
      }
      
      // Create pipe geometry with fewer segments for better performance
      const radius = Math.max(routingState.selectedDiameter * 0.15, 0.12)
      const geometry = new THREE.CylinderGeometry(radius, radius, distance, 8) // Reduced from 16 to 8 segments
      
      // Update existing pipe or create new one to reduce object creation/destruction
      let pipe: THREE.Mesh
      if (!shouldFullRebuild && i < previewLineRef.current.children.length) {
        // Update existing pipe instead of creating new one
        pipe = previewLineRef.current.children[i] as THREE.Mesh
        
        // Only update geometry if distance changed significantly
        const currentGeometry = pipe.geometry as THREE.CylinderGeometry
        if (Math.abs(currentGeometry.parameters.height - distance) > 0.01) {
          pipe.geometry.dispose()
          pipe.geometry = geometry
        }
        
        // Update material color smoothly
        const material = pipe.material as THREE.MeshBasicMaterial
        material.color.setHex(pipeColor)
        material.opacity = opacity
      } else {
        // Create new pipe
        const material = new THREE.MeshBasicMaterial({
          color: pipeColor,
          transparent: true,
          opacity: opacity
        })
        
        pipe = new THREE.Mesh(geometry, material)
        previewLineRef.current.add(pipe)
      }
      
      // Position and orient pipe smoothly
      const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5)
      pipe.position.copy(midPoint)
      
      // Smooth orientation with better math
      const up = new THREE.Vector3(0, 1, 0)
      if (Math.abs(direction.dot(up)) > 0.99) {
        pipe.lookAt(endVec)
      } else {
        const axis = new THREE.Vector3().crossVectors(up, direction).normalize()
        const angle = Math.acos(Math.max(-1, Math.min(1, up.dot(direction))))
        pipe.setRotationFromAxisAngle(axis, angle)
      }
    }
    
    previewLineRef.current.visible = true
    
  }, [routingState, currentAlignment])

  const updatePreviewPoints = useCallback(() => {
    if (!previewPointsRef.current) return
    
    // Clear existing points
    previewPointsRef.current.clear()
    
    // Add points for current path
    routingState.currentPath.forEach((point, index) => {
      const pointGeometry = new THREE.SphereGeometry(0.1, 8, 6)
      const pointMaterial = new THREE.MeshBasicMaterial({ 
        color: index === 0 ? 0x00ff00 : index === routingState.currentPath.length - 1 ? 0xff0000 : 0xffff00
      })
      const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial)
      pointMesh.position.set(point.x, point.y, point.z)
      previewPointsRef.current!.add(pointMesh)
    })
    
    // Add hover point
    if (hoverPoint && routingState.currentPath.length > 0) {
      const hoverGeometry = new THREE.SphereGeometry(0.05, 8, 6)
      const hoverMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff, 
        transparent: true, 
        opacity: 0.7 
      })
      const hoverMesh = new THREE.Mesh(hoverGeometry, hoverMaterial)
      hoverMesh.position.copy(hoverPoint)
      previewPointsRef.current!.add(hoverMesh)
    }
  }, [routingState.currentPath, hoverPoint])

  const finishCurrentPath = useCallback(() => {
    if (routingState.currentPath.length < 2) return

    const systemConfig: PlumbingSystemConfig = {
      id: `pipe_system_${Date.now()}`,
      name: `${routingState.selectedMaterial.toUpperCase()} ${routingState.selectedSystemType.replace('_', ' ')} Line`,
      systemType: routingState.selectedSystemType,
      material: routingState.selectedMaterial,
      diameter: routingState.selectedDiameter,
      path: [...routingState.currentPath],
      pressure: getDefaultPressure(routingState.selectedSystemType),
      insulated: routingState.selectedSystemType === 'hot_water',
      supportSpacing: getDefaultSupportSpacing(routingState.selectedMaterial)
    }

    const system = plumbingManager.createSystem(systemConfig)
    onSystemCreated?.(system)

    // Reset state
    setRoutingState(prev => ({
      ...prev,
      currentPath: [],
      currentSystemId: null
    }))
    
    updatePreviewLine([])
  }, [routingState, plumbingManager, onSystemCreated])

  const cancelCurrentPath = useCallback(() => {
    setRoutingState(prev => ({
      ...prev,
      currentPath: [],
      currentSystemId: null,
      editingSystemId: null,
      editingPointIndex: null
    }))
    updatePreviewLine([])
  }, [])

  const removeLastPoint = useCallback(() => {
    setRoutingState(prev => ({
      ...prev,
      currentPath: prev.currentPath.slice(0, -1)
    }))
    updatePreviewLine()
  }, [])

  const cycleMaterial = useCallback(() => {
    const materials: PlumbingSystemConfig['material'][] = ['pex', 'copper', 'pvc', 'cpvc', 'steel', 'cast_iron']
    setRoutingState(prev => {
      const currentIndex = materials.indexOf(prev.selectedMaterial)
      const nextIndex = (currentIndex + 1) % materials.length
      return {
        ...prev,
        selectedMaterial: materials[nextIndex]
      }
    })
  }, [])

  const cycleDiameter = useCallback(() => {
    const diameters: PlumbingSystemConfig['diameter'][] = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 6.0]
    setRoutingState(prev => {
      const currentIndex = diameters.indexOf(prev.selectedDiameter)
      const nextIndex = (currentIndex + 1) % diameters.length
      return {
        ...prev,
        selectedDiameter: diameters[nextIndex]
      }
    })
  }, [])

  // Update preview when state changes
  useEffect(() => {
    console.log('🔧 Routing state changed:', {
      isActive: routingState.isActive,
      mode: routingState.mode,
      pathLength: routingState.currentPath.length,
      material: routingState.selectedMaterial,
      diameter: routingState.selectedDiameter
    })
    updatePreviewLine()
    updatePreviewPoints()
  }, [routingState.currentPath, hoverPoint, updatePreviewLine, updatePreviewPoints, routingState.isActive, routingState.mode])

  // Public API methods
  const startRouting = useCallback((mode: PipeRoutingState['mode'] = 'create') => {
    console.log('🚰 Starting pipe routing in mode:', mode)
    console.log('💡 Double-click to place pipe points, Enter to finish, Escape to cancel')
    setRoutingState(prev => ({
      ...prev,
      isActive: true,
      mode,
      currentPath: [],
      editingSystemId: null,
      editingPointIndex: null
    }))
  }, [])

  const stopRouting = useCallback(() => {
    console.log('🚰 Stopping pipe routing')
    setRoutingState(prev => ({
      ...prev,
      isActive: false,
      mode: 'view',
      currentPath: [],
      editingSystemId: null,
      editingPointIndex: null
    }))
    updatePreviewLine([])
  }, [])

  const setMaterial = useCallback((material: PlumbingSystemConfig['material']) => {
    setRoutingState(prev => ({ ...prev, selectedMaterial: material }))
  }, [])

  const setDiameter = useCallback((diameter: PlumbingSystemConfig['diameter']) => {
    setRoutingState(prev => ({ ...prev, selectedDiameter: diameter }))
  }, [])

  const setSystemType = useCallback((systemType: PlumbingSystemConfig['systemType']) => {
    setRoutingState(prev => ({ ...prev, selectedSystemType: systemType }))
  }, [])

  // Expose public API
  React.useImperativeHandle(ref, () => ({
    startRouting,
    stopRouting,
    setMaterial,
    setDiameter,
    setSystemType,
    getState: () => routingState,
    finishCurrentPath,
    cancelCurrentPath
  }))

  // Get existing pipe paths for alignment
  const existingPipePaths = useMemo(() => {
    return plumbingManager.getAllSystems().map(system => system.getConfig().path)
  }, [plumbingManager])

  // Get snap points for alignment
  const currentSnapPoints = useMemo(() => {
    return snapPointGeneratorRef.current?.getSnapPoints() || []
  }, [snapPointGeneratorRef.current])

  return null // Simplified - no complex rendering, just pipe color feedback
})

// Helper functions
function getSystemTypeFromConfig(configSystemType: PlumbingSystemConfig['systemType']): PlumbingSystemType {
  switch (configSystemType) {
    case 'hot_water': return PlumbingSystemType.HOT_WATER
    case 'cold_water': return PlumbingSystemType.COLD_WATER
    case 'waste': return PlumbingSystemType.WASTE
    case 'vent': return PlumbingSystemType.VENT
    case 'gas': return PlumbingSystemType.GAS
    case 'compressed_air': return PlumbingSystemType.COMPRESSED_AIR
    default: return PlumbingSystemType.COLD_WATER
  }
}

function getSystemTypeColor(systemType: PlumbingSystemConfig['systemType']): number {
  const colors = {
    hot_water: 0xff4444,
    cold_water: 0x4444ff,
    waste: 0x888888,
    vent: 0x666666,
    gas: 0xffaa00,
    compressed_air: 0x00aaff
  }
  return colors[systemType] || 0x888888
}

function getMaterialColor(material: PlumbingSystemConfig['material'], systemType: PlumbingSystemConfig['systemType']): number {
  const materialColors = {
    pex: systemType === 'hot_water' ? 0xFF2222 : 0x0055FF, // Bright red/blue
    copper: 0xD2691E, // Rich copper color
    pvc: systemType === 'waste' ? 0xDDDDDD : 0xF8F8FF, // Light gray/off-white
    cpvc: 0xF5DEB3,
    steel: 0x708090,
    cast_iron: 0x2F4F4F
  }
  return materialColors[material] || materialColors.pex
}

function getDefaultPressure(systemType: PlumbingSystemConfig['systemType']): number {
  const pressures = {
    hot_water: 80,
    cold_water: 160,
    waste: 0,
    vent: 0,
    gas: 25,
    compressed_air: 125
  }
  return pressures[systemType] || 80
}

function getDefaultSupportSpacing(material: PlumbingSystemConfig['material']): number {
  const spacings = {
    pex: 32,
    copper: 48,
    pvc: 48,
    cpvc: 48,
    steel: 60,
    cast_iron: 60
  }
  return spacings[material] || 48
}

// React component for the pipe routing toolbar
interface PipeRoutingToolbarProps {
  routingTool: React.RefObject<any>
  onModeChange?: (mode: PipeRoutingState['mode']) => void
}

export const PipeRoutingToolbar: React.FC<PipeRoutingToolbarProps> = ({
  routingTool,
  onModeChange
}) => {
  const [isActive, setIsActive] = useState(false)
  const [currentMaterial, setCurrentMaterial] = useState<PlumbingSystemConfig['material']>('pex')
  const [currentDiameter, setCurrentDiameter] = useState<PlumbingSystemConfig['diameter']>(0.5)
  const [currentSystemType, setCurrentSystemType] = useState<PlumbingSystemConfig['systemType']>('cold_water')

  const handleStartRouting = () => {
    routingTool.current?.startRouting('create')
    setIsActive(true)
    onModeChange?.('create')
  }

  const handleStopRouting = () => {
    routingTool.current?.stopRouting()
    setIsActive(false)
    onModeChange?.('view')
  }

  const handleMaterialChange = (material: PlumbingSystemConfig['material']) => {
    setCurrentMaterial(material)
    routingTool.current?.setMaterial(material)
  }

  const handleDiameterChange = (diameter: PlumbingSystemConfig['diameter']) => {
    setCurrentDiameter(diameter)
    routingTool.current?.setDiameter(diameter)
  }

  const handleSystemTypeChange = (systemType: PlumbingSystemConfig['systemType']) => {
    setCurrentSystemType(systemType)
    routingTool.current?.setSystemType(systemType)
  }

  return (
    <div className="pipe-routing-toolbar bg-white border rounded-lg shadow-lg p-4 m-4">
      <div className="flex items-center gap-4">
        <button
          onClick={isActive ? handleStopRouting : handleStartRouting}
          className={`px-4 py-2 rounded font-medium ${
            isActive 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isActive ? 'Stop Routing' : 'Start Pipe Routing'}
        </button>

        {isActive && (
          <>
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1">Material</label>
              <select
                value={currentMaterial}
                onChange={(e) => handleMaterialChange(e.target.value as PlumbingSystemConfig['material'])}
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
                value={currentDiameter}
                onChange={(e) => handleDiameterChange(parseFloat(e.target.value) as PlumbingSystemConfig['diameter'])}
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
              <label className="text-sm font-medium mb-1">System Type</label>
              <select
                value={currentSystemType}
                onChange={(e) => handleSystemTypeChange(e.target.value as PlumbingSystemConfig['systemType'])}
                className="border rounded px-2 py-1"
              >
                <option value="hot_water">Hot Water</option>
                <option value="cold_water">Cold Water</option>
                <option value="waste">Waste</option>
                <option value="vent">Vent</option>
                <option value="gas">Gas</option>
                <option value="compressed_air">Compressed Air</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              <div>Click to add points</div>
              <div>Enter to finish</div>
              <div>Esc to cancel</div>
              <div>Backspace to remove last</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
