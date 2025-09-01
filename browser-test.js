// BROWSER TEST SCRIPT
// Copy and paste this into the browser console at http://localhost:3002

console.log('🧪 Starting Plumbing System Browser Test...')

// Test 1: Find the Target button
const targetButton = Array.from(document.querySelectorAll('button')).find(btn => 
  btn.title === 'Add Example PEX System' || 
  btn.innerHTML.includes('Target') ||
  btn.querySelector('svg')?.classList.contains('lucide-target')
)

console.log('🎯 Target button found:', targetButton ? 'YES' : 'NO')
if (targetButton) {
  console.log('🎯 Button element:', targetButton)
  console.log('🎯 Button title:', targetButton.title)
  console.log('🎯 Button onclick:', targetButton.onclick)
}

// Test 2: Find plumbing toolbar
const plumbingToolbar = Array.from(document.querySelectorAll('div')).find(div => 
  div.className.includes('bg-[#2d2d2d]') && 
  div.className.includes('w-8') &&
  div.querySelector('button[title*="View"]') &&
  div.querySelector('button[title*="Create"]')
)

console.log('🔧 Plumbing toolbar found:', plumbingToolbar ? 'YES' : 'NO')
if (plumbingToolbar) {
  const buttons = plumbingToolbar.querySelectorAll('button')
  console.log('🔧 Toolbar buttons count:', buttons.length)
  buttons.forEach((btn, i) => {
    console.log(`🔧 Button ${i}:`, btn.title || 'No title')
  })
}

// Test 3: Manually trigger Target button click
if (targetButton) {
  console.log('🎯 Manually clicking Target button...')
  targetButton.click()
} else {
  console.log('❌ Cannot test - Target button not found')
}

// Test 4: Check for any JavaScript errors
console.log('🧪 Test completed. Check for alerts and console messages above.')

// Test 5: Try to find elements in the store
setTimeout(() => {
  if (window.warehouseCAD && window.warehouseCAD.getCurrentFloorplan) {
    const floorplan = window.warehouseCAD.getCurrentFloorplan()
    if (floorplan && floorplan.elements) {
      const pipeElements = floorplan.elements.filter(el => el.type === 'pipe_system')
      console.log('🚰 Pipe elements in store:', pipeElements.length)
      if (pipeElements.length > 0) {
        console.log('🚰 First pipe element:', pipeElements[0])
      }
    } else {
      console.log('⚠️ No floorplan or elements found')
    }
  } else {
    console.log('⚠️ warehouseCAD global object not found')
  }
}, 1000)
