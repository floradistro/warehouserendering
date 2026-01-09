'use client'

import React, { useState } from 'react'
import { Layers, X, Eye, EyeOff, ChevronUp, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/lib/store'

interface LayerConfig {
  id: string
  name: string
  icon?: string
  color: string
}

const LAYER_CONFIGS: LayerConfig[] = [
  { id: 'roof-panels', name: 'Roof', color: '#708090' },
  { id: 'steel-ibeams', name: 'Steel', color: '#3B82F6' },
  { id: 'room-walls', name: 'Rooms', color: '#10B981' },
  { id: 'category-exterior', name: 'Exterior', color: '#F59E0B' },
  { id: 'category-interior', name: 'Interior', color: '#8B5CF6' },
  { id: 'category-structural', name: 'Structure', color: '#EF4444' },
  { id: 'tji-beams', name: 'TJI', color: '#D2B48C' },
]

export default function MobileLayerControls() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    hiddenLayers,
    layerGroups,
    toggleLayerVisibility,
    isLayerVisible
  } = useAppStore()

  // Filter to only show layers that exist in the model
  const availableLayers = LAYER_CONFIGS.filter(
    layer => layerGroups[layer.id] && layerGroups[layer.id].length > 0
  )

  // Count visible/hidden layers
  const visibleCount = availableLayers.filter(l => isLayerVisible(l.id)).length
  const totalCount = availableLayers.length

  if (availableLayers.length === 0) return null

  return (
    <>
      {/* Floating Layer Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#2d2d2d] border border-[#3e3e3e] shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        style={{ touchAction: 'manipulation' }}
      >
        <Layers className="w-6 h-6 text-white" />
        {visibleCount < totalCount && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {visibleCount}
          </span>
        )}
      </button>

      {/* Layer Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-end justify-center"
          onClick={() => setIsOpen(false)}
        >
          {/* Modal Panel */}
          <div
            className="w-full max-w-lg bg-[#1e1e1e] rounded-t-2xl shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '80vh' }}
          >
            {/* Handle Bar */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-[#3e3e3e]">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-white" />
                <h2 className="text-lg font-semibold text-white">Layers</h2>
                <span className="text-sm text-gray-400">
                  {visibleCount}/{totalCount}
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-10 h-10 rounded-full bg-[#3c3c3c] flex items-center justify-center active:bg-[#4c4c4c]"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Quick Toggle All */}
            <div className="px-5 py-3 border-b border-[#3e3e3e]">
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    availableLayers.forEach(layer => {
                      if (!isLayerVisible(layer.id)) {
                        toggleLayerVisibility(layer.id)
                      }
                    })
                  }}
                  className="flex-1 py-2.5 px-4 bg-green-600/20 border border-green-600/50 rounded-xl text-green-400 font-medium active:bg-green-600/30 flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Show All
                </button>
                <button
                  onClick={() => {
                    availableLayers.forEach(layer => {
                      if (isLayerVisible(layer.id)) {
                        toggleLayerVisibility(layer.id)
                      }
                    })
                  }}
                  className="flex-1 py-2.5 px-4 bg-red-600/20 border border-red-600/50 rounded-xl text-red-400 font-medium active:bg-red-600/30 flex items-center justify-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  Hide All
                </button>
              </div>
            </div>

            {/* Layer List */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 180px)' }}>
              <div className="p-4 grid grid-cols-2 gap-3">
                {availableLayers.map((layer) => {
                  const isVisible = isLayerVisible(layer.id)
                  const count = layerGroups[layer.id]?.length || 0

                  return (
                    <button
                      key={layer.id}
                      onClick={() => toggleLayerVisibility(layer.id)}
                      className={`p-4 rounded-xl border-2 transition-all active:scale-95 ${
                        isVisible
                          ? 'bg-[#2d2d2d] border-[#4d4d4d]'
                          : 'bg-[#1a1a1a] border-[#2a2a2a] opacity-60'
                      }`}
                      style={{ touchAction: 'manipulation' }}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-4 h-4 rounded-full ${isVisible ? '' : 'opacity-40'}`}
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className={`font-medium ${isVisible ? 'text-white' : 'text-gray-500'}`}>
                          {layer.name}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {count} items
                        </span>
                        {isVisible ? (
                          <Eye className="w-4 h-4 text-green-400" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Safe Area Padding for iOS */}
            <div className="h-safe-area-inset-bottom pb-6" />
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
