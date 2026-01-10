'use client'

import { Suspense, useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { X, Square, Eye, EyeOff, User, Layers } from 'lucide-react'
import ClientOnly from '@/components/ClientOnly'
import ModelToolbar from '@/components/ModelToolbar'
import PhotoshopMeasurementTools from '@/components/PhotoshopMeasurementTools'
import SimplePlumbingToolbar from '@/components/SimplePlumbingToolbar'
import GeometryCalculatorPanel from '@/components/GeometryCalculatorPanel'
import MeasurementStatusBar from '@/components/MeasurementStatusBar'
import { SelectionInfoSystem } from '@/components/SelectionInfoSystem'
import { useAppStore } from '@/lib/store'
import { useStableMobile } from '@/lib/useMobile'
import MobileLayerControls from '@/components/MobileLayerControls'
import WebGLErrorBoundary, { checkWebGLSupport } from '@/components/WebGLErrorBoundary'

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
  const [webglSupported, setWebglSupported] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const isMobile = useStableMobile()

  // Check WebGL support on mount
  useEffect(() => {
    const result = checkWebGLSupport()
    console.log('🎮 WebGL check:', result)
    setWebglSupported(result.supported)
  }, [])

  console.log('🏠 Home render - isMobile:', isMobile)

  const {
    selectedElements,
    clearSelection,
    showMeasurements,
    toggleMeasurements,
    firstPersonMode,
    toggleFirstPersonMode,
    hiddenLayers,
    layerGroups,
    toggleLayerVisibility,
    isLayerVisible
  } = useAppStore()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__appStore = useAppStore
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowLayersDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Single component tree - use CSS to hide/show based on mobile
  return (
    <div className={`h-full w-full flex flex-col bg-gray-700 ${isMobile ? 'mobile-mode' : ''}`}>
      {/* Desktop Header - Hidden on mobile via CSS */}
      <header className={`flex-shrink-0 bg-[#2d2d2d] border-b border-[#3e3e3e] h-8 px-3 ${isMobile ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
            <span className="text-[#cccccc] text-xs font-medium">WarehouseCAD</span>
          </div>

          <div className="flex items-center gap-1">
            {selectedElements.length > 0 && (
              <div className="flex items-center gap-1 text-[10px] text-[#cccccc] bg-[#3c3c3c] px-2 py-0.5 rounded">
                <Square size={8} />
                {selectedElements.length}
              </div>
            )}

            <button
              onClick={toggleMeasurements}
              className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                showMeasurements ? 'text-[#cccccc] hover:bg-[#3c3c3c]' : 'text-[#858585] hover:bg-[#3c3c3c]'
              }`}
              title={showMeasurements ? "Hide All Measurements" : "Show All Measurements"}
            >
              {showMeasurements ? <Eye size={12} /> : <EyeOff size={12} />}
            </button>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowLayersDropdown(!showLayersDropdown)}
                className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                  showLayersDropdown ? 'bg-[#0e639c] text-white' : 'text-[#cccccc] hover:bg-[#3c3c3c]'
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

                  {/* Layer items */}
                  {[
                    { id: 'roof-panels', name: 'Metal Roof Panels', color: '#708090', count: '8 panels' },
                    { id: 'steel-ibeams', name: 'Steel I-Beams', color: '#0e639c' },
                    { id: 'room-walls', name: 'Room Walls', color: '#0e639c' },
                    { id: 'category-exterior', name: 'Exterior Walls', color: '#0e639c' },
                    { id: 'category-interior', name: 'Interior Walls', color: '#0e639c' },
                    { id: 'category-structural', name: 'Structural', color: '#0e639c' },
                    { id: 'tji-beams', name: 'TJI Beams', color: '#D2B48C' },
                    { id: 'type-wall', name: 'All Walls', color: '#0e639c' },
                    { id: 'type-fixture', name: 'Fixtures', color: '#0e639c' },
                  ].map(layer => {
                    const items = layerGroups[layer.id]
                    if (!items?.length && layer.id !== 'roof-panels') return null
                    return (
                      <div
                        key={layer.id}
                        className="px-3 py-1.5 hover:bg-[#3c3c3c] flex items-center justify-between cursor-pointer"
                        onClick={() => toggleLayerVisibility(layer.id)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded border ${
                            isLayerVisible(layer.id) ? `bg-[${layer.color}] border-[${layer.color}]` : 'border-[#666]'
                          }`} style={{ backgroundColor: isLayerVisible(layer.id) ? layer.color : 'transparent', borderColor: isLayerVisible(layer.id) ? layer.color : '#666' }}>
                            {isLayerVisible(layer.id) && (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="w-1.5 h-1.5 bg-white rounded-sm"></div>
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-[#cccccc]">{layer.name}</span>
                        </div>
                        <span className="text-[10px] text-[#888]">
                          {layer.count || (items?.length ? `(${items.length})` : '')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <button
              onClick={toggleFirstPersonMode}
              className={`flex items-center justify-center w-6 h-6 rounded transition-colors ${
                firstPersonMode ? 'bg-[#0e639c] text-white' : 'text-[#cccccc] hover:bg-[#3c3c3c]'
              }`}
              title={firstPersonMode ? "Exit First Person Mode" : "Enter First Person Mode"}
            >
              <User size={12} />
            </button>

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

          <div className="flex items-center">
            {firstPersonMode && <div className="text-[10px] text-[#cccccc]">First Person</div>}
            {!firstPersonMode && selectedElements.length === 0 && <div className="text-[10px] text-[#858585]">Ready</div>}
          </div>
        </div>
      </header>

      {/* Desktop Model Toolbar - Hidden on mobile */}
      <div className={isMobile ? 'hidden' : ''}>
        <ModelToolbar />
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex flex-1 min-h-0">
          {/* Desktop Sidebars - Hidden on mobile */}
          <div className={isMobile ? 'hidden' : 'contents'}>
            <PhotoshopMeasurementTools className="flex-shrink-0" />
            <SimplePlumbingToolbar />
            <ClientOnly fallback={null}>
              <GeometryCalculatorPanel className="flex-shrink-0" />
            </ClientOnly>
          </div>

          {/* 3D Viewport - Always rendered, full screen on mobile */}
          <div className={`flex-1 min-h-0 relative ${isMobile ? 'fixed inset-0 z-10' : ''}`}>
            {!webglSupported ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-4">
                <div className="text-xl mb-4">⚠️ WebGL Not Supported</div>
                <div className="text-sm text-gray-400 text-center">
                  Your browser does not support WebGL, which is required for the 3D view.
                </div>
              </div>
            ) : (
              <ClientOnly
                fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <div className="text-white text-xl">Initializing 3D Renderer...</div>
                  </div>
                }
              >
                <WebGLErrorBoundary>
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center bg-gray-700">
                      <div className="text-white">Loading 3D scene...</div>
                    </div>
                  }>
                    <ThreeRenderer />
                  </Suspense>
                </WebGLErrorBoundary>
              </ClientOnly>
            )}
          </div>
        </div>

        {/* Desktop Bottom Status Bar - Hidden on mobile */}
        <div className={isMobile ? 'hidden' : ''}>
          <ClientOnly fallback={null}>
            <MeasurementStatusBar />
          </ClientOnly>
        </div>
      </div>

      {/* Desktop Selection Info */}
      <div className={isMobile ? 'hidden' : ''}>
        <ClientOnly fallback={null}>
          <SelectionInfoSystem />
        </ClientOnly>
      </div>

      {/* Mobile Layer Controls - Only shown on mobile */}
      {isMobile && (
        <ClientOnly fallback={null}>
          <MobileLayerControls />
        </ClientOnly>
      )}
    </div>
  )
}
