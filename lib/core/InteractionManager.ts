import * as THREE from 'three'

// Keyboard event handler interface
export interface KeyboardHandler {
  handleKeyDown: (event: KeyboardEvent) => void
  handleKeyUp: (event: KeyboardEvent) => void
  cleanup: () => void
}

// Mouse/pointer interaction interface
export interface PointerHandler {
  handlePointerMove: (event: React.PointerEvent) => void
  handlePointerUp: (event: React.PointerEvent) => void
  handlePointerDown: (event: React.PointerEvent) => void
  handleClick: (event: React.MouseEvent) => void
}

// Interaction manager class
export class InteractionManager {
  private keyboardHandlers: Set<KeyboardHandler> = new Set()
  private pointerHandlers: Set<PointerHandler> = new Set()
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    if (this.isInitialized) return

    document.addEventListener('keydown', this.handleKeyDown.bind(this))
    document.addEventListener('keyup', this.handleKeyUp.bind(this))

    this.isInitialized = true
  }

  addKeyboardHandler(handler: KeyboardHandler) {
    this.keyboardHandlers.add(handler)
  }

  removeKeyboardHandler(handler: KeyboardHandler) {
    this.keyboardHandlers.delete(handler)
  }

  addPointerHandler(handler: PointerHandler) {
    this.pointerHandlers.add(handler)
  }

  removePointerHandler(handler: PointerHandler) {
    this.pointerHandlers.delete(handler)
  }

  private handleKeyDown(event: KeyboardEvent) {
    this.keyboardHandlers.forEach(handler => {
      try {
        handler.handleKeyDown(event)
      } catch (error) {
        console.error('Keyboard handler error:', error)
      }
    })
  }

  private handleKeyUp(event: KeyboardEvent) {
    this.keyboardHandlers.forEach(handler => {
      try {
        handler.handleKeyUp(event)
      } catch (error) {
        console.error('Keyboard handler error:', error)
      }
    })
  }

  handlePointerMove(event: React.PointerEvent) {
    this.pointerHandlers.forEach(handler => {
      try {
        handler.handlePointerMove(event)
      } catch (error) {
        console.error('Pointer handler error:', error)
      }
    })
  }

  handlePointerUp(event: React.PointerEvent) {
    this.pointerHandlers.forEach(handler => {
      try {
        handler.handlePointerUp(event)
      } catch (error) {
        console.error('Pointer handler error:', error)
      }
    })
  }

  handlePointerDown(event: React.PointerEvent) {
    this.pointerHandlers.forEach(handler => {
      try {
        handler.handlePointerDown(event)
      } catch (error) {
        console.error('Pointer handler error:', error)
      }
    })
  }

  handleClick(event: React.MouseEvent) {
    this.pointerHandlers.forEach(handler => {
      try {
        handler.handleClick(event)
      } catch (error) {
        console.error('Pointer handler error:', error)
      }
    })
  }

  cleanup() {
    if (!this.isInitialized) return

    document.removeEventListener('keydown', this.handleKeyDown.bind(this))
    document.removeEventListener('keyup', this.handleKeyUp.bind(this))

    this.keyboardHandlers.forEach(handler => handler.cleanup())
    this.keyboardHandlers.clear()
    this.pointerHandlers.clear()

    this.isInitialized = false
  }
}

// Singleton instance
export const globalInteractionManager = new InteractionManager()

// Utility functions for common interactions
export function isInputElement(target: EventTarget | null): boolean {
  return target instanceof HTMLInputElement || 
         target instanceof HTMLTextAreaElement ||
         target instanceof HTMLSelectElement
}

export function isModifierPressed(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey
}

export function getMousePosition(event: React.MouseEvent, element: HTMLElement): THREE.Vector2 {
  const rect = element.getBoundingClientRect()
  return new THREE.Vector2(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1
  )
}

export function worldToScreen(
  worldPosition: THREE.Vector3,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer
): THREE.Vector2 {
  const vector = worldPosition.clone()
  vector.project(camera)

  const widthHalf = renderer.domElement.width / 2
  const heightHalf = renderer.domElement.height / 2

  return new THREE.Vector2(
    vector.x * widthHalf + widthHalf,
    -(vector.y * heightHalf) + heightHalf
  )
}

export function screenToWorld(
  screenPosition: THREE.Vector2,
  camera: THREE.Camera,
  depth: number = 0
): THREE.Vector3 {
  const vector = new THREE.Vector3(
    screenPosition.x,
    screenPosition.y,
    depth
  )
  
  vector.unproject(camera)
  return vector
}
