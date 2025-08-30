'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore } from '../lib/store'

interface SelectionInfo {
  timestamp: number
  selectedElements: Array<{
    id: string
    type: string
    position: { x: number; y: number; z?: number }
    dimensions: { width: number; height: number; depth?: number }
    rotation?: number
    color?: string
    material?: string
    metadata?: Record<string, any>
  }>
  selectionCount: number
  hasSelection: boolean
}

// Global variable to store current selection info - accessible from external systems
declare global {
  interface Window {
    warehouseCADSelection?: SelectionInfo
  }
}

export function SelectionInfoSystem() {
  const { selectedElements, currentFloorplan } = useAppStore()
  const [currentSelection, setCurrentSelection] = useState<SelectionInfo | null>(null)
  
  // Clean operation - debug logs removed for production

  useEffect(() => {

    // Get selected floorplan elements with full details
    const selectedFloorplanElements = selectedElements
      .map(id => {
        if (!currentFloorplan) return null
        return currentFloorplan.elements.find(el => el.id === id)
      })
      .filter(el => el !== null)

    // Create comprehensive selection info
    const selectionInfo: SelectionInfo = {
      timestamp: Date.now(),
      selectedElements: selectedFloorplanElements.filter((el): el is NonNullable<typeof el> => el !== null && el !== undefined).map(el => ({
        id: el.id,
        type: el.type,
        position: el.position,
        dimensions: el.dimensions,
        rotation: el.rotation,
        color: el.color,
        material: el.material,
        metadata: el.metadata
      })),

      selectionCount: selectedElements.length,
      hasSelection: selectedElements.length > 0
    }

    // Update state
    setCurrentSelection(selectionInfo)

    // Make selection info globally accessible
    if (typeof window !== 'undefined') {
      window.warehouseCADSelection = selectionInfo
    }

    // Log selection changes for debugging/external access
    if (selectionInfo.hasSelection) {
      console.group('🎯 WAREHOUSE OBJECT SELECTED')
      selectionInfo.selectedElements.forEach((element, index) => {
        // Get detailed object-specific information
        const getObjectDetails = (el: any) => {
          if (el.id.includes('electrical-panel')) {
            return {
              type: 'Electrical Panel',
              subtype: el.id.includes('main') ? 'Main Distribution' : 'Branch Circuit',
              mounting: el.rotation === 90 ? 'Wall-mounted' : 'Floor-standing',
              voltage: '480V/277V',
              capacity: el.id.includes('main') ? '400-800 Amps' : '100-200 Amps'
            }
          } else if (el.id.includes('ibc-tote')) {
            const number = el.id.match(/\d+$/)?.[0] || 'Unknown'
            return {
              type: 'IBC Tote Container',
              level: el.id.includes('top') ? 'Upper Rack' : 'Ground Level',
              capacity: '275 gallons',
              material: 'HDPE Plastic',
              unitNumber: number
            }
          } else if (el.id.includes('norwesco-tank')) {
            return {
              type: 'Norwesco Storage Tank',
              capacity: '~1,500 gallons',
              material: 'Polyethylene',
              use: 'Bulk liquid storage'
            }
          } else if (el.id.includes('wall')) {
            return {
              type: el.id.includes('room-wall') ? 'Interior Room Wall' : 'Building Wall',
              function: el.id.includes('room-wall') ? 'Space division' : 'Structural/envelope',
              thickness: `${el.dimensions.depth || 8}"`
            }
          } else if (el.id.includes('beam')) {
            return {
              type: el.id.includes('steel') ? 'Steel I-Beam' : 'TJI Beam',
              material: el.id.includes('steel') ? 'Structural steel' : 'Engineered lumber',
              function: 'Structural support'
            }
          } else if (el.id.includes('floor') && el.id.includes('epoxy')) {
            return {
              type: 'Epoxy Floor Coating',
              color: el.id.includes('black') ? 'Black' : el.id.includes('white') ? 'White' : 'Standard',
              function: 'Chemical-resistant flooring',
              thickness: `${el.dimensions.depth || 0.125}"`
            }
          }
          return { type: el.type.toUpperCase(), function: 'General warehouse component' }
        }
        
        const details = getObjectDetails(element)
        
        console.log(`\n📦 ${details.type.toUpperCase()}`)
        console.log(`🏷️  ID: ${element.id}`)
        console.log(`📍 Location: X=${element.position.x}', Y=${element.position.y}', Z=${element.position.z || 0}'`)
        console.log(`📏 Size: ${element.dimensions.width}' × ${element.dimensions.height}' × ${element.dimensions.depth || 0}'`)
        
        Object.entries(details).forEach(([key, value]) => {
          if (key !== 'type' && value) {
            const icon = key === 'capacity' ? '🪣' : key === 'material' ? '🔧' : key === 'function' ? '⚙️' : '📋'
            console.log(`${icon} ${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`)
          }
        })
        
        const volume = element.dimensions.width * element.dimensions.height * (element.dimensions.depth || 0)
        console.log(`📊 Volume: ${volume.toFixed(2)} cubic feet`)
      })
      console.log(`\n⏰ Updated: ${new Date(selectionInfo.timestamp).toLocaleString()}`)
      console.groupEnd()
      
      // Also log a simple summary
      const summary = getSelectionSummary()
      console.log(`📊 ${summary}`)
    } else {
      console.log('⚪ No objects currently selected')
    }

  }, [selectedElements, currentFloorplan])

  // This component doesn't render anything visible - it's a background service
  return null
}

// Utility function to get current selection (for external use)
export function getCurrentSelection(): SelectionInfo | null {
  if (typeof window !== 'undefined') {
    return window.warehouseCADSelection || null
  }
  return null
}

// Utility function to get formatted selection summary
export function getSelectionSummary(): string {
  const selection = getCurrentSelection()
  
  if (!selection || !selection.hasSelection) {
    return 'No objects currently selected'
  }


  
  const elementTypes = selection.selectedElements.reduce((acc, el) => {
    acc[el.type] = (acc[el.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  const elementSummary = Object.entries(elementTypes)
    .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
    .join(', ')
  
  return `Selected: ${elementSummary} (Total: ${selection.selectionCount})`
}

// Utility function to get detailed selection info for a specific element
export function getElementDetails(elementId: string): any {
  const selection = getCurrentSelection()
  
  if (!selection) return null

  // Check floorplan elements
  const floorplanElement = selection.selectedElements.find(el => el.id === elementId)
  if (floorplanElement) {
    return {
      source: 'floorplan',
      ...floorplanElement
    }
  }

  return null
}
