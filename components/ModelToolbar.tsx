'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  Save, 
  Upload, 
  Download, 
  Undo, 
  Redo, 
  Trash2, 
  Copy,
  Settings,
  AlertCircle,
  CheckCircle,
  FolderOpen,
  FileText,
  X,
  RotateCw,
  RotateCcw,
  Maximize2
} from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { modelManager } from '@/lib/model-manager'
import { ELEMENT_TEMPLATES, TEMPLATE_CATEGORIES, createElement } from '@/lib/element-tools'

interface ModelToolbarProps {
  className?: string
}

export default function ModelToolbar({ className = '' }: ModelToolbarProps) {
  const {
    currentFloorplan,
    selectedElements,
    undoRedoStatus,
    lastError,
    availableModels,
    isPlacing,
    placementTemplate,
    placementRotation,
    placementDimensions,
    activeSnapPoint,
    snapTolerance,
    clipboard,
    clipboardMode,
    isEditing,
    editingElement,
    addElement,
    undo,
    redo,
    removeElement,
    duplicateElement,
    createNewModel,
    switchModel,
    refreshModelList,
    clearError,
    loadCurrentModel,
    startPlacement,
    cancelPlacement,
    rotatePlacementElement,
    updatePlacementDimensions,
    setSnapTolerance,
    expandPlacementWall,
    isRotationLocked,
    copyElements,
    cutElements,
    pasteElements,
    clearClipboard,
    hasClipboard,
    updateElementEdit,
    finalizeElementEdit,
    cancelElementEdit
  } = useAppStore()

  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSaveMenu, setShowSaveMenu] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importData, setImportData] = useState('')

  // Save functions
  const handleSaveScreenshot = (format: 'png' | 'jpeg' = 'png', quality: number = 1.0) => {
    const warehouseCAD = (window as any).warehouseCAD
    if (warehouseCAD?.captureScreenshot) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `warehouse-render-${timestamp}`
      warehouseCAD.captureScreenshot(filename, format, quality)
      setShowSaveMenu(false)
    } else {
      console.error('Screenshot functionality not available')
    }
  }

  const handleSaveModel = () => {
    const warehouseCAD = (window as any).warehouseCAD
    if (warehouseCAD?.exportModelAsJSON) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `warehouse-model-${timestamp}`
      warehouseCAD.exportModelAsJSON(filename)
      setShowSaveMenu(false)
    } else {
      console.error('Model export functionality not available')
    }
  }

  const handleSaveHighRes = (width: number, height: number) => {
    const warehouseCAD = (window as any).warehouseCAD
    if (warehouseCAD?.captureScreenshot) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const filename = `warehouse-render-${width}x${height}-${timestamp}`
      warehouseCAD.captureScreenshot(filename, 'png', 1.0, width, height)
      setShowSaveMenu(false)
    }
  }

  // Handle element creation - now starts placement mode
  const handleCreateElement = (templateId: string) => {
    // Verify template exists
    if (!ELEMENT_TEMPLATES[templateId]) {
      console.error('Template not found:', templateId)
      return
    }
    
    startPlacement(templateId)
    setShowCreateMenu(false)
  }

  // Handle model export
  const handleExport = () => {
    if (!currentFloorplan) return
    
    const result = modelManager.exportModel(currentFloorplan.id)
    if (result.success && result.data) {
      // Create downloadable file
      const blob = new Blob([result.data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentFloorplan.name.replace(/\s+/g, '_')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setShowExportDialog(false)
    }
  }

  // Handle model import
  const handleImport = () => {
    if (!importData.trim()) return
    
    const result = modelManager.importModel(importData)
    if (result.success && result.data) {
      switchModel(result.data.id)
      refreshModelList()
      setShowImportDialog(false)
      setImportData('')
    }
  }

  // Handle file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setImportData(content)
    }
    reader.readAsText(file)
  }

  React.useEffect(() => {
    refreshModelList()
  }, [refreshModelList])

  return (
    <div className={`bg-[#2d2d2d] border-b border-[#3e3e3e] px-3 py-2 ${className}`}>
      <div className="flex items-center justify-between">
        {/* Left: Creation Tools */}
        <div className="flex items-center gap-2">
          {/* Placement/Editing Status */}
          {(isPlacing || isEditing) ? (
            <div className="flex items-center gap-2">
              <div className={`text-xs px-2 py-1 rounded ${
                isEditing 
                  ? 'text-[#fbbf24] bg-[#f59e0b]/20' 
                  : 'text-[#4ade80] bg-[#22c55e]/20'
              }`}>
                {isEditing 
                  ? `Editing: ${editingElement?.type} (${editingElement?.id?.slice(0, 8)}...)`
                  : `Placing: ${ELEMENT_TEMPLATES[placementTemplate!]?.name}`
                }
              </div>
              
              {/* Rotation Controls */}
              <div className={`flex items-center gap-1 rounded px-1 ${isRotationLocked ? 'bg-[#4c4c4c] border border-blue-400' : 'bg-[#3c3c3c]/50'}`}>
                <button
                  onClick={() => {
                    rotatePlacementElement('counterclockwise')
                  }}
                  className="p-1 hover:bg-[#4c4c4c] rounded transition-colors"
                  title="Rotate Left (Shift+R)"
                >
                  <RotateCcw size={10} />
                </button>
                <span className={`text-xs px-1 ${isRotationLocked ? 'text-blue-300' : 'text-[#888]'}`}>
                  {Math.round((placementRotation * 180) / Math.PI)}°{isRotationLocked ? ' 🔒' : ''}
                </span>
                <button
                  onClick={() => {
                    rotatePlacementElement('clockwise')
                  }}
                  className="p-1 hover:bg-[#4c4c4c] rounded transition-colors"
                  title="Rotate Right (R)"
                >
                  <RotateCw size={10} />
                </button>
              </div>

              {/* Wall Expansion Control - Only show for walls */}
              {placementTemplate && ['EXTERIOR_WALL', 'INTERIOR_WALL', 'PARTITION_WALL'].includes(placementTemplate) && (
                <div className="flex items-center gap-1 bg-[#3c3c3c]/50 rounded px-1">
                  <button
                    onClick={() => {
                      expandPlacementWall()
                    }}
                    className="p-1 hover:bg-[#4c4c4c] rounded transition-colors"
                    title="Expand Wall Edge-to-Edge (E)"
                  >
                    <Maximize2 size={10} />
                  </button>
                  <span className="text-xs text-[#888] px-1">Expand</span>
                </div>
              )}

              {/* Dimension Controls */}
              <div className="flex items-center gap-1 bg-[#3c3c3c]/50 rounded px-2 py-1">
                <span className="text-xs text-[#888]">W:</span>
                <input
                  type="number"
                  value={placementDimensions.width}
                  onChange={(e) => {
                    const newWidth = Math.max(1, parseFloat(e.target.value) || 1)
                    if (isEditing) {
                      updateElementEdit({ dimensions: { ...editingElement!.dimensions, width: newWidth } })
                    } else {
                      updatePlacementDimensions({ width: newWidth })
                    }
                  }}
                  className="w-12 bg-transparent text-xs text-[#cccccc] border-none outline-none"
                  min="1"
                  step="1"
                />
                <span className="text-xs text-[#888]">H:</span>
                <input
                  type="number"
                  value={placementDimensions.height}
                  onChange={(e) => {
                    const newHeight = Math.max(1, parseFloat(e.target.value) || 1)
                    if (isEditing) {
                      updateElementEdit({ dimensions: { ...editingElement!.dimensions, height: newHeight } })
                    } else {
                      updatePlacementDimensions({ height: newHeight })
                    }
                  }}
                  className="w-12 bg-transparent text-xs text-[#cccccc] border-none outline-none"
                  min="1"
                  step="1"
                />
                {((placementTemplate && ELEMENT_TEMPLATES[placementTemplate]?.defaultDimensions.depth) || (isEditing && editingElement?.dimensions.depth)) && (
                  <>
                    <span className="text-xs text-[#888]">D:</span>
                    <input
                      type="number"
                      value={placementDimensions.depth}
                      onChange={(e) => {
                        const newDepth = Math.max(1, parseFloat(e.target.value) || 1)
                        if (isEditing) {
                          updateElementEdit({ dimensions: { ...editingElement!.dimensions, depth: newDepth } })
                        } else {
                          updatePlacementDimensions({ depth: newDepth })
                        }
                      }}
                      className="w-12 bg-transparent text-xs text-[#cccccc] border-none outline-none"
                      min="1"
                      step="1"
                    />
                  </>
                )}
              </div>

              {/* Color Control for Editing */}
              {isEditing && editingElement && (
                <div className="flex items-center gap-1 bg-[#3c3c3c]/50 rounded px-2 py-1">
                  <span className="text-xs text-[#888]">Color:</span>
                  <input
                    type="color"
                    value={editingElement.color}
                    onChange={(e) => {
                      updateElementEdit({ color: e.target.value })
                    }}
                    className="w-6 h-4 bg-transparent border-none cursor-pointer"
                    title="Change element color"
                  />
                </div>
              )}

              {/* Position Control for Editing - Shows CENTER position */}
              {isEditing && editingElement && (
                <div className="flex items-center gap-1 bg-[#3c3c3c]/50 rounded px-2 py-1">
                  <span className="text-xs text-[#888]">Center X:</span>
                  <input
                    type="number"
                    value={Math.round((editingElement.position.x + editingElement.dimensions.width / 2) * 10) / 10}
                    onChange={(e) => {
                      const centerX = parseFloat(e.target.value) || 0
                      const newX = centerX - editingElement.dimensions.width / 2
                      updateElementEdit({ position: { ...editingElement.position, x: newX } })
                    }}
                    className="w-12 bg-transparent text-xs text-[#cccccc] border-none outline-none"
                    step="0.1"
                  />
                  <span className="text-xs text-[#888]">Y:</span>
                  <input
                    type="number"
                    value={Math.round((editingElement.position.y + editingElement.dimensions.height / 2) * 10) / 10}
                    onChange={(e) => {
                      const centerY = parseFloat(e.target.value) || 0
                      const newY = centerY - editingElement.dimensions.height / 2
                      updateElementEdit({ position: { ...editingElement.position, y: newY } })
                    }}
                    className="w-12 bg-transparent text-xs text-[#cccccc] border-none outline-none"
                    step="0.1"
                  />
                  <span className="text-xs text-[#888]">Z:</span>
                  <input
                    type="number"
                    value={Math.round((editingElement.position.z || 0) * 10) / 10}
                    onChange={(e) => {
                      const newZ = parseFloat(e.target.value) || 0
                      updateElementEdit({ position: { ...editingElement.position, z: newZ } })
                    }}
                    className="w-12 bg-transparent text-xs text-[#cccccc] border-none outline-none"
                    step="0.1"
                  />
                </div>
              )}

              {/* Snap Status */}
              {activeSnapPoint && (
                <div className="text-xs text-[#fbbf24] bg-[#f59e0b]/20 px-2 py-1 rounded max-w-48">
                  {activeSnapPoint.description || `Snap: ${activeSnapPoint.type}`}
                </div>
              )}

              {/* Enhanced Snap Tolerance Control */}
              <div className="flex items-center gap-1 bg-[#3c3c3c]/50 rounded px-2 py-1">
                <span className="text-xs text-[#888]">Snap:</span>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={snapTolerance}
                  onChange={(e) => setSnapTolerance(parseFloat(e.target.value))}
                  className="w-16"
                />
                <span className="text-xs text-[#cccccc]">{snapTolerance.toFixed(1)}ft</span>
                <button
                  onClick={() => setSnapTolerance(1.0)}
                  className="text-xs text-[#888] hover:text-[#cccccc] px-1"
                  title="Reset to default (1.0ft)"
                >
                  ↻
                </button>
              </div>
              
              <button
                onClick={() => {
                  if (isEditing) {
                    cancelElementEdit()
                  } else {
                    cancelPlacement()
                  }
                }}
                className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                title={isEditing ? "Cancel Edit (ESC)" : "Cancel Placement (ESC)"}
              >
                <X size={12} />
                Cancel
              </button>
              
              {/* Confirm button for editing mode */}
              {isEditing && (
                <button
                  onClick={finalizeElementEdit}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#10b981] hover:bg-[#065f46] rounded transition-colors"
                  title="Confirm Edit (Enter)"
                >
                  <span>✓</span>
                  Confirm
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Create Element Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowCreateMenu(!showCreateMenu)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                  title="Add Element"
                >
                  <Plus size={12} />
                  Add
                </button>
            
            {showCreateMenu && (
              <div className="absolute top-full left-0 mt-1 bg-[#252526] border border-[#3e3e3e] rounded shadow-lg z-50 min-w-48">
                {Object.entries(TEMPLATE_CATEGORIES).map(([category, templateIds]) => (
                  <div key={category} className="p-2">
                    <div className="text-[10px] text-[#858585] uppercase tracking-wide mb-1">
                      {category.replace('_', ' ')}
                    </div>
                    {templateIds.map(templateId => {
                      const template = ELEMENT_TEMPLATES[templateId]
                      return (
                        <button
                          key={templateId}
                          onClick={() => handleCreateElement(templateId)}
                          className="w-full text-left px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                        >
                          {template.name}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

              {/* Element Actions */}
              {selectedElements.length > 0 && (
                <>
                  <button
                    onClick={() => copyElements()}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                    title="Copy Selected (Ctrl+C)"
                  >
                    <Copy size={12} />
                  </button>
                  
                  <button
                    onClick={() => cutElements()}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                    title="Cut Selected (Ctrl+X)"
                  >
                    <span className="text-xs">✂️</span>
                  </button>
                  
                  <button
                    onClick={() => selectedElements.forEach(id => duplicateElement(id))}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                    title="Duplicate Selected"
                  >
                    <span className="text-xs">📋</span>
                  </button>
                  
                  <button
                    onClick={() => selectedElements.forEach(id => removeElement(id))}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                    title="Delete Selected"
                  >
                    <Trash2 size={12} />
                  </button>
                  
                  <span className="text-xs text-[#888] px-1">
                    {selectedElements.length} selected
                  </span>
                </>
              )}

              {/* Clipboard Actions */}
              {hasClipboard() && (
                <>
                  <div className="w-px h-4 bg-[#3c3c3c] mx-1" />
                  
                  <button
                    onClick={() => {
                      // Paste at center of view with slight offset
                      const basePosition = { x: 50, y: 50, z: 0 }
                      pasteElements(basePosition)
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#10b981] hover:bg-[#065f46] rounded transition-colors"
                    title="Paste (Ctrl+V)"
                  >
                    <span className="text-xs">📌</span>
                  </button>
                  
                  <button
                    onClick={() => clearClipboard()}
                    className="flex items-center gap-1 px-1 py-1 text-xs text-[#888] hover:text-[#cccccc] rounded transition-colors"
                    title="Clear Clipboard"
                  >
                    <span className="text-xs">🗑️</span>
                  </button>
                  
                  <span className="text-xs text-[#888] px-1">
                    {clipboard.length} {clipboardMode === 'cut' ? 'cut' : 'copied'}
                  </span>
                </>
              )}
            </>
          )}
        </div>

        {/* Center: Model Info */}
        <div className="flex items-center gap-4">
          {currentFloorplan && currentFloorplan.elements ? (
            <div className="text-xs text-[#cccccc]">
              {currentFloorplan.name} • {currentFloorplan.elements.length} elements
            </div>
          ) : (
            <div className="text-xs text-[#858585]">
              No model loaded
            </div>
          )}
          
          {lastError && (
            <div className="flex items-center gap-1 text-xs text-red-400">
              <AlertCircle size={12} />
              <span>{lastError}</span>
              <button
                onClick={clearError}
                className="ml-1 hover:text-red-300"
                title="Dismiss Error"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Right: File Operations */}
        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <button
            onClick={undo}
            disabled={!undoRedoStatus.canUndo}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              undoRedoStatus.canUndo 
                ? 'text-[#cccccc] hover:bg-[#3c3c3c]' 
                : 'text-[#858585] cursor-not-allowed'
            }`}
            title={`Undo (${undoRedoStatus.undoCount} available)`}
          >
            <Undo size={12} />
          </button>
          
          <button
            onClick={redo}
            disabled={!undoRedoStatus.canRedo}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              undoRedoStatus.canRedo 
                ? 'text-[#cccccc] hover:bg-[#3c3c3c]' 
                : 'text-[#858585] cursor-not-allowed'
            }`}
            title={`Redo (${undoRedoStatus.redoCount} available)`}
          >
            <Redo size={12} />
          </button>

          <div className="w-px h-4 bg-[#3e3e3e]" />

          {/* Model Management */}
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(!showModelMenu)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
              title="Manage Models"
            >
              <FolderOpen size={12} />
              Models
            </button>
            
            {showModelMenu && (
              <div className="absolute top-full right-0 mt-1 bg-[#252526] border border-[#3e3e3e] rounded shadow-lg z-50 min-w-48 max-h-64 overflow-y-auto">
                <div className="p-2 border-b border-[#3e3e3e]">
                  <button
                    onClick={() => {
                      createNewModel('EMPTY')
                      setShowModelMenu(false)
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                  >
                    + New Empty Model
                  </button>
                  <button
                    onClick={() => {
                      createNewModel('BASIC')
                      setShowModelMenu(false)
                    }}
                    className="w-full text-left px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
                  >
                    + New Basic Model
                  </button>
                </div>
                
                <div className="p-2">
                  <div className="text-[10px] text-[#858585] uppercase tracking-wide mb-1">
                    Available Models
                  </div>
                  {availableModels.map(model => (
                    <button
                      key={model.id}
                      onClick={() => {
                        switchModel(model.id)
                        setShowModelMenu(false)
                      }}
                      className={`w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                        currentFloorplan?.id === model.id
                          ? 'bg-[#0e639c] text-white'
                          : 'text-[#cccccc] hover:bg-[#3c3c3c]'
                      }`}
                    >
                      {model.name}
                      <div className="text-[10px] text-[#858585]">
                        {new Date(model.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <button
            onClick={() => setShowExportDialog(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
            title="Export Model"
          >
            <Download size={12} />
          </button>

          {/* Import */}
          <button
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
            title="Import Model"
          >
            <Upload size={12} />
          </button>
        </div>
      </div>

      {/* Export Dialog */}
      {showExportDialog && currentFloorplan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#3e3e3e] rounded p-4 w-96">
            <h3 className="text-sm text-[#cccccc] mb-3">Export Model</h3>
            <p className="text-xs text-[#858585] mb-4">
              Export "{currentFloorplan.name}" as JSON file
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowExportDialog(false)}
                className="px-3 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1 text-xs bg-[#0e639c] text-white hover:bg-[#1177bb] rounded transition-colors"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#252526] border border-[#3e3e3e] rounded p-4 w-96">
            <h3 className="text-sm text-[#cccccc] mb-3">Import Model</h3>
            
            <div className="mb-3">
              <label className="block text-xs text-[#858585] mb-1">
                Upload JSON File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="w-full text-xs text-[#cccccc] bg-[#3c3c3c] border border-[#3e3e3e] rounded px-2 py-1"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-xs text-[#858585] mb-1">
                Or Paste JSON Data
              </label>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Paste JSON model data here..."
                className="w-full h-24 text-xs text-[#cccccc] bg-[#3c3c3c] border border-[#3e3e3e] rounded px-2 py-1 resize-none"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowImportDialog(false)
                  setImportData('')
                }}
                className="px-3 py-1 text-xs text-[#cccccc] hover:bg-[#3c3c3c] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className={`px-3 py-1 text-xs rounded transition-colors ${
                  importData.trim()
                    ? 'bg-[#0e639c] text-white hover:bg-[#1177bb]'
                    : 'bg-[#3c3c3c] text-[#858585] cursor-not-allowed'
                }`}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
