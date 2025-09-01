# Plumbing Preview Lines Debug Guide 🔧

## Issue: No Preview Lines When Creating Plumbing

The realistic pipe rendering system has been implemented, but you're not seeing preview lines. Here's how to debug and fix this:

## Debug Steps 🔍

### 1. **Check Console Output**
Open browser developer tools (F12) and look for these messages:

**When switching to create mode:**
```
🚰 Starting pipe routing in mode: create
🔧 Routing state changed: { isActive: true, mode: 'create', pathLength: 0, ... }
```

**When moving mouse in create mode:**
```
🔧 Updating preview line with 1 points
🔧 Showing single preview point at 50 8 100
```

**When clicking to add points:**
```
✅ Processing click for pipe routing
✅ Adding pipe point at (50.0, 8.0, 100.0)
🔧 Created 1 preview pipe segments
```

### 2. **Verify Create Mode is Active**
- Click the green "+" icon in the plumbing toolbar
- Should see "CREATE MODE" panel appear
- Console should show: `🚰 Starting pipe routing in mode: create`

### 3. **Check Floorplan Loading**
Look for these console messages:
```
🏗️ Current floorplan: LOADED (or USING FALLBACK)
🏗️ Floorplan elements: 50+ 
🌿 Generating cannabis grow plumbing snap points for 20+ walls
🔧 Generated 500+ plumbing snap points
```

### 4. **Test Mouse Movement**
In create mode, move your mouse around the 3D scene:
- Should see console: `🔧 Updating preview line with 1 points`
- Should see a colored sphere following your mouse cursor
- Sphere color should match selected material (red PEX, copper, white PVC)

## Common Issues & Fixes 🛠️

### **Issue 1: Create Mode Not Starting**
**Symptoms:** No console logs when clicking create button
**Fix:** Check PlumbingSystemIntegration is enabled and routing tool ref is connected

### **Issue 2: No Mouse Movement Detection**
**Symptoms:** No preview sphere when moving mouse
**Fix:** Check that canvas event listeners are attached:
```javascript
canvas.addEventListener('mousemove', handleMouseMove)
```

### **Issue 3: Preview Objects Not Visible**
**Symptoms:** Console shows points being created but nothing visible
**Fix:** Check camera position and scene lighting

### **Issue 4: Wrong Material Colors**
**Symptoms:** All pipes show same color
**Fix:** Verify material selection is working in toolbar

## Manual Testing Steps 📝

### **Step 1: Enable Create Mode**
1. Open browser console (F12)
2. Click green "+" in plumbing toolbar
3. Verify console shows: `🚰 Starting pipe routing in mode: create`

### **Step 2: Test Mouse Preview**
1. Move mouse over 3D scene
2. Should see colored sphere following cursor
3. Console should show: `🔧 Showing single preview point at X Y Z`

### **Step 3: Test Material Changes**
1. Click different material buttons (PEX, Copper, PVC)
2. Preview sphere should change color:
   - **PEX**: Bright blue (#0055FF)
   - **Copper**: Rich copper (#D2691E)  
   - **PVC**: Light gray/white (#F8F8FF)

### **Step 4: Test Point Placement**
1. Click to place first point
2. Console should show: `✅ Adding pipe point at (X, Y, Z)`
3. Move mouse to see pipe preview between points
4. Console should show: `🔧 Created 1 preview pipe segments`

## Expected Visual Results 🎨

### **Hover Preview (Before Clicking):**
- **Colored sphere** following mouse cursor
- **Size matches** selected pipe diameter
- **Color matches** selected material

### **Pipe Preview (After First Click):**
- **Realistic pipe cylinder** from last point to mouse
- **Proper thickness** (much thicker than old blue lines)
- **Material-accurate color** and finish
- **Semi-transparent** for preview

### **Material Appearance:**
- **PEX**: Bright blue/red plastic tubes
- **Copper**: Shiny metallic orange pipes  
- **PVC**: Clean white/gray plastic pipes

## Quick Fixes 🚀

### **If No Preview At All:**
```javascript
// Check in console:
window.plumbingDebug = {
  routingTool: routingToolRef.current,
  state: routingToolRef.current?.getState()
}
```

### **If Wrong Colors:**
- Switch materials in toolbar
- Check console for material change events
- Verify getMaterialColor function is working

### **If Too Thin/Invisible:**
- Check radius calculation: `Math.max(diameter * 0.15, 0.12)`
- Verify opacity is 0.7+ for preview
- Check emissive glow is enabled

The preview system should now show realistic, thick, properly colored pipes instead of thin lines! 🚰✨
