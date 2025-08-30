'use client'

import React from 'react'
import { Canvas } from '@react-three/fiber'
import { useAppStore } from '@/lib/store'
import { CameraController } from '@/lib/core/CameraController'
import { SceneWrapper } from '@/lib/core/SceneManager'
import { globalInteractionManager } from '@/lib/core/InteractionManager'

export default function ThreeRenderer() {
  const { 
    // Camera state
    cameraPosition,
    cameraTarget,
    lockedTarget,
    setLockedTarget,
    
    // Placement state
    isPlacing,
    placementTemplate,
    placementRotation,
    placementDimensions,
    isRotationLocked,
    snapPoints,
    activeSnapPoint,
    showSnapIndicators,
    snapTolerance,
    finalizePlacement,
    cancelPlacement,
    updatePreview,
    updateSnapPoints,
    rotatePlacementElement,
    expandPlacementWall,
    
    // Selection and editing
    selectedElements,
    copyElements,
    cutElements,
    pasteElements,
    hasClipboard,
    isEditing,
    editingElement,
    startElementEdit,
    updateElementEdit,
    finalizeElementEdit,
    cancelElementEdit,
    
    // Dragging
    isDragging,
    dragStartPosition,
    dragCurrentPosition,
    updateDrag,
    finalizeDrag,
    cancelDrag,
    updateElement,
    startDrag,
    
    // Measurement
    measurementMode,
    selectedObjectsForMeasurement,
    measurementDistance,
    measurementType,
    selectObjectForMeasurement,
    
    // Layer visibility
    hiddenLayers,
    layerGroups,
    isLayerVisible,
    updateLayerGroups,
    selectElementGroup,
    
    // Floorplan
    currentFloorplan
  } = useAppStore()

  // Local state for wall framing visibility
  const [showFraming, setShowFraming] = React.useState(false)
  const [showDrywall, setShowDrywall] = React.useState(false)

  // Refs for saving functionality
  const canvasRef = React.useRef<HTMLCanvasElement>()
  const cameraRef = React.useRef<THREE.Camera>()
  const mouseRef = React.useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Snap points cache
  const snapPointsCache = React.useMemo(() => {
    return snapPoints || []
  }, [snapPoints])

  // Update layer groups when floorplan changes
  React.useEffect(() => {
    updateLayerGroups()
  }, [currentFloorplan, updateLayerGroups])

  // ESC key handler to unlock camera target
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && lockedTarget) {
        console.log('🔓 ESC pressed - unlocking camera target')
        setLockedTarget(null)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [lockedTarget, setLockedTarget])

  // Screenshot and export functions
  const captureScreenshot = React.useCallback((
    filename: string = 'warehouse-render', 
    format: 'png' | 'jpeg' = 'png',
    quality: number = 1.0,
    width?: number,
    height?: number
  ) => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas not found for screenshot')
      return
    }

    try {
      // Create a temporary canvas for high-resolution export if needed
      let exportCanvas = canvas
      if (width && height && (width !== canvas.width || height !== canvas.height)) {
        exportCanvas = document.createElement('canvas')
        exportCanvas.width = width
        exportCanvas.height = height
        const ctx = exportCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(canvas, 0, 0, width, height)
        }
      }

      // Convert to blob and download
      const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png'
      exportCanvas.toBlob((blob) => {
        if (!blob) {
          console.error('Failed to create image blob')
          return
        }

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${filename}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        console.log(`📸 Screenshot saved: ${filename}.${format}`)
      }, mimeType, quality)
    } catch (error) {
      console.error('Screenshot capture failed:', error)
    }
  }, [])

  const exportModelAsJSON = React.useCallback((filename: string = 'warehouse-model') => {
    if (!currentFloorplan) {
      console.error('No floorplan to export')
      return
    }

    try {
      const exportData = {
        ...currentFloorplan,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        metadata: {
          exportSource: 'WarehouseCAD',
          totalElements: currentFloorplan.elements.length
        }
      }

      const jsonString = JSON.stringify(exportData, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${filename}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`💾 Model exported: ${filename}.json`)
    } catch (error) {
      console.error('Model export failed:', error)
    }
  }, [currentFloorplan])

  // Expose functions globally for toolbar access
  React.useEffect(() => {
    (window as any).warehouseCAD = {
      captureScreenshot,
      exportModelAsJSON,
      editElement: startElementEdit
    }
  }, [captureScreenshot, exportModelAsJSON, startElementEdit])

  // Callback to capture camera reference
  const handleCameraReady = React.useCallback((camera: THREE.Camera) => {
    cameraRef.current = camera
  }, [])

  // Handle pointer events
  const handlePointerMove = React.useCallback((event: React.PointerEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    mouseRef.current = {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height
    }

    globalInteractionManager.handlePointerMove(event)
  }, [])

  const handlePointerUp = React.useCallback((event: React.PointerEvent) => {
    globalInteractionManager.handlePointerUp(event)
  }, [])

  // Handle keyboard controls for placement and clipboard
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      console.log('Key pressed:', event.key, 'isPlacing:', isPlacing)
      
      const isCtrlOrCmd = event.ctrlKey || event.metaKey

      // Handle clipboard operations first (work in any mode)
      if (isCtrlOrCmd) {
        switch (event.key.toLowerCase()) {
          case 'c':
            if (selectedElements.length > 0) {
              event.preventDefault()
              event.stopPropagation()
              copyElements()
            }
            break
          case 'x':
            if (selectedElements.length > 0) {
              event.preventDefault()
              event.stopPropagation()
              cutElements()
            }
            break
          case 'v':
            if (hasClipboard()) {
              event.preventDefault()
              event.stopPropagation()
              // Smart paste positioning - use mouse position if available, otherwise default offset
              const basePosition = mouseRef.current 
                ? { x: mouseRef.current.x * 100, y: mouseRef.current.y * 100, z: 0 } // Convert normalized coords
                : { x: 20, y: 20, z: 0 } // Default offset
              pasteElements(basePosition)
            }
            break
        }
        return // Don't process other keys when Ctrl/Cmd is pressed
      }

      // Handle placement and editing controls
      if (isPlacing || isEditing) {
        // Handle rotation
        if (event.key.toLowerCase() === 'r') {
          event.preventDefault()
          event.stopPropagation()
          
          if (event.shiftKey) {
            console.log('Rotating counterclockwise')
            rotatePlacementElement('counterclockwise')
          } else {
            console.log('Rotating clockwise')
            rotatePlacementElement('clockwise')
          }
        }
        
        // Handle wall expansion
        if (event.key.toLowerCase() === 'e' && isPlacing) {
          event.preventDefault()
          event.stopPropagation()
          console.log('🔧 Expanding wall edge-to-edge')
          expandPlacementWall()
        }
        
        // Handle escape to cancel
        if (event.key === 'Escape') {
          event.preventDefault()
          event.stopPropagation()
          if (isEditing) {
            console.log('Canceling element edit')
            cancelElementEdit()
          } else {
            console.log('Canceling placement')
            cancelPlacement()
          }
        }
        
        // Handle enter to confirm (editing mode only)
        if (isEditing && event.key === 'Enter') {
          event.preventDefault()
          event.stopPropagation()
          console.log('Confirming element edit')
          finalizeElementEdit()
        }
      } else {
        // Handle edit shortcut when not in placement/editing mode
        if (event.key.toLowerCase() === 'e' && selectedElements.length === 1) {
          event.preventDefault()
          event.stopPropagation()
          const selectedElement = currentFloorplan?.elements.find(el => el.id === selectedElements[0])
          if (selectedElement) {
            console.log('Starting element edit via keyboard shortcut')
            startElementEdit(selectedElement)
          }
        }
        
        // Handle framing toggle (F key)
        if (event.key.toLowerCase() === 'f') {
          event.preventDefault()
          event.stopPropagation()
          console.log('🔧 Toggling framing visibility')
          setShowFraming(!showFraming)
        }
        
        // Handle drywall toggle (G key)
        if (event.key.toLowerCase() === 'g') {
          event.preventDefault()
          event.stopPropagation()
          console.log('🔧 Toggling drywall visibility')
          setShowDrywall(!showDrywall)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [
    isPlacing, isEditing, selectedElements, currentFloorplan, 
    copyElements, cutElements, pasteElements, hasClipboard,
    rotatePlacementElement, expandPlacementWall, cancelElementEdit,
    cancelPlacement, finalizeElementEdit, startElementEdit,
    showFraming, showDrywall
  ])

  return (
    <div className="w-full h-full bg-gray-700 relative">
      <Canvas
        camera={{
          position: [150, 100, 200], // View rotated building from Southeast corner
          fov: 60,
        }}
        shadows
        className="w-full h-full bg-gray-700"
        style={{ width: '100%', height: '100%', display: 'block' }}
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false
        }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        frameloop="demand"
        performance={{ min: 0.5 }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onCreated={({ gl }) => {
          // Store canvas reference for screenshots
          if (gl.domElement) {
            canvasRef.current = gl.domElement
          }
        }}
        onPointerMissed={(event) => {
          // Measurement now handled by direct object clicks - no ground clicking needed
        }}
      >
        {/* Camera Controls */}
        <CameraController 
          target={cameraTarget}
        />

        {/* Main Scene */}
        <SceneWrapper 
          onCameraReady={handleCameraReady} 
          snapPointsCache={snapPointsCache} 
          showFraming={showFraming}
          showDrywall={showDrywall}
          cameraTarget={cameraTarget}
          lockedTarget={lockedTarget}
        />
      </Canvas>
    </div>
  )
}
