import * as THREE from 'three'
import { PipePoint } from './PlumbingSystem'
import { PlumbingSnapPoint } from './PlumbingSnapPoints'

/**
 * PIPE ALIGNMENT DETECTION SYSTEM
 * 
 * Advanced alignment detection for professional pipe routing.
 * Detects when pipes are level, plumb, or aligned with existing elements.
 */

export interface AlignmentResult {
  isAligned: boolean
  alignmentType: 'horizontal' | 'vertical' | 'height' | 'grid'
  confidence: number
  snapPosition: THREE.Vector3
  guideLines: AlignmentGuideLine[]
  description: string
}

export interface AlignmentGuideLine {
  start: THREE.Vector3
  end: THREE.Vector3
  color: string
  opacity: number
  style: 'solid' | 'dashed'
  thickness: number
}

export class PipeAlignmentDetector {
  private tolerance: number
  private gridSize: number

  constructor(tolerance: number = 0.25, gridSize: number = 1.0) {
    this.tolerance = tolerance // Quarter foot tolerance
    this.gridSize = gridSize   // 1 foot grid
  }

  /**
   * Detect alignment for a hover point relative to current pipe path
   */
  detectAlignment(
    hoverPoint: THREE.Vector3,
    currentPath: PipePoint[],
    existingPipes: PipePoint[][],
    snapPoints: PlumbingSnapPoint[]
  ): AlignmentResult {
    
    if (currentPath.length === 0) {
      return this.createNoAlignment(hoverPoint)
    }

    const lastPoint = currentPath[currentPath.length - 1]
    const lastVec = new THREE.Vector3(lastPoint.x, lastPoint.y, lastPoint.z)

    // Check different types of alignment in priority order
    
    // 1. Height alignment (most important for plumbing)
    const heightAlignment = this.detectHeightAlignment(hoverPoint, lastVec, snapPoints, existingPipes)
    if (heightAlignment.isAligned) return heightAlignment

    // 2. Horizontal level alignment
    const horizontalAlignment = this.detectHorizontalAlignment(hoverPoint, lastVec)
    if (horizontalAlignment.isAligned) return horizontalAlignment

    // 3. Vertical plumb alignment  
    const verticalAlignment = this.detectVerticalAlignment(hoverPoint, lastVec)
    if (verticalAlignment.isAligned) return verticalAlignment

    // 4. Grid alignment
    const gridAlignment = this.detectGridAlignment(hoverPoint)
    if (gridAlignment.isAligned) return gridAlignment

    return this.createNoAlignment(hoverPoint)
  }

  private detectHeightAlignment(
    hoverPoint: THREE.Vector3,
    lastPoint: THREE.Vector3,
    snapPoints: PlumbingSnapPoint[],
    existingPipes: PipePoint[][]
  ): AlignmentResult {
    
    // Check alignment with snap points at same height
    const alignedSnapPoints = snapPoints.filter(snap => 
      Math.abs(snap.position.y - hoverPoint.y) <= this.tolerance &&
      snap.position.distanceTo(hoverPoint) > 1.0 && // Not too close
      snap.position.distanceTo(hoverPoint) < 30.0   // Not too far
    )

    if (alignedSnapPoints.length > 0) {
      const bestSnap = alignedSnapPoints[0]
      const alignedHeight = bestSnap.position.y
      const confidence = 1.0 - Math.abs(hoverPoint.y - alignedHeight) / this.tolerance

      return {
        isAligned: true,
        alignmentType: 'height',
        confidence,
        snapPosition: new THREE.Vector3(hoverPoint.x, alignedHeight, hoverPoint.z),
        guideLines: this.createHeightGuideLines(hoverPoint, bestSnap.position, alignedHeight),
        description: `Aligned with ${bestSnap.description} at ${alignedHeight.toFixed(1)}' height`
      }
    }

    // Check alignment with existing pipes
    for (const pipePath of existingPipes) {
      for (const pipePoint of pipePath) {
        const heightDiff = Math.abs(pipePoint.y - hoverPoint.y)
        const horizontalDistance = new THREE.Vector3(pipePoint.x, 0, pipePoint.z)
          .distanceTo(new THREE.Vector3(hoverPoint.x, 0, hoverPoint.z))

        if (heightDiff <= this.tolerance && horizontalDistance > 2.0 && horizontalDistance < 25.0) {
          const alignedHeight = pipePoint.y
          const confidence = 1.0 - heightDiff / this.tolerance

          return {
            isAligned: true,
            alignmentType: 'height',
            confidence,
            snapPosition: new THREE.Vector3(hoverPoint.x, alignedHeight, hoverPoint.z),
            guideLines: this.createHeightGuideLines(hoverPoint, new THREE.Vector3(pipePoint.x, pipePoint.y, pipePoint.z), alignedHeight),
            description: `Level with existing pipe at ${alignedHeight.toFixed(1)}' height`
          }
        }
      }
    }

    return this.createNoAlignment(hoverPoint)
  }

  private detectHorizontalAlignment(hoverPoint: THREE.Vector3, lastPoint: THREE.Vector3): AlignmentResult {
    const heightDiff = Math.abs(hoverPoint.y - lastPoint.y)
    
    if (heightDiff <= this.tolerance) {
      const alignedHeight = lastPoint.y
      const confidence = 1.0 - heightDiff / this.tolerance

      return {
        isAligned: true,
        alignmentType: 'horizontal',
        confidence,
        snapPosition: new THREE.Vector3(hoverPoint.x, alignedHeight, hoverPoint.z),
        guideLines: this.createHorizontalGuideLines(hoverPoint, lastPoint, alignedHeight),
        description: `Level pipe run at ${alignedHeight.toFixed(1)}' height`
      }
    }

    return this.createNoAlignment(hoverPoint)
  }

  private detectVerticalAlignment(hoverPoint: THREE.Vector3, lastPoint: THREE.Vector3): AlignmentResult {
    const xDiff = Math.abs(hoverPoint.x - lastPoint.x)
    const zDiff = Math.abs(hoverPoint.z - lastPoint.z)

    // Check X-axis alignment (plumb in X direction)
    if (xDiff <= this.tolerance) {
      const alignedX = lastPoint.x
      const confidence = 1.0 - xDiff / this.tolerance

      return {
        isAligned: true,
        alignmentType: 'vertical',
        confidence,
        snapPosition: new THREE.Vector3(alignedX, hoverPoint.y, hoverPoint.z),
        guideLines: this.createVerticalGuideLines(hoverPoint, lastPoint, 'x', alignedX),
        description: `Plumb at X=${alignedX.toFixed(1)}'`
      }
    }

    // Check Z-axis alignment (plumb in Z direction)
    if (zDiff <= this.tolerance) {
      const alignedZ = lastPoint.z
      const confidence = 1.0 - zDiff / this.tolerance

      return {
        isAligned: true,
        alignmentType: 'vertical',
        confidence,
        snapPosition: new THREE.Vector3(hoverPoint.x, hoverPoint.y, alignedZ),
        guideLines: this.createVerticalGuideLines(hoverPoint, lastPoint, 'z', alignedZ),
        description: `Plumb at Z=${alignedZ.toFixed(1)}'`
      }
    }

    return this.createNoAlignment(hoverPoint)
  }

  private detectGridAlignment(hoverPoint: THREE.Vector3): AlignmentResult {
    const snappedX = Math.round(hoverPoint.x / this.gridSize) * this.gridSize
    const snappedZ = Math.round(hoverPoint.z / this.gridSize) * this.gridSize
    
    const xDiff = Math.abs(hoverPoint.x - snappedX)
    const zDiff = Math.abs(hoverPoint.z - snappedZ)

    if (xDiff <= this.tolerance || zDiff <= this.tolerance) {
      const confidence = 1.0 - Math.max(xDiff, zDiff) / this.tolerance

      return {
        isAligned: true,
        alignmentType: 'grid',
        confidence,
        snapPosition: new THREE.Vector3(snappedX, hoverPoint.y, snappedZ),
        guideLines: this.createGridGuideLines(hoverPoint, snappedX, snappedZ),
        description: `Grid aligned at (${snappedX.toFixed(0)}', ${snappedZ.toFixed(0)}')`
      }
    }

    return this.createNoAlignment(hoverPoint)
  }

  private createHeightGuideLines(hoverPoint: THREE.Vector3, referencePoint: THREE.Vector3, height: number): AlignmentGuideLine[] {
    const extend = 8.0 // Extend guide lines 8 feet in each direction
    
    return [{
      start: new THREE.Vector3(
        Math.min(hoverPoint.x, referencePoint.x) - extend,
        height,
        Math.min(hoverPoint.z, referencePoint.z)
      ),
      end: new THREE.Vector3(
        Math.max(hoverPoint.x, referencePoint.x) + extend,
        height,
        Math.max(hoverPoint.z, referencePoint.z)
      ),
      color: '#00FF88', // Bright green for level alignment
      opacity: 0.8,
      style: 'dashed',
      thickness: 2
    }]
  }

  private createHorizontalGuideLines(hoverPoint: THREE.Vector3, lastPoint: THREE.Vector3, height: number): AlignmentGuideLine[] {
    const extend = 6.0
    
    return [{
      start: new THREE.Vector3(
        Math.min(hoverPoint.x, lastPoint.x) - extend,
        height,
        lastPoint.z
      ),
      end: new THREE.Vector3(
        Math.max(hoverPoint.x, lastPoint.x) + extend,
        height,
        lastPoint.z
      ),
      color: '#00FF88', // Green for horizontal level
      opacity: 0.7,
      style: 'solid',
      thickness: 3
    }]
  }

  private createVerticalGuideLines(hoverPoint: THREE.Vector3, lastPoint: THREE.Vector3, axis: 'x' | 'z', alignedValue: number): AlignmentGuideLine[] {
    const extend = 4.0
    
    if (axis === 'x') {
      return [{
        start: new THREE.Vector3(
          alignedValue,
          Math.min(hoverPoint.y, lastPoint.y) - extend,
          lastPoint.z
        ),
        end: new THREE.Vector3(
          alignedValue,
          Math.max(hoverPoint.y, lastPoint.y) + extend,
          lastPoint.z
        ),
        color: '#FF6600', // Orange for vertical plumb
        opacity: 0.7,
        style: 'solid',
        thickness: 3
      }]
    } else {
      return [{
        start: new THREE.Vector3(
          lastPoint.x,
          Math.min(hoverPoint.y, lastPoint.y) - extend,
          alignedValue
        ),
        end: new THREE.Vector3(
          lastPoint.x,
          Math.max(hoverPoint.y, lastPoint.y) + extend,
          alignedValue
        ),
        color: '#FF6600', // Orange for vertical plumb
        opacity: 0.7,
        style: 'solid',
        thickness: 3
      }]
    }
  }

  private createGridGuideLines(hoverPoint: THREE.Vector3, snappedX: number, snappedZ: number): AlignmentGuideLine[] {
    const extend = 3.0
    
    return [
      // X-axis grid line
      {
        start: new THREE.Vector3(snappedX - extend, hoverPoint.y, hoverPoint.z),
        end: new THREE.Vector3(snappedX + extend, hoverPoint.y, hoverPoint.z),
        color: '#FFFF00', // Yellow for grid
        opacity: 0.5,
        style: 'dashed',
        thickness: 1
      },
      // Z-axis grid line
      {
        start: new THREE.Vector3(hoverPoint.x, hoverPoint.y, snappedZ - extend),
        end: new THREE.Vector3(hoverPoint.x, hoverPoint.y, snappedZ + extend),
        color: '#FFFF00', // Yellow for grid
        opacity: 0.5,
        style: 'dashed',
        thickness: 1
      }
    ]
  }

  private createNoAlignment(hoverPoint: THREE.Vector3): AlignmentResult {
    return {
      isAligned: false,
      alignmentType: 'grid',
      confidence: 0,
      snapPosition: hoverPoint.clone(),
      guideLines: [],
      description: 'No alignment detected'
    }
  }

  /**
   * Update tolerance for alignment detection
   */
  setTolerance(tolerance: number) {
    this.tolerance = tolerance
  }

  /**
   * Update grid size for grid alignment
   */
  setGridSize(gridSize: number) {
    this.gridSize = gridSize
  }
}
