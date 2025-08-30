/**
 * SELECTION UTILITIES
 * Provides easy access to current selection information for external systems
 */

// Import utility functions from the SelectionInfoSystem
import { getCurrentSelection, getSelectionSummary, getElementDetails } from '../components/SelectionInfoSystem'

// Re-export for convenience
export { getCurrentSelection, getSelectionSummary, getElementDetails }

// Additional utility functions for external access
export function logCurrentSelection(): void {
  const selection = getCurrentSelection()
  
  if (!selection) {
    console.log('❌ No selection system available')
    return
  }

  if (!selection.hasSelection) {
    console.log('⚪ No objects currently selected')
    return
  }

  console.group('🎯 Current Selection Details')
  console.log('📊 Summary:', getSelectionSummary())
  console.log('⏰ Last updated:', new Date(selection.timestamp).toLocaleString())
  console.log('📈 Total count:', selection.selectionCount)
  
  if (selection.selectedElements.length > 0) {
    console.group('🏗️ DETAILED SELECTION BREAKDOWN')
    selection.selectedElements.forEach((element, index) => {
      console.group(`📦 OBJECT ${index + 1}: ${element.type.toUpperCase()}`)
      console.log(`🏷️  Object ID: ${element.id}`)
      console.log(`📍 Location: X=${element.position.x}', Y=${element.position.y}', Z=${element.position.z || 0}'`)
      console.log(`📏 Size: ${element.dimensions.width}' wide × ${element.dimensions.height}' tall × ${element.dimensions.depth || 0}' deep`)
      
      if (element.material) {
        console.log(`🔧 Material: ${element.material}`)
      }
      
      if (element.color) {
        console.log(`🎨 Color: ${element.color}`)
      }
      
      if (element.rotation) {
        console.log(`🔄 Rotation: ${element.rotation}° (${(element.rotation * Math.PI / 180).toFixed(2)} radians)`)
      }
      
      if (element.metadata && Object.keys(element.metadata).length > 0) {
        console.log('📋 Metadata:')
        Object.entries(element.metadata).forEach(([key, value]) => {
          console.log(`   • ${key}: ${value}`)
        })
      }
      
      // Calculate volume
      const volume = element.dimensions.width * element.dimensions.height * (element.dimensions.depth || 0)
      console.log(`📊 Volume: ${volume.toFixed(2)} cubic feet`)
      
      console.groupEnd()
    })
    console.groupEnd()
  }
  
  console.groupEnd()
}

// Function to get selection as JSON string (useful for external systems)
export function getSelectionJSON(): string {
  const selection = getCurrentSelection()
  return JSON.stringify(selection, null, 2)
}

// Function to get a detailed description of the selected object
export function getSelectedObjectDescription(): string {
  const selection = getCurrentSelection()
  
  if (!selection || !selection.hasSelection) {
    return 'No objects currently selected'
  }
  
  if (selection.selectedElements.length === 1) {
    const element = selection.selectedElements[0]
    
    // Create a human-readable description
    let description = `Selected: ${element.type.toUpperCase()}\n`
    description += `ID: ${element.id}\n`
    description += `Position: ${element.position.x}', ${element.position.y}', ${element.position.z || 0}'\n`
    description += `Dimensions: ${element.dimensions.width}' × ${element.dimensions.height}' × ${element.dimensions.depth || 0}'\n`
    
    if (element.material) {
      description += `Material: ${element.material}\n`
    }
    
    if (element.color) {
      description += `Color: ${element.color}\n`
    }
    
    if (element.rotation) {
      description += `Rotation: ${element.rotation}°\n`
    }
    
    // Add specific details based on object type and ID
    if (element.id.includes('electrical-panel')) {
      description += `Type: Electrical Panel\n`
      description += `Mount: ${element.rotation === 90 ? 'Wall-mounted' : 'Floor-standing'}\n`
      description += `Voltage: 480V/277V (typical industrial)\n`
      if (element.id.includes('main')) {
        description += `Function: Main Distribution Panel\n`
        description += `Capacity: 400-800 Amps\n`
      } else {
        description += `Function: Branch Circuit Panel\n`
        description += `Capacity: 100-200 Amps\n`
      }
    } else if (element.id.includes('ibc-tote')) {
      description += `Type: IBC Tote Container (Intermediate Bulk Container)\n`
      description += `Level: ${element.id.includes('top') ? 'Upper Rack' : 'Ground Level'}\n`
      description += `Capacity: 275 gallons (1,041 liters)\n`
      description += `Material: High-density polyethylene (HDPE)\n`
      description += `Use: Chemical/liquid storage and transport\n`
      const toteNumber = element.id.match(/\d+$/)?.[0] || 'Unknown'
      description += `Unit Number: ${toteNumber}\n`
    } else if (element.id.includes('norwesco-tank')) {
      description += `Type: Norwesco Storage Tank\n`
      description += `Capacity: ~1,500 gallons\n`
      description += `Material: Polyethylene\n`
      description += `Use: Bulk liquid storage\n`
    } else if (element.id.includes('spiral-feeder')) {
      description += `Type: Spiral Feeder Tank\n`
      description += `Function: Material feeding system\n`
    } else if (element.id.includes('wall')) {
      if (element.id.includes('room-wall')) {
        description += `Type: Interior Room Wall\n`
        description += `Function: Space division\n`
      } else if (element.id.includes('exterior') || element.id.includes('wall-left') || element.id.includes('wall-right') || element.id.includes('wall-top') || element.id.includes('wall-bottom')) {
        description += `Type: Exterior Wall\n`
        description += `Function: Building envelope\n`
      } else {
        description += `Type: Interior Wall\n`
      }
      description += `Thickness: ${element.dimensions.depth || 8}" (typical)\n`
    } else if (element.id.includes('beam')) {
      if (element.id.includes('steel-beam') || element.id.includes('i-beam')) {
        description += `Type: Steel I-Beam\n`
        description += `Material: Structural steel\n`
        description += `Function: Primary structural support\n`
      } else if (element.id.includes('tji-beam')) {
        description += `Type: TJI Engineered Lumber Beam\n`
        description += `Material: Engineered wood\n`
        description += `Function: Floor/roof framing\n`
      }
    } else if (element.id.includes('truss')) {
      description += `Type: Support Truss\n`
      description += `Function: Roof structural support\n`
      description += `Material: Steel or engineered lumber\n`
    } else if (element.id.includes('catwalk')) {
      description += `Type: Industrial Catwalk\n`
      description += `Function: Elevated walkway\n`
      description += `Safety: Includes railings\n`
    } else if (element.id.includes('floor')) {
      if (element.id.includes('epoxy')) {
        description += `Type: Epoxy Floor Coating\n`
        const color = element.id.includes('black') ? 'Black' : element.id.includes('white') ? 'White' : 'Standard'
        description += `Color: ${color}\n`
        description += `Function: Chemical-resistant flooring\n`
        description += `Thickness: ${element.dimensions.depth || 0.125}"\n`
      }
    } else if (element.id.includes('roof-panel')) {
      description += `Type: Metal Roof Panel\n`
      description += `Material: Galvanized steel\n`
      description += `Function: Weather protection\n`
    } else if (element.id.includes('cove-trim')) {
      description += `Type: Cove Base Trim\n`
      description += `Function: Wall-to-floor transition\n`
      description += `Height: ${element.dimensions.depth || 0.67}"\n`
    }
    
    const volume = element.dimensions.width * element.dimensions.height * (element.dimensions.depth || 0)
    description += `Volume: ${volume.toFixed(2)} cubic feet`
    
    return description
  } else {
    return `Selected: ${selection.selectionCount} objects (${getSelectionSummary()})`
  }
}

// Function to check if a specific element is selected
export function isElementSelected(elementId: string): boolean {
  const selection = getCurrentSelection()
  if (!selection) return false
  
  return selection.selectedElements.some(el => el.id === elementId)
}

// Function to get selection count by type
export function getSelectionCountByType(): Record<string, number> {
  const selection = getCurrentSelection()
  if (!selection) return {}
  
  const counts: Record<string, number> = {}
  
  // Count selected elements by type
  selection.selectedElements.forEach(el => {
    counts[el.type] = (counts[el.type] || 0) + 1
  })
  
  return counts
}

// Function to export selection data (useful for saving/sharing)
export function exportSelectionData(): {
  timestamp: string
  summary: string
  details: any
  counts: Record<string, number>
} {
  const selection = getCurrentSelection()
  
  return {
    timestamp: new Date().toISOString(),
    summary: getSelectionSummary(),
    details: selection,
    counts: getSelectionCountByType()
  }
}

// Make utilities available globally for console access
if (typeof window !== 'undefined') {
  (window as any).warehouseCADUtils = {
    getCurrentSelection,
    getSelectionSummary,
    getSelectedObjectDescription,
    getElementDetails,
    logCurrentSelection,
    getSelectionJSON,
    isElementSelected,
    getSelectionCountByType,
    exportSelectionData
  }
  
  // Add helpful console message
  console.log('🔧 WarehouseCAD Selection Utils loaded! Try:')
  console.log('   warehouseCADUtils.logCurrentSelection()')
  console.log('   warehouseCADUtils.getSelectedObjectDescription()')
  console.log('   warehouseCADUtils.getSelectionSummary()')
  console.log('   warehouseCADUtils.exportSelectionData()')
}
