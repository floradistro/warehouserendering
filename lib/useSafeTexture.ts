'use client'

import * as THREE from 'three'

// Create a simple 1x1 colored texture as fallback
export function createFallbackTexture(color: string = '#808080'): THREE.Texture {
  if (typeof document === 'undefined') {
    // SSR fallback - create a simple data texture
    const data = new Uint8Array([128, 128, 128, 255])
    const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat)
    texture.needsUpdate = true
    return texture
  }

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = color
    ctx.fillRect(0, 0, 1, 1)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

// Cached fallback textures
let brickFallback: THREE.Texture | null = null
let concreteFallback: THREE.Texture | null = null

export function getBrickFallbackTexture(): THREE.Texture {
  if (!brickFallback) {
    brickFallback = createFallbackTexture('#8B7355')
  }
  return brickFallback
}

export function getConcreteFallbackTexture(): THREE.Texture {
  if (!concreteFallback) {
    concreteFallback = createFallbackTexture('#808080')
  }
  return concreteFallback
}
