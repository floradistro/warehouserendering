'use client'

import React, { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class WebGLErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('🔴 WebGL Error Boundary caught:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔴 WebGL Error Details:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-4">
          <div className="text-xl mb-4">⚠️ 3D View Unavailable</div>
          <div className="text-sm text-gray-400 text-center max-w-md">
            Your device may not support the 3D rendering required for this application.
            Try using a desktop browser or a device with better WebGL support.
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Try Again
          </button>
          {this.state.error && (
            <div className="mt-4 text-xs text-gray-500 max-w-md overflow-auto">
              Error: {this.state.error.message}
            </div>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

// WebGL capability check
export function checkWebGLSupport(): { supported: boolean; version: number; error?: string } {
  if (typeof window === 'undefined') {
    return { supported: false, version: 0, error: 'SSR' }
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl) {
      return { supported: false, version: 0, error: 'WebGL not supported' }
    }

    const version = canvas.getContext('webgl2') ? 2 : 1
    console.log(`✅ WebGL ${version} supported`)

    // Check for mobile-specific limits
    const maxTextureSize = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_TEXTURE_SIZE)
    const maxRenderbufferSize = (gl as WebGLRenderingContext).getParameter((gl as WebGLRenderingContext).MAX_RENDERBUFFER_SIZE)
    console.log(`📊 WebGL limits: maxTexture=${maxTextureSize}, maxRenderbuffer=${maxRenderbufferSize}`)

    return { supported: true, version }
  } catch (e) {
    return { supported: false, version: 0, error: (e as Error).message }
  }
}
