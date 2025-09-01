'use client'

import React, { Suspense } from 'react'
import { Html } from '@react-three/drei'
import { useAppStore } from '@/lib/store'
import { CameraCapture } from './CameraController'
import { Background3DGrid, GroundPlane, RoomFloor } from './RenderingUtils'
import EnhancedLighting from '@/components/EnhancedLighting'

// Import the actual warehouse model as fallback
import { MAIN_WAREHOUSE_MODEL } from '@/lib/warehouse-models'

// Sample floorplan fallback (should be moved to a constants file)
const sampleFloorplan = MAIN_WAREHOUSE_MODEL

interface SceneProps {
  onCameraReady: (camera: THREE.Camera) => void
  snapPointsCache: any[]
  showFraming: boolean
  showDrywall: boolean
  cameraTarget: [number, number, number]
  lockedTarget: string | null
}

export function Scene({ 
  onCameraReady, 
  snapPointsCache, 
  showFraming, 
  showDrywall, 
  cameraTarget, 
  lockedTarget 
}: SceneProps) {
  const {
    currentFloorplan,
    selectedElements,
    toggleElementSelection,
    selectElementWithSnap,
    showMeasurements,
    // measurementMode, // Removed - property doesn't exist
    // selectedObjectsForMeasurement, // Removed - property doesn't exist
    // measurementDistance, // Removed - property doesn't exist
    // measurementType, // Removed - property doesn't exist
    // selectObjectForMeasurement, // Removed - property doesn't exist
    dragGuides,
    firstPersonMode,
    isPlacing,
    placementTemplate,
    previewElement,
    snapPoints,
    activeSnapPoint,
    showSnapIndicators,
    loadCurrentModel,
    finalizePlacement,
    cancelPlacement,
    updatePreview,
    startElementEdit,
    isEditing,
    isDragging,
    startDrag,
    
    // Layer visibility
    isLayerVisible,
    updateLayerGroups,
    selectElementGroup
  } = useAppStore()

  // Initialize model on first render only
  const [isInitialized, setIsInitialized] = React.useState(false)
  
  React.useEffect(() => {
    if (!isInitialized) {
      console.log('🔄 Loading current model...')
      loadCurrentModel()
      setIsInitialized(true)
    }
  }, [isInitialized, loadCurrentModel])

  // Use sample data if no floorplan exists (fallback)
  const floorplan = currentFloorplan || sampleFloorplan
  
  console.log('🏗️ Current floorplan:', currentFloorplan ? 'LOADED' : 'USING FALLBACK')
  console.log('🏗️ Floorplan elements:', floorplan.elements.length)
  
  // Combine real elements with preview element
  const allElements = React.useMemo(() => {
    const elements = [...floorplan.elements]
    if (previewElement) {
      elements.push(previewElement)
    }
    return elements
  }, [floorplan.elements, previewElement])

  return (
    <>
      {/* Camera capture for raycasting */}
      <CameraCapture onCameraReady={onCameraReady} />

      {/* Background 3D Grid */}
      <Background3DGrid 
        centerX={floorplan.dimensions.width / 2} 
        centerY={floorplan.dimensions.height / 2}
        size={300} // Smaller grid for smaller workspace
      />

      {/* Enhanced Lighting System for Realistic Rendering */}
      <EnhancedLighting 
        enableShadows={true} 
        quality="ultra" 
      />

      {/* Ground plane with concrete texture */}
      <GroundPlane 
        width={floorplan.dimensions.width} 
        height={floorplan.dimensions.height} 
      />

      {/* Room floors - TODO: implement when room data is available in FloorplanData */}

      {/* Render all floorplan elements */}
      {allElements.map((element) => (
        <FloorplanElementMesh
          key={element.id}
          element={element}
          isSelected={selectedElements.includes(element.id)}
          onSelect={() => toggleElementSelection(element.id)}
          onEdit={() => startElementEdit(element)}
          onDragStart={(worldPosition: { x: number; y: number; z: number } | null) => startDrag(element, worldPosition || { x: element.position.x, y: element.position.y, z: element.position.z || 0 })}
          showFraming={showFraming}
          showDrywall={showDrywall}
          isLayerVisible={isLayerVisible}
        />
      ))}

      {/* Snap point indicators */}
      {showSnapIndicators && snapPoints.map((point, index) => (
        <SnapPointIndicator
          key={`snap-${index}`}
          position={[point.position.x, point.position.y, point.position.z]}
          type={point.type}
          isActive={activeSnapPoint !== null && 
                     activeSnapPoint.position.x === point.position.x && 
                     activeSnapPoint.position.y === point.position.y && 
                     activeSnapPoint.position.z === point.position.z}
        />
      ))}

      {/* First person controls if enabled */}
      {firstPersonMode && (
        <FirstPersonControls />
      )}

      {/* Measurement tools - removed during optimization */}

      {/* Drag guides */}
      {isDragging && dragGuides && (
        <DragGuides guides={dragGuides} />
      )}
    </>
  )
}

// Placeholder components - these will be implemented in their respective modules
function FloorplanElementMesh({ element, isSelected, onSelect, onEdit, onDragStart, showFraming, showDrywall, isLayerVisible }: any) {
  // This will be moved to a dedicated FloorplanElement component
  return null
}

function SnapPointIndicator({ position, type, isActive }: any) {
  // This will use the SnapSystem component
  return null
}

function FirstPersonControls() {
  // This will use the existing FirstPersonControls component
  return null
}

function MeasurementTools({ selectedObjects, measurementType, distance }: any) {
  // This will be a dedicated measurement component
  return null
}

function DragGuides({ guides }: any) {
  // This will be a dedicated drag guide component
  return null
}

// Scene wrapper with suspense
interface SceneWrapperProps extends SceneProps {}

export function SceneWrapper(props: SceneWrapperProps) {
  return (
    <Suspense fallback={
      <Html center>
        <div className="text-white text-lg">Loading 3D Scene...</div>
      </Html>
    }>
      <Scene {...props} />
    </Suspense>
  )
}
