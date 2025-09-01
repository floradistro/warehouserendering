'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { PlumbingSystemManager, PlumbingSystem } from '@/lib/plumbing/PlumbingSystem'
import { SmartPipeRenderer } from '@/lib/plumbing/SmartPipeRenderer'
import { PipeRoutingTool, PipeRoutingToolbar } from '@/lib/plumbing/PipeRoutingTool'
import { PipePathEditor, PipePathEditorToolbar } from '@/lib/plumbing/PipePathEditor'
import { PlumbingSnapPointGenerator, PlumbingSnapPoint } from '@/lib/plumbing/PlumbingSnapPoints'
import PlumbingSnapIndicators from './PlumbingSnapIndicators'
import { useAppStore } from '@/lib/store'

// Event Listeners Component for UI Communication
const EventListeners: React.FC<{
  onCreateExample: () => void
  onLogSystems: () => void
  onModeChange: (mode: string, config: any) => void
  onMaterialChange: (config: any) => void
  onSystemTypeChange: (config: any) => void
  onDiameterChange: (config: any) => void
}> = ({ 
  onCreateExample, 
  onLogSystems, 
  onModeChange, 
  onMaterialChange, 
  onSystemTypeChange, 
  onDiameterChange 
}) => {
  useEffect(() => {
    const handleCreateExample = (event: CustomEvent) => {
      onCreateExample()
    }

    const handleLogSystems = () => {
      onLogSystems()
    }

    const handleModeChange = (event: CustomEvent) => {
      const { mode, material, diameter, systemType } = event.detail
      onModeChange(mode, { material, diameter, systemType })
    }

    const handleMaterialChange = (event: CustomEvent) => {
      onMaterialChange(event.detail)
    }

    const handleSystemTypeChange = (event: CustomEvent) => {
      onSystemTypeChange(event.detail)
    }

    const handleDiameterChange = (event: CustomEvent) => {
      onDiameterChange(event.detail)
    }

    window.addEventListener('createExamplePEXSystem', handleCreateExample as EventListener)
    window.addEventListener('logPlumbingSystems', handleLogSystems)
    window.addEventListener('plumbingModeChange', handleModeChange as EventListener)
    window.addEventListener('plumbingMaterialChange', handleMaterialChange as EventListener)
    window.addEventListener('plumbingSystemTypeChange', handleSystemTypeChange as EventListener)
    window.addEventListener('plumbingDiameterChange', handleDiameterChange as EventListener)

    return () => {
      window.removeEventListener('createExamplePEXSystem', handleCreateExample as EventListener)
      window.removeEventListener('logPlumbingSystems', handleLogSystems)
      window.removeEventListener('plumbingModeChange', handleModeChange as EventListener)
      window.removeEventListener('plumbingMaterialChange', handleMaterialChange as EventListener)
      window.removeEventListener('plumbingSystemTypeChange', handleSystemTypeChange as EventListener)
      window.removeEventListener('plumbingDiameterChange', handleDiameterChange as EventListener)
    }
  }, [onCreateExample, onLogSystems, onModeChange, onMaterialChange, onSystemTypeChange, onDiameterChange])

  return null
}

/**
 * PLUMBING SYSTEM INTEGRATION
 * 
 * Main component that integrates all plumbing system components:
 * - PlumbingSystemManager for system management
 * - SmartPipeRenderer for visual rendering
 * - PipeRoutingTool for creating new pipe paths
 * - PipePathEditor for modifying existing paths
 * 
 * This replaces the individual PEX fixtures with intelligent path-based pipes
 * as specified in Phase 1 requirements.
 */

interface PlumbingSystemIntegrationProps {
  enabled?: boolean
  showToolbars?: boolean
  onSystemChange?: (systems: PlumbingSystem[]) => void
}

export const PlumbingSystemIntegration: React.FC<PlumbingSystemIntegrationProps> = ({
  enabled = true,
  showToolbars = true,
  onSystemChange
}) => {
  const { scene } = useThree()
  const [plumbingManager] = useState(() => new PlumbingSystemManager())
  const [renderers, setRenderers] = useState<Map<string, SmartPipeRenderer>>(new Map())
  const [currentMode, setCurrentMode] = useState<'view' | 'create' | 'edit' | 'delete'>('view')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [activeSnapPoint, setActiveSnapPoint] = useState<PlumbingSnapPoint | null>(null)
  const [plumbingSnapPoints, setPlumbingSnapPoints] = useState<PlumbingSnapPoint[]>([])
  
  const { currentFloorplan } = useAppStore()

  const routingToolRef = useRef<any>(null)
  const pathEditorRef = useRef<any>(null)
  const snapPointGeneratorRef = useRef<PlumbingSnapPointGenerator | null>(null)

  // Generate plumbing snap points when floorplan changes
  useEffect(() => {
    console.log('🔧 PlumbingSystemIntegration: currentFloorplan =', currentFloorplan ? 'EXISTS' : 'NULL')
    console.log('🔧 PlumbingSystemIntegration: elements =', currentFloorplan?.elements?.length || 0)
    
    if (currentFloorplan && currentFloorplan.elements) {
      // Debug the elements we have
      const walls = currentFloorplan.elements.filter(el => el.type === 'wall')
      const rooms = currentFloorplan.elements.filter(el => el.type === 'room')
      console.log('🔧 Found walls:', walls.length, 'rooms:', rooms.length)
      
      try {
        if (!snapPointGeneratorRef.current) {
          snapPointGeneratorRef.current = new PlumbingSnapPointGenerator(currentFloorplan)
        } else {
          snapPointGeneratorRef.current.updateFloorplan(currentFloorplan)
        }
        
        const snapPoints = snapPointGeneratorRef.current.getSnapPoints()
        setPlumbingSnapPoints(snapPoints)
        console.log('🔧 Generated', snapPoints.length, 'plumbing snap points')
        
        // Debug snap points by type
        const snapPointsByType = snapPoints.reduce((acc, point) => {
          acc[point.type] = (acc[point.type] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log('🔧 Snap points by type:', snapPointsByType)
        
      } catch (error) {
        console.error('❌ Error generating plumbing snap points:', error)
        setPlumbingSnapPoints([]) // Reset to empty array on error
      }
    } else {
      console.log('⚠️ No valid floorplan available for snap point generation')
      setPlumbingSnapPoints([])
    }
  }, [currentFloorplan])

  // Initialize plumbing manager scene
  useEffect(() => {
    if (enabled) {
      scene.add(plumbingManager.getScene())
    }

    return () => {
      scene.remove(plumbingManager.getScene())
      plumbingManager.dispose()
    }
  }, [scene, plumbingManager, enabled])

  // Handle system creation
  const handleSystemCreated = (system: PlumbingSystem) => {
    const config = system.getConfig()
    
    // Create renderer for the new system - use main scene
    const renderer = new SmartPipeRenderer(system, scene, {
      enableLOD: true,
      showSupportStructure: false,
      showInsulation: config.insulated || false
    })
    
    setRenderers(prev => new Map(prev.set(config.id, renderer)))
    
    // Notify parent component
    onSystemChange?.(plumbingManager.getAllSystems())
    
    console.log(`Created plumbing system: ${config.name}`)
  }

  // Handle system updates
  const handleSystemUpdated = (system: PlumbingSystem) => {
    const config = system.getConfig()
    
    // Update existing renderer
    const existingRenderer = renderers.get(config.id)
    if (existingRenderer) {
      existingRenderer.updateSystem(system)
    } else {
      // Create new renderer if it doesn't exist - use main scene
      const renderer = new SmartPipeRenderer(system, scene, {
        enableLOD: true,
        showSupportStructure: false,
        showInsulation: config.insulated || false
      })
      
      setRenderers(prev => new Map(prev.set(config.id, renderer)))
    }
    
    // Notify parent component
    onSystemChange?.(plumbingManager.getAllSystems())
    
    console.log(`Updated plumbing system: ${config.name}`)
  }

  // Handle system deletion
  const handleSystemDeleted = (systemId: string) => {
    // Dispose of renderer
    const renderer = renderers.get(systemId)
    if (renderer) {
      renderer.dispose()
      setRenderers(prev => {
        const newMap = new Map(prev)
        newMap.delete(systemId)
        return newMap
      })
    }
    
    // Notify parent component
    onSystemChange?.(plumbingManager.getAllSystems())
    
    console.log(`Deleted plumbing system: ${systemId}`)
  }

  // Handle validation errors
  const handleValidationError = (error: string) => {
    setErrorMessage(error)
    setTimeout(() => setErrorMessage(''), 5000) // Clear error after 5 seconds
  }

  // Handle mode changes from UI
  const handleModeChange = (mode: string, config: any) => {
    console.log('🎯 3D System received mode change:', mode, config)
    console.log('🎯 Routing tool ref:', routingToolRef.current)
    console.log('🎯 Path editor ref:', pathEditorRef.current)
    
    setCurrentMode(mode as 'view' | 'create' | 'edit' | 'delete')
    
    // Update routing tool settings
    if (routingToolRef.current) {
      console.log('🎯 Updating routing tool settings...')
      if (config.material) routingToolRef.current.setMaterial(config.material)
      if (config.diameter) routingToolRef.current.setDiameter(config.diameter)
      if (config.systemType) routingToolRef.current.setSystemType(config.systemType)
    } else {
      console.warn('⚠️ Routing tool ref is null!')
    }
    
    // Start/stop appropriate tools
    if (mode === 'create' && routingToolRef.current) {
      console.log('🎯 Starting routing tool...')
      routingToolRef.current.startRouting('create')
    } else if (routingToolRef.current) {
      console.log('🎯 Stopping routing tool...')
      routingToolRef.current.stopRouting()
    }
    
    if (mode === 'edit' && pathEditorRef.current) {
      console.log('🎯 Starting path editor...')
      pathEditorRef.current.startEditing()
    } else if (pathEditorRef.current) {
      console.log('🎯 Stopping path editor...')
      pathEditorRef.current.stopEditing()
    }
  }

  // Handle material changes from UI
  const handleMaterialChange = (config: any) => {
    console.log('🎯 3D System received material change:', config)
    if (routingToolRef.current) {
      routingToolRef.current.setMaterial(config.material)
    }
  }

  // Handle system type changes from UI
  const handleSystemTypeChange = (config: any) => {
    console.log('🎯 3D System received system type change:', config)
    if (routingToolRef.current) {
      routingToolRef.current.setSystemType(config.systemType)
    }
  }

  // Handle diameter changes from UI
  const handleDiameterChange = (config: any) => {
    console.log('🎯 3D System received diameter change:', config)
    if (routingToolRef.current) {
      routingToolRef.current.setDiameter(config.diameter)
    }
  }

  // Create example PEX system as specified in the requirements
  const createExamplePEXSystem = () => {
    console.log('🚰 Creating example PEX system...')
    
    const exampleConfig = {
      id: `pex_cold_water_${Date.now()}`,
      name: 'PEX Cold Water Distribution',
      systemType: 'cold_water' as const,
      material: 'pex' as const,
      diameter: 0.5 as const,
      path: [
        { x: 37.5, y: 222, z: 9.0 }, // Start at north wall
        { x: 37.5, y: 210, z: 9.0 }, // Veg branch point
        { x: 76.4, y: 210, z: 9.0 }  // Terminate at Veg center
      ],
      pressure: 160,
      insulated: false,
      supportSpacing: 32
    }

    console.log('🚰 Example config:', exampleConfig)
    
    try {
      const system = plumbingManager.createSystem(exampleConfig)
      console.log('🚰 System created successfully:', system)
      handleSystemCreated(system)
    } catch (error) {
      console.error('❌ Failed to create system:', error)
    }
  }

  // Cleanup renderers on unmount
  useEffect(() => {
    return () => {
      renderers.forEach(renderer => renderer.dispose())
    }
  }, [renderers])

  // Debug: Expose functions globally for testing
  useEffect(() => {
    if (typeof window === 'undefined') return // SSR guard
    
    (window as any).plumbingDebug = {
      createExample: createExamplePEXSystem,
      getManager: () => plumbingManager,
      getSystems: () => plumbingManager.getAllSystems(),
      getRenderers: () => renderers,
      testModeChange: (mode: string) => handleModeChange(mode, { material: 'pex', diameter: 0.5, systemType: 'cold_water' }),
      routingToolRef: routingToolRef,
      pathEditorRef: pathEditorRef
    }
  }, [plumbingManager, renderers, handleModeChange, createExamplePEXSystem])

  return (
    <>
      {/* Invisible components that handle interactions */}
      {enabled && (
        <>
          <PipeRoutingTool
            ref={routingToolRef}
            plumbingManager={plumbingManager}
            onSystemCreated={handleSystemCreated}
            onSystemUpdated={handleSystemUpdated}
            onSystemDeleted={handleSystemDeleted}
            enabled={currentMode === 'view' || currentMode === 'create'}
            floorplan={currentFloorplan}
            onActiveSnapPointChange={setActiveSnapPoint}
            showAlignmentGuides={true}
          />
          
          <PipePathEditor
            ref={pathEditorRef}
            plumbingManager={plumbingManager}
            onSystemUpdated={handleSystemUpdated}
            onValidationError={handleValidationError}
            enabled={currentMode === 'view' || currentMode === 'edit'}
          />
        </>
      )}

      {/* Plumbing Snap Point Indicators */}
      {enabled && currentMode === 'create' && (
        <PlumbingSnapIndicators
          snapPoints={plumbingSnapPoints}
          activeSnapPoint={activeSnapPoint}
          visible={true}
          opacity={0.7}
        />
      )}

      {/* Event Listeners for UI Communication */}
      {enabled && (
        <EventListeners 
          onCreateExample={createExamplePEXSystem}
          onLogSystems={() => {
            const systems = plumbingManager.getAllSystems()
            console.log('Current systems:', systems.map(s => s.getConfig()))
          }}
          onModeChange={handleModeChange}
          onMaterialChange={handleMaterialChange}
          onSystemTypeChange={handleSystemTypeChange}
          onDiameterChange={handleDiameterChange}
        />
      )}
    </>
  )
}

// Hook for accessing plumbing system data in other components
export const usePlumbingSystems = () => {
  const [systems, setSystems] = useState<PlumbingSystem[]>([])
  
  return {
    systems,
    setSystems,
    getTotalCost: () => systems.reduce((sum, sys) => sum + sys.calculateTotalCost(), 0),
    getTotalLength: () => systems.reduce((sum, sys) => sum + sys.calculateTotalLength(), 0),
    getSystemsByType: (type: string) => systems.filter(sys => sys.getConfig().systemType === type),
    getSystemsByMaterial: (material: string) => systems.filter(sys => sys.getConfig().material === material)
  }
}

export default PlumbingSystemIntegration
