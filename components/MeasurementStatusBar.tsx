import React, { useState, useMemo } from 'react'
import { useMeasurementStore, useVisibleMeasurements } from '../lib/measurement/MeasurementStore'
import {
  formatMeasurement,
  formatAngularMeasurement,
  formatAreaMeasurement,
  LinearMeasurement,
  AngularMeasurement,
  AreaMeasurement,
  Measurement
} from '../lib/measurement/MeasurementTypes'
import { useAppStore } from '../lib/store'
import {
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Ruler,
  RotateCw,
  Square,
  Box,
  Circle,
  Triangle,
  Route,
  Gauge,
  X,
  Download,
  Trash2,
  MousePointer,
  Package,
  Layers,
  Info,
  ChevronUp,
  ChevronDown,
  MapPin,
  Wrench,
  Palette,
  Database
} from 'lucide-react'

interface MeasurementStatusBarProps {
  className?: string
}

/**
 * Bottom status bar for measurement display and management with integrated object info panel
 */
export const MeasurementStatusBar: React.FC<MeasurementStatusBarProps> = ({
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const [isInfoExpanded, setIsInfoExpanded] = useState(false)
  const [isCostExpanded, setIsCostExpanded] = useState(false)
  
  const {
    activeTool,
    currentPoints,
    defaultUnit,
    defaultPrecision,
    showAllMeasurements,
    toggleAllMeasurements,
    deleteMeasurement,
    exportMeasurements,
    getTotalDistance,
    getTotalArea
  } = useMeasurementStore()
  
  const { selectedElements, currentFloorplan } = useAppStore()
  const measurements = useVisibleMeasurements()
  
  // Get selected object details
  const selectedObjects = useMemo(() => {
    if (!currentFloorplan || selectedElements.length === 0) return []
    
    return currentFloorplan.elements.filter(element => 
      selectedElements.includes(element.id)
    ).map(element => ({
      id: element.id,
      type: element.type,
      material: element.material,
      dimensions: element.dimensions,
      metadata: element.metadata
    }))
  }, [selectedElements, currentFloorplan])
  
  // Get selection summary
  const selectionSummary = useMemo(() => {
    if (selectedObjects.length === 0) return null
    
    const types = selectedObjects.reduce((acc, obj) => {
      acc[obj.type] = (acc[obj.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    const typeLabels = Object.entries(types).map(([type, count]) => 
      count > 1 ? `${count} ${type}s` : `1 ${type}`
    ).join(', ')
    
    return {
      count: selectedObjects.length,
      typeLabels,
      totalVolume: selectedObjects.reduce((sum, obj) => 
        sum + (obj.dimensions.width * obj.dimensions.height * (obj.dimensions.depth || 1)), 0
      )
    }
  }, [selectedObjects])
  
  // Get icon for measurement type
  const getTypeIcon = (type: string) => {
    const icons = {
      linear: Ruler,
      angular: RotateCw,
      area: Square,
      volume: Box,
      radius: Circle,
      diameter: Triangle,
      path: Route,
      clearance: Gauge
    }
    return icons[type as keyof typeof icons] || Ruler
  }
  
  // Format measurement value
  const formatMeasurementValue = (measurement: Measurement): string => {
    switch (measurement.type) {
      case 'linear':
        const linear = measurement as LinearMeasurement
        return formatMeasurement(linear.totalDistance, linear.unit, linear.precision)
      case 'angular':
        const angular = measurement as AngularMeasurement
        return formatAngularMeasurement(angular.angle, angular.unit, angular.precision)
      case 'area':
        const area = measurement as AreaMeasurement
        return formatAreaMeasurement(area.area, area.unit, area.precision)
      default:
        return 'N/A'
    }
  }
  
  // Calculate live measurement preview
  const livePreview = useMemo(() => {
    if (!activeTool || currentPoints.length < 2) return null
    
    const start = currentPoints[0]
    const end = currentPoints[currentPoints.length - 1]
    
    // Calculate horizontal distance
    const distance = Math.sqrt(
      Math.pow((end.x || 0) - (start.x || 0), 2) + 
      Math.pow((end.z || 0) - (start.z || 0), 2)
    )
    
    return {
      tool: activeTool,
      points: currentPoints.length,
      distance: formatMeasurement(distance, defaultUnit, defaultPrecision),
      coordinates: {
        start: { x: (start.x || 0).toFixed(1), z: (start.z || 0).toFixed(1) },
        end: { x: (end.x || 0).toFixed(1), z: (end.z || 0).toFixed(1) }
      }
    }
  }, [activeTool, currentPoints, defaultUnit, defaultPrecision])
  
  // Get detailed object info for selected element
  const getObjectTypeInfo = (element: any) => {
    if (!element) return null

    if (element.id.includes('electrical-panel')) {
      return {
        icon: '⚡',
        type: 'Electrical Panel',
        category: element.id.includes('main') ? 'Main Distribution' : 'Branch Circuit',
        specifications: {
          'Voltage': '480V/277V',
          'Mounting': element.rotation === 90 ? 'Wall-mounted' : 'Floor-standing',
          'Capacity': element.id.includes('main') ? '400-800 Amps' : '100-200 Amps',
          'Type': 'Industrial Grade'
        }
      }
    } else if (element.id.includes('ibc-tote')) {
      const number = element.id.match(/\d+$/)?.[0] || 'Unknown'
      return {
        icon: '🪣',
        type: 'IBC Tote Container',
        category: `Unit ${number} - ${element.id.includes('top') ? 'Upper Rack' : 'Ground Level'}`,
        specifications: {
          'Capacity': element.metadata?.capacity_gallons ? `${element.metadata.capacity_gallons} gallons` : '275 gallons',
          'Material': 'HDPE Plastic',
          'Level': element.metadata?.liquid_level ? `${(element.metadata.liquid_level * 100).toFixed(0)}% full` : 'Unknown',
          'Stack Position': element.id.includes('top') ? 'Upper Rack' : 'Ground Level',
          'Use': 'Chemical/Liquid Storage'
        }
      }
    } else if (element.id.includes('norwesco-tank')) {
      return {
        icon: '🛢️',
        type: 'Norwesco Storage Tank',
        category: 'Bulk Liquid Storage',
        specifications: {
          'Capacity': '~1,500 gallons',
          'Material': 'Polyethylene',
          'Type': 'Vertical Storage',
          'Use': 'Bulk liquid storage'
        }
      }
    } else if (element.id.includes('wall')) {
      return {
        icon: '🧱',
        type: element.id.includes('room-wall') ? 'Interior Room Wall' : 'Building Wall',
        category: element.id.includes('room-wall') ? 'Space Division' : 'Structural Element',
        specifications: {
          'Function': element.id.includes('room-wall') ? 'Room separation' : 'Building envelope',
          'Thickness': `${element.dimensions.depth || 8}"`,
          'Material': 'Drywall/Steel frame',
          'Type': element.id.includes('exterior') ? 'Exterior' : 'Interior'
        }
      }
    } else if (element.id.includes('floor') && element.id.includes('epoxy')) {
      const color = element.id.includes('black') ? 'Black' : element.id.includes('white') ? 'White' : 'Standard'
      return {
        icon: '⬜',
        type: 'Epoxy Floor Coating',
        category: `${color} Industrial Flooring`,
        specifications: {
          'Color': color,
          'Type': 'Chemical-resistant epoxy',
          'Thickness': `${element.dimensions.depth || 0.125}"`,
          'Use': 'Industrial floor protection'
        }
      }
    } else if (element.id.includes('beam')) {
      return {
        icon: '🏗️',
        type: element.id.includes('steel') ? 'Steel I-Beam' : 'TJI Beam',
        category: 'Structural Support',
        specifications: {
          'Material': element.id.includes('steel') ? 'Structural steel' : 'Engineered lumber',
          'Function': 'Primary structural support',
          'Load Type': 'Compression/Tension',
          'Grade': element.id.includes('steel') ? 'A992 Steel' : 'Engineered Wood'
        }
      }
    }

    return {
      icon: '📦',
      type: element.type.charAt(0).toUpperCase() + element.type.slice(1),
      category: 'Warehouse Component',
      specifications: {
        'Type': element.type,
        'Function': 'General warehouse component'
      }
    }
  }

  const selectedElement = selectedObjects.length > 0 ? selectedObjects[0] : null
  const typeInfo = selectedElement ? getObjectTypeInfo(selectedElement) : null
  const volume = selectedElement ? 
    (selectedElement.dimensions.width * selectedElement.dimensions.height * (selectedElement.dimensions.depth || 0)).toFixed(2) 
    : '0'

  // Get cost information for selected element
  const getCostInfo = (element: any) => {
    if (!element) return null

    const volume = element.dimensions.width * element.dimensions.height * (element.dimensions.depth || 0)
    const area = element.dimensions.width * element.dimensions.height

    if (element.id.includes('electrical-panel')) {
      const isMain = element.id.includes('main')
      const baseCost = isMain ? 2500 : 800
      const installCost = isMain ? 1200 : 400
      return {
        materialCost: baseCost,
        laborCost: installCost,
        totalCost: baseCost + installCost,
        breakdown: {
          'Panel Unit': `$${baseCost}`,
          'Installation': `$${installCost}`,
          'Electrical Permit': '$150',
          'Inspection': '$100'
        },
        unit: 'per panel'
      }
    } else if (element.id.includes('ibc-tote')) {
      const capacity = element.metadata?.capacity_gallons || 275
      const costPerGallon = 2.5
      const baseCost = Math.round(capacity * costPerGallon)
      return {
        materialCost: baseCost,
        laborCost: 150,
        totalCost: baseCost + 150,
        breakdown: {
          'IBC Tote Container': `$${baseCost}`,
          'Delivery & Setup': '$150',
          'Rack Installation': element.id.includes('top') ? '$200' : '$0'
        },
        unit: `${capacity} gallon capacity`
      }
    } else if (element.id.includes('norwesco-tank')) {
      return {
        materialCost: 3200,
        laborCost: 800,
        totalCost: 4000,
        breakdown: {
          'Storage Tank': '$3,200',
          'Foundation': '$500',
          'Installation': '$300'
        },
        unit: '1,500 gallon capacity'
      }
    } else if (element.id.includes('wall')) {
      const isInteriorWall = element.id.includes('room-wall')
      const isExteriorWall = element.id.includes('wall-left') || element.id.includes('wall-right') || 
                           element.id.includes('wall-top') || element.id.includes('wall-bottom')
      
      // Fix wall dimension mapping: width=length, depth=height, height=thickness
      const wallLength = element.dimensions.width     // Length of wall
      const wallHeight = element.dimensions.depth || 12  // Actual height (stored in depth)
      const wallThickness = element.dimensions.height    // Wall thickness (stored in height)
      const wallArea = wallLength * wallHeight           // Correct area calculation
      
      // Debug the corrected wall dimensions
      console.log('🧱 Wall Dimensions Fixed:', {
        elementId: element.id,
        rawDimensions: element.dimensions,
        wallLength: wallLength,
        wallHeight: wallHeight,
        wallThickness: wallThickness,
        correctArea: wallArea,
        isInteriorWall,
        isExteriorWall
      })
      
      // === STEEL FRAMING CALCULATIONS ===
      // Vertical studs: 16" OC + end studs
      const studSpacing = 16 / 12  // 16" on center = 1.33 feet
      const numStuds = Math.ceil(wallLength / studSpacing) + 1  // Add 1 for end stud
      const studLength = wallHeight  // Full height studs
      const totalStudLinearFeet = numStuds * studLength
      
      // Top and bottom plates (double bottom plate for commercial)
      const topPlateLinearFeet = wallLength
      const bottomPlateLinearFeet = wallLength * 2  // Double bottom plate
      const totalPlateLinearFeet = topPlateLinearFeet + bottomPlateLinearFeet
      
      // Total steel framing
      const totalFramingLinearFeet = totalStudLinearFeet + totalPlateLinearFeet
      const steelStudCostPerFoot = 2.85  // 25ga 6" steel stud
      const steelPlateCostPerFoot = 3.25  // Steel track/plate
      
      const studCost = Math.round(totalStudLinearFeet * steelStudCostPerFoot)
      const plateCost = Math.round(totalPlateLinearFeet * steelPlateCostPerFoot)
      const fastenersCost = Math.round(wallArea * 0.45)  // Screws, clips, etc.
      const framingMaterialCost = studCost + plateCost + fastenersCost
      const framingLaborCost = Math.round(totalFramingLinearFeet * 4.50)  // Installation labor per linear foot
      const totalFramingCost = framingMaterialCost + framingLaborCost
      
      // === DRYWALL CALCULATIONS ===
      const hasDrywall = isInteriorWall || isExteriorWall
      const drywallSides = isInteriorWall ? 2 : 1
      const totalDrywallArea = wallArea * drywallSides
      
      // Drywall sheets (4x8 = 32 sq ft per sheet) - add 10% waste
      const drywallSheetsNeeded = Math.ceil(totalDrywallArea / 32)
      const drywallSheetsWithWaste = Math.ceil(drywallSheetsNeeded * 1.1)  // 10% waste factor
      const drywallSheetCost = 28.50  // 5/8" Type X fire-rated sheet (commercial grade)
      const drywallSheetsCost = drywallSheetsWithWaste * drywallSheetCost
      
      // Drywall supplies (more accurate quantities)
      const jointCompoundBuckets = Math.ceil(totalDrywallArea / 300)  // 1 bucket per 300 sq ft (more realistic)
      const jointCompoundCost = jointCompoundBuckets * 32  // 5-gallon bucket price
      
      // Paper tape - need more for interior walls (more joints)
      const tapeRolls = Math.ceil(totalDrywallArea / 120)  // 1 roll per 120 sq ft
      const tapeCost = tapeRolls * 12
      
      // Drywall screws - 1 lb per 100 sq ft
      const screwBoxes = Math.ceil(totalDrywallArea / 100)
      const screwsCost = screwBoxes * 18
      
      // Corner bead - all inside and outside corners
      const cornerBeadLinearFeet = wallHeight * 4  // More realistic corner count
      const cornerBeadCost = Math.round(cornerBeadLinearFeet * 2.15)
      
      // Primer and texture
      const primerCost = Math.round(totalDrywallArea * 0.85)  // Primer coverage
      const textureCost = Math.round(totalDrywallArea * 0.65)  // Texture material
      
      const drywallMaterialCost = hasDrywall ? 
        drywallSheetsCost + jointCompoundCost + tapeCost + screwsCost + cornerBeadCost + primerCost + textureCost : 0
      
      // Labor costs - more accurate for commercial work
      const hangingLabor = hasDrywall ? Math.round(totalDrywallArea * 2.25) : 0    // Hanging sheets
      const tapingLabor = hasDrywall ? Math.round(totalDrywallArea * 3.50) : 0     // Taping and finishing
      const textureLabor = hasDrywall ? Math.round(totalDrywallArea * 1.75) : 0    // Texture application
      const drywallLaborCost = hangingLabor + tapingLabor + textureLabor
      
      const totalDrywallCost = drywallMaterialCost + drywallLaborCost
      
      // === INSULATION (Exterior walls only) ===
      const insulationBatts = isExteriorWall ? Math.ceil(wallArea / 49) : 0  // R-19 batts cover ~49 sq ft
      const insulationCost = insulationBatts * 32  // $32 per batt
      const insulationLaborCost = isExteriorWall ? Math.round(wallArea * 1.25) : 0
      const totalInsulationCost = insulationCost + insulationLaborCost
      
      // === ADDITIONAL MATERIALS ===
      const vaporBarrierCost = isExteriorWall ? Math.round(wallArea * 0.35) : 0
      const fireBlockingLinearFeet = wallLength * 2  // Top and bottom blocking
      const fireBlockingCost = Math.round(fireBlockingLinearFeet * 2.85)
      
      const totalMaterialCost = framingMaterialCost + drywallMaterialCost + insulationCost + vaporBarrierCost + fireBlockingCost
      const totalLaborCost = framingLaborCost + drywallLaborCost + insulationLaborCost
      const grandTotal = totalMaterialCost + totalLaborCost
      
      // Detailed breakdown with quantities
      const breakdown: Record<string, string> = {
        // Framing breakdown
        'Steel Studs': `${numStuds} studs × ${studLength.toFixed(1)}' = ${totalStudLinearFeet.toFixed(0)} LF @ $2.85 = $${studCost}`,
        'Steel Plates': `${totalPlateLinearFeet.toFixed(0)} LF @ $3.25 = $${plateCost}`,
        'Fasteners & Hardware': `$${fastenersCost}`,
        'Framing Labor': `${totalFramingLinearFeet.toFixed(0)} LF @ $4.50 = $${framingLaborCost}`,
        '🔧 FRAMING TOTAL': `$${totalFramingCost}`
      }
      
      if (hasDrywall) {
        breakdown['Drywall Sheets'] = `${drywallSheetsWithWaste} sheets (4'×8') @ $28.50 = $${drywallSheetsCost}`
        breakdown['Joint Compound'] = `${jointCompoundBuckets} buckets (5-gal) @ $32 = $${jointCompoundCost}`
        breakdown['Paper Tape'] = `${tapeRolls} rolls @ $12 = $${tapeCost}`
        breakdown['Drywall Screws'] = `${screwBoxes} lbs @ $18 = $${screwsCost}`
        breakdown['Corner Bead'] = `${cornerBeadLinearFeet.toFixed(0)} LF @ $2.15 = $${cornerBeadCost}`
        breakdown['Primer & Texture'] = `$${primerCost + textureCost}`
        breakdown['Hanging Labor'] = `${totalDrywallArea.toFixed(0)} sq ft @ $2.25 = $${hangingLabor}`
        breakdown['Taping Labor'] = `${totalDrywallArea.toFixed(0)} sq ft @ $3.50 = $${tapingLabor}`
        breakdown['Texture Labor'] = `${totalDrywallArea.toFixed(0)} sq ft @ $1.75 = $${textureLabor}`
        breakdown['🧱 DRYWALL TOTAL'] = `$${totalDrywallCost} (${totalDrywallArea.toFixed(0)} sq ft coverage)`
      } else {
        breakdown['🧱 DRYWALL'] = 'Not included'
      }
      
      if (isExteriorWall && insulationBatts > 0) {
        breakdown['Insulation Batts'] = `${insulationBatts} R-19 batts @ $32 = $${insulationCost}`
        breakdown['Insulation Labor'] = `$${insulationLaborCost}`
        breakdown['🏠 INSULATION TOTAL'] = `$${totalInsulationCost}`
      }
      
      if (vaporBarrierCost > 0) {
        breakdown['Vapor Barrier'] = `$${vaporBarrierCost}`
      }
      
      breakdown['Fire Blocking'] = `${fireBlockingLinearFeet.toFixed(0)} LF @ $2.85 = $${fireBlockingCost}`
      
      return {
        materialCost: totalMaterialCost,
        laborCost: totalLaborCost,
        totalCost: grandTotal,
        breakdown,
        unit: `${wallArea.toFixed(1)} sq ft wall`,
        wallDetails: {
          wallType: isExteriorWall ? 'Exterior Wall' : isInteriorWall ? 'Interior Wall' : 'Wall',
          hasDrywall,
          drywallSides,
          framingCost: totalFramingCost,
          drywallCost: totalDrywallCost,
          insulationCost: totalInsulationCost,
          quantities: {
            studs: `${numStuds} studs (${totalStudLinearFeet.toFixed(0)} LF)`,
            plates: `${totalPlateLinearFeet.toFixed(0)} LF steel track`,
            drywallSheets: hasDrywall ? `${drywallSheetsWithWaste} sheets (4'×8')` : 'None',
            drywallArea: hasDrywall ? `${totalDrywallArea.toFixed(0)} sq ft` : 'None',
            insulationBatts: insulationBatts > 0 ? `${insulationBatts} R-19 batts` : 'None'
          }
        }
      }
    } else if (element.id.includes('floor') && element.id.includes('epoxy')) {
      const costPerSqFt = element.id.includes('black') ? 8 : 12
      const materialCost = Math.round(area * costPerSqFt * 0.6)
      const laborCost = Math.round(area * costPerSqFt * 0.4)
      return {
        materialCost,
        laborCost,
        totalCost: materialCost + laborCost,
        breakdown: {
          'Epoxy Material': `$${materialCost}`,
          'Surface Prep': `$${Math.round(area * 2)}`,
          'Application': `$${Math.round(area * 1.5)}`,
          'Finish Coat': `$${Math.round(area * 1)}`
        },
        unit: `${area.toFixed(1)} sq ft`
      }
    } else if (element.id.includes('beam')) {
      const isSteel = element.id.includes('steel')
      const costPerFt = isSteel ? 45 : 25
      const length = element.dimensions.width
      const materialCost = Math.round(length * costPerFt)
      const laborCost = Math.round(length * (isSteel ? 20 : 12))
      return {
        materialCost,
        laborCost,
        totalCost: materialCost + laborCost,
        breakdown: {
          'Beam Material': `$${materialCost}`,
          'Hardware': `$${Math.round(length * 5)}`,
          'Installation': `$${laborCost}`,
          'Engineering': '$200'
        },
        unit: `${length}' length`
      }
    }

    // Default cost for other elements
    const estimatedCost = Math.round(volume * 15)
    return {
      materialCost: Math.round(estimatedCost * 0.7),
      laborCost: Math.round(estimatedCost * 0.3),
      totalCost: estimatedCost,
      breakdown: {
        'Materials': `$${Math.round(estimatedCost * 0.7)}`,
        'Labor': `$${Math.round(estimatedCost * 0.3)}`
      },
      unit: `${volume} cu ft`
    }
  }

  const costInfo = selectedElement ? getCostInfo(selectedElement) : null
  
  return (
    <div className={`relative bg-[#2d2d2d] border-t border-[#3e3e3e] flex-shrink-0 ${className}`}>
      {/* Main Status Bar */}
      <div className="h-6 px-3 flex items-center justify-between text-[10px] text-[#cccccc]">
        {/* Left: Current Tool Status or Selection Info */}
        <div className="flex items-center gap-3">
          {activeTool ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {React.createElement(getTypeIcon(activeTool), { size: 10 })}
                <span className="font-medium">{activeTool.toUpperCase()}</span>
              </div>
              
              {livePreview ? (
                <div className="flex items-center gap-3 text-[#858585]">
                  <span>{livePreview.points} point{livePreview.points !== 1 ? 's' : ''}</span>
                  <span className="text-white font-mono">{livePreview.distance}</span>
                  <span className="text-[8px]">
                    ({livePreview.coordinates.start.x}, {livePreview.coordinates.start.z}) → 
                    ({livePreview.coordinates.end.x}, {livePreview.coordinates.end.z})
                  </span>
                  {livePreview.points >= 2 && (
                    <span className="text-green-400 text-[10px] font-medium">
                      ✓ Ready - Press ESC to clear or select new tool
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-[#858585]">Double-click points to measure</span>
              )}
            </div>
          ) : selectionSummary ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <MousePointer size={10} />
                <span className="font-medium text-[#0e639c]">SELECTED</span>
              </div>
              
              <div className="flex items-center gap-3 text-[#858585]">
                <span className="text-white font-medium">
                  {selectionSummary.count} item{selectionSummary.count !== 1 ? 's' : ''}
                </span>
                <span className="text-[#cccccc]">
                  {selectionSummary.typeLabels}
                </span>
                {selectionSummary.totalVolume > 0 && (
                  <span className="text-[8px]">
                    Vol: {selectionSummary.totalVolume.toFixed(1)}ft³
                  </span>
                )}
              </div>

              {/* Info Button */}
              {typeInfo && (
                <button
                  onClick={() => {
                    setIsInfoExpanded(!isInfoExpanded)
                    if (!isInfoExpanded) setIsCostExpanded(false) // Close cost panel when opening info
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all duration-200 ease-out text-[#cccccc] ${
                    isInfoExpanded 
                      ? 'bg-[#0e639c] text-white shadow-sm transform scale-105' 
                      : 'hover:bg-[#3c3c3c] hover:transform hover:scale-105'
                  }`}
                  title="Show detailed object information"
                >
                  <Info size={10} className="transition-transform duration-200" />
                  <span className="text-[10px] font-medium">Info</span>
                  <div className="transition-transform duration-300 ease-out">
                    {isInfoExpanded ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                  </div>
                </button>
              )}

              {/* Materials Cost Button */}
              {costInfo && (
                <button
                  onClick={() => {
                    setIsCostExpanded(!isCostExpanded)
                    if (!isCostExpanded) setIsInfoExpanded(false) // Close info panel when opening cost
                  }}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded transition-all duration-200 ease-out text-[#cccccc] ${
                    isCostExpanded 
                      ? 'bg-[#0e639c] text-white shadow-sm transform scale-105' 
                      : 'hover:bg-[#3c3c3c] hover:transform hover:scale-105'
                  }`}
                  title="Show materials cost breakdown"
                >
                  <span className="text-[10px] font-medium">Cost</span>
                  <span className="text-[8px] font-mono">${costInfo.totalCost.toLocaleString()}</span>
                  <div className="transition-transform duration-300 ease-out">
                    {isCostExpanded ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                  </div>
                </button>
              )}
            </div>
          ) : (
            <span className="text-[#858585]">Select objects or measurement tool</span>
          )}
        </div>
        
        {/* Center: Measurement Navigation */}
        {measurements.length > 0 && (
          <div className="flex items-center gap-2">
            {!showAll ? (
              // Single measurement view
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="flex items-center justify-center w-4 h-4 hover:bg-[#3c3c3c] rounded disabled:text-[#555]"
                  title="Previous measurement"
                >
                  <ChevronLeft size={10} />
                </button>
                
                <div className="flex items-center gap-1 text-[#cccccc]">
                  {React.createElement(getTypeIcon(measurements[currentIndex]?.type), { size: 10 })}
                  <span className="font-mono text-white">
                    {measurements[currentIndex] ? formatMeasurementValue(measurements[currentIndex]) : ''}
                  </span>
                  <span className="text-[#858585]">
                    {currentIndex + 1}/{measurements.length}
                  </span>
                </div>
                
                <button
                  onClick={() => setCurrentIndex(Math.min(measurements.length - 1, currentIndex + 1))}
                  disabled={currentIndex === measurements.length - 1}
                  className="flex items-center justify-center w-4 h-4 hover:bg-[#3c3c3c] rounded disabled:text-[#555]"
                  title="Next measurement"
                >
                  <ChevronRight size={10} />
                </button>
                
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="flex items-center justify-center w-4 h-4 hover:bg-[#3c3c3c] rounded ml-1"
                  title="Show all measurements"
                >
                  <span className="text-[8px]">...</span>
                </button>
              </div>
            ) : (
              // All measurements view
              <div className="flex items-center gap-1 max-w-md overflow-x-auto">
                {measurements.slice(0, 8).map((measurement, index) => {
                  const Icon = getTypeIcon(measurement.type)
                  return (
                    <div
                      key={measurement.id}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                        index === currentIndex ? 'bg-[#3c3c3c] text-white' : 'hover:bg-[#3c3c3c]'
                      }`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <Icon size={8} />
                      <span className="font-mono text-[8px]">
                        {formatMeasurementValue(measurement)}
                      </span>
                    </div>
                  )
                })}
                
                {measurements.length > 8 && (
                  <span className="text-[#858585] text-[8px]">+{measurements.length - 8}</span>
                )}
                
                <button
                  onClick={() => setShowAll(false)}
                  className="flex items-center justify-center w-4 h-4 hover:bg-[#3c3c3c] rounded ml-1"
                  title="Show single measurement"
                >
                  <X size={8} />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Right: Stats and Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Stats */}
          {measurements.length > 0 && (
            <div className="flex items-center gap-3 text-[#858585]">
              <span>{measurements.length} measurement{measurements.length !== 1 ? 's' : ''}</span>
              
              <div className="flex items-center gap-1">
                <span>Total:</span>
                <span className="text-[#cccccc] font-mono">
                  {getTotalDistance().toFixed(1)}ft
                </span>
              </div>
              
              {getTotalArea() > 0 && (
                <div className="flex items-center gap-1">
                  <span>Area:</span>
                  <span className="text-[#cccccc] font-mono">
                    {getTotalArea().toFixed(1)}ft²
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Actions */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={toggleAllMeasurements}
              className={`flex items-center justify-center w-4 h-4 rounded transition-colors ${
                showAllMeasurements 
                  ? 'hover:bg-[#3c3c3c] text-[#cccccc]' 
                  : 'bg-[#3c3c3c] text-[#858585] hover:text-[#cccccc]'
              }`}
              title={showAllMeasurements ? 'Hide measurements' : 'Show measurements'}
            >
              {showAllMeasurements ? <Eye size={10} /> : <EyeOff size={10} />}
            </button>
            
            {measurements.length > 0 && (
              <>
                <button
                  onClick={() => {
                    const data = exportMeasurements('json')
                    const blob = new Blob([data], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `measurements-${new Date().toISOString().split('T')[0]}.json`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="flex items-center justify-center w-4 h-4 hover:bg-[#3c3c3c] rounded transition-colors"
                  title="Export measurements"
                >
                  <Download size={10} />
                </button>
                
                <button
                  onClick={() => {
                    if (measurements[currentIndex]) {
                      deleteMeasurement(measurements[currentIndex].id)
                      setCurrentIndex(Math.max(0, Math.min(currentIndex, measurements.length - 2)))
                    }
                  }}
                  className="flex items-center justify-center w-4 h-4 hover:bg-[#3c3c3c] rounded transition-colors text-[#858585] hover:text-[#cccccc]"
                  title="Delete current measurement"
                >
                  <Trash2 size={10} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Info Panel - Absolute positioned to overlay */}
      <div 
        className={`absolute bottom-full left-0 right-0 z-50 border-t border-[#3e3e3e] bg-[#252526] overflow-hidden transition-all duration-300 ease-out backdrop-blur-sm ${
          isInfoExpanded && selectedElement && typeInfo 
            ? 'max-h-80 opacity-100 shadow-2xl' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div 
          className={`max-h-80 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-[#3e3e3e] scrollbar-thumb-[#858585] hover:scrollbar-thumb-[#cccccc] transition-all duration-300 ease-out ${
            isInfoExpanded && selectedElement && typeInfo
              ? 'transform translate-y-0 opacity-100'
              : 'transform -translate-y-4 opacity-0'
          }`}
        >
          <div className="p-4 space-y-4">
          {selectedElement && typeInfo && (
            <>
              {/* Object Header */}
              <div className={`flex items-center gap-3 pb-3 border-b border-[#3e3e3e] transition-all duration-400 ease-out ${
                isInfoExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
              }`}>
                <span className="text-2xl transition-transform duration-300 hover:scale-110">{typeInfo.icon}</span>
                <div>
                  <h3 className="text-[#cccccc] font-medium text-sm">{typeInfo.type}</h3>
                  <p className="text-[#858585] text-xs">{typeInfo.category}</p>
                </div>
              </div>

              {/* Object Details Grid */}
              <div className={`grid grid-cols-2 gap-4 transition-all duration-500 ease-out delay-100 ${
                isInfoExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
              }`}>
              {/* Basic Info */}
              <div className="space-y-2">
                <h4 className="text-[#cccccc] text-xs font-medium flex items-center gap-1">
                  <Package size={12} />
                  Basic Information
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#858585]">ID:</span>
                    <span className="text-[#cccccc] font-mono">{selectedElement.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#858585]">Type:</span>
                    <span className="text-[#cccccc]">{selectedElement.type}</span>
                  </div>
                  {selectedElement.material && (
                    <div className="flex justify-between">
                      <span className="text-[#858585]">Material:</span>
                      <span className="text-[#cccccc]">{selectedElement.material}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Dimensions & Location */}
              <div className="space-y-2">
                <h4 className="text-[#cccccc] text-xs font-medium flex items-center gap-1">
                  <Ruler size={12} />
                  Dimensions & Location
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#858585]">Size:</span>
                    <span className="text-[#cccccc] font-mono">
                      {selectedElement.dimensions.width}' × {selectedElement.dimensions.height}' × {selectedElement.dimensions.depth || 0}'
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#858585]">Volume:</span>
                    <span className="text-[#cccccc]">{volume} ft³</span>
                  </div>
                </div>
              </div>
            </div>

              {/* Specifications */}
              {typeInfo.specifications && (
                <div className={`space-y-2 transition-all duration-600 ease-out delay-200 ${
                  isInfoExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                }`}>
                  <h4 className="text-[#cccccc] text-xs font-medium flex items-center gap-1">
                    <Wrench size={12} className="transition-transform duration-200 hover:rotate-12" />
                    Specifications
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    {Object.entries(typeInfo.specifications).map(([key, value], index) => (
                      <div 
                        key={key} 
                        className={`flex justify-between transition-all duration-300 ease-out hover:bg-[#3c3c3c] hover:px-1 hover:rounded ${
                          isInfoExpanded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-2'
                        }`}
                        style={{ transitionDelay: `${300 + index * 50}ms` }}
                      >
                        <span className="text-[#858585]">{key}:</span>
                        <span className="text-[#cccccc] font-mono">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedElement.metadata && Object.keys(selectedElement.metadata).length > 0 && (
                <div className={`space-y-2 transition-all duration-700 ease-out delay-300 ${
                  isInfoExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
                }`}>
                  <h4 className="text-[#cccccc] text-xs font-medium flex items-center gap-1">
                    <Database size={12} className="transition-transform duration-200 hover:scale-110" />
                    Additional Data
                  </h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs max-h-20 overflow-y-auto">
                    {Object.entries(selectedElement.metadata).map(([key, value], index) => (
                      <div 
                        key={key} 
                        className={`flex justify-between transition-all duration-300 ease-out hover:bg-[#3c3c3c] hover:px-1 hover:rounded ${
                          isInfoExpanded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-2'
                        }`}
                        style={{ transitionDelay: `${400 + index * 30}ms` }}
                      >
                        <span className="text-[#858585]">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-[#cccccc] font-mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      {/* Materials Cost Panel - Absolute positioned to overlay */}
      <div 
        className={`absolute bottom-full left-0 right-0 z-50 border-t border-[#3e3e3e] bg-[#252526] overflow-hidden transition-all duration-300 ease-out backdrop-blur-sm ${
          isCostExpanded && selectedElement && costInfo 
            ? 'max-h-80 opacity-100 shadow-2xl' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div 
          className={`max-h-80 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-track-[#3e3e3e] scrollbar-thumb-[#858585] hover:scrollbar-thumb-[#cccccc] transition-all duration-300 ease-out ${
            isCostExpanded && selectedElement && costInfo
              ? 'transform translate-y-0 opacity-100'
              : 'transform -translate-y-4 opacity-0'
          }`}
        >
          <div className="p-4 space-y-4">
          {selectedElement && costInfo && (
            <>
              {/* Cost Header */}
              <div className={`flex items-center justify-between pb-3 border-b border-[#3e3e3e] transition-all duration-400 ease-out ${
                isCostExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl transition-transform duration-300 hover:scale-110">💵</span>
                  <div>
                    <h3 className="text-[#cccccc] font-medium text-sm">
                      {costInfo.wallDetails ? `${costInfo.wallDetails.wallType} Cost Breakdown` : 'Materials Cost Estimate'}
                    </h3>
                    <p className="text-[#858585] text-xs">{selectedElement.id} • {costInfo.unit}</p>
                    {costInfo.wallDetails && (
                      <p className="text-[#f59e0b] text-xs">
                        Drywall: {costInfo.wallDetails.hasDrywall ? `${costInfo.wallDetails.drywallSides} side${costInfo.wallDetails.drywallSides > 1 ? 's' : ''}` : 'Not included'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[#cccccc] font-bold text-lg">${costInfo.totalCost.toLocaleString()}</div>
                  <div className="text-[#858585] text-xs">Total Cost</div>
                </div>
              </div>

              {/* Cost Breakdown Grid */}
              <div className={`grid grid-cols-2 gap-4 transition-all duration-500 ease-out delay-100 ${
                isCostExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
              }`}>
                {/* Cost Summary */}
                <div className="space-y-2">
                  <h4 className="text-[#cccccc] text-xs font-medium flex items-center gap-1">
                    <Package size={12} />
                    {costInfo.wallDetails ? 'Wall Component Costs' : 'Cost Summary'}
                  </h4>
                  <div className="space-y-1 text-xs">
                    {costInfo.wallDetails ? (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#858585]">🔧 Framing Total:</span>
                          <span className="text-[#cccccc] font-mono">${costInfo.wallDetails.framingCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#858585]">🧱 Drywall Total:</span>
                          <span className="text-[#cccccc] font-mono">
                            {costInfo.wallDetails.hasDrywall ? `$${costInfo.wallDetails.drywallCost.toLocaleString()}` : 'Not included'}
                          </span>
                        </div>
                        {costInfo.wallDetails.insulationCost > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[#858585]">🏠 Insulation:</span>
                            <span className="text-[#cccccc] font-mono">${costInfo.wallDetails.insulationCost.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-[#3e3e3e] pt-1">
                          <span className="text-[#cccccc] font-medium">Wall Total:</span>
                          <span className="text-[#cccccc] font-mono font-bold">${costInfo.totalCost.toLocaleString()}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#858585]">Materials:</span>
                          <span className="text-[#cccccc] font-mono">${costInfo.materialCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#858585]">Labor:</span>
                          <span className="text-[#cccccc] font-mono">${costInfo.laborCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t border-[#3e3e3e] pt-1">
                          <span className="text-[#cccccc] font-medium">Total:</span>
                          <span className="text-[#cccccc] font-mono font-bold">${costInfo.totalCost.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Cost per Unit */}
                <div className="space-y-2">
                  <h4 className="text-[#cccccc] text-xs font-medium flex items-center gap-1">
                    <Ruler size={12} />
                    Unit Costs
                  </h4>
                  <div className="space-y-1 text-xs">
                    {selectedElement.dimensions && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-[#858585]">Per sq ft:</span>
                          <span className="text-[#cccccc] font-mono">
                            ${((costInfo.totalCost) / (selectedElement.dimensions.width * selectedElement.dimensions.height)).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#858585]">Per cu ft:</span>
                          <span className="text-[#cccccc] font-mono">
                            ${((costInfo.totalCost) / parseFloat(volume)).toFixed(2)}
                          </span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between">
                      <span className="text-[#858585]">Unit:</span>
                      <span className="text-[#cccccc] text-[10px]">{costInfo.unit}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className={`space-y-2 transition-all duration-600 ease-out delay-200 ${
                isCostExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
              }`}>
                <h4 className="text-[#cccccc] text-xs font-medium flex items-center gap-1">
                  <Database size={12} className="transition-transform duration-200 hover:scale-110" />
                  Cost Breakdown
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(costInfo.breakdown).map(([item, cost], index) => (
                    <div 
                      key={item} 
                      className={`flex justify-between transition-all duration-300 ease-out hover:bg-[#3c3c3c] hover:px-1 hover:rounded ${
                        isCostExpanded ? 'opacity-100 transform translate-x-0' : 'opacity-0 transform translate-x-2'
                      }`}
                      style={{ transitionDelay: `${300 + index * 50}ms` }}
                    >
                      <span className="text-[#858585]">{item}:</span>
                      <span className="text-[#cccccc] font-mono">{cost}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost Notes */}
              <div className={`text-xs text-[#858585] bg-[#3c3c3c] p-2 rounded transition-all duration-700 ease-out delay-300 ${
                isCostExpanded ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
              }`}>
                <p>💡 <strong>Note:</strong> Costs are estimates based on 2024 market rates. Actual costs may vary by location, supplier, and project complexity.</p>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MeasurementStatusBar