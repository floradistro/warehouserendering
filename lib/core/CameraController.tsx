'use client'

import React, { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface CameraControllerProps {
  target?: [number, number, number]
  [key: string]: any
}

// WASD-enabled Orbit Controls
export function CameraController({ target, ...props }: CameraControllerProps) {
  const orbitRef = useRef<any>()
  const { camera } = useThree()
  const keysPressed = useRef<Set<string>>(new Set())
  const panSpeed = 2.0
  
  // Animation state for smooth target transitions
  const isAnimating = useRef(false)
  const animationStart = useRef(0)
  const startTarget = useRef(new THREE.Vector3())
  const endTarget = useRef(new THREE.Vector3())
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysPressed.current.add(event.code)
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      keysPressed.current.delete(event.code)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      keysPressed.current.clear()
    }
  }, [])

  // Start smooth animation when target changes
  useEffect(() => {
    if (orbitRef.current && target) {
      const controls = orbitRef.current
      
      // Store starting target only
      startTarget.current.copy(controls.target)
      endTarget.current.set(target[0], target[1], target[2])
      
      // Start animation
      isAnimating.current = true
      animationStart.current = Date.now()
    }
  }, [target, camera])

  useFrame((state, delta) => {
    if (!orbitRef.current) return

    const controls = orbitRef.current
    const camera = state.camera
    
    // Handle smooth target focus animation with frame rate limiting
    if (isAnimating.current) {
      const elapsed = Date.now() - animationStart.current
      const duration = 800 // 0.8 second animation - much faster and smoother
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function (ease out quadratic for smoother feel)
      const eased = 1 - Math.pow(1 - progress, 2)
      
      // Only interpolate target - let camera position stay where user left it
      const currentTarget = new THREE.Vector3().lerpVectors(startTarget.current, endTarget.current, eased)
      
      // Apply smooth target transition
      controls.target.copy(currentTarget)
      controls.update()
      
      // End animation
      if (progress >= 1) {
        isAnimating.current = false
      }
      
      // Allow WASD movement during focus animation (don't return early)
    }
    
    // Get camera's right and forward vectors
    const forward = new THREE.Vector3()
    camera.getWorldDirection(forward)
    forward.y = 0 // Keep movement on horizontal plane
    forward.normalize()
    
    const right = new THREE.Vector3()
    right.crossVectors(forward, camera.up).normalize()
    
    const movement = new THREE.Vector3()
    const moveDistance = panSpeed * delta * 60 // Normalize for 60fps

    // WASD movement
    if (keysPressed.current.has('KeyW')) {
      movement.add(forward.clone().multiplyScalar(moveDistance))
    }
    if (keysPressed.current.has('KeyS')) {
      movement.add(forward.clone().multiplyScalar(-moveDistance))
    }
    if (keysPressed.current.has('KeyA')) {
      movement.add(right.clone().multiplyScalar(-moveDistance))
    }
    if (keysPressed.current.has('KeyD')) {
      movement.add(right.clone().multiplyScalar(moveDistance))
    }

    // Apply movement to both camera and target
    if (movement.length() > 0) {
      camera.position.add(movement)
      controls.target.add(movement)
      controls.update()
    }
  })

  return (
    <OrbitControls
      ref={orbitRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={10}
      maxDistance={400}
      target={target}
      makeDefault
      // Zoom settings for smoother, more precise control
      zoomSpeed={0.5} // Reduced from default 1.0 for less sensitivity
      zoomToCursor={true} // Zoom towards cursor/touch point
      screenSpacePanning={false} // Keep panning in world space
      // Smooth zoom dampening
      enableDamping={true}
      dampingFactor={0.05}
      {...props}
    />
  )
}

// Camera capture utility component
interface CameraCaptureProps {
  onCameraReady: (camera: THREE.Camera) => void
}

export function CameraCapture({ onCameraReady }: CameraCaptureProps) {
  const { camera } = useThree()
  
  useEffect(() => {
    if (camera) {
      onCameraReady(camera)
    }
  }, [camera, onCameraReady])
  
  return null
}
