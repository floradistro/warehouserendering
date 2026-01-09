'use client'

import { useState, useEffect, useRef } from 'react'

// Get initial mobile state synchronously to prevent flash
function getInitialMobileState(breakpoint: number): boolean {
  if (typeof window === 'undefined') return false
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth < breakpoint
  return isTouchDevice || isSmallScreen
}

export function useMobile(breakpoint: number = 768): boolean {
  // Initialize with correct value immediately to prevent re-render flash
  const [isMobile, setIsMobile] = useState(() => getInitialMobileState(breakpoint))
  const initialized = useRef(false)

  useEffect(() => {
    // Skip first effect run since we already have the correct initial value
    if (!initialized.current) {
      initialized.current = true
      return
    }

    // Only listen for resize/orientation changes after initial render
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < breakpoint
      setIsMobile(isTouchDevice || isSmallScreen)
    }

    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [breakpoint])

  return isMobile
}

// Static check for SSR-safe initial detection
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth < 768
  return isTouchDevice || isSmallScreen
}

// Get initial low power state synchronously
function getInitialLowPowerState(): boolean {
  if (typeof window === 'undefined') return false
  const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const hasLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
  const hasLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
  const isSmallScreen = window.innerWidth < 768
  return isMobile && (hasLowMemory || hasLowCores || isSmallScreen)
}

// Hook to detect if running on low-power mobile device
export function useLowPowerMode(): boolean {
  // Initialize with correct value immediately
  const [isLowPower] = useState(() => getInitialLowPowerState())
  return isLowPower
}
