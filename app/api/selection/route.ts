import { NextRequest, NextResponse } from 'next/server'

// This endpoint provides access to the current selection state
// It can be called by external systems or AI assistants to understand what's selected

export async function GET(request: NextRequest) {
  try {
    // In a real-world scenario, you might want to store selection state in a database
    // or use server-side state management. For now, we'll return instructions on how
    // to access the client-side selection data.
    
    return NextResponse.json({
      message: 'Selection data is available client-side',
      instructions: {
        javascript: 'window.warehouseCADSelection',
        console: 'Check browser console for selection updates',
        summary: 'Use getSelectionSummary() function for formatted text'
      },
      endpoints: {
        current: '/api/selection',
        websocket: '/api/selection/ws (future implementation)'
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Selection API error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve selection data' },
      { status: 500 }
    )
  }
}

// POST endpoint to receive selection updates (for future use)
export async function POST(request: NextRequest) {
  try {
    const selectionData = await request.json()
    
    // Here you could store the selection data in a database,
    // send it to external systems, or trigger webhooks
    
    console.log('Selection update received:', {
      timestamp: new Date().toISOString(),
      selectionCount: selectionData.selectionCount,
      hasSelection: selectionData.hasSelection
    })
    
    return NextResponse.json({
      success: true,
      message: 'Selection data received',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Selection POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process selection data' },
      { status: 500 }
    )
  }
}
