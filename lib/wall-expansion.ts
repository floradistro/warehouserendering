import * as THREE from 'three'
import { FloorplanElement } from './store'

/**
 * SIMPLIFIED WALL EXPANSION SYSTEM
 * Automatically extends walls edge-to-edge until they hit boundaries or other walls
 */

export interface WallExpansionResult {
  newDimensions: { width: number; height: number; depth: number }
  newPosition: { x: number; y: number; z: number }
  hitElements: FloorplanElement[]
  expansionDirection: 'horizontal' | 'vertical'
}

export class WallExpander {
  /**
   * Expands a wall in both directions until it hits boundaries or other walls
   * SIMPLIFIED VERSION - focuses on axis-aligned walls for reliability
   */
  static expandWall(
    wallPosition: { x: number; y: number; z: number },
    wallDimensions: { width: number; height: number; depth: number },
    wallRotation: number,
    existingElements: FloorplanElement[],
    floorplanBounds: { width: number; height: number }
  ): WallExpansionResult {
    
    console.log('🔧 Expanding wall:', { wallPosition, wallDimensions, wallRotation })
    
    // Normalize rotation to 0-360 degrees
    const normalizedRotation = ((wallRotation * 180 / Math.PI) % 360 + 360) % 360
    
    // Determine if wall is primarily horizontal or vertical
    const isVertical = (normalizedRotation > 45 && normalizedRotation < 135) || 
                      (normalizedRotation > 225 && normalizedRotation < 315)
    
    console.log('📐 Wall orientation:', { normalizedRotation, isVertical })
    
    // Get current wall bounds
    const wallStart = { x: wallPosition.x, y: wallPosition.y }
    const wallEnd = { 
      x: wallPosition.x + wallDimensions.width, 
      y: wallPosition.y + wallDimensions.height 
    }
    const wallCenter = {
      x: (wallStart.x + wallEnd.x) / 2,
      y: (wallStart.y + wallEnd.y) / 2
    }
    
    let newPosition = { ...wallPosition }
    let newDimensions = { ...wallDimensions }
    const hitElements: FloorplanElement[] = []
    
    if (isVertical) {
      // Expand vertically (change height, keep width)
      const expandUp = this.findNearestObstacle(wallCenter, 'up', existingElements, floorplanBounds)
      const expandDown = this.findNearestObstacle(wallCenter, 'down', existingElements, floorplanBounds)
      
      console.log('📏 Vertical expansion:', { expandUp, expandDown })
      
      // Calculate new dimensions and position
      newPosition.y = expandDown.position
      newDimensions.height = expandUp.position - expandDown.position
      
      hitElements.push(...expandUp.hitElements, ...expandDown.hitElements)
      
    } else {
      // Expand horizontally (change width, keep height)
      const expandLeft = this.findNearestObstacle(wallCenter, 'left', existingElements, floorplanBounds)
      const expandRight = this.findNearestObstacle(wallCenter, 'right', existingElements, floorplanBounds)
      
      console.log('📏 Horizontal expansion:', { expandLeft, expandRight })
      
      // Calculate new dimensions and position
      newPosition.x = expandLeft.position
      newDimensions.width = expandRight.position - expandLeft.position
      
      hitElements.push(...expandLeft.hitElements, ...expandRight.hitElements)
    }
    
    return {
      newDimensions,
      newPosition,
      hitElements,
      expansionDirection: isVertical ? 'vertical' : 'horizontal'
    }
  }
  
  /**
   * Find nearest obstacle in a specific direction (up/down/left/right)
   * SIMPLIFIED - works with axis-aligned directions only
   */
  private static findNearestObstacle(
    fromPoint: { x: number; y: number },
    direction: 'up' | 'down' | 'left' | 'right',
    existingElements: FloorplanElement[],
    floorplanBounds: { width: number; height: number }
  ): { position: number; hitElements: FloorplanElement[] } {
    
    let nearestPosition: number
    const hitElements: FloorplanElement[] = []
    
    // Set boundary limits based on direction
    switch (direction) {
      case 'up':
        nearestPosition = floorplanBounds.height
        break
      case 'down':
        nearestPosition = 0
        break
      case 'left':
        nearestPosition = 0
        break
      case 'right':
        nearestPosition = floorplanBounds.width
        break
    }
    
    // Check for wall obstacles in the specified direction
    for (const element of existingElements) {
      if (element.type !== 'wall' || element.metadata?.isPreview) continue
      
      const elementStart = { x: element.position.x, y: element.position.y }
      const elementEnd = { 
        x: element.position.x + element.dimensions.width, 
        y: element.position.y + element.dimensions.height 
      }
      
      // Check if element blocks expansion in this direction
      let obstaclePosition: number | null = null
      
      switch (direction) {
        case 'up':
          // Check if wall blocks upward expansion
          if (elementStart.x <= fromPoint.x && elementEnd.x >= fromPoint.x && 
              elementStart.y > fromPoint.y && elementStart.y < nearestPosition) {
            obstaclePosition = elementStart.y
          }
          break
          
        case 'down':
          // Check if wall blocks downward expansion  
          if (elementStart.x <= fromPoint.x && elementEnd.x >= fromPoint.x && 
              elementEnd.y < fromPoint.y && elementEnd.y > nearestPosition) {
            obstaclePosition = elementEnd.y
          }
          break
          
        case 'left':
          // Check if wall blocks leftward expansion
          if (elementStart.y <= fromPoint.y && elementEnd.y >= fromPoint.y && 
              elementEnd.x < fromPoint.x && elementEnd.x > nearestPosition) {
            obstaclePosition = elementEnd.x
          }
          break
          
        case 'right':
          // Check if wall blocks rightward expansion
          if (elementStart.y <= fromPoint.y && elementEnd.y >= fromPoint.y && 
              elementStart.x > fromPoint.x && elementStart.x < nearestPosition) {
            obstaclePosition = elementStart.x
          }
          break
      }
      
      if (obstaclePosition !== null) {
        nearestPosition = obstaclePosition
        hitElements.length = 0 // Clear previous hits
        hitElements.push(element)
      }
    }
    
    return { position: nearestPosition, hitElements }
  }
}
