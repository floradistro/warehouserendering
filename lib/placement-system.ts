import * as THREE from 'three'
import { FloorplanElement } from './store'

/**
 * INTERACTIVE PLACEMENT SYSTEM
 * Handles cursor-based element placement in the 3D scene
 */

export interface PlacementState {
  isPlacing: boolean
  elementTemplate: string | null
  previewElement: FloorplanElement | null
  cursorPosition: { x: number; y: number; z: number } | null
}

export interface PlacementOptions {
  snapToGrid?: boolean
  gridSize?: number
  showPreview?: boolean
  constrainToGround?: boolean
}

export class PlacementManager {
  private raycaster = new THREE.Raycaster()
  private mouse = new THREE.Vector2()
  private groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  
  constructor(
    private camera: THREE.Camera,
    private options: PlacementOptions = {}
  ) {
    this.options = {
      snapToGrid: true,
      gridSize: 1,
      showPreview: true,
      constrainToGround: true,
      ...options
    }
  }

  /**
   * Converts screen coordinates to world position
   */
  screenToWorld(
    screenX: number, 
    screenY: number, 
    canvasWidth: number, 
    canvasHeight: number
  ): THREE.Vector3 | null {
    // Convert screen coordinates to normalized device coordinates (-1 to +1)
    this.mouse.x = (screenX / canvasWidth) * 2 - 1
    this.mouse.y = -(screenY / canvasHeight) * 2 + 1

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera)

    if (this.options.constrainToGround) {
      // Intersect with ground plane
      const intersection = new THREE.Vector3()
      const intersected = this.raycaster.ray.intersectPlane(this.groundPlane, intersection)
      
      if (intersected) {
        return this.snapToGrid(intersection)
      }
    } else {
      // Use a default distance from camera
      const direction = new THREE.Vector3()
      this.raycaster.ray.direction.clone().multiplyScalar(50).add(this.raycaster.ray.origin)
      return this.snapToGrid(direction)
    }

    return null
  }

  /**
   * Snaps position to grid if enabled
   */
  private snapToGrid(position: THREE.Vector3): THREE.Vector3 {
    if (!this.options.snapToGrid || !this.options.gridSize) {
      return position
    }

    const gridSize = this.options.gridSize
    return new THREE.Vector3(
      Math.round(position.x / gridSize) * gridSize,
      position.y,
      Math.round(position.z / gridSize) * gridSize
    )
  }

  /**
   * Creates a preview element at the given position
   */
  createPreviewElement(
    templateId: string, 
    position: THREE.Vector3,
    templates: Record<string, any>
  ): FloorplanElement | null {
    const template = templates[templateId]
    if (!template) return null

    return {
      id: 'preview-element',
      type: template.type,
      position: { x: position.x, y: position.z, z: position.y },
      dimensions: {
        width: template.defaultDimensions.width,
        height: template.defaultDimensions.height,
        depth: template.defaultDimensions.depth || 8
      },
      color: template.defaultColor,
      material: template.material,
      metadata: {
        ...template.metadata,
        isPreview: true
      }
    }
  }

  /**
   * Updates camera reference (for when camera changes)
   */
  updateCamera(camera: THREE.Camera) {
    this.camera = camera
  }

  /**
   * Updates placement options
   */
  updateOptions(options: Partial<PlacementOptions>) {
    this.options = { ...this.options, ...options }
  }
}

/**
 * React hook for managing placement state
 */
export function usePlacementSystem() {
  const [placementState, setPlacementState] = React.useState<PlacementState>({
    isPlacing: false,
    elementTemplate: null,
    previewElement: null,
    cursorPosition: null
  })

  const startPlacement = (templateId: string) => {
    setPlacementState(prev => ({
      ...prev,
      isPlacing: true,
      elementTemplate: templateId,
      previewElement: null
    }))
  }

  const updateCursorPosition = (position: { x: number; y: number; z: number } | null, previewElement?: FloorplanElement | null) => {
    setPlacementState(prev => ({
      ...prev,
      cursorPosition: position,
      previewElement: previewElement || prev.previewElement
    }))
  }

  const finalizePlacement = () => {
    const result = {
      position: placementState.cursorPosition,
      templateId: placementState.elementTemplate
    }
    
    setPlacementState({
      isPlacing: false,
      elementTemplate: null,
      previewElement: null,
      cursorPosition: null
    })
    
    return result
  }

  const cancelPlacement = () => {
    setPlacementState({
      isPlacing: false,
      elementTemplate: null,
      previewElement: null,
      cursorPosition: null
    })
  }

  return {
    placementState,
    startPlacement,
    updateCursorPosition,
    finalizePlacement,
    cancelPlacement
  }
}

// We need to import React for the hook
import React from 'react'



