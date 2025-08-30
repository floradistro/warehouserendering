'use client'

import React, { useState, useMemo } from 'react'
import { 
  Calculator, 
  Triangle, 
  Circle, 
  Ruler, 
  Home,
  Zap,
  TrendingUp,
  RotateCw,
  Square,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import {
  calculateRiseRun,
  riseRunFromPitch,
  riseRunFromAngle,
  calculateRadialSpan,
  radialSpanFromChordSagitta,
  Point2D,
  RiseRunResult,
  RadialSpanResult
} from '@/lib/geometry/GeometryCalculator'
import {
  designKingPostTruss,
  designQueenPostTruss,
  sizeBeam,
  designColumn,
  calculateCompoundMiter,
  calculateStairStringers,
  LUMBER_SIZES,
  TrussDesign,
  BeamSizing,
  ColumnDesign
} from '@/lib/geometry/FramingCalculator'

interface GeometryCalculatorPanelProps {
  className?: string
}

type CalculatorMode = 'rise-run' | 'radial' | 'truss' | 'beam' | 'column' | 'compound' | 'stairs'

export default function GeometryCalculatorPanel({ className = '' }: GeometryCalculatorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeMode, setActiveMode] = useState<CalculatorMode>('rise-run')
  
  // Rise/Run Calculator State
  const [riseRunInputs, setRiseRunInputs] = useState({
    point1: { x: 0, y: 0 },
    point2: { x: 12, y: 4 },
    inputMode: 'points' as 'points' | 'pitch' | 'angle',
    pitch: '4:12',
    angle: 18.43,
    run: 12
  })
  
  // Radial Calculator State
  const [radialInputs, setRadialInputs] = useState({
    inputMode: 'radius-angle' as 'radius-angle' | 'chord-sagitta',
    radius: 10,
    centralAngle: 90,
    chord: 14.14,
    sagitta: 2.93
  })
  
  // Truss Calculator State
  const [trussInputs, setTrussInputs] = useState({
    span: 24,
    pitch: '4:12',
    trussType: 'king-post' as 'king-post' | 'queen-post'
  })
  
  // Beam Calculator State
  const [beamInputs, setBeamInputs] = useState({
    span: 16,
    load: 50,
    deflectionLimit: 240,
    allowableStress: 1200
  })
  
  // Column Calculator State
  const [columnInputs, setColumnInputs] = useState({
    height: 10,
    axialLoad: 5000,
    endCondition: 'pinned' as 'pinned' | 'fixed'
  })
  
  // Compound Miter State
  const [compoundInputs, setCompoundInputs] = useState({
    pitch: '6:12',
    hipAngle: 45
  })
  
  // Stair Calculator State
  const [stairInputs, setStairInputs] = useState({
    totalRise: 96,
    totalRun: 120,
    maxRiserHeight: 7.75,
    minTreadDepth: 10
  })

  // Calculate results
  const riseRunResult = useMemo((): RiseRunResult | null => {
    try {
      switch (riseRunInputs.inputMode) {
        case 'points':
          return calculateRiseRun(riseRunInputs.point1, riseRunInputs.point2)
        case 'pitch':
          return riseRunFromPitch(riseRunInputs.pitch, riseRunInputs.run)
        case 'angle':
          return riseRunFromAngle(riseRunInputs.angle, riseRunInputs.run)
        default:
          return null
      }
    } catch {
      return null
    }
  }, [riseRunInputs])

  const radialResult = useMemo((): RadialSpanResult | null => {
    try {
      switch (radialInputs.inputMode) {
        case 'radius-angle':
          return calculateRadialSpan(radialInputs.radius, radialInputs.centralAngle)
        case 'chord-sagitta':
          return radialSpanFromChordSagitta(radialInputs.chord, radialInputs.sagitta)
        default:
          return null
      }
    } catch {
      return null
    }
  }, [radialInputs])

  const trussResult = useMemo((): TrussDesign | null => {
    try {
      return trussInputs.trussType === 'king-post' 
        ? designKingPostTruss(trussInputs.span, trussInputs.pitch)
        : designQueenPostTruss(trussInputs.span, trussInputs.pitch)
    } catch {
      return null
    }
  }, [trussInputs])

  const beamResult = useMemo((): BeamSizing | null => {
    try {
      return sizeBeam(beamInputs.span, beamInputs.load, beamInputs.deflectionLimit, beamInputs.allowableStress)
    } catch {
      return null
    }
  }, [beamInputs])

  const columnResult = useMemo((): ColumnDesign | null => {
    try {
      return designColumn(columnInputs.height, columnInputs.axialLoad, columnInputs.endCondition)
    } catch {
      return null
    }
  }, [columnInputs])

  const compoundResult = useMemo(() => {
    try {
      return calculateCompoundMiter(compoundInputs.pitch, compoundInputs.hipAngle)
    } catch {
      return null
    }
  }, [compoundInputs])

  const stairResult = useMemo(() => {
    try {
      return calculateStairStringers(
        stairInputs.totalRise,
        stairInputs.totalRun,
        stairInputs.maxRiserHeight,
        stairInputs.minTreadDepth
      )
    } catch {
      return null
    }
  }, [stairInputs])

  const calculatorModes = [
    { id: 'rise-run', icon: TrendingUp, label: 'Rise/Run', color: '#3b82f6' },
    { id: 'radial', icon: Circle, label: 'Radial', color: '#10b981' },
    { id: 'truss', icon: Triangle, label: 'Truss', color: '#f59e0b' },
    { id: 'beam', icon: Ruler, label: 'Beam', color: '#ef4444' },
    { id: 'column', icon: Square, label: 'Column', color: '#8b5cf6' },
    { id: 'compound', icon: RotateCw, label: 'Compound', color: '#06b6d4' },
    { id: 'stairs', icon: Home, label: 'Stairs', color: '#84cc16' }
  ]

  if (!isExpanded) {
    return (
      <div className={`bg-[#2d2d2d] border-r border-[#3e3e3e] ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-8 h-8 flex items-center justify-center text-[#858585] hover:text-[#cccccc] hover:bg-[#3c3c3c] transition-colors"
          title="Open Geometry Calculator"
        >
          <Calculator size={14} />
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-[#2d2d2d] border-r border-[#3e3e3e] w-80 h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#3e3e3e]">
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-[#cccccc]" />
          <span className="text-sm font-medium text-[#cccccc]">Geometry Calculator</span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="text-[#858585] hover:text-[#cccccc] transition-colors"
        >
          <ChevronUp size={16} />
        </button>
      </div>

      {/* Mode Selector */}
      <div className="p-2 border-b border-[#3e3e3e]">
        <div className="grid grid-cols-4 gap-1">
          {calculatorModes.map((mode) => {
            const Icon = mode.icon
            const isActive = activeMode === mode.id
            return (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id as CalculatorMode)}
                className={`p-2 rounded text-xs transition-colors ${
                  isActive
                    ? 'bg-[#3c3c3c] text-white border border-[#555]'
                    : 'text-[#858585] hover:bg-[#3c3c3c] hover:text-[#cccccc]'
                }`}
                title={mode.label}
              >
                <Icon size={14} className="mx-auto mb-1" />
                <div className="text-[10px]">{mode.label}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Calculator Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Rise/Run Calculator */}
        {activeMode === 'rise-run' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#cccccc] mb-3">Rise Over Run Calculator</div>
            
            {/* Input Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs text-[#858585]">Input Method</label>
              <select
                value={riseRunInputs.inputMode}
                onChange={(e) => setRiseRunInputs(prev => ({ ...prev, inputMode: e.target.value as any }))}
                className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
              >
                <option value="points">Two Points</option>
                <option value="pitch">Pitch (Rise:Run)</option>
                <option value="angle">Angle (Degrees)</option>
              </select>
            </div>

            {/* Input Fields */}
            {riseRunInputs.inputMode === 'points' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#858585]">Point 1 (X,Y)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={riseRunInputs.point1.x}
                      onChange={(e) => setRiseRunInputs(prev => ({
                        ...prev,
                        point1: { ...prev.point1, x: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-1 py-1"
                    />
                    <input
                      type="number"
                      value={riseRunInputs.point1.y}
                      onChange={(e) => setRiseRunInputs(prev => ({
                        ...prev,
                        point1: { ...prev.point1, y: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-1 py-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#858585]">Point 2 (X,Y)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      value={riseRunInputs.point2.x}
                      onChange={(e) => setRiseRunInputs(prev => ({
                        ...prev,
                        point2: { ...prev.point2, x: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-1 py-1"
                    />
                    <input
                      type="number"
                      value={riseRunInputs.point2.y}
                      onChange={(e) => setRiseRunInputs(prev => ({
                        ...prev,
                        point2: { ...prev.point2, y: parseFloat(e.target.value) || 0 }
                      }))}
                      className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-1 py-1"
                    />
                  </div>
                </div>
              </div>
            )}

            {riseRunInputs.inputMode === 'pitch' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#858585]">Pitch (Rise:Run)</label>
                  <input
                    type="text"
                    value={riseRunInputs.pitch}
                    onChange={(e) => setRiseRunInputs(prev => ({ ...prev, pitch: e.target.value }))}
                    placeholder="4:12"
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#858585]">Run (ft)</label>
                  <input
                    type="number"
                    value={riseRunInputs.run}
                    onChange={(e) => setRiseRunInputs(prev => ({ ...prev, run: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
              </div>
            )}

            {riseRunInputs.inputMode === 'angle' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#858585]">Angle (degrees)</label>
                  <input
                    type="number"
                    value={riseRunInputs.angle}
                    onChange={(e) => setRiseRunInputs(prev => ({ ...prev, angle: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#858585]">Run (ft)</label>
                  <input
                    type="number"
                    value={riseRunInputs.run}
                    onChange={(e) => setRiseRunInputs(prev => ({ ...prev, run: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {riseRunResult && (
              <div className="bg-[#3c3c3c] rounded p-3 space-y-2">
                <div className="text-xs font-medium text-[#cccccc]">Results</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#858585]">Rise:</span>
                    <span className="text-[#cccccc] ml-1">{riseRunResult.rise.toFixed(2)} ft</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Run:</span>
                    <span className="text-[#cccccc] ml-1">{riseRunResult.run.toFixed(2)} ft</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Slope:</span>
                    <span className="text-[#cccccc] ml-1">{riseRunResult.slope.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Angle:</span>
                    <span className="text-[#cccccc] ml-1">{riseRunResult.angle.toFixed(2)}°</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Pitch:</span>
                    <span className="text-[#cccccc] ml-1">{riseRunResult.pitch}</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Percentage:</span>
                    <span className="text-[#cccccc] ml-1">{riseRunResult.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#858585]">Hypotenuse:</span>
                    <span className="text-[#cccccc] ml-1">{riseRunResult.hypotenuse.toFixed(2)} ft</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Radial Span Calculator */}
        {activeMode === 'radial' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#cccccc] mb-3">Radial Span Calculator</div>
            
            {/* Input Mode */}
            <div className="space-y-2">
              <label className="text-xs text-[#858585]">Input Method</label>
              <select
                value={radialInputs.inputMode}
                onChange={(e) => setRadialInputs(prev => ({ ...prev, inputMode: e.target.value as any }))}
                className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
              >
                <option value="radius-angle">Radius & Central Angle</option>
                <option value="chord-sagitta">Chord & Sagitta</option>
              </select>
            </div>

            {/* Input Fields */}
            {radialInputs.inputMode === 'radius-angle' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#858585]">Radius (ft)</label>
                  <input
                    type="number"
                    value={radialInputs.radius}
                    onChange={(e) => setRadialInputs(prev => ({ ...prev, radius: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#858585]">Central Angle (°)</label>
                  <input
                    type="number"
                    value={radialInputs.centralAngle}
                    onChange={(e) => setRadialInputs(prev => ({ ...prev, centralAngle: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
              </div>
            )}

            {radialInputs.inputMode === 'chord-sagitta' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#858585]">Chord (ft)</label>
                  <input
                    type="number"
                    value={radialInputs.chord}
                    onChange={(e) => setRadialInputs(prev => ({ ...prev, chord: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#858585]">Sagitta (ft)</label>
                  <input
                    type="number"
                    value={radialInputs.sagitta}
                    onChange={(e) => setRadialInputs(prev => ({ ...prev, sagitta: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                  />
                </div>
              </div>
            )}

            {/* Results */}
            {radialResult && (
              <div className="bg-[#3c3c3c] rounded p-3 space-y-2">
                <div className="text-xs font-medium text-[#cccccc]">Results</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#858585]">Radius:</span>
                    <span className="text-[#cccccc] ml-1">{radialResult.radius.toFixed(2)} ft</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Diameter:</span>
                    <span className="text-[#cccccc] ml-1">{radialResult.diameter.toFixed(2)} ft</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Arc Length:</span>
                    <span className="text-[#cccccc] ml-1">{radialResult.arcLength.toFixed(2)} ft</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Chord:</span>
                    <span className="text-[#cccccc] ml-1">{radialResult.chord.toFixed(2)} ft</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Sagitta:</span>
                    <span className="text-[#cccccc] ml-1">{radialResult.sagitta.toFixed(2)} ft</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Central Angle:</span>
                    <span className="text-[#cccccc] ml-1">{radialResult.centralAngle.toFixed(1)}°</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#858585]">Sector Area:</span>
                    <span className="text-[#cccccc] ml-1">{radialResult.area.toFixed(2)} ft²</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Beam Sizing Calculator */}
        {activeMode === 'beam' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#cccccc] mb-3">Beam Sizing Calculator</div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-[#858585]">Span (ft)</label>
                <input
                  type="number"
                  value={beamInputs.span}
                  onChange={(e) => setBeamInputs(prev => ({ ...prev, span: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-xs text-[#858585]">Load (lbs/ft)</label>
                <input
                  type="number"
                  value={beamInputs.load}
                  onChange={(e) => setBeamInputs(prev => ({ ...prev, load: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-xs text-[#858585]">Deflection Limit (L/x)</label>
                <input
                  type="number"
                  value={beamInputs.deflectionLimit}
                  onChange={(e) => setBeamInputs(prev => ({ ...prev, deflectionLimit: parseFloat(e.target.value) || 240 }))}
                  className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                />
              </div>
              <div>
                <label className="text-xs text-[#858585]">Allowable Stress (psi)</label>
                <input
                  type="number"
                  value={beamInputs.allowableStress}
                  onChange={(e) => setBeamInputs(prev => ({ ...prev, allowableStress: parseFloat(e.target.value) || 1200 }))}
                  className="w-full bg-[#3c3c3c] text-[#cccccc] text-xs border border-[#555] rounded px-2 py-1"
                />
              </div>
            </div>

            {/* Results */}
            {beamResult && (
              <div className={`rounded p-3 space-y-2 ${beamResult.isAdequate ? 'bg-green-900/30 border border-green-600/50' : 'bg-red-900/30 border border-red-600/50'}`}>
                <div className="text-xs font-medium text-[#cccccc] flex items-center gap-2">
                  Beam Sizing Results
                  {beamResult.isAdequate ? (
                    <span className="text-green-400 text-[10px]">✓ ADEQUATE</span>
                  ) : (
                    <span className="text-red-400 text-[10px]">⚠ INADEQUATE</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2">
                    <span className="text-[#858585]">Recommended Size:</span>
                    <span className="text-[#cccccc] ml-1 font-medium">{beamResult.recommendedSize}</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Deflection:</span>
                    <span className="text-[#cccccc] ml-1">{beamResult.deflection.toFixed(3)}"</span>
                  </div>
                  <div>
                    <span className="text-[#858585]">Stress Ratio:</span>
                    <span className="text-[#cccccc] ml-1">{beamResult.stressRatio.toFixed(2)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#858585]">Safety Factor:</span>
                    <span className="text-[#cccccc] ml-1">{beamResult.safetyFactor.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add other calculator modes here... */}
        {activeMode === 'truss' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#cccccc] mb-3">Truss Design Calculator</div>
            <div className="text-xs text-[#858585]">Coming soon - Truss calculations</div>
          </div>
        )}
        
        {activeMode === 'column' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#cccccc] mb-3">Column Design Calculator</div>
            <div className="text-xs text-[#858585]">Coming soon - Column calculations</div>
          </div>
        )}
        
        {activeMode === 'compound' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#cccccc] mb-3">Compound Miter Calculator</div>
            <div className="text-xs text-[#858585]">Coming soon - Compound miter calculations</div>
          </div>
        )}
        
        {activeMode === 'stairs' && (
          <div className="space-y-4">
            <div className="text-sm font-medium text-[#cccccc] mb-3">Stair Calculator</div>
            <div className="text-xs text-[#858585]">Coming soon - Stair calculations</div>
          </div>
        )}
      </div>
    </div>
  )
}
