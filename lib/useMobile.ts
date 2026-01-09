'use client'

import { useState, useEffect, useRef } from 'react'

// Cached mobile state - computed once on first client render, never changes
let cachedIsMobile: boolean | null = null

function computeIsMobile(breakpoint: number): boolean {
  if (typeof window === 'undefined') return false
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth < breakpoint
  return isTouchDevice || isSmallScreen
}

export function useMobile(breakpoint: number = 768): boolean {
  // Use ref to track if we've initialized
  const initialized = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Only compute once per app lifetime
    if (cachedIsMobile === null) {
      cachedIsMobile = computeIsMobile(breakpoint)
    }

    // Only update state once
    if (!initialized.current) {
      initialized.current = true
      setIsMobile(cachedIsMobile)
    }
  }, [breakpoint])

  return isMobile
}

// Stable hook that never changes after first render - use for Canvas props
export function useStableMobile(breakpoint: number = 768): boolean {
  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    if (cachedIsMobile !== null) return cachedIsMobile
    cachedIsMobile = computeIsMobile(breakpoint)
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
