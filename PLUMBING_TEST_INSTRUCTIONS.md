# 🧪 Plumbing System Test Instructions

## Quick Test Steps

1. **Open the application**: Go to `http://localhost:3001`

2. **Open Browser Console**: Press F12 → Console tab

3. **Test Event System**: Run these commands in console:

```javascript
// Test 1: Check if plumbing system is loaded
console.log('Plumbing debug object:', window.plumbingDebug)

// Test 2: Test example system creation
window.plumbingDebug.createExample()

// Test 3: Test mode change to create
window.plumbingDebug.testModeChange('create')

// Test 4: Check if systems exist
console.log('Current systems:', window.plumbingDebug.getSystems())

// Test 5: Test UI events
window.dispatchEvent(new CustomEvent('createExamplePEXSystem'))
```

## Visual Test Steps

1. **Find the Plumbing Toolbar**: 
   - Look for the second vertical toolbar (32px wide)
   - Should be right after the measurement tools
   - Dark VSCode theme with icons

2. **Test Mode Buttons**:
   - Click the Eye icon (View mode) - should highlight
   - Click the Plus icon (Create mode) - should highlight and show status
   - Click the Edit icon (Edit mode) - should highlight

3. **Test Material Buttons**:
   - Click the Droplet icon (PEX) - should highlight with blue/red dot
   - Click the Lightning icon (Copper) - should highlight with bronze dot
   - Click the Wind icon (PVC) - should highlight with blue/white dot

4. **Test System Type Buttons**:
   - Click the Flame icon (Hot Water) - should highlight with red dot
   - Click the Droplet icon (Cold Water) - should highlight with blue dot
   - Click the Wind icon (Waste) - should highlight with gray dot

5. **Test Action Buttons**:
   - Click the Target icon (Add Example) - should create PEX system
   - Click the Dollar icon (Stats) - should show/hide stats panel
   - Click the Ruler icon (Diameter) - should cycle through sizes

## Expected Console Output

When clicking buttons, you should see:
```
🔧 Plumbing mode changed to: create
🎯 3D System received mode change: create {material: 'pex', diameter: 0.5, systemType: 'cold_water'}
🎯 Routing tool ref: [object Object]
🎯 Updating routing tool settings...
🎯 Starting routing tool...
```

## Troubleshooting

### If no console output when clicking:
- Check if PlumbingSystemIntegration is loaded in Canvas
- Verify event listeners are attached
- Check browser console for JavaScript errors

### If toolbar not visible:
- Check if PlumbingSystemUI is in the left sidebar
- Look for VSCode dark theme styling
- Verify it's positioned after measurement tools

### If example system doesn't appear:
- Check 3D viewport for blue PEX pipes
- Look for pipe geometry in the scene
- Verify PlumbingSystemManager is working

## Debug Commands

```javascript
// Check if components are loaded
console.log('Plumbing manager:', window.plumbingDebug?.getManager())
console.log('Routing tool:', window.plumbingDebug?.routingToolRef?.current)

// Force create example system
window.plumbingDebug?.createExample()

// Check scene for plumbing objects
console.log('Scene children:', window.plumbingDebug?.getManager()?.getScene()?.children)

// Test event system
window.dispatchEvent(new CustomEvent('plumbingModeChange', {
  detail: { mode: 'create', material: 'pex', diameter: 0.5, systemType: 'cold_water' }
}))
```

## What Should Work

✅ **Toolbar Visible**: VSCode-style dark toolbar in left sidebar  
✅ **Button Interactions**: Hover effects, active states, tooltips  
✅ **Mode Switching**: View/Create/Edit modes with visual feedback  
✅ **Material Selection**: PEX/Copper/PVC with color indicators  
✅ **System Creation**: Example PEX system appears in 3D scene  
✅ **Console Logging**: Debug output for all interactions  

If any of these don't work, let me know which specific step fails!
