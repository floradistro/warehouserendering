# Plumbing System Debug Guide 🔧

## Current Status
The plumbing system has been enhanced with:
- ✅ Realistic pipe rendering (thick, colored pipes)
- ✅ Cannabis grow snap points on all walls
- ✅ Canva-style alignment guides
- ✅ Fixed import errors

## Debugging Steps 🔍

### **Step 1: Check Console Output**
Open browser developer tools (F12) and look for these messages:

**When you switch to create mode:**
```
🚰 Starting pipe routing in mode: create
🔧 Routing state changed: { isActive: true, mode: 'create', ... }
```

**When you move your mouse:**
```
🖱️ Mouse move - routing active, processing...
🔧 Updating preview line with 1 points
🔧 Showing single preview point at X Y Z
```

**If you see these instead:**
```
🚫 Mouse move ignored - not enabled
🚫 Mouse move ignored - routing not active
```
Then the routing tool isn't properly activated.

### **Step 2: Verify Plumbing Integration**
Check that PlumbingSystemIntegration is loaded:
```
🔧 PlumbingSystemIntegration: currentFloorplan = EXISTS
🔧 PlumbingSystemIntegration: elements = 50+
🌿 Generating cannabis grow plumbing snap points for 20+ walls
```

### **Step 3: Test Create Mode Activation**
1. **Click the green "+" button** in the plumbing toolbar (leftmost toolbar)
2. **Should see "CREATE MODE" panel** appear next to the toolbar
3. **Console should show:** `🚰 Starting pipe routing in mode: create`

### **Step 4: Test Mouse Movement**
1. **Move mouse over the 3D scene**
2. **Should see console:** `🖱️ Mouse move - routing active, processing...`
3. **Should see a colored sphere** following your cursor
4. **Sphere color should match material** (blue PEX, copper, white PVC)

### **Step 5: Test Alignment Guides**
1. **Click first point** anywhere in the scene
2. **Move mouse to a different location at same height**
3. **Should see green line** appear when heights are level
4. **Console should show:** `📐 Level alignment detected: Level at X.X' height`

## Common Issues & Solutions 🛠️

### **Issue 1: No Console Output When Clicking Create**
**Cause:** Plumbing toolbar not connected to routing tool
**Solution:** Check that SimplePlumbingToolbar is dispatching events properly

### **Issue 2: Mouse Events Not Working**
**Cause:** Canvas event listeners not attached
**Solution:** Check that PipeRoutingTool is enabled and canvas exists

### **Issue 3: No Preview Objects**
**Cause:** Preview objects not being created or added to scene
**Solution:** Check that Three.js scene is properly initialized

### **Issue 4: No Snap Points**
**Cause:** Floorplan not loaded or walls missing
**Solution:** Verify warehouse model is loading with walls

## Quick Diagnostic Commands 🔬

**In browser console, try these:**

```javascript
// Check if plumbing system is loaded
console.log('Plumbing enabled:', document.querySelector('canvas') !== null)

// Check routing tool state
window.plumbingDebug = true

// Force create mode (if toolbar not working)
window.dispatchEvent(new CustomEvent('plumbingModeChange', {
  detail: { mode: 'create' }
}))

// Check floorplan data
console.log('Floorplan loaded:', !!window.currentFloorplan)
```

## Expected Working Behavior ✅

### **Create Mode:**
1. **Click green "+" button** → CREATE MODE panel appears
2. **Move mouse over scene** → Colored sphere follows cursor
3. **Click to place point** → Point added, console shows coordinates
4. **Move to second point** → Pipe preview appears between points
5. **Move near same height** → Green alignment line appears
6. **Click when aligned** → Perfect level pipe created

### **Visual Results:**
- **Thick, realistic pipes** instead of thin lines
- **Proper material colors** (blue PEX, copper, white PVC)
- **Green alignment guides** when pipes are level
- **Snap points** on all walls for cannabis grow operations

## If Still Not Working 🚨

If the system is still not working, the issue might be:

1. **Toolbar Integration** - SimplePlumbingToolbar not connected
2. **Event System** - Custom events not being handled
3. **Three.js Integration** - PipeRoutingTool not in scene
4. **Model Loading** - Floorplan not loaded properly

**Next steps:** Check browser console for any error messages and let me know what console output you see when trying to use the plumbing system.

The plumbing system should now work with realistic pipe rendering and professional alignment guides! 🚰📐✨
