# Plumbing Snap Points System

## Overview
Added industry-standard plumbing snap points to provide professional, code-compliant pipe routing locations throughout the warehouse CAD system.

## Features Implemented ✅

### 1. Industry Standard Locations
Based on commercial plumbing codes and best practices:

**Wall Snap Points:**
- Wall centers at standard plumbing heights
- Wall corners for fixture connections
- Wall penetration points every 2 feet
- Valve and access panel heights

**Fixture Snap Points:**
- **Bathroom Fixtures:**
  - Toilet supply (6" above floor) & drain (floor level)
  - Sink supply (18" above floor) & drain (15" above floor)  
  - Shower supply (48" above floor) & drain (floor level)
- **Kitchen Fixtures:**
  - Kitchen sink supply & drain connections
  - Dishwasher connection points
- **Laundry Fixtures:**
  - Washer supply connections (42" above floor)
  - Laundry sink connections
  - Floor drain locations

**Equipment Snap Points:**
- Water heater connections (6" above floor)
- Pump connections (12" above floor)
- Tank connection points

**Support Snap Points:**
- Pipe support points every 4-8 feet along walls
- Ceiling support points (8' height)
- Basement ceiling supports (7' height)

### 2. Smart Snap Detection
- **1.5 foot snap radius** - automatically snaps to nearby industry points
- **System type filtering** - only shows relevant snap points for current pipe system
- **Confidence-based sizing** - more important points are larger and more visible
- **Real-time feedback** - console logging shows which snap points are being used

### 3. Visual Indicators
**Color-coded snap points:**
- 🔵 **Blue** - Wall mounting points
- 🔴 **Red** - Supply line connections  
- 🟢 **Teal** - Drain connections
- 🟡 **Yellow** - Equipment connections
- 🟢 **Light Green** - Support points
- 🟣 **Pink** - Branch connections

**Shape-coded indicators:**
- **Rectangles** - Wall points
- **Cones** - Supply connections (pointing up)
- **Funnels** - Drain connections  
- **Diamonds** - Equipment connections
- **Pyramids** - Support points
- **Spheres** - Branch points

### 4. Height-Based Standards
Follows industry standard heights:
- **Supply lines:** 6"-48" depending on fixture type
- **Drain lines:** Floor level to 18" 
- **Vent connections:** 72" above floor
- **Support points:** 7'-8' (ceiling level)
- **Equipment:** 6"-12" above floor

## Technical Implementation

### New Files Created:
1. **`lib/plumbing/PlumbingSnapPoints.ts`** - Core snap point generation system
2. **`components/PlumbingSnapIndicators.tsx`** - Visual 3D indicators

### Integration Points:
1. **`PipeRoutingTool.tsx`** - Snap detection during pipe creation
2. **`PlumbingSystemIntegration.tsx`** - Snap point management and display

### Key Classes:
- **`PlumbingSnapPointGenerator`** - Analyzes floorplan and generates snap points
- **`PlumbingSnapIndicators`** - Renders visual indicators in 3D scene

## Usage

### For Users:
1. **Switch to Create Mode** in plumbing toolbar
2. **See colored indicators** appear at industry-standard locations
3. **Move mouse near indicators** - they highlight and show descriptions
4. **Click near snap points** - pipes automatically snap to exact locations
5. **Different colors** show different types of connections

### For Developers:
```typescript
// Generate snap points for a floorplan
const generator = new PlumbingSnapPointGenerator(floorplan)
const snapPoints = generator.getSnapPoints()

// Filter by system type
const supplyPoints = generator.getSnapPointsForSystemType(PlumbingSystemType.COLD_WATER)

// Filter by height range
const floorLevelPoints = generator.getSnapPointsInHeightRange(0, 1)
```

## Industry Standards Compliance

### Spacing Requirements:
- **Maximum 50 feet** between snap points on long runs
- **25 feet** in congested areas
- **2 feet minimum** from corners for penetrations
- **4-8 feet** typical support spacing

### Height Standards:
- **Residential fixtures:** 6"-48" above floor
- **Commercial fixtures:** 12"-60" above floor  
- **Accessibility compliance:** ADA height requirements
- **Code compliance:** Local building code adherence

### Connection Standards:
- **Branch connections:** Proper spacing from mains
- **Valve locations:** Accessible maintenance points
- **Access panels:** Code-required access points
- **Firestopping:** Proper penetration sealing locations

## Benefits

### For Designers:
- **Faster Design** - No manual calculation of fixture heights
- **Code Compliance** - Automatically follows industry standards
- **Professional Results** - Clean, properly spaced pipe runs
- **Reduced Errors** - Prevents common placement mistakes

### For Installers:
- **Accurate Dimensions** - Industry-standard measurements
- **Proper Support** - Correct support point spacing
- **Code Compliance** - Meets inspection requirements
- **Material Optimization** - Efficient pipe routing

## Testing Recommendations

1. **Create Mode Testing:**
   - Switch to create mode and verify snap points appear
   - Test different system types (hot water, cold water, waste)
   - Verify snap point filtering by system type

2. **Snap Behavior Testing:**
   - Move mouse near snap points - should highlight
   - Click near snap points - should snap to exact location
   - Test 1.5 foot snap radius

3. **Visual Testing:**
   - Verify different colors for different point types
   - Check shape coding (cones for supply, funnels for drains, etc.)
   - Test opacity and visibility settings

4. **Room Type Testing:**
   - Test bathroom fixture snap points
   - Test kitchen fixture snap points  
   - Test mechanical room equipment points
   - Test wall penetration points

The plumbing system now provides professional, industry-standard snap points that make pipe routing faster, more accurate, and code-compliant!
