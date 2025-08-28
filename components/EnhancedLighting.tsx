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
      // Enable physically correct lighting
      gl.physicallyCorrectLights = true
      gl.toneMapping = THREE.ACESFilmicToneMapping
      gl.toneMappingExposure = 1.2
      
      // Configure shadow settings based on quality
      if (enableShadows) {
        gl.shadowMap.enabled = true
        gl.shadowMap.type = quality === 'ultra' 
          ? THREE.PCFSoftShadowMap 
          : quality === 'high'
          ? THREE.PCFShadowMap
          : THREE.BasicShadowMap
      }
      
      // Set output encoding for better colors
      gl.outputEncoding = THREE.sRGBEncoding
    }
  }, [gl, enableShadows, quality])

  // Shadow map size based on quality
  const shadowMapSize = useMemo(() => {
    switch(quality) {
      case 'ultra': return 8192
      case 'high': return 4096
      case 'medium': return 2048
      default: return 1024
    }
  }, [quality])

  // Animate sun light for dynamic shadows (optional)
  useFrame((state) => {
    if (sunLightRef.current) {
      // Subtle movement for more realistic lighting
      const time = state.clock.getElapsedTime()
      sunLightRef.current.position.x = 50 + Math.sin(time * 0.1) * 5
      sunLightRef.current.position.z = 20 + Math.cos(time * 0.1) * 5
    }
  })

  return (
    <>
      {/* Main ambient light - warehouse interior lighting */}
      <ambientLight intensity={0.4} color="#f0f0f0" />
      
      {/* Primary sun light - main directional light source */}
      <directionalLight
        ref={sunLightRef}
        position={[50, 60, 30]}
        intensity={1.5}
        color="#fffaf0"
        castShadow={enableShadows}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-far={300}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      
      {/* Secondary fill light - soften shadows */}
      <directionalLight
        position={[-30, 40, -20]}
        intensity={0.5}
        color="#e6f3ff"
        castShadow={false}
      />
      
      {/* Warehouse ceiling lights - array of point lights */}
      {Array.from({ length: 6 }, (_, i) => {
        const x = (i % 3) * 40 - 40
        const z = Math.floor(i / 3) * 60 - 30
        return (
          <pointLight
            key={`ceiling-light-${i}`}
            position={[x, 11, z]}
            intensity={0.8}
            color="#fff5e6"
            distance={40}
            decay={2}
            castShadow={enableShadows && i < 2} // Only first 2 cast shadows for performance
            shadow-mapSize={[1024, 1024]}
          />
        )
      })}
      
      {/* Accent lighting for IBC Totes and equipment */}
      <spotLight
        position={[70, 15, 60]}
        target-position={[70, 0, 60]}
        angle={Math.PI / 6}
        penumbra={0.5}
        intensity={0.6}
        color="#ffffff"
        castShadow={enableShadows}
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* Rim lighting for better depth perception */}
      <directionalLight
        position={[0, 30, -80]}
        intensity={0.3}
        color="#cce7ff"
      />
      
      {/* Ground reflection light - simulate light bouncing off floor */}
      <hemisphereLight
        color="#ffffff"
        groundColor="#8b7355"
        intensity={0.3}
        position={[0, -1, 0]}
      />
      
      {/* Environment map for reflections (using a simple gradient for now) */}
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
      // Fallback to simple environment color
      scene.environment = new THREE.Color(0xf0f0f0)
    }
  }, [scene, gl])
  
  return null
}
