'use client'

import React, { useRef, useState, useMemo, useEffect } from 'react'
import { 
  Wrench,
  Plus, 
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Layers,
  DollarSign,
  Ruler,
  Zap,
  Droplets,
  Wind,
  Flame,
  Target,
  RotateCw,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'

/**
 * PLUMBING SYSTEM UI - VSCode Style Toolbar
 * 
 * VSCode-style vertical toolbar for plumbing system tools.
 * Matches the existing PhotoshopMeasurementTools design pattern.
 */

export const PlumbingSystemUI: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<'view' | 'create' | 'edit' | 'delete'>('view')
  const [currentMaterial, setCurrentMaterial] = useState<'pex' | 'copper' | 'pvc' | 'cpvc' | 'steel' | 'cast_iron'>('pex')
  const [currentDiameter, setCurrentDiameter] = useState<number>(0.5)
  const [currentSystemType, setCurrentSystemType] = useState<'hot_water' | 'cold_water' | 'waste' | 'vent' | 'gas' | 'compressed_air'>('cold_water')
  const [showSettings, setShowSettings] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [systemCount, setSystemCount] = useState<number>(0)
  const [totalCost, setTotalCost] = useState<number>(0)
  const [isCreating, setIsCreating] = useState(false)

  const routingToolRef = useRef<any>(null)
  const pathEditorRef = useRef<any>(null)

  // Tool definitions - VSCode style
  const plumbingTools = useMemo(() => [
    {
      mode: 'view' as const,
      icon: Eye,
      label: 'View Mode',
      color: '#cccccc',
      shortcut: 'V'
    },
    {
      mode: 'create' as const,
      icon: Plus,
      label: 'Create Pipes',
      color: '#4CAF50',
      shortcut: 'C'
    },
    {
      mode: 'edit' as const,
      icon: Edit3,
      label: 'Edit Pipes',
      color: '#FF9800',
      shortcut: 'E'
    }
  ], [])

  const materialTools = useMemo(() => [
    {
      material: 'pex' as const,
      icon: Droplets,
      label: 'PEX Tubing',
      color: currentSystemType === 'hot_water' ? '#DC143C' : '#0047AB'
    },
    {
      material: 'copper' as const,
      icon: Zap,
      label: 'Copper Pipe',
      color: '#B87333'
    },
    {
      material: 'pvc' as const,
      icon: Wind,
      label: 'PVC Pipe',
      color: currentSystemType === 'waste' ? '#F5F5F5' : '#FFFFFF'
    }
  ], [currentSystemType])

  const systemTypeTools = useMemo(() => [
    {
      type: 'hot_water' as const,
      icon: Flame,
      label: 'Hot Water',
      color: '#DC143C'
    },
    {
      type: 'cold_water' as const,
      icon: Droplets,
      label: 'Cold Water', 
      color: '#0047AB'
    },
    {
      type: 'waste' as const,
      icon: Wind,
      label: 'Waste/Drain',
      color: '#666666'
    }
  ], [])

  // Handle mode changes
  const handleModeChange = (mode: 'view' | 'create' | 'edit' | 'delete') => {
    setCurrentMode(mode)
    setIsCreating(mode === 'create')
    
    if (typeof window === 'undefined') return // SSR guard
    
    // Dispatch event to 3D components
    const event = new CustomEvent('plumbingModeChange', {
      detail: { 
        mode,
        material: currentMaterial,
        diameter: currentDiameter,
        systemType: currentSystemType
      }
    })
    window.dispatchEvent(event)
    
    console.log('🔧 Plumbing mode changed to:', mode)
  }

  // Handle material changes
  const handleMaterialChange = (material: typeof currentMaterial) => {
    setCurrentMaterial(material)
    
    if (typeof window === 'undefined') return // SSR guard
    
    // Dispatch event to 3D components
    const event = new CustomEvent('plumbingMaterialChange', {
      detail: { material, diameter: currentDiameter, systemType: currentSystemType }
    })
    window.dispatchEvent(event)
    
    console.log('🔧 Material changed to:', material)
  }

  // Handle system type changes
  const handleSystemTypeChange = (systemType: typeof currentSystemType) => {
    setCurrentSystemType(systemType)
    
    if (typeof window === 'undefined') return // SSR guard
    
    // Dispatch event to 3D components
    const event = new CustomEvent('plumbingSystemTypeChange', {
      detail: { systemType, material: currentMaterial, diameter: currentDiameter }
    })
    window.dispatchEvent(event)
    
    console.log('🔧 System type changed to:', systemType)
  }

  // Handle diameter changes
  const handleDiameterChange = (diameter: number) => {
    setCurrentDiameter(diameter)
    
    if (typeof window === 'undefined') return // SSR guard
    
    // Dispatch event to 3D components
    const event = new CustomEvent('plumbingDiameterChange', {
      detail: { diameter, material: currentMaterial, systemType: currentSystemType }
    })
    window.dispatchEvent(event)
    
    console.log('🔧 Diameter changed to:', diameter)
  }

  // Create example PEX system
  const createExamplePEXSystem = () => {
    if (typeof window === 'undefined') return // SSR guard
    
    // This will be handled by the PlumbingSystemIntegration component
    // We'll dispatch a custom event that it can listen to
    const event = new CustomEvent('createExamplePEXSystem', {
      detail: {
        config: {
          id: `pex_cold_water_${Date.now()}`,
          name: 'PEX Cold Water Distribution',
          systemType: 'cold_water',
          material: 'pex',
          diameter: 0.5,
          path: [
            { x: 37.5, y: 222, z: 9.0 }, // Start at north wall
            { x: 37.5, y: 210, z: 9.0 }, // Veg branch point
            { x: 76.4, y: 210, z: 9.0 }  // Terminate at Veg center
          ],
          pressure: 160,
          insulated: false,
          supportSpacing: 32
        }
      }
    })
    window.dispatchEvent(event)
  }

  // Log systems (for debugging)
  const logSystems = () => {
    if (typeof window === 'undefined') return // SSR guard
    
    const event = new CustomEvent('logPlumbingSystems')
    window.dispatchEvent(event)
  }

  return (
    <div className="bg-[#2d2d2d] border-r border-[#3e3e3e] w-8 h-full">
      {/* VSCode-Style Vertical Plumbing Toolbar */}
      <div className="flex flex-col h-full">
        
        {/* Mode Tools */}
        {plumbingTools.map((tool) => {
          const Icon = tool.icon
          const isActive = currentMode === tool.mode
          
          return (
            <button
              key={tool.mode}
              onClick={() => handleModeChange(tool.mode)}
              className={`
                relative w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors group
                ${isActive
                  ? 'bg-[#3c3c3c] text-white'
                  : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]'
                }
              `}
              title={`${tool.label} (${tool.shortcut})`}
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
                {tool.label} ({tool.shortcut})
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
              onClick={() => handleMaterialChange(tool.material)}
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
        
        {/* System Type Tools */}
        {systemTypeTools.map((tool) => {
          const Icon = tool.icon
          const isActive = currentSystemType === tool.type
          
          return (
            <button
              key={tool.type}
              onClick={() => handleSystemTypeChange(tool.type)}
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
        
        {/* Diameter Selector */}
        <button
          onClick={() => {
            const diameters = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 4.0, 6.0]
            const currentIndex = diameters.indexOf(currentDiameter)
            const nextIndex = (currentIndex + 1) % diameters.length
            handleDiameterChange(diameters[nextIndex])
          }}
          className="w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc] group"
          title={`Diameter: ${currentDiameter}"`}
        >
          <Ruler size={12} />
          
          {/* Tooltip with current diameter */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Diameter: {currentDiameter}"
          </div>
        </button>
        
        {/* Action Buttons */}
        <button
          onClick={createExamplePEXSystem}
          className="w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc] group"
          title="Add Example PEX System"
        >
          <Target size={12} />
          
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Add Example PEX
          </div>
        </button>
        
        {/* Stats Toggle */}
        <button
          onClick={() => setShowStats(!showStats)}
          className={`w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors group ${
            showStats 
              ? 'bg-[#3c3c3c] text-white' 
              : 'hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]'
          }`}
          title="System Statistics"
        >
          <DollarSign size={12} />
          
          {showStats && <div className="absolute right-0.5 top-0.5 w-1 h-1 bg-white rounded-full" />}
          
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Statistics
          </div>
        </button>
        
        {/* Settings */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-full h-8 flex items-center justify-center transition-colors group ${
            showSettings ? 'bg-[#3c3c3c] text-white' : 'hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]'
          }`}
          title="Plumbing Settings"
        >
          <Settings size={12} />
          
          <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            Settings
          </div>
        </button>
      </div>
      
      {/* Status Panel - Shows when creating */}
      {isCreating && (
        <div className="absolute left-full ml-1 bg-[#2d2d2d] border border-[#3e3e3e] px-2 py-1 min-w-36">
          <div className="text-[#cccccc] text-[10px] font-medium mb-1">
            CREATE MODE
          </div>
          <div className="text-[#858585] text-[8px] mb-2 leading-tight">
            {currentMaterial.toUpperCase()} {currentDiameter}" {currentSystemType.replace('_', ' ').toUpperCase()}
          </div>
          <div className="text-[#858585] text-[8px] leading-tight">
            Click points to route
          </div>
        </div>
      )}
      
      {/* Stats Panel */}
      {showStats && (
        <div className="absolute left-full ml-1 bg-[#2d2d2d] border border-[#3e3e3e] px-2 py-1 min-w-32">
          <div className="text-[#cccccc] text-[10px] font-medium mb-1">
            STATISTICS
          </div>
          <div className="text-[#858585] text-[8px] leading-tight">
            <div>Systems: {systemCount}</div>
            <div>Cost: ${totalCost.toFixed(0)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PlumbingSystemUI
