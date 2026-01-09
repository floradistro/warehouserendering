'use client'

import { useState, useEffect } from 'react'

export function useMobile(breakpoint: number = 768): boolean {
  // Start with false for SSR, then update on client
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark that we're on the client
    setIsClient(true)

    // Check mobile state
    const checkMobile = () => {
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const isSmallScreen = window.innerWidth < breakpoint
      setIsMobile(isTouchDevice || isSmallScreen)
    }

    // Initial check
    checkMobile()

    // Listen for changes
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
