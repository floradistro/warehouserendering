# WarehouseCAD Positioning Standards

## 🎯 Coordinate System Overview

### Warehouse Model Coordinates
- **X-axis**: East-West (increasing eastward)
- **Y-axis**: North-South (increasing northward) 
- **Z-axis**: Vertical height (increasing upward)
- **Units**: Feet
- **Origin**: Southwest corner of the workspace pad

### Three.js World Coordinates
- **X-axis**: East-West (matches warehouse X)
- **Y-axis**: Vertical height (matches warehouse Z)
- **Z-axis**: North-South (matches warehouse Y)

## 📐 Key Warehouse Boundaries

### Building Envelope
- **West wall**: x = 25' (interior face)
- **East wall**: x = 112.75' (interior face)
- **South wall**: y = 25' (interior face)
- **North wall**: y = 222' (interior face)
- **Building width**: 88.75' (east-west)
- **Building length**: 198' (north-south)

### Room Boundaries (North to South)
1. **North Dry Room**: y = 211.5209 to y = 222
2. **Middle Hallway**: y = 208.5209 to y = 211.5209
3. **South Dry Room**: y = 198.0417 to y = 208.5209
4. **Room 2**: y = 173.4792 to y = 198.0417
5. **Room 3**: y = 148.9167 to y = 173.4792
6. **Room 4**: y = 124.3542 to y = 148.9167
7. **Room 5**: y = 99.7917 to y = 124.3542
8. **Room 6**: y = 75.2292 to y = 99.7917
9. **Room 7**: y = 48.6667 to y = 75.2292
10. **Room 8**: y = 25 to y = 48.6667

### Longways Walls
- **West longway wall**: x = 30.0625
- **East longway wall**: x = 110.375
- **Room interior width**: 80.3125' (between longways walls)

## 🏗️ Element Positioning Rules

### 1. Walls
```typescript
position: { x: startX, y: startY, z: 0 }
dimensions: { width: length, height: thickness, depth: wallHeight }
```
- Walls positioned at their **start corner**
- Width = length along primary axis
- Height = thickness perpendicular to primary axis
- Depth = vertical height (typically 12')

### 2. I-Beams (Vertical Columns)
```typescript
position: { x: centerX, y: centerY, z: 0 }
dimensions: { width: 0.67, height: 0.67, depth: beamHeight }
```
- Positioned at **base center point**
- Ground level (z = 0)
- Height extends upward

### 3. TJI Beams (Horizontal Joists)
```typescript
position: { x: centerX, y: centerY, z: elevationHeight }
dimensions: { width: beamWidth, height: spanLength, depth: beamDepth }
```
- Positioned at **geometric center**
- Elevated to proper ceiling height (z = 8' typically)
- Height = span length along primary axis

### 4. Trusses (Structural Spans)
```typescript
position: { x: startX, y: centerY, z: bottomHeight }
dimensions: { width: spanWidth, height: spanLength, depth: trussHeight }
```
- Support trusses: positioned at exterior wall height (z = 12')
- Longitudinal trusses: positioned at wall height (z = 12')

### 5. Storage Equipment (IBC Totes, Tanks)
```typescript
position: { x: centerX, y: centerY, z: 0 }
dimensions: { width: equipWidth, height: equipLength, depth: equipHeight }
```
- Positioned at **base center point**
- Ground level (z = 0)
- Use actual equipment dimensions

### 6. Roof Panels
```typescript
position: { x: centerX, y: centerY, z: roofHeight }
dimensions: { width: panelWidth, height: panelLength, depth: panelThickness }
```
- Positioned at panel center
- Elevated to truss top height (z varies with curve)

## 🎨 Three.js Renderer Position Mapping

### Standard Elements
```typescript
// Warehouse (x,y,z) → Three.js [x,y,z]
const position = [
  element.position.x + element.dimensions.width / 2,  // Center X
  element.position.z + element.dimensions.depth / 2,  // Height from ground
  element.position.y + element.dimensions.height / 2  // Center Y
]
```

### Special Cases

#### TJI Beams
```typescript
if (element.material === 'tji_beam' && element.metadata?.equipment_type === 'tji_ijoist') {
  return [
    element.position.x,                                    // Already centered X
    element.position.z + element.dimensions.depth / 2,    // Beam center height
    element.position.y + element.dimensions.height / 2    // Already centered Y
  ]
}
```

#### I-Beams (Vertical)
```typescript
if (element.material === 'steel' && element.type === 'fixture') {
  return [element.position.x, 0, element.position.y]  // Base at ground level
}
```

#### Support Trusses
```typescript
if (element.metadata?.truss_type === 'support_truss') {
  return [
    element.position.x + element.dimensions.width / 2,  // Span center
    12,                                                 // Exterior wall height
    element.position.y                                  // Truss centerline
  ]
}
```

## ✅ Positioning Checklist

Before adding any new element:

1. **Define Purpose**: What is this element's structural role?
2. **Determine Reference Point**: Corner, center, or base?
3. **Set Correct Elevation**: Ground level, ceiling height, or custom?
4. **Verify Coordinates**: Check against room boundaries
5. **Test Renderer Mapping**: Ensure proper Three.js positioning
6. **Add Special Case**: If needed, add to renderer position logic

## 🔧 Common Fixes

### Element Appears at Wrong Location
1. Check warehouse model coordinates
2. Verify renderer position mapping
3. Ensure proper centering logic
4. Check for missing special case handling

### Element at Wrong Height
1. Verify z-coordinate in warehouse model
2. Check renderer height calculation
3. Ensure proper depth/height dimension usage

### Element Orientation Issues
1. Check width vs height dimension assignment
2. Verify rotation angle (degrees vs radians)
3. Ensure proper axis mapping

## 📊 Quick Reference

### Standard Heights
- **Ground Level**: z = 0
- **Ceiling Joists**: z = 12.5' (above 12' walls)
- **Wall Top**: z = 12'
- **I-Beam Top**: z = 14.046875'
- **Truss Peak**: z = 16.8438'

### Standard Spacings
- **16" OC**: 1.33' spacing
- **24" OC**: 2.0' spacing
- **Wall Thickness**: 0.375' (4.5")
- **Firewall Thickness**: 0.5' (6")

### Room Width Standards
- **Full Building**: 88.75'
- **Between Longways**: 80.3125'
- **Individual Room**: ~24.5' (varies)
- **Hallway Width**: 3-5'

This standardization ensures consistent, predictable object placement throughout the warehouse model.
