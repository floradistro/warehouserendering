'use client'

import React from 'react'
import { Target } from 'lucide-react'

/**
 * SUPER SIMPLE TOOLBAR
 * 
 * Just one button that creates a test pipe
 */

export const SimpleToolbar: React.FC = () => {
  
  const handleCreatePipe = () => {
    console.log('🚰 Simple toolbar: Create pipe clicked')
    
    // Call the global function exposed by SimplePipeSystem
    if (typeof window !== 'undefined' && (window as any).createTestPipe) {
      (window as any).createTestPipe()
      alert('Pipe created! Check the 3D scene.')
    } else {
      console.error('❌ createTestPipe function not available')
      alert('Error: Pipe system not ready')
    }
  }
  
  return (
    <div className="bg-[#2d2d2d] border-r border-[#3e3e3e] w-12 h-full flex-shrink-0">
      <div className="flex flex-col h-full p-2">
        
        {/* Big obvious button */}
        <button
          onClick={handleCreatePipe}
          className="w-full h-12 flex items-center justify-center bg-[#0066CC] hover:bg-[#0088FF] text-white rounded transition-colors mb-2"
          title="Create Test Pipe"
        >
          <Target size={20} />
        </button>
        
        <div className="text-[#cccccc] text-[8px] text-center">
          Create<br/>Pipe
        </div>
        
      </div>
    </div>
  )
}

export default SimpleToolbar
