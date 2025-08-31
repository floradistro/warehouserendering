import React, { useMemo } from 'react'
import * as THREE from 'three'
import { FloorplanData, FloorplanElement } from '../lib/store'

interface BlueprintFloorPlanProps {
  floorplan: FloorplanData
}

interface BlueprintElement {
  id: string
  type: 'table' | 'walkway'
  position: { x: number; y: number; z: number }
  dimensions: { width: number; height: number }
  room: number
  label: string
}

export default function BlueprintFloorPlan({ floorplan }: BlueprintFloorPlanProps) {
  // Extract and categorize cultivation layout elements
  const blueprintElements = useMemo(() => {
    const elements: BlueprintElement[] = []
    
    floorplan.elements
      .filter(el => el.metadata?.category === 'cultivation-layout')
      .forEach(el => {
        if (el.metadata?.type === 'rolling-table') {
          elements.push({
            id: el.id,
            type: 'table',
            position: el.position,
            dimensions: { width: el.dimensions.width, height: el.dimensions.height },
            room: el.metadata.room || 0,
            label: `TABLES`
          })
        } else if (el.metadata?.type === 'harvest-aisle') {
          elements.push({
            id: el.id,
            type: 'walkway',
            position: el.position,
            dimensions: { width: el.dimensions.width, height: el.dimensions.height },
            room: el.metadata.room || 0,
            label: el.metadata.aisle_position === 'north' ? 'WALKWAY (N)' : 'WALKWAY (S)'
          })
        }
      })
    
    return elements
  }, [floorplan.elements])

  return (
    <>
      {blueprintElements.map((element) => (
        <BlueprintElementRenderer key={element.id} element={element} />
      ))}
    </>
  )
}

// Component to render text directly on the floor as a texture
interface FloorTextProps {
  text: string
  position: [number, number, number]
  dimensions: { width: number; height: number }
  color: string
  rotation: number
}

function FloorText({ text, position, dimensions, color, rotation }: FloorTextProps) {
  // Create canvas texture with text
  const textTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    
    // Set canvas size based on dimensions with higher resolution
    const scale = 100 // Higher resolution for crisp text
    canvas.width = dimensions.width * scale
    canvas.height = dimensions.height * scale
    
    // Clear canvas with transparent background
    context.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set text style - large measurements, much smaller titles
    const isDimension = text.includes('×')
    const fontSize = isDimension 
      ? Math.min(canvas.width, canvas.height) * 0.35  // Large for measurements
      : Math.min(canvas.width, canvas.height) * 0.12  // Much smaller for titles
    
    context.font = `bold ${fontSize}px Arial, sans-serif`
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    
    // Add strong white outline for maximum visibility
    context.strokeStyle = 'white'
    context.lineWidth = fontSize * 0.2
    context.strokeText(text, canvas.width / 2, canvas.height / 2)
    
    // Fill text with color
    context.fillStyle = color
    context.fillText(text, canvas.width / 2, canvas.height / 2)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [text, dimensions, color])
  
  return (
    <mesh 
      position={position} 
      rotation={[-Math.PI / 2, 0, rotation]}
    >
      <planeGeometry args={[dimensions.width, dimensions.height]} />
      <meshBasicMaterial 
        map={textTexture}
        transparent
        opacity={1.0}
        depthTest={false}  // Always visible on top
        depthWrite={false}
      />
    </mesh>
  )
}

// CAD-style hatch pattern component
interface CADHatchPatternProps {
  position: [number, number, number]
  dimensions: { width: number; height: number }
  type: 'table' | 'walkway'
}

function CADHatchPattern({ position, dimensions, type }: CADHatchPatternProps) {
  // Create diagonal line pattern texture
  const hatchTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    
    // High resolution for crisp lines
    const scale = 100
    canvas.width = dimensions.width * scale
    canvas.height = dimensions.height * scale
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height)
    
    // Set line properties
    const lineSpacing = type === 'table' ? 8 : 12 // Closer lines for tables
    const lineWidth = 1
    const color = type === 'table' ? '#0066cc' : '#666666'
    
    context.strokeStyle = color
    context.lineWidth = lineWidth
    context.globalAlpha = 0.4 // Semi-transparent for subtle effect
    
    // Draw diagonal lines (45-degree angle)
    const diagonal = Math.sqrt(canvas.width * canvas.width + canvas.height * canvas.height)
    const numLines = Math.ceil(diagonal / lineSpacing)
    
    context.beginPath()
    for (let i = -numLines; i <= numLines; i++) {
      const offset = i * lineSpacing
      // Draw line from top-left to bottom-right direction
      context.moveTo(offset, 0)
      context.lineTo(offset + canvas.height, canvas.height)
    }
    context.stroke()
    
    // Optional: Add cross-hatch for tables (perpendicular lines)
    if (type === 'table') {
      context.beginPath()
      context.globalAlpha = 0.2 // Even more subtle for cross-hatch
      for (let i = -numLines; i <= numLines; i++) {
        const offset = i * lineSpacing * 2 // Wider spacing for cross-hatch
        // Draw line from top-right to bottom-left direction
        context.moveTo(canvas.width - offset, 0)
        context.lineTo(canvas.width - offset - canvas.height, canvas.height)
      }
      context.stroke()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    return texture
  }, [dimensions, type])
  
  return (
    <mesh 
      position={position} 
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[dimensions.width, dimensions.height]} />
      <meshBasicMaterial 
        map={hatchTexture}
        transparent
        opacity={1.0}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}

interface BlueprintElementRendererProps {
  element: BlueprintElement
}

function BlueprintElementRenderer({ element }: BlueprintElementRendererProps) {
  const { position, dimensions, type } = element
  
  return (
    <group position={[position.x, position.z, position.y]}>
      {/* CAD-style diagonal hatch pattern */}
      <CADHatchPattern
        position={[dimensions.width / 2, 0.001, dimensions.height / 2]}
        dimensions={dimensions}
        type={type}
      />
      
      {/* Bold outline border */}
      <mesh 
        position={[dimensions.width / 2, 0.002, dimensions.height / 2]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[dimensions.width, dimensions.height]} />
        <meshBasicMaterial 
          color={type === 'table' ? '#0066cc' : '#333333'} 
          wireframe={true}
          transparent
          opacity={1.0}
        />
      </mesh>
      
      {/* 2D Floor-drawn text label */}
      <FloorText
        text={type === 'table' ? 'TABLES' : 'WALKWAY'}
        position={[dimensions.width / 2, 0.003, dimensions.height / 2]}
        dimensions={dimensions}
        color={type === 'table' ? '#0066cc' : '#333333'}
        rotation={0}
      />
      
      {/* 2D Floor-drawn dimensions */}
      <FloorText
        text={`${dimensions.width.toFixed(1)}' × ${dimensions.height.toFixed(1)}'`}
        position={[dimensions.width / 2, 0.004, dimensions.height / 2 + dimensions.height * 0.25]}
        dimensions={{ width: dimensions.width * 0.8, height: dimensions.height * 0.2 }}
        color={type === 'table' ? '#666666' : '#555555'}
        rotation={0}
      />
    </group>
  )
}
