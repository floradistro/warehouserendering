import * as THREE from 'three'
import { FloorplanElement } from './store'

export interface SimpleGuide {
  type: 'horizontal' | 'vertical'
  position: number // X position for vertical, Y position for horizontal
  color: string
  elements: string[] // IDs of elements that align at this position
}

export class SimpleGuideSystem {
  private tolerance: number = 1.0 // 1 foot tolerance
  
  /**
   * Find simple alignment guides for a dragged element
   * Only checks center and edge alignments to keep it fast
   */
  findGuides(
    draggedElement: { 
      position: { x: number; y: number; z: number }
      dimensions: { width: number; height: number; depth?: number }
    },
    otherElements: FloorplanElement[]
  ): SimpleGuide[] {
    const guides: SimpleGuide[] = []
    const processedVertical = new Set<number>()
    const processedHorizontal = new Set<number>()
    
    // Calculate dragged element bounds
    const draggedLeft = draggedElement.position.x
    const draggedRight = draggedElement.position.x + draggedElement.dimensions.width
    const draggedTop = draggedElement.position.y
    const draggedBottom = draggedElement.position.y + draggedElement.dimensions.height
    const draggedCenterX = draggedElement.position.x + draggedElement.dimensions.width / 2
    const draggedCenterY = draggedElement.position.y + draggedElement.dimensions.height / 2
    
    // Check alignment with each other element
    for (const element of otherElements) {
      if (element.metadata?.isPreview) continue
      
      const elementLeft = element.position.x
      const elementRight = element.position.x + element.dimensions.width
      const elementTop = element.position.y
      const elementBottom = element.position.y + element.dimensions.height
      const elementCenterX = element.position.x + element.dimensions.width / 2
      const elementCenterY = element.position.y + element.dimensions.height / 2
      
      // Vertical guides (align on X axis)
      
      // Center to center
      if (Math.abs(draggedCenterX - elementCenterX) < this.tolerance) {
        const pos = Math.round(elementCenterX * 10) / 10
        if (!processedVertical.has(pos)) {
          processedVertical.add(pos)
          guides.push({
            type: 'vertical',
            position: elementCenterX,
            color: '#ff6b6b', // Red for center
            elements: [element.id]
          })
        }
      }
      
      // Left edges
      if (Math.abs(draggedLeft - elementLeft) < this.tolerance) {
        const pos = Math.round(elementLeft * 10) / 10
        if (!processedVertical.has(pos)) {
          processedVertical.add(pos)
          guides.push({
            type: 'vertical',
            position: elementLeft,
            color: '#4ecdc4', // Teal for edges
            elements: [element.id]
          })
        }
      }
      
      // Right edges
      if (Math.abs(draggedRight - elementRight) < this.tolerance) {
        const pos = Math.round(elementRight * 10) / 10
        if (!processedVertical.has(pos)) {
          processedVertical.add(pos)
          guides.push({
            type: 'vertical',
            position: elementRight,
            color: '#4ecdc4', // Teal for edges
            elements: [element.id]
          })
        }
      }
      
      // Horizontal guides (align on Y axis)
      
      // Center to center
      if (Math.abs(draggedCenterY - elementCenterY) < this.tolerance) {
        const pos = Math.round(elementCenterY * 10) / 10
        if (!processedHorizontal.has(pos)) {
          processedHorizontal.add(pos)
          guides.push({
            type: 'horizontal',
            position: elementCenterY,
            color: '#ff6b6b', // Red for center
            elements: [element.id]
          })
        }
      }
      
      // Top edges
      if (Math.abs(draggedTop - elementTop) < this.tolerance) {
        const pos = Math.round(elementTop * 10) / 10
        if (!processedHorizontal.has(pos)) {
          processedHorizontal.add(pos)
          guides.push({
            type: 'horizontal',
            position: elementTop,
            color: '#4ecdc4', // Teal for edges
            elements: [element.id]
          })
        }
      }
      
      // Bottom edges
      if (Math.abs(draggedBottom - elementBottom) < this.tolerance) {
        const pos = Math.round(elementBottom * 10) / 10
        if (!processedHorizontal.has(pos)) {
          processedHorizontal.add(pos)
          guides.push({
            type: 'horizontal',
            position: elementBottom,
            color: '#4ecdc4', // Teal for edges
            elements: [element.id]
          })
        }
      }
    }
    
    // Limit to top 3 guides of each type for performance
    const verticalGuides = guides.filter(g => g.type === 'vertical').slice(0, 3)
    const horizontalGuides = guides.filter(g => g.type === 'horizontal').slice(0, 3)
    
    return [...verticalGuides, ...horizontalGuides]
  }
  
  /**
   * Get snap position if element is close to a guide
   */
  getSnapPosition(
    draggedElement: { 
      position: { x: number; y: number; z: number }
      dimensions: { width: number; height: number; depth?: number }
    },
    guides: SimpleGuide[]
  ): { x: number; y: number; z: number } | null {
    let snapX: number | null = null
    let snapY: number | null = null
    
    const draggedCenterX = draggedElement.position.x + draggedElement.dimensions.width / 2
    const draggedCenterY = draggedElement.position.y + draggedElement.dimensions.height / 2
    
    // Check vertical guides for X snapping
    for (const guide of guides.filter(g => g.type === 'vertical')) {
      // Check if we should snap to this guide
      const leftDist = Math.abs(draggedElement.position.x - guide.position)
      const rightDist = Math.abs(draggedElement.position.x + draggedElement.dimensions.width - guide.position)
      const centerDist = Math.abs(draggedCenterX - guide.position)
      
      if (centerDist < this.tolerance) {
        // Snap center to guide
        snapX = guide.position - draggedElement.dimensions.width / 2
        break
      } else if (leftDist < this.tolerance) {
        // Snap left edge to guide
        snapX = guide.position
        break
      } else if (rightDist < this.tolerance) {
        // Snap right edge to guide
        snapX = guide.position - draggedElement.dimensions.width
        break
      }
    }
    
    // Check horizontal guides for Y snapping
    for (const guide of guides.filter(g => g.type === 'horizontal')) {
      // Check if we should snap to this guide
      const topDist = Math.abs(draggedElement.position.y - guide.position)
      const bottomDist = Math.abs(draggedElement.position.y + draggedElement.dimensions.height - guide.position)
      const centerDist = Math.abs(draggedCenterY - guide.position)
      
      if (centerDist < this.tolerance) {
        // Snap center to guide
        snapY = guide.position - draggedElement.dimensions.height / 2
        break
      } else if (topDist < this.tolerance) {
        // Snap top edge to guide
        snapY = guide.position
        break
      } else if (bottomDist < this.tolerance) {
        // Snap bottom edge to guide
        snapY = guide.position - draggedElement.dimensions.height
        break
      }
    }
    
    if (snapX !== null || snapY !== null) {
      return {
        x: snapX !== null ? snapX : draggedElement.position.x,
        y: snapY !== null ? snapY : draggedElement.position.y,
        z: draggedElement.position.z
      }
    }
    
    return null
  }
}
