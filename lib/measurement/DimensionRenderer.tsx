import React, { useMemo, useRef, useEffect } from 'react'
import { extend, useFrame } from '@react-three/fiber'
import { 
  Vector3, 
  BufferGeometry, 
  BufferAttribute, 
  LineBasicMaterial, 
  Line,
  Group,
  Sprite,
  SpriteMaterial,
  CanvasTexture,
  DoubleSide,
  AdditiveBlending,
  Object3D,
  Camera
} from 'three'
import {
  Measurement,
  LinearMeasurement,
  AngularMeasurement,
  AreaMeasurement,
  MeasurementStyle,
  formatMeasurement,
  formatAngularMeasurement,
  formatAreaMeasurement
} from './MeasurementTypes'

// Extend Three.js objects for React Three Fiber
extend({ Line, Group, Sprite })

interface DimensionRendererProps {
  measurements: Measurement[]
  globalOpacity?: number
  camera?: Camera
  showExtensionLines?: boolean
  showText?: boolean
  textScale?: number
  style?: Partial<MeasurementStyle>
}

/**
 * Professional dimension line renderer for Three.js scene
 * Renders CAD-standard dimension lines with arrows, text, and extension lines
 */
export const DimensionRenderer: React.FC<DimensionRendererProps> = ({
  measurements,
  globalOpacity = 1.0,
  camera,
  showExtensionLines = true,
  showText = true,
  textScale = 1.0,
  style: globalStyle = {}
}) => {
  const groupRef = useRef<Group>(null)
  
  // Update billboard text orientation to face camera
  useFrame(() => {
    if (groupRef.current && camera) {
      groupRef.current.traverse((child) => {
        if (child instanceof Sprite && child.userData.billboardText) {
          child.lookAt(camera.position)
        }
      })
    }
  })
  
  const renderElements = useMemo(() => {
    const elements: JSX.Element[] = []
    
    measurements
      .filter(measurement => measurement.visible)
      .forEach((measurement, index) => {
        const style = { ...measurement.style, ...globalStyle }
        const opacity = (style.opacity || 1.0) * globalOpacity
        
        if (opacity <= 0) return
        
        switch (measurement.type) {
          case 'linear':
            elements.push(
              <LinearDimensionRenderer
                key={measurement.id}
                measurement={measurement as LinearMeasurement}
                style={{
                  color: style.color || '#ffffff',
                  thickness: style.thickness || 1,
                  opacity: style.opacity || 1,
                  textSize: style.textSize || 12,
                  textColor: style.textColor || '#ffffff',
                  arrowSize: style.arrowSize || 8,
                  arrowStyle: style.arrowStyle || 'arrow',
                  lineStyle: style.lineStyle || 'solid',
                  extensionLineLength: style.extensionLineLength || 10,
                  textOffset: style.textOffset || new Vector3(0, 0, 0),
                  dimensionLineOffset: style.dimensionLineOffset || 2,
                  showExtensionLines: style.showExtensionLines !== false,
                  showDimensionLine: style.showDimensionLine !== false,
                  showText: style.showText !== false,
                  backgroundOpacity: style.backgroundOpacity || 0,
                  backgroundColor: style.backgroundColor || 'transparent'
                }}
                opacity={opacity}
                showExtensionLines={showExtensionLines}
                showText={showText}
                textScale={textScale}
              />
            )
            break
            
          case 'angular':
            elements.push(
              <AngularDimensionRenderer
                key={measurement.id}
                measurement={measurement as AngularMeasurement}
                style={{
                  color: style.color || '#ffffff',
                  thickness: style.thickness || 1,
                  opacity: style.opacity || 1,
                  textSize: style.textSize || 12,
                  textColor: style.textColor || '#ffffff',
                  arrowSize: style.arrowSize || 8,
                  arrowStyle: style.arrowStyle || 'arrow',
                  lineStyle: style.lineStyle || 'solid',
                  extensionLineLength: style.extensionLineLength || 10,
                  textOffset: style.textOffset || new Vector3(0, 0, 0),
                  dimensionLineOffset: style.dimensionLineOffset || 2,
                  showExtensionLines: style.showExtensionLines !== false,
                  showDimensionLine: style.showDimensionLine !== false,
                  showText: style.showText !== false,
                  backgroundOpacity: style.backgroundOpacity || 0,
                  backgroundColor: style.backgroundColor || 'transparent'
                }}
                opacity={opacity}
                showText={showText}
                textScale={textScale}
              />
            )
            break
            
          case 'area':
            elements.push(
              <AreaDimensionRenderer
                key={measurement.id}
                measurement={measurement as AreaMeasurement}
                style={{
                  color: style.color || '#ffffff',
                  thickness: style.thickness || 1,
                  opacity: style.opacity || 1,
                  textSize: style.textSize || 12,
                  textColor: style.textColor || '#ffffff',
                  arrowSize: style.arrowSize || 8,
                  arrowStyle: style.arrowStyle || 'arrow',
                  lineStyle: style.lineStyle || 'solid',
                  extensionLineLength: style.extensionLineLength || 10,
                  textOffset: style.textOffset || new Vector3(0, 0, 0),
                  dimensionLineOffset: style.dimensionLineOffset || 2,
                  showExtensionLines: style.showExtensionLines !== false,
                  showDimensionLine: style.showDimensionLine !== false,
                  showText: style.showText !== false,
                  backgroundOpacity: style.backgroundOpacity || 0,
                  backgroundColor: style.backgroundColor || 'transparent'
                }}
                opacity={opacity}
                showText={showText}
                textScale={textScale}
              />
            )
            break
        }
      })
    
    return elements
  }, [measurements, globalOpacity, globalStyle, showExtensionLines, showText, textScale])
  
  return (
    <group ref={groupRef} name="measurement-dimensions">
      {renderElements}
    </group>
  )
}

// ===== LINEAR DIMENSION RENDERER =====

interface LinearDimensionProps {
  measurement: LinearMeasurement
  style: MeasurementStyle
  opacity: number
  showExtensionLines: boolean
  showText: boolean
  textScale: number
}

const LinearDimensionRenderer: React.FC<LinearDimensionProps> = ({
  measurement,
  style,
  opacity,
  showExtensionLines,
  showText,
  textScale
}) => {
  const { points, segments, totalDistance, unit, precision, chainDimensions } = measurement
  
  const geometries = useMemo(() => {
    const geos = {
      dimensionLines: new BufferGeometry(),
      extensionLines: new BufferGeometry(),
      arrows: new BufferGeometry()
    }
    
    const dimVertices: number[] = []
    const extVertices: number[] = []
    const arrowVertices: number[] = []
    
    // Safety check - ensure we have valid data
    if (!points || !Array.isArray(points) || points.length < 2) {
      console.warn('Invalid points data for linear measurement:', points)
      return geos
    }
    
    if (chainDimensions && segments.length > 1) {
      // Chain dimensions - show individual segment dimensions
      segments.forEach((segment, index) => {
        const { startPoint, endPoint, distance } = segment
        
        // Safety check for segment points
        if (!startPoint || !endPoint || typeof startPoint.x !== 'number' || typeof endPoint.x !== 'number') {
          console.warn('Invalid segment points:', { startPoint, endPoint })
          return
        }
        
        const start = new Vector3(startPoint.x || 0, startPoint.y || 0, startPoint.z || 0)
        const end = new Vector3(endPoint.x || 0, endPoint.y || 0, endPoint.z || 0)
        const direction = new Vector3().subVectors(end, start).normalize()
        const perpendicular = new Vector3(-direction.z, direction.y, direction.x).normalize()
        const offset = perpendicular.multiplyScalar(style.dimensionLineOffset * (index + 1))
        
        // Dimension line
        const dimStart = start.clone().add(offset)
        const dimEnd = end.clone().add(offset)
        
        dimVertices.push(dimStart.x, dimStart.y, dimStart.z)
        dimVertices.push(dimEnd.x, dimEnd.y, dimEnd.z)
        
        // Extension lines
        if (showExtensionLines && style.showExtensionLines) {
          const extLength = style.extensionLineLength
          const extStart1 = start.clone()
          const extEnd1 = start.clone().add(perpendicular.clone().multiplyScalar(extLength))
          const extStart2 = end.clone()
          const extEnd2 = end.clone().add(perpendicular.clone().multiplyScalar(extLength))
          
          extVertices.push(extStart1.x, extStart1.y, extStart1.z)
          extVertices.push(extEnd1.x, extEnd1.y, extEnd1.z)
          extVertices.push(extStart2.x, extStart2.y, extStart2.z)
          extVertices.push(extEnd2.x, extEnd2.y, extEnd2.z)
        }
        
        // Arrows
        const arrowSize = style.arrowSize
        if (style.arrowStyle === 'arrow' && arrowSize > 0) {
          // Start arrow
          const arrowBack1 = direction.clone().multiplyScalar(-arrowSize * 0.1)
          const arrowSide1 = perpendicular.clone().multiplyScalar(arrowSize * 0.05)
          
          arrowVertices.push(dimStart.x, dimStart.y, dimStart.z)
          arrowVertices.push(
            dimStart.x + arrowBack1.x + arrowSide1.x,
            dimStart.y + arrowBack1.y + arrowSide1.y,
            dimStart.z + arrowBack1.z + arrowSide1.z
          )
          arrowVertices.push(dimStart.x, dimStart.y, dimStart.z)
          arrowVertices.push(
            dimStart.x + arrowBack1.x - arrowSide1.x,
            dimStart.y + arrowBack1.y - arrowSide1.y,
            dimStart.z + arrowBack1.z - arrowSide1.z
          )
          
          // End arrow
          const arrowBack2 = direction.clone().multiplyScalar(arrowSize * 0.1)
          const arrowSide2 = perpendicular.clone().multiplyScalar(arrowSize * 0.05)
          
          arrowVertices.push(dimEnd.x, dimEnd.y, dimEnd.z)
          arrowVertices.push(
            dimEnd.x + arrowBack2.x + arrowSide2.x,
            dimEnd.y + arrowBack2.y + arrowSide2.y,
            dimEnd.z + arrowBack2.z + arrowSide2.z
          )
          arrowVertices.push(dimEnd.x, dimEnd.y, dimEnd.z)
          arrowVertices.push(
            dimEnd.x + arrowBack2.x - arrowSide2.x,
            dimEnd.y + arrowBack2.y - arrowSide2.y,
            dimEnd.z + arrowBack2.z - arrowSide2.z
          )
        }
      })
    } else {
      // Simple linear dimension
      if (points.length >= 2 && points[0] && points[points.length - 1]) {
        const p1 = points[0]
        const p2 = points[points.length - 1]
        
        // Ensure points have valid coordinates
        if (!p1 || typeof p1.x !== 'number' || !p2 || typeof p2.x !== 'number') {
          return geos
        }
        
        const startPoint = new Vector3(p1.x || 0, p1.y || 0, p1.z || 0)
        const endPoint = new Vector3(p2.x || 0, p2.y || 0, p2.z || 0)
        const direction = new Vector3().subVectors(endPoint, startPoint).normalize()
        const perpendicular = new Vector3(-direction.z, direction.y, direction.x).normalize()
        const offset = perpendicular.multiplyScalar(style.dimensionLineOffset)
        
        // Main dimension line
        const dimStart = startPoint.clone().add(offset)
        const dimEnd = endPoint.clone().add(offset)
        
        dimVertices.push(dimStart.x, dimStart.y, dimStart.z)
        dimVertices.push(dimEnd.x, dimEnd.y, dimEnd.z)
        
        // Extension lines
        if (showExtensionLines && style.showExtensionLines) {
          const extLength = style.extensionLineLength
          
          extVertices.push(startPoint.x, startPoint.y, startPoint.z)
          extVertices.push(
            startPoint.x + offset.x + perpendicular.x * (extLength - style.dimensionLineOffset),
            startPoint.y + offset.y + perpendicular.y * (extLength - style.dimensionLineOffset),
            startPoint.z + offset.z + perpendicular.z * (extLength - style.dimensionLineOffset)
          )
          
          extVertices.push(endPoint.x, endPoint.y, endPoint.z)
          extVertices.push(
            endPoint.x + offset.x + perpendicular.x * (extLength - style.dimensionLineOffset),
            endPoint.y + offset.y + perpendicular.y * (extLength - style.dimensionLineOffset),
            endPoint.z + offset.z + perpendicular.z * (extLength - style.dimensionLineOffset)
          )
        }
        
        // Arrows
        if (style.arrowStyle === 'arrow' && style.arrowSize > 0) {
          const arrowSize = style.arrowSize
          const arrowBack = direction.clone().multiplyScalar(-arrowSize * 0.1)
          const arrowSide = perpendicular.clone().multiplyScalar(arrowSize * 0.05)
          
          // Start arrow
          arrowVertices.push(dimStart.x, dimStart.y, dimStart.z)
          arrowVertices.push(
            dimStart.x + arrowBack.x + arrowSide.x,
            dimStart.y + arrowBack.y + arrowSide.y,
            dimStart.z + arrowBack.z + arrowSide.z
          )
          arrowVertices.push(dimStart.x, dimStart.y, dimStart.z)
          arrowVertices.push(
            dimStart.x + arrowBack.x - arrowSide.x,
            dimStart.y + arrowBack.y - arrowSide.y,
            dimStart.z + arrowBack.z - arrowSide.z
          )
          
          // End arrow
          const endArrowBack = direction.clone().multiplyScalar(arrowSize * 0.1)
          arrowVertices.push(dimEnd.x, dimEnd.y, dimEnd.z)
          arrowVertices.push(
            dimEnd.x + endArrowBack.x + arrowSide.x,
            dimEnd.y + endArrowBack.y + arrowSide.y,
            dimEnd.z + endArrowBack.z + arrowSide.z
          )
          arrowVertices.push(dimEnd.x, dimEnd.y, dimEnd.z)
          arrowVertices.push(
            dimEnd.x + endArrowBack.x - arrowSide.x,
            dimEnd.y + endArrowBack.y - arrowSide.y,
            dimEnd.z + endArrowBack.z - arrowSide.z
          )
        }
      }
    }
    
    // Set geometry attributes
    if (dimVertices.length > 0) {
      geos.dimensionLines.setAttribute('position', new BufferAttribute(new Float32Array(dimVertices), 3))
    }
    if (extVertices.length > 0) {
      geos.extensionLines.setAttribute('position', new BufferAttribute(new Float32Array(extVertices), 3))
    }
    if (arrowVertices.length > 0) {
      geos.arrows.setAttribute('position', new BufferAttribute(new Float32Array(arrowVertices), 3))
    }
    
    return geos
  }, [measurement, style, showExtensionLines])
  
  // Text sprites
  const textSprites = useMemo(() => {
    if (!showText || !style.showText || !points || points.length < 2) return []
    
    const sprites: JSX.Element[] = []
    
    if (chainDimensions && segments && segments.length > 1) {
      segments.forEach((segment, index) => {
        const { startPoint, endPoint, distance } = segment
        
        // Safety check for segment points
        if (!startPoint || !endPoint || typeof startPoint.x !== 'number' || typeof endPoint.x !== 'number') {
          return
        }
        
        const start = new Vector3(startPoint.x || 0, startPoint.y || 0, startPoint.z || 0)
        const end = new Vector3(endPoint.x || 0, endPoint.y || 0, endPoint.z || 0)
        const midpoint = new Vector3().addVectors(start, end).multiplyScalar(0.5)
        const direction = new Vector3().subVectors(end, start).normalize()
        const perpendicular = new Vector3(-direction.z, direction.y, direction.x).normalize()
        const offset = perpendicular.multiplyScalar(style.dimensionLineOffset * (index + 1))
        const textPosition = midpoint.add(offset).add(new Vector3(style.textOffset.x, style.textOffset.y, style.textOffset.z))
        
        const text = formatMeasurement(distance, unit, precision)
        
        sprites.push(
          <TextSprite
            key={`segment-${index}`}
            position={textPosition}
            text={text}
            style={style}
            scale={textScale}
          />
        )
      })
    } else {
      const p1 = points[0]
      const p2 = points[points.length - 1]
      
      // Safety check for points
      if (!p1 || !p2 || typeof p1.x !== 'number' || typeof p2.x !== 'number') {
        return []
      }
      
      const startPoint = new Vector3(p1.x || 0, p1.y || 0, p1.z || 0)
      const endPoint = new Vector3(p2.x || 0, p2.y || 0, p2.z || 0)
      const midpoint = new Vector3().addVectors(startPoint, endPoint).multiplyScalar(0.5)
      const direction = new Vector3().subVectors(endPoint, startPoint).normalize()
      const perpendicular = new Vector3(-direction.z, direction.y, direction.x).normalize()
      const offset = perpendicular.multiplyScalar(style.dimensionLineOffset)
      const textPosition = midpoint.add(offset).add(new Vector3(style.textOffset.x, style.textOffset.y, style.textOffset.z))
      
      const text = formatMeasurement(totalDistance, unit, precision)
      
      sprites.push(
        <TextSprite
          key="total"
          position={textPosition}
          text={text}
          style={style}
          scale={textScale}
        />
      )
    }
    
    return sprites
  }, [measurement, style, showText, textScale, chainDimensions])
  
  const lineMaterial = useMemo(() => 
    new LineBasicMaterial({ 
      color: style.color,
      transparent: true,
      opacity,
      linewidth: style.thickness
    }),
    [style.color, opacity, style.thickness]
  )
  
  const extLineMaterial = useMemo(() => 
    new LineBasicMaterial({ 
      color: style.color,
      transparent: true,
      opacity: opacity * 0.7,
      linewidth: Math.max(1, style.thickness - 1)
    }),
    [style.color, opacity, style.thickness]
  )
  
  return (
    <group name={`linear-dimension-${measurement.id}`}>
      {geometries.dimensionLines.attributes.position && (
        <primitive object={new Line(geometries.dimensionLines, lineMaterial)} />
      )}
      {geometries.extensionLines.attributes.position && showExtensionLines && (
        <primitive object={new Line(geometries.extensionLines, extLineMaterial)} />
      )}
      {geometries.arrows.attributes.position && (
        <primitive object={new Line(geometries.arrows, lineMaterial)} />
      )}
      {textSprites}
    </group>
  )
}

// ===== ANGULAR DIMENSION RENDERER =====

interface AngularDimensionProps {
  measurement: AngularMeasurement
  style: MeasurementStyle
  opacity: number
  showText: boolean
  textScale: number
}

const AngularDimensionRenderer: React.FC<AngularDimensionProps> = ({
  measurement,
  style,
  opacity,
  showText,
  textScale
}) => {
  const { vertex, startPoint, endPoint, angle, unit, precision } = measurement
  
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const vertices: number[] = []
    
    const radius = style.dimensionLineOffset * 2
    const segments = Math.max(8, Math.ceil(angle * 180 / Math.PI / 15)) // More segments for larger angles
    
    const vertexVec = new Vector3(vertex.x, vertex.y, vertex.z)
    const startVec = new Vector3(startPoint.x, startPoint.y, startPoint.z)
    const endVec = new Vector3(endPoint.x, endPoint.y, endPoint.z)
    
    const v1 = new Vector3().subVectors(startVec, vertexVec).normalize()
    const v2 = new Vector3().subVectors(endVec, vertexVec).normalize()
    
    // Create arc
    for (let i = 0; i <= segments; i++) {
      const t = i / segments
      const currentAngle = angle * t
      
      const direction = new Vector3().copy(v1)
      direction.applyAxisAngle(new Vector3().crossVectors(v1, v2).normalize(), currentAngle)
      
      const point = vertexVec.clone().add(direction.multiplyScalar(radius))
      vertices.push(point.x, point.y, point.z)
      
      if (i > 0) {
        vertices.push(point.x, point.y, point.z)
      }
    }
    
    // Add extension lines to arc endpoints
    const arcStart = vertexVec.clone().add(v1.clone().multiplyScalar(radius))
    const arcEnd = vertexVec.clone().add(v2.clone().multiplyScalar(radius))
    
    vertices.push(vertexVec.x, vertexVec.y, vertexVec.z)
    vertices.push(arcStart.x, arcStart.y, arcStart.z)
    vertices.push(vertexVec.x, vertexVec.y, vertexVec.z)
    vertices.push(arcEnd.x, arcEnd.y, arcEnd.z)
    
    geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    return geo
  }, [measurement, style])
  
  const textSprite = useMemo(() => {
    if (!showText || !style.showText) return null
    
    const radius = style.dimensionLineOffset * 2.5
    const midAngle = angle / 2
    
    const vertexVec = new Vector3(vertex.x, vertex.y, vertex.z)
    const startVec = new Vector3(startPoint.x, startPoint.y, startPoint.z)
    const endVec = new Vector3(endPoint.x, endPoint.y, endPoint.z)
    
    const v1 = new Vector3().subVectors(startVec, vertexVec).normalize()
    const v2 = new Vector3().subVectors(endVec, vertexVec).normalize()
    const normal = new Vector3().crossVectors(v1, v2).normalize()
    
    const midDirection = new Vector3().copy(v1)
    midDirection.applyAxisAngle(normal, midAngle)
    
    const textPosition = vertexVec.clone().add(midDirection.multiplyScalar(radius)).add(new Vector3(style.textOffset.x, style.textOffset.y, style.textOffset.z))
    const text = formatAngularMeasurement(angle, unit, precision)
    
    return (
      <TextSprite
        position={textPosition}
        text={text}
        style={style}
        scale={textScale}
      />
    )
  }, [measurement, style, showText, textScale])
  
  const material = useMemo(() => 
    new LineBasicMaterial({ 
      color: style.color,
      transparent: true,
      opacity,
      linewidth: style.thickness
    }),
    [style.color, opacity, style.thickness]
  )
  
  return (
    <group name={`angular-dimension-${measurement.id}`}>
      <primitive object={new Line(geometry, material)} />
      {textSprite}
    </group>
  )
}

// ===== AREA DIMENSION RENDERER =====

interface AreaDimensionProps {
  measurement: AreaMeasurement
  style: MeasurementStyle
  opacity: number
  showText: boolean
  textScale: number
}

const AreaDimensionRenderer: React.FC<AreaDimensionProps> = ({
  measurement,
  style,
  opacity,
  showText,
  textScale
}) => {
  const { boundary, area, centroid, unit, precision, showCentroid } = measurement
  
  const geometry = useMemo(() => {
    const geo = new BufferGeometry()
    const vertices: number[] = []
    
    // Create boundary lines
    for (let i = 0; i < boundary.length; i++) {
      const current = new Vector3(boundary[i].x, boundary[i].y, boundary[i].z)
      const next = new Vector3(boundary[(i + 1) % boundary.length].x, boundary[(i + 1) % boundary.length].y, boundary[(i + 1) % boundary.length].z)
      
      vertices.push(current.x, current.y, current.z)
      vertices.push(next.x, next.y, next.z)
    }
    
    // Add centroid marker if requested
    if (showCentroid) {
      const markerSize = 1.0
      const centroidVec = new Vector3(centroid.x, centroid.y, centroid.z)
      vertices.push(centroidVec.x - markerSize, centroidVec.y, centroidVec.z)
      vertices.push(centroidVec.x + markerSize, centroidVec.y, centroidVec.z)
      vertices.push(centroidVec.x, centroidVec.y, centroidVec.z - markerSize)
      vertices.push(centroidVec.x, centroidVec.y, centroidVec.z + markerSize)
    }
    
    geo.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    return geo
  }, [boundary, centroid, showCentroid])
  
  const textSprite = useMemo(() => {
    if (!showText || !style.showText) return null
    
    const textPosition = new Vector3(centroid.x, centroid.y, centroid.z).add(new Vector3(style.textOffset.x, style.textOffset.y, style.textOffset.z))
    const text = formatAreaMeasurement(area, unit, precision)
    
    return (
      <TextSprite
        position={textPosition}
        text={text}
        style={style}
        scale={textScale}
      />
    )
  }, [area, unit, precision, centroid, style, showText, textScale])
  
  const material = useMemo(() => 
    new LineBasicMaterial({ 
      color: style.color,
      transparent: true,
      opacity,
      linewidth: style.thickness
    }),
    [style.color, opacity, style.thickness]
  )
  
  return (
    <group name={`area-dimension-${measurement.id}`}>
      <primitive object={new Line(geometry, material)} />
      {textSprite}
    </group>
  )
}

// ===== TEXT SPRITE COMPONENT =====

interface TextSpriteProps {
  position: Vector3
  text: string
  style: MeasurementStyle
  scale: number
}

const TextSprite: React.FC<TextSpriteProps> = ({ position, text, style, scale }) => {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) return null
    
    // Set canvas size
    canvas.width = 256
    canvas.height = 64
    
    // Set font and measure text
    const fontSize = Math.floor(style.textSize * scale)
    context.font = `${fontSize}px Arial, sans-serif`
    const metrics = context.measureText(text)
    const textWidth = metrics.width
    const textHeight = fontSize
    
    // Adjust canvas size to fit text
    canvas.width = Math.ceil(textWidth + 20)
    canvas.height = Math.ceil(textHeight + 10)
    
    // Redraw with correct size
    context.font = `${fontSize}px Arial, sans-serif`
    context.fillStyle = style.backgroundColor
    context.globalAlpha = style.backgroundOpacity
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Draw text
    context.globalAlpha = 1.0
    context.fillStyle = style.textColor
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(text, canvas.width / 2, canvas.height / 2)
    
    return new CanvasTexture(canvas)
  }, [text, style, scale])
  
  const material = useMemo(() => 
    new SpriteMaterial({ 
      map: texture,
      transparent: true,
      alphaTest: 0.01,
      side: DoubleSide
    }),
    [texture]
  )
  
  if (!texture) return null
  
  return (
    <sprite
      position={[position.x, position.y, position.z]}
      material={material}
      scale={[2 * scale, 0.5 * scale, 1]}
      userData={{ billboardText: true }}
    />
  )
}

export default DimensionRenderer
