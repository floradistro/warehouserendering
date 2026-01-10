'use client'

import { useState, useEffect, useRef } from 'react'

// IMMEDIATELY compute mobile state when this module loads on client
// This ensures consistent value before any React rendering
let cachedIsMobile: boolean | null = null

// Compute immediately on module load (client-side only)
if (typeof window !== 'undefined') {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth < 768
  cachedIsMobile = isTouchDevice || isSmallScreen
  console.log(`📱 Mobile detection: ${cachedIsMobile} (touch: ${isTouchDevice}, small: ${isSmallScreen}, width: ${window.innerWidth})`)
}

function computeIsMobile(breakpoint: number): boolean {
  if (typeof window === 'undefined') return false
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth < breakpoint
  return isTouchDevice || isSmallScreen
}

export function useMobile(breakpoint: number = 768): boolean {
  const initialized = useRef(false)
  const [isMobile, setIsMobile] = useState(cachedIsMobile ?? false)

  useEffect(() => {
    if (cachedIsMobile === null) {
      cachedIsMobile = computeIsMobile(breakpoint)
      console.log(`📱 useMobile computed: ${cachedIsMobile}`)
    }

    if (!initialized.current) {
      initialized.current = true
      setIsMobile(cachedIsMobile)
    }
  }, [breakpoint])

  return isMobile
}

// Stable hook - returns cached value immediately, no state changes
export function useStableMobile(breakpoint: number = 768): boolean {
  // If cache exists, use it directly
  if (cachedIsMobile !== null) {
    return cachedIsMobile
  }

  // Compute on first call (should only happen on client)
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    cachedIsMobile = computeIsMobile(breakpoint)
    console.log(`📱 useStableMobile computed: ${cachedIsMobile}`)
    return cachedIsMobile
  })
  return isMobile
}

// Static check for SSR-safe initial detection
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth < 768
  return isTouchDevice || isSmallScreen
}

// Hook to detect if running on low-power mobile device
export function useLowPowerMode(): boolean {
  const [isLowPower, setIsLowPower] = useState(false)

  useEffect(() => {
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
    const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
    const isSmallScreen = window.innerWidth < 768
    setIsLowPower(isMobile && (hasLowMemory || hasLowCores || isSmallScreen))
  }, [])

  return isLowPower
}
