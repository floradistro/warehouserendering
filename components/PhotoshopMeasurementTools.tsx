import React, { useState, useMemo, useEffect } from 'react'
import { useMeasurementStore } from '../lib/measurement/MeasurementStore'
import { MeasurementType, Unit, DEFAULT_STYLES } from '../lib/measurement/MeasurementTypes'
import { 
  Ruler, 
  RotateCw, 
  Square, 
  Box, 
  Circle,
  Triangle,
  Route,
  Gauge,
  Settings,
  Eye,
  EyeOff,
  Undo2,
  Redo2,
  Trash2,
  Target,
  X
} from 'lucide-react'

interface PhotoshopMeasurementToolsProps {
  className?: string
}

/**
 * Photoshop-style vertical measurement toolbar
 * Tall and skinny design like Adobe toolbars
 */
export const PhotoshopMeasurementTools: React.FC<PhotoshopMeasurementToolsProps> = ({
  className = ''
}) => {
  const [showSettings, setShowSettings] = useState(false)
  
  const {
    activeTool,
    setActiveTool,
    currentPoints,
    clearPoints,
    finalizeMeasurement,
    cancelMeasurement,
    snapEnabled,
    toggleSnap,
    showAllMeasurements,
    toggleAllMeasurements,
    canUndo,
    canRedo,
    undo,
    redo,
    getAllMeasurements,
    deleteSelected,
    selectAll
  } = useMeasurementStore()
  
  // Tool definitions
  const measurementTools = useMemo(() => [
    {
      type: 'linear' as MeasurementType,
      icon: Ruler,
      label: 'Linear',
      color: DEFAULT_STYLES.linear.color,
      shortcut: 'L'
    },
    {
      type: 'angular' as MeasurementType,
      icon: RotateCw,
      label: 'Angular',
      color: DEFAULT_STYLES.angular.color,
      shortcut: 'A'
    },
    {
      type: 'area' as MeasurementType,
      icon: Square,
      label: 'Area',
      color: DEFAULT_STYLES.area.color,
      shortcut: 'R'
    },
    {
      type: 'volume' as MeasurementType,
      icon: Box,
      label: 'Volume',
      color: DEFAULT_STYLES.volume.color,
      shortcut: 'V'
    },
    {
      type: 'radius' as MeasurementType,
      icon: Circle,
      label: 'Radius',
      color: DEFAULT_STYLES.radius.color,
      shortcut: 'C'
    },
    {
      type: 'diameter' as MeasurementType,
      icon: Triangle,
      label: 'Diameter',
      color: DEFAULT_STYLES.diameter.color,
      shortcut: 'D'
    },
    {
      type: 'path' as MeasurementType,
      icon: Route,
      label: 'Path',
      color: DEFAULT_STYLES.path.color,
      shortcut: 'P'
    },
    {
      type: 'clearance' as MeasurementType,
      icon: Gauge,
      label: 'Clearance',
      color: DEFAULT_STYLES.clearance.color,
      shortcut: 'E'
    }
  ], [])
  
  const measurements = getAllMeasurements()
  const hasActiveMeasurement = currentPoints.length > 0
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC key to cancel current measurement
      if (event.key === 'Escape' && hasActiveMeasurement) {
        event.preventDefault()
        cancelMeasurement()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasActiveMeasurement, cancelMeasurement])
  
  // Handle tool selection
  const handleToolSelect = (toolType: MeasurementType) => {
    if (activeTool === toolType) {
      setActiveTool(null)
      clearPoints()
    } else {
      setActiveTool(toolType)
      clearPoints()
    }
  }
  
  return (
    <div className={`bg-[#2d2d2d] border-r border-[#3e3e3e] w-8 h-full ${className}`}>
      {/* Monochrome Vertical Toolbar - Continuation of Header */}
      <div className="flex flex-col h-full">
        {/* Tools - Vertical Stack */}
        {measurementTools.map((tool) => {
          const Icon = tool.icon
          const isActive = activeTool === tool.type
          
          return (
            <button
              key={tool.type}
              onClick={() => handleToolSelect(tool.type)}
              className={`
                relative w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors group
                ${isActive
                  ? 'bg-[#3c3c3c] text-white'
                  : 'bg-[#2d2d2d] text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]'
                }
              `}
              title={`${tool.label} Tool (${tool.shortcut})`}
            >
              <Icon 
                size={12} 
                className={isActive ? 'text-white' : 'text-[#858585]'}
              />
              
              {/* Minimal active indicator */}
              {isActive && (
                <div className="absolute right-0 top-1 w-1 h-1 bg-white rounded-full" />
              )}
              
              {/* Tooltip on hover */}
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#2d2d2d] border border-[#3e3e3e] rounded text-[10px] text-[#cccccc] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.label} ({tool.shortcut})
              </div>
            </button>
          )
        })}
        
        {/* Divider */}
        <div className="h-px bg-[#3e3e3e]" />
        
        {/* Cancel/Clear Current Measurement */}
        {hasActiveMeasurement && (
          <button
            onClick={() => {
              cancelMeasurement()
            }}
            className="w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300"
            title="Cancel Current Measurement (ESC)"
          >
            <X size={12} />
          </button>
        )}
        
        {/* Monochrome Action Buttons */}
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors ${
            canUndo() 
              ? 'hover:bg-[#3c3c3c] text-[#cccccc]' 
              : 'text-[#555] cursor-not-allowed'
          }`}
          title="Undo"
        >
          <Undo2 size={12} />
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors ${
            canRedo() 
              ? 'hover:bg-[#3c3c3c] text-[#cccccc]' 
              : 'text-[#555] cursor-not-allowed'
          }`}
          title="Redo"
        >
          <Redo2 size={12} />
        </button>
        
        <button
          onClick={toggleSnap}
          className={`w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors ${
            snapEnabled 
              ? 'bg-[#3c3c3c] text-white' 
              : 'hover:bg-[#3c3c3c] text-[#858585]'
          }`}
          title={`Snap ${snapEnabled ? 'ON' : 'OFF'}`}
        >
          <Target size={12} />
          {/* Minimal indicator */}
          {snapEnabled && <div className="absolute right-0.5 top-0.5 w-1 h-1 bg-white rounded-full" />}
        </button>
        
        <button
          onClick={toggleAllMeasurements}
          className={`w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors ${
            showAllMeasurements 
              ? 'hover:bg-[#3c3c3c] text-[#cccccc]' 
              : 'bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]'
          }`}
          title={showAllMeasurements ? 'Hide measurements' : 'Show measurements'}
        >
          {showAllMeasurements ? <Eye size={12} /> : <EyeOff size={12} />}
        </button>
        
        {measurements.length > 0 && (
          <button
            onClick={() => {
              if (confirm(`Clear all ${measurements.length} measurements?`)) {
                const allIds = selectAll()
                deleteSelected(allIds)
              }
            }}
            className="w-full h-8 flex items-center justify-center border-b border-[#3e3e3e] transition-colors hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]"
            title="Clear all measurements"
          >
            <Trash2 size={12} />
          </button>
        )}
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`w-full h-8 flex items-center justify-center transition-colors ${
            showSettings ? 'bg-[#3c3c3c] text-white' : 'hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]'
          }`}
          title="Settings"
        >
          <Settings size={12} />
        </button>
      </div>
      
      {/* Monochrome Active Measurement Status */}
      {hasActiveMeasurement && (
        <div className="absolute left-full ml-1 bg-[#2d2d2d] border border-[#3e3e3e] px-2 py-1 min-w-36">
          <div className="text-[#cccccc] text-[10px] font-medium mb-1">
            {activeTool?.toUpperCase()}
          </div>
          <div className="text-[#858585] text-[8px] mb-2 leading-tight">
            {currentPoints.length}pt{currentPoints.length !== 1 ? 's' : ''}
            {currentPoints.length === 1 && " - click 2nd"}
            {currentPoints.length >= 2 && " - ready"}
          </div>
          <div className="flex gap-1">
            <button
              onClick={finalizeMeasurement}
              disabled={currentPoints.length < 2}
              className="flex-1 bg-[#3c3c3c] hover:bg-[#4c4c4c] disabled:bg-[#2a2a2a] disabled:text-[#555] px-1 py-0.5 text-[8px] text-[#cccccc] transition-colors"
            >
              Finish
            </button>
            <button
              onClick={cancelMeasurement}
              className="px-1 py-0.5 text-[8px] bg-[#2a2a2a] hover:bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PhotoshopMeasurementTools
