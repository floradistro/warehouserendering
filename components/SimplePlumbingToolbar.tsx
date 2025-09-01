'use client'

import React, { useState } from 'react'
import { 
  Eye,
  Plus, 
  Edit3,
  Droplets,
  Zap,
  Wind,
  Flame,
  Target
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

// Helper function for realistic pipe colors
function getRealisticPipeColor(material: string, systemType: string): string {
  const materialColors = {
    pex: systemType === 'hot_water' ? '#FF2222' : '#0055FF', // Bright red/blue
    copper: '#D2691E', // Rich copper color
    pvc: systemType === 'waste' ? '#DDDDDD' : '#F8F8FF', // Light gray/off-white
    cpvc: '#F5DEB3',
    steel: '#708090',
    cast_iron: '#2F4F4F'
  } as const
  return materialColors[material as keyof typeof materialColors] || materialColors.pex
}

/**
 * SIMPLE PLUMBING TOOLBAR
 * 
 * Simplified version to test functionality without complex event systems.
 * VSCode-style design matching PhotoshopMeasurementTools.
 */

export const SimplePlumbingToolbar: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'view' | 'create' | 'edit'>('view')
  const [currentMaterial, setCurrentMaterial] = useState<'pex' | 'copper' | 'pvc'>('pex')
  const { addElement, currentFloorplan } = useAppStore()

  const handleModeClick = (mode: 'view' | 'create' | 'edit') => {
    console.log('🔧 MODE BUTTON CLICKED:', mode)
    
    try {
      setCurrentMode(mode)
      console.log('🔧 Mode changed to:', mode)
      
      // Simple event dispatch with all required properties
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('plumbingModeChange', {
          detail: { 
            mode,
            material: currentMaterial,
            diameter: 0.5,
            systemType: currentMaterial === 'pvc' ? 'waste' : 'cold_water'
          }
        }))
        console.log('🔧 Event dispatched successfully')
      }
      
      // Alert to make it obvious
      alert(`Mode changed to: ${mode.toUpperCase()}`)
      
    } catch (error) {
      console.error('❌ Error in handleModeClick:', error)
      alert(`Error changing mode: ${error}`)
    }
  }

  const handleMaterialClick = (material: 'pex' | 'copper' | 'pvc') => {
    console.log('🔧 MATERIAL BUTTON CLICKED:', material)
    setCurrentMaterial(material)
    console.log('🔧 Material changed to:', material)
    
    // Alert to make it obvious
    alert(`Material changed to: ${material.toUpperCase()}`)
  }

  const handleExampleClick = () => {
    console.log('🚰 ============================================')
    console.log('🚰 TARGET BUTTON CLICKED!')
    console.log('🚰 ============================================')
    console.log('🚰 Current floorplan:', currentFloorplan ? 'EXISTS' : 'NULL')
    console.log('🚰 AddElement function:', typeof addElement)
    console.log('🚰 Current material:', currentMaterial)
    
    // Determine system type based on material
    let systemType: 'hot_water' | 'cold_water' | 'waste' = 'cold_water'
    if (currentMaterial === 'pvc') {
      systemType = 'waste' // PVC typically used for waste systems
    } else if (currentMaterial === 'copper') {
      systemType = 'hot_water' // Copper often used for hot water
    }
    
    // Create pipe system directly using existing store system
    const pipeElement = {
      id: `pipe_${Date.now()}`, // Add unique ID
      type: 'pipe_system' as const,
      position: { x: 0, y: 0, z: 8.0 }, // Center at reasonable height
      dimensions: { width: 40, height: 15, depth: 1.0 }, // Rough dimensions of the pipe run
      material: currentMaterial,
      color: getRealisticPipeColor(currentMaterial, systemType),
      pipeData: {
        systemType: systemType,
        diameter: 0.75, // 3/4" pipe for better visibility
        path: [
          { x: 0, y: 0, z: 8.0 },   // Start at origin
          { x: 20, y: 0, z: 8.0 },  // Go east 20 feet
          { x: 20, y: 15, z: 8.0 }, // Turn north 15 feet
          { x: 35, y: 15, z: 8.0 }  // End at east side
        ]
      },
      metadata: {
        pipeSystem: true,
        totalLength: 50.0,
        estimatedCost: 65.00,
        fittingsCount: 2,
        materialType: currentMaterial,
        systemType: systemType
      }
    }
    
    console.log('🚰 Pipe element to add:', pipeElement)
    
    try {
      addElement(pipeElement)
      console.log('✅ Successfully added pipe system element to store')
      
      // Dispatch event for PlumbingSystemIntegration
      window.dispatchEvent(new CustomEvent('createExamplePEXSystem', {
        detail: pipeElement
      }))
      
      // Also alert to make it super obvious
      alert(`${currentMaterial.toUpperCase()} pipe system added! Check the 3D scene.`)
      
    } catch (error) {
      console.error('❌ Failed to add pipe element:', error)
      alert('Error adding pipe system: ' + error)
    }
  }

  const modeTools = [
    { mode: 'view' as const, icon: Eye, label: 'View' },
    { mode: 'create' as const, icon: Plus, label: 'Create' },
    { mode: 'edit' as const, icon: Edit3, label: 'Edit' }
  ]

  const materialTools = [
    { material: 'pex' as const, icon: Droplets, label: 'PEX', color: '#0066CC' }, // Bright blue for visibility
    { material: 'copper' as const, icon: Zap, label: 'Copper', color: '#CD7F32' }, // True copper bronze
    { material: 'pvc' as const, icon: Wind, label: 'PVC', color: '#4682B4' } // Steel blue
  ]

  return (
    <div className="bg-[#2d2d2d] border-r border-[#3e3e3e] w-8 h-full flex-shrink-0">
      <div className="flex flex-col h-full">
        
        {/* Mode Tools */}
        {modeTools.map((tool) => {
          const Icon = tool.icon
          const isActive = currentMode === tool.mode
          
          return (
            <button
              key={tool.mode}
              onClick={() => handleModeClick(tool.mode)}
              className={`
                relative w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors group
                ${isActive
                  ? 'bg-[#3c3c3c] text-white'
                  : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]'
                }
              `}
              title={tool.label}
            >
              <Icon 
                size={12} 
                className={isActive ? 'text-white' : 'text-[#858585]'}
              />
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1 w-1 h-1 bg-white rounded-full" />
              )}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label}
              </div>
            </button>
          )
        })}
        
        {/* Divider */}
        <div className="h-px bg-[#3e3e3e]" />
        
        {/* Material Tools */}
        {materialTools.map((tool) => {
          const Icon = tool.icon
          const isActive = currentMaterial === tool.material
          
          return (
            <button
              key={tool.material}
              onClick={() => handleMaterialClick(tool.material)}
              className={`
                relative w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors group
                ${isActive
                  ? 'bg-[#3c3c3c] text-white'
                  : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]'
                }
              `}
              title={tool.label}
            >
              <Icon 
                size={12} 
                className={isActive ? 'text-white' : 'text-[#858585]'}
              />
              
              {/* Active indicator with material color */}
              {isActive && (
                <div 
                  className="absolute right-0 top-1 w-1 h-1 rounded-full" 
                  style={{ backgroundColor: tool.color }}
                />
              )}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label}
              </div>
            </button>
          )
        })}
        
        {/* Divider */}
        <div className="h-px bg-[#3e3e3e]" />
        
        {/* Example System Button */}
        <button
          onClick={handleExampleClick}
          className="w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc] group"
          title="Add Example PEX System"
        >
          <Target size={12} />
          
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Add Example PEX
          </div>
        </button>
        
      </div>
      
      {/* Status Panel */}
      {currentMode === 'create' && (
        <div className="absolute left-full ml-1 bg-[#2d2d2d] border border-[#3e3e3e] px-2 py-1 min-w-32">
          <div className="text-[#cccccc] text-[10px] font-medium mb-1">
            CREATE MODE
          </div>
          <div className="text-[#858585] text-[8px] leading-tight">
            {currentMaterial.toUpperCase()} 0.5" COLD WATER
          </div>
          <div className="text-[#858585] text-[8px] leading-tight">
            Click points to route
          </div>
        </div>
      )}
    </div>
  )
}

export default SimplePlumbingToolbar
