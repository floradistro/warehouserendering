'use client'

import React from 'react'
import * as THREE from 'three'

// Selection box component for highlighting selected elements
interface SelectionBoxProps {
  dimensions: { 
    width: number
    height: number
    depth?: number 
  }
  color?: string
}

export function SelectionBox({ dimensions, color = '#ff0000' }: SelectionBoxProps) {
  const { width, height, depth = 1 } = dimensions
  
  return (
    <lineSegments>
      <edgesGeometry args={[new THREE.BoxGeometry(width, depth, height)]} />
      <lineBasicMaterial color={color} linewidth={2} />
    </lineSegments>
  )
}

// Selection utilities
export class SelectionManager {
  private selectedIds = new Set<string>()
  private onSelectionChange?: (selectedIds: string[]) => void

  constructor(onSelectionChange?: (selectedIds: string[]) => void) {
    this.onSelectionChange = onSelectionChange
  }

  select(id: string) {
    this.selectedIds.add(id)
    this.notifyChange()
  }

  deselect(id: string) {
    this.selectedIds.delete(id)
    this.notifyChange()
  }

  toggle(id: string) {
    if (this.selectedIds.has(id)) {
      this.deselect(id)
    } else {
      this.select(id)
    }
  }

  clear() {
    this.selectedIds.clear()
    this.notifyChange()
  }

  selectMultiple(ids: string[]) {
    ids.forEach(id => this.selectedIds.add(id))
    this.notifyChange()
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id)
  }

  getSelected(): string[] {
    return Array.from(this.selectedIds)
  }

  private notifyChange() {
    if (this.onSelectionChange) {
      this.onSelectionChange(this.getSelected())
    }
  }
}

// Hook for using selection manager
export function useSelectionManager() {
  const managerRef = React.useRef<SelectionManager>()
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  if (!managerRef.current) {
    managerRef.current = new SelectionManager(setSelectedIds)
  }

  return {
    manager: managerRef.current,
    selectedIds
  }
}
