'use client'

import { useRef, useEffect } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FirstPersonControlsProps {
  enabled: boolean
  movementSpeed?: number
  mouseSensitivity?: number
  initialPosition?: [number, number, number]
  initialTarget?: [number, number, number]
}

export default function FirstPersonControls({
  enabled = false,
  movementSpeed = 25,
  mouseSensitivity = 0.002,
  initialPosition = [99, 6, 44.25], // 6 feet above ground (human height)
  initialTarget = [120, 6, 44.25]
}: FirstPersonControlsProps) {
  const { camera, gl } = useThree()
  
  const keysPressed = useRef<Set<string>>(new Set())
  const mouseMovement = useRef({ x: 0, y: 0 })
  const isPointerLocked = useRef(false)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const direction = useRef(new THREE.Vector3())
  const velocity = useRef(new THREE.Vector3())
  const prevTime = useRef(performance.now())
  
  // Set initial camera position and rotation when enabled
  useEffect(() => {
    if (enabled) {
      camera.position.set(...initialPosition)
      camera.lookAt(...initialTarget)
      
      // Calculate initial euler angles from camera's current orientation
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      euler.current.setFromQuaternion(camera.quaternion)
      
      // Reset velocity
      velocity.current.set(0, 0, 0)
      prevTime.current = performance.now()
    }
  }, [enabled, camera, initialPosition, initialTarget])

  // Keyboard event handlers
  useEffect(() => {
    if (!enabled) return

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
  }, [enabled])

  // Mouse event handlers for pointer lock
  useEffect(() => {
    if (!enabled) return

    const canvas = gl.domElement

    const handleClick = () => {
      if (!isPointerLocked.current) {
        canvas.requestPointerLock()
      }
    }

    const handlePointerLockChange = () => {
      isPointerLocked.current = document.pointerLockElement === canvas
    }

    const handleMouseMove = (event: MouseEvent) => {
      if (!isPointerLocked.current) return

      mouseMovement.current.x = event.movementX || 0
      mouseMovement.current.y = event.movementY || 0
    }

    canvas.addEventListener('click', handleClick)
    document.addEventListener('pointerlockchange', handlePointerLockChange)
    document.addEventListener('mousemove', handleMouseMove)

    return () => {
      canvas.removeEventListener('click', handleClick)
      document.removeEventListener('pointerlockchange', handlePointerLockChange)
      document.removeEventListener('mousemove', handleMouseMove)
      
      if (document.pointerLockElement === canvas) {
        document.exitPointerLock()
      }
    }
  }, [enabled, gl])

  // Animation frame loop
  useFrame(() => {
    if (!enabled) return

    const time = performance.now()
    const delta = (time - prevTime.current) / 1000
    prevTime.current = time

    // Handle mouse look
    if (isPointerLocked.current) {
      euler.current.setFromQuaternion(camera.quaternion)
      euler.current.y -= mouseMovement.current.x * mouseSensitivity
      euler.current.x -= mouseMovement.current.y * mouseSensitivity
      
      // Constrain vertical look angle
      euler.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.current.x))
      
      camera.quaternion.setFromEuler(euler.current)
      mouseMovement.current.x = 0
      mouseMovement.current.y = 0
    }

    // Handle movement
    direction.current.set(0, 0, 0)

    if (keysPressed.current.has('KeyW')) {
      direction.current.z -= 1
    }
    if (keysPressed.current.has('KeyS')) {
      direction.current.z += 1
    }
    if (keysPressed.current.has('KeyA')) {
      direction.current.x -= 1
    }
    if (keysPressed.current.has('KeyD')) {
      direction.current.x += 1
    }
    if (keysPressed.current.has('Space')) {
      direction.current.y += 1
    }
    if (keysPressed.current.has('ShiftLeft')) {
      direction.current.y -= 1
    }

    // Normalize direction and apply to velocity
    if (direction.current.length() > 0) {
      direction.current.normalize()
      
      // Transform direction relative to camera orientation
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)
      
      const right = new THREE.Vector3()
      right.crossVectors(cameraDirection, camera.up).normalize()
      
      const forward = new THREE.Vector3()
      forward.crossVectors(camera.up, right).normalize()
      
      const moveVector = new THREE.Vector3()
      moveVector.addScaledVector(forward, -direction.current.z)
      moveVector.addScaledVector(right, direction.current.x)
      moveVector.addScaledVector(camera.up, direction.current.y)
      
      velocity.current.copy(moveVector.multiplyScalar(movementSpeed))
    } else {
      velocity.current.multiplyScalar(0.95) // Friction
    }

    // Apply movement
    const movement = velocity.current.clone().multiplyScalar(delta)
    camera.position.add(movement)

    // Keep camera above ground level (minimum 3 feet)
    camera.position.y = Math.max(3, camera.position.y)
  })

  return null
}
