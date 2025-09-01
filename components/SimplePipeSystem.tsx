'use client'

import React, { useState, useEffect } from 'react'
import * as THREE from 'three'
import { useAppStore } from '@/lib/store'

/**
 * SIMPLE PIPE SYSTEM
 * 
 * Super simple pipe creation and rendering system
 * No complex integrations, just basic functionality
 */

interface PipeSystemProps {
  enabled?: boolean
}

export const SimplePipeSystem: React.FC<PipeSystemProps> = ({ enabled = true }) => {
  const { addElement, currentFloorplan } = useAppStore()
  const [isCreating, setIsCreating] = useState(false)
  
  // Get all pipe elements from store
  const pipes = (currentFloorplan?.elements || []).filter(el => el.type === 'pipe_system')
  
  // Create a simple test pipe
  const createTestPipe = () => {
    console.log('🚰 Creating simple test pipe...')
    
    const pipe = {
      id: `simple_pipe_${Date.now()}`,
      type: 'pipe_system' as const,
      position: { x: 20, y: 20, z: 8 },
      dimensions: { width: 30, height: 30, depth: 1 },
      material: 'pex',
      color: '#0066CC',
      pipeData: {
        systemType: 'cold_water' as const,
        diameter: 1.0,
        path: [
          { x: 20, y: 20, z: 8 },
          { x: 35, y: 20, z: 8 },
          { x: 35, y: 35, z: 8 },
          { x: 50, y: 35, z: 8 }
        ]
      },
      metadata: {
        pipeSystem: true,
        materialType: 'pex',
        systemType: 'cold_water'
      }
    }
    
    try {
      addElement(pipe)
      console.log('✅ Simple pipe added successfully!')
      console.log('Pipe:', pipe)
      
      // Check if it was added
      setTimeout(() => {
        const store = (window as any).__appStore
        if (store) {
          const state = store.getState()
          const pipesInStore = state.elements?.filter((e: any) => e.type === 'pipe_system') || []
          console.log(`📦 Store now has ${pipesInStore.length} pipe systems`)
        }
      }, 100)
      
    } catch (error) {
      console.error('❌ Failed to add pipe:', error)
    }
  }
  
  // Expose to window for easy testing
  useEffect(() => {
    if (typeof window !== 'undefined' && window) {
      try {
        (window as any).createTestPipe = createTestPipe
        ;(window as any).getPipes = () => pipes
        console.log('🚰 Simple pipe system loaded')
        console.log('   Use: createTestPipe() to add a pipe')
        console.log('   Use: getPipes() to see all pipes')
      } catch (error) {
        console.error('Failed to expose pipe functions to window:', error)
      }
    }
  }, [pipes])
  
  if (!enabled) return null
  
  return (
    <group name="SimplePipeSystem">
      {/* Render all pipes from store */}
      {pipes.map(pipe => {
        if (!pipe.pipeData?.path) return null
        
        const path = pipe.pipeData.path
        const segments = []
        
        // Create pipe segments
        for (let i = 0; i < path.length - 1; i++) {
          const start = path[i]
          const end = path[i + 1]
          
          const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) +
            Math.pow(end.y - start.y, 2) +
            Math.pow(end.z - start.z, 2)
          )
          
          const midX = (start.x + end.x) / 2
          const midY = (start.y + end.y) / 2
          const midZ = (start.z + end.z) / 2
          
          // Calculate rotation
          const direction = new THREE.Vector3(
            end.x - start.x,
            end.y - start.y,
            end.z - start.z
          ).normalize()
          
          let rotationY = 0
          let rotationZ = 0
          
          if (Math.abs(direction.x) > 0.1 || Math.abs(direction.z) > 0.1) {
            rotationY = Math.atan2(direction.x, direction.z)
          }
          if (Math.abs(direction.y) > 0.1) {
            rotationZ = Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z))
          }
          
          segments.push(
            <mesh 
              key={`${pipe.id}-segment-${i}`}
              position={[midX, midZ, midY]}
              rotation={[0, rotationY, rotationZ]}
              castShadow 
              receiveShadow
            >
              <cylinderGeometry args={[0.5, 0.5, distance, 16]} />
              <meshStandardMaterial 
                color={pipe.color || '#0066CC'} 
                roughness={0.7}
                metalness={0.1}
              />
            </mesh>
          )
        }
        
        return (
          <group key={pipe.id} name={`Pipe-${pipe.id}`}>
            {segments}
          </group>
        )
      })}
    </group>
  )
}

export default SimplePipeSystem
