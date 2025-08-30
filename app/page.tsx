'use client'

import { Suspense, useState, useEffect, useRef, useCallback, memo } from 'react'
import dynamic from 'next/dynamic'
import { X, Move3D, Square, Eye, EyeOff, User, Layers, ChevronDown } from 'lucide-react'
import ClientOnly from '@/components/ClientOnly'
import ModelToolbar from '@/components/ModelToolbar'
import PhotoshopMeasurementTools from '@/components/PhotoshopMeasurementTools'
import GeometryCalculatorPanel from '@/components/GeometryCalculatorPanel'
import MeasurementStatusBar from '@/components/MeasurementStatusBar'
import { SelectionInfoSystem } from '@/components/SelectionInfoSystem'
import { useAppStore } from '@/lib/store'

// Import selection utilities to make them globally available
import '@/lib/selection-utils'

const ThreeRenderer = dynamic(() => import('@/components/ThreeRenderer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-700">
      <div className="text-white text-xl">Loading 3D Renderer...</div>
    </div>
  ),
})

export default function Home() {
  const [showLayersDropdown, setShowLayersDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const { 
    // Legacy measurement variables removed

    selectedElements,
    clearSelection,
    showMeasurements,
    toggleMeasurements,
    firstPersonMode,
    toggleFirstPersonMode,
    
    // Layer visibility
    hiddenLayers,
    layerGroups,
    toggleLayerVisibility,
    isLayerVisible
  } = useAppStore()
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLayersDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])
  
  return (
    <div className="h-full w-full flex flex-col bg-gray-700">
      {/* VSCode-style thin header */}
      <header className="flex-shrink-0 bg-[#2d2d2d] border-b border-[#3e3e3e] h-8 px-3">
        <div className="flex items-center justify-between h-full">
          {/* Left: App name */}
          <div className="flex items-center">
            <span className="text-[#cccccc] text-xs font-medium">WarehouseCAD</span>
          </div>
          
          {/* Center: Tools */}
          <div className="flex items-center gap-1">
            {/* Selection indicator */}
            {selectedElements.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-[#cccccc] bg-[#3c3c3c] px-2 py-0.5 rounded">
                <Square size={8} />
                {selectedElements.length}
              </div>
            )}
            
            {/* Legacy measurement tool removed - will be replaced by professional system */}
            
            {/* Toggle measurements visibility */}
            <button
              onClick={toggleMeasurements}
              className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                showMeasurements 
                  ? 'text-[#cccccc] hover:bg-[#3c3c3c]' 
                  : 'text-[#858585] hover:bg-[#3c3c3c]'
              }`}
              title={showMeasurements ? "Hide All Measurements" : "Show All Measurements"}
            >
              {showMeasurements ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>
            

            
            {/* Layers dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLayersDropdown(!showLayersDropdown)}
                className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                  showLayersDropdown 
                    ? 'bg-[#0e639c] text-white' 
                    : 'text-[#cccccc] hover:bg-[#3c3c3c]'
                }`}
                title="Layers"
              >
                <Layers size={12} />
              </button>
              
              {showLayersDropdown && (
                <div className="absolute top-8 left-0 bg-[#2d2d2d] border border-[#3e3e3e] rounded shadow-lg min-w-48 z-50">
                  <div className="px-3 py-2 border-b border-[#3e3e3e]">
                    <div className="text-[10px] text-[#cccccc] font-medium">LAYERS</div>
                  </div>
                  
                  {/* Roof Panels Layer */}
                  <div 
                    className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between cursor-pointer"
                    onClick={() => {
                      toggleLayerVisibility('roof-panels')
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded border ${
                        isLayerVisible('roof-panels') 
                          ? 'bg-[#708090] border-[#708090]' 
                          : 'border-[#666]'
                      }`}>
                        {isLayerVisible('roof-panels') && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-[#cccccc]">Metal Roof Panels</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLayerVisibility('roof-panels')
                      }}
                      className="text-[10px] text-[#888] hover:text-[#ccc]"
                    >
                      8 panels
                    </button>
                  </div>

                  {/* I-Beams Layer */}
                  {layerGroups['steel-ibeams'] && layerGroups['steel-ibeams'].length > 0 && (
                    <div 
                      className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        toggleLayerVisibility('steel-ibeams')
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('steel-ibeams') 
                            ? 'bg-[#0e639c] border-[#0e639c]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('steel-ibeams') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">Steel I-Beams</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLayerVisibility('steel-ibeams')
                        }}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['steel-ibeams'].length})
                      </button>
                    </div>
                  )}
                  
                  {/* Room Walls Layer */}
                  {layerGroups['room-walls'] && layerGroups['room-walls'].length > 0 && (
                    <div 
                      className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        console.log('🔍 Toggling room-walls layer via row click')
                        toggleLayerVisibility('room-walls')
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('room-walls') 
                            ? 'bg-[#0e639c] border-[#0e639c]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('room-walls') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">Room Walls</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          console.log('🔍 Toggling room-walls layer')
                          toggleLayerVisibility('room-walls')
                        }}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['room-walls'].length})
                      </button>
                    </div>
                  )}
                  
                  {/* Exterior Walls Layer */}
                  {layerGroups['category-exterior'] && layerGroups['category-exterior'].length > 0 && (
                    <div 
                      className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between cursor-pointer"
                      onClick={() => {
                        console.log('🔍 Toggling category-exterior layer')
                        toggleLayerVisibility('category-exterior')
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('category-exterior') 
                            ? 'bg-[#0e639c] border-[#0e639c]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('category-exterior') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">Exterior Walls</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleLayerVisibility('category-exterior')
                        }}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['category-exterior'].length})
                      </button>
                    </div>
                  )}
                  
                  {/* Interior Walls Layer */}
                  {layerGroups['category-interior'] && layerGroups['category-interior'].length > 0 && (
                    <div className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('category-interior') 
                            ? 'bg-[#0e639c] border-[#0e639c]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('category-interior') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">Interior Walls</span>
                      </div>
                      <button
                        onClick={() => toggleLayerVisibility('category-interior')}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['category-interior'].length})
                      </button>
                    </div>
                  )}
                  
                  {/* Structural Elements Layer */}
                  {layerGroups['category-structural'] && layerGroups['category-structural'].length > 0 && (
                    <div className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('category-structural') 
                            ? 'bg-[#0e639c] border-[#0e639c]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('category-structural') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">Structural</span>
                      </div>
                      <button
                        onClick={() => toggleLayerVisibility('category-structural')}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['category-structural'].length})
                      </button>
                    </div>
                  )}

                  {/* TJI Beams Layer */}
                  {layerGroups['tji-beams'] && layerGroups['tji-beams'].length > 0 && (
                    <div className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('tji-beams') 
                            ? 'bg-[#D2B48C] border-[#D2B48C]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('tji-beams') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">TJI Beams</span>
                      </div>
                      <button
                        onClick={() => toggleLayerVisibility('tji-beams')}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['tji-beams'].length})
                      </button>
                    </div>
                  )}
                  
                  {/* Walls Type Layer */}
                  {layerGroups['type-wall'] && layerGroups['type-wall'].length > 0 && (
                    <div className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('type-wall') 
                            ? 'bg-[#0e639c] border-[#0e639c]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('type-wall') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">All Walls</span>
                      </div>
                      <button
                        onClick={() => toggleLayerVisibility('type-wall')}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['type-wall'].length})
                      </button>
                    </div>
                  )}
                  
                  {/* Fixtures Type Layer */}
                  {layerGroups['type-fixture'] && layerGroups['type-fixture'].length > 0 && (
                    <div className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded border ${
                          isLayerVisible('type-fixture') 
                            ? 'bg-[#0e639c] border-[#0e639c]' 
                            : 'border-[#666]'
                        }`}>
                          {isLayerVisible('type-fixture') && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                        <span className="text-[11px] text-[#cccccc]">Fixtures</span>
                      </div>
                      <button
                        onClick={() => toggleLayerVisibility('type-fixture')}
                        className="text-[10px] text-[#888] hover:text-[#cccccc]"
                      >
                        ({layerGroups['type-fixture'].length})
                      </button>
                    </div>
                  )}
                  
                  {Object.keys(layerGroups).length === 0 && (
                    <div className="px-3 py-2 text-[10px] text-[#888]">
                      No layers available
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* First person mode toggle */}
            <button
              onClick={toggleFirstPersonMode}
              className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                firstPersonMode 
                  ? 'bg-[#0e639c] text-white' 
                  : 'text-[#cccccc] hover:bg-[#3c3c3c]'
              }`}
              title={firstPersonMode ? "Exit First Person Mode" : "Enter First Person Mode (WASD + Mouse)"}
            >
              <User size={12} />
            </button>
            
            {/* Clear selection */}
            {selectedElements.length > 0 && (
              <button
                onClick={clearSelection}
                className="flex items-center justify-center w-6 h-6 rounded text-[#cccccc] hover:bg-[#3c3c3c] transition-colors"
                title="Clear Selection"
              >
                <X size={12} />
              </button>
            )}
            

          </div>
          
          {/* Right: Status */}
          <div className="flex items-center">
            {firstPersonMode && (
              <div className="text-[10px] text-[#cccccc]">
                First Person • WASD + Mouse
              </div>
            )}
            {/* Legacy measurement status removed - will be replaced by professional system */}
            {!firstPersonMode && selectedElements.length === 0 && (
              <div className="text-[10px] text-[#858585]">
                Ready
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Model Management Toolbar */}
      <ModelToolbar />

            {/* Main Content Area with Bottom Status Bar */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Monochrome Measurement Toolbar - Continuation of Header */}
          <ClientOnly fallback={null}>
            <PhotoshopMeasurementTools className="flex-shrink-0" />
          </ClientOnly>
          
          {/* Geometry Calculator Panel */}
          <ClientOnly fallback={null}>
            <GeometryCalculatorPanel className="flex-shrink-0" />
          </ClientOnly>
          
          {/* 3D Viewport */}
          <div className="flex-1 min-h-0 relative">
            <ClientOnly
              fallback={
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <div className="text-white text-xl">Initializing 3D Renderer...</div>
                </div>
              }
            >
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center bg-gray-700">
                  <div className="text-white">Loading 3D scene...</div>
                </div>
              }>
                <ThreeRenderer />
              </Suspense>
            </ClientOnly>
          </div>
        </div>
        
        {/* Bottom Status Bar with Integrated Info Panel */}
        <ClientOnly fallback={null}>
          <MeasurementStatusBar />
        </ClientOnly>
      </div>
      
      {/* Selection Info System - Background Service */}
      <ClientOnly fallback={null}>
        <SelectionInfoSystem />
      </ClientOnly>
    </div>
  )
}
