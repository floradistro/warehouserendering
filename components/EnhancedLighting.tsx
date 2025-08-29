import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface EnhancedLightingProps {
  enableShadows?: boolean
  quality?: 'low' | 'medium' | 'high' | 'ultra'
}

export default function EnhancedLighting({ 
  enableShadows = true, 
  quality = 'high' 
}: EnhancedLightingProps) {
  const { scene, gl } = useThree()
  const sunLightRef = useRef<THREE.DirectionalLight>(null)
  
  // Configure renderer for better quality
  React.useEffect(() => {
    if (gl) {
      // Note: physicallyCorrectLights was removed in Three.js r155+
      // Physical lighting is now the default behavior
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.2
      
      // Configure shadow settings based on quality - optimized for corner visibility
      if (enableShadows) {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = quality === 'ultra' 
          ? THREE.PCFSoftShadowMap 
          : quality === 'high'
          ? THREE.PCFShadowMap
          : THREE.BasicShadowMap
        
        // Enhanced shadow settings for better corner definition
        gl.shadowMap.autoUpdate = true
        gl.shadowMap.needsUpdate = true
      }
      
      // Set output color space for better colors (updated from outputEncoding)
      gl.outputColorSpace = THREE.SRGBColorSpace
    }
  }, [gl, enableShadows, quality])

  // Shadow map size based on quality - ultra quality restored
  const shadowMapSize = useMemo(() => {
    switch(quality) {
      case 'ultra': return 8192
      case 'high': return 4096
      case 'medium': return 2048
      default: return 1024
    }
  }, [quality])

  // Removed dynamic sun movement for better performance

  return (
    <>
      {/* Main ambient light for base illumination */}
      <ambientLight intensity={0.35} color="#f0f0f0" />
      
      {/* Primary directional sun light */}
      <directionalLight
        position={[50, 60, 30]}
        intensity={1.8}
        color="#fffaf0"
        castShadow={enableShadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-far={400}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
        shadow-bias={-0.001}
        shadow-normalBias={0.05}
        shadow-radius={4}
      />
      
      {/* Secondary fill light */}
      <directionalLight
        position={[-30, 40, -20]}
        intensity={0.4}
        color="#e6f3ff"
        castShadow={false}
      />
      
      {/* Warehouse ceiling lights - strategic placement */}
      {Array.from({ length: 6 }, (_, i) => {
        const positions = [
          [35, 11.5, 80],   // Room 6 area
          [105, 11.5, 80],  // Room 6 area
          [35, 11.5, 140],  // Room 4 area
          [105, 11.5, 140], // Room 4 area
          [35, 11.5, 200],  // Room 2 area
          [105, 11.5, 200]  // Room 2 area
        ]
        const [x, y, z] = positions[i]
        return (
          <pointLight
            key={`ceiling-light-${i}`}
            position={[x, y, z]}
            intensity={0.8}
            color="#fff5e6"
            distance={60}
            decay={2}
            castShadow={enableShadows && i < 2} // Only first 2 cast shadows
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.001}
          />
        )
      })}
      
      {/* Key spotlight for corner definition */}
      <spotLight
        position={[70, 15, 140]}
        target-position={[70, 0, 140]}
        angle={Math.PI / 4}
        penumbra={0.3}
        intensity={0.8}
        color="#ffffff"
        castShadow={enableShadows}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.001}
      />
      
      {/* Corner enhancement lights - minimal but effective */}
      <directionalLight
        position={[20, 10, 140]} // West side for corner shadows
        target-position={[70, 0, 140]}
        intensity={0.3}
        color="#f8f8ff"
        castShadow={enableShadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.001}
      />
      
      <directionalLight
        position={[120, 10, 140]} // East side for corner shadows
        target-position={[70, 0, 140]}
        intensity={0.3}
        color="#f8f8ff"
        castShadow={enableShadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={80}
        shadow-camera-left={-40}
        shadow-camera-right={40}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.001}
      />
      
      {/* Rim lighting for depth */}
      <directionalLight
        position={[0, 25, -60]}
        intensity={0.25}
        color="#cce7ff"
        castShadow={false}
      />
      
      {/* Ground reflection simulation */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#8b7355"
        intensity={0.25}
        position={[0, -1, 0]}
      />
      
      {/* Environment map for reflections */}
      <EnvironmentMap />
    </>
  )
}

// Simple environment map component for reflections
function EnvironmentMap() {
  const { scene, gl } = useThree()
  
  React.useEffect(() => {
    if (!gl) return
    
    try {
      // Create a simple gradient environment map
      const pmremGenerator = new THREE.PMREMGenerator(gl)
      pmremGenerator.compileEquirectangularShader()
      
      // Create a simple gradient texture
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 256
      
      const context = canvas.getContext('2d')
      if (context) {
        // Sky gradient
        const gradient = context.createLinearGradient(0, 0, 0, canvas.height)
        gradient.addColorStop(0, '#87CEEB')
        gradient.addColorStop(0.5, '#E0F6FF')
        gradient.addColorStop(1, '#FFF4E6')
        
        context.fillStyle = gradient
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
      
      const texture = new THREE.CanvasTexture(canvas)
      texture.mapping = THREE.EquirectangularReflectionMapping
      
      // Apply to scene
      scene.environment = texture
      scene.background = null // Keep transparent/default background
      
      return () => {
        texture.dispose()
        pmremGenerator.dispose()
      }
    } catch (error) {
      console.warn('Environment map setup failed:', error)
      // Fallback - set environment to null (no environment map)
      scene.environment = null
    }
  }, [scene, gl])
  
  return null
}
