import { FloorplanData } from './store'
import { CoveBaseTrimConfig, createCoveBaseTrim, defaultCoveBaseTrimConfig, coveBaseTrimPresets } from './cove-base-trim-model'


/**
 * MAIN WAREHOUSE MODEL - Building: 88' 7/8" x 198' with 12' exterior walls (rotated)
 * Workspace pad extends 25' around building perimeter
 * Total pad dimensions: 138.75' x 248' (88.75+25+25 x 198+25+25)
 */
export const MAIN_WAREHOUSE_MODEL: FloorplanData = {
  id: 'main-warehouse-building',
  name: 'Warehouse Building - 88\' 7/8" x 198\' (rotated)',
  dimensions: { width: 138.75, height: 248 }, // Pad extends 25' around rotated building
  elements: [
    // South wall - LEFT SEGMENT (from west wall to opening)
    // Opening starts at 4.125' from east wall: 112.75 - 4.125 = 108.625
    // Opening is 10' wide, so it ends at 108.625 - 10 = 98.625
    // Left segment runs from x=25 to x=98.625, width = 73.625'
    {
      id: 'wall-bottom-left',
      type: 'wall' as const,
      position: { x: 25, y: 25, z: 0 }, // 25' from pad edge
      dimensions: { width: 73.625, height: 1, depth: 12 }, // 12' tall wall, 73.625' wide
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'brick', 
        description: 'South wall left segment - west of opening',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(73.625 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },
    
    // South wall - RIGHT SEGMENT (from opening to east wall) 
    // Right segment starts at x=108.625 and runs to east wall at x=112.75
    // Width = 112.75 - 108.625 = 4.125' (49.5")
    {
      id: 'wall-bottom-right',
      type: 'wall' as const,
      position: { x: 108.625, y: 25, z: 0 }, // Start after opening
      dimensions: { width: 4.125, height: 1, depth: 12 }, // 12' tall wall, 4.125' wide (49.5")
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'brick', 
        description: 'South wall right segment - east of opening (49.5" from east wall)',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center  
          studCount: Math.ceil(4.125 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },
    
    // SOUTH WALL OPENING - 10' wide by 12' tall opening
    {
      id: 'south-wall-opening',
      type: 'window' as const,
      position: { x: 98.625, y: 25, z: 0 }, // Positioned in the gap between wall segments
      dimensions: { width: 10, height: 1, depth: 12 }, // 10' wide, 12' tall opening
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'access', 
        opening_type: 'large_opening',
        description: '12\' tall by 10\' wide opening on south wall, 49.5" from east wall'
      }
    },
    // Top wall (North) - 88' 7/8" (88.75') long
    {
      id: 'wall-top',
      type: 'wall' as const,
      position: { x: 25, y: 222, z: 0 }, // 198' from bottom wall (25 + 197)
      dimensions: { width: 88.75, height: 1, depth: 12 }, // 12' tall wall
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick' }
    },
    // West wall - NORTH SEGMENT (from north exterior wall to opening)
    // Opening starts at 6' 5 1/8" from north wall: 222 - 6.427 = 215.573
    // Opening is 10' tall, so it ends at 215.573 - 10 = 205.573
    // North segment runs from y=222 down to y=205.573, height = 16.427'
    {
      id: 'wall-left-north',
      type: 'wall' as const,
      position: { x: 25, y: 205.573, z: 0 }, // Position at south end of north segment
      dimensions: { width: 1, height: 16.427, depth: 12 }, // 16.427' long north segment
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick', description: 'West wall north segment - north of opening' }
    },
    
    // West wall - SOUTH SEGMENT (from opening to south exterior wall)
    // South segment starts at y=205.573 and runs to south wall at y=25
    // Height = 205.573 - 25 = 180.573'
    {
      id: 'wall-left-south',
      type: 'wall' as const,
      position: { x: 25, y: 25, z: 0 }, // Start at south exterior wall
      dimensions: { width: 1, height: 180.573, depth: 12 }, // 180.573' long south segment
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick', description: 'West wall south segment - south of opening' }
    },
    
    // WEST WALL OPENING - 10' wide by 10' tall walkway opening
    {
      id: 'west-wall-opening',
      type: 'window' as const,
      position: { x: 25, y: 205.573, z: 0 }, // Positioned in the gap between wall segments
      dimensions: { width: 1, height: 10, depth: 10 }, // 10' wide, 10' tall opening
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'access', 
        opening_type: 'walkway',
        description: '10\' tall by 10\' wide walkway opening on west wall, 6\' 5 1/8" from north wall'
      }
    },
    // Right wall (East) - 198' long
    {
      id: 'wall-right',
      type: 'wall' as const,
      position: { x: 112.75, y: 25, z: 0 }, // 88.75' from left wall (25 + 87.75)
      dimensions: { width: 1, height: 198, depth: 12 }, // 198' long
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick' }
    },
    // Steel I-beam at center of north wall, 23' 9 3/16" from interior
    {
      id: 'steel-beam-north-center',
      type: 'fixture' as const,
      position: { 
        x: 69.375, // Center of north wall (25 + 88.75/2 = 69.375)
        y: 198.2292, // 23' 9 3/16" from north wall interior (222 - 23.7708 = 198.2292)
        z: 0 
      },
      dimensions: { width: 0.67, height: 0.67, depth: 14.046875 }, // 8" I-beam (0.67'), 14' 9/16" tall
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        beam_type: 'I-beam',
        beam_size: '8_inch',
        beam_layers: 1,
        load_bearing: true,
        description: '14\' 9/16" tall steel I-beam (8 inch) - single layer at center of north wall'
      }
    },
    // Second steel I-beam, 24' 5 9/16" from first beam
    {
      id: 'steel-beam-second',
      type: 'fixture' as const,
      position: { 
        x: 69.375, // Same X position as first beam (center alignment)
        y: 173.6667, // 24' 5 9/16" from first beam (198.2292 - 24.5625 = 173.6667)
        z: 0 
      },
      dimensions: { width: 0.67, height: 0.67, depth: 14.046875 }, // 8" I-beam (0.67'), 14' 9/16" tall
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        beam_type: 'I-beam',
        beam_size: '8_inch',
        beam_layers: 1,
        load_bearing: true,
        description: '14\' 9/16" tall steel I-beam (8 inch) - single layer, second beam'
      }
    },
    // Third steel I-beam, 24' 5 9/16" from second beam
    {
      id: 'steel-beam-third',
      type: 'fixture' as const,
      position: { 
        x: 69.375, // Same X position as other beams (center alignment)
        y: 149.1042, // 24' 5 9/16" from second beam (173.6667 - 24.5625 = 149.1042)
        z: 0 
      },
      dimensions: { width: 0.67, height: 0.67, depth: 14.046875 }, // 8" I-beam (0.67'), 14' 9/16" tall
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        beam_type: 'I-beam',
        beam_size: '8_inch',
        beam_layers: 1,
        load_bearing: true,
        description: '14\' 9/16" tall steel I-beam (8 inch) - single layer, third beam'
      }
    },
    // Fourth steel I-beam, 24' 5 9/16" from third beam
    {
      id: 'steel-beam-fourth',
      type: 'fixture' as const,
      position: { 
        x: 69.375, // Same X position as other beams (center alignment)
        y: 124.5417, // 24' 5 9/16" from third beam (149.1042 - 24.5625 = 124.5417)
        z: 0 
      },
      dimensions: { width: 0.67, height: 0.67, depth: 14.046875 }, // 8" I-beam (0.67'), 14' 9/16" tall
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        beam_type: 'I-beam',
        beam_size: '8_inch',
        beam_layers: 1,
        load_bearing: true,
        description: '14\' 9/16" tall steel I-beam (8 inch) - single layer, fourth beam'
      }
    },
    // Fifth steel I-beam, 24' 5 9/16" from fourth beam
    {
      id: 'steel-beam-fifth',
      type: 'fixture' as const,
      position: { 
        x: 69.375, // Same X position as other beams (center alignment)
        y: 99.9792, // 24' 5 9/16" from fourth beam (124.5417 - 24.5625 = 99.9792)
        z: 0 
      },
      dimensions: { width: 0.67, height: 0.67, depth: 14.046875 }, // 8" I-beam (0.67'), 14' 9/16" tall
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        beam_type: 'I-beam',
        beam_size: '8_inch',
        beam_layers: 1,
        load_bearing: true,
        description: '14\' 9/16" tall steel I-beam (8 inch) - single layer, fifth beam'
      }
    },
    // Sixth steel I-beam, 24' 5 9/16" from fifth beam
    {
      id: 'steel-beam-sixth',
      type: 'fixture' as const,
      position: { 
        x: 69.375, // Same X position as other beams (center alignment)
        y: 75.4167, // 24' 5 9/16" from fifth beam (99.9792 - 24.5625 = 75.4167)
        z: 0 
      },
      dimensions: { width: 0.67, height: 0.67, depth: 14.046875 }, // 8" I-beam (0.67'), 14' 9/16" tall
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        beam_type: 'I-beam',
        beam_size: '8_inch',
        beam_layers: 1,
        load_bearing: true,
        description: '14\' 9/16" tall steel I-beam (8 inch) - single layer, sixth beam'
      }
    },
    // Seventh steel I-beam (LAST), 23' 10 3/16" from south wall
    {
      id: 'steel-beam-seventh',
      type: 'fixture' as const,
      position: { 
        x: 69.375, // Same X position as other beams (center alignment)
        y: 48.8542, // 23' 10 3/16" from south wall (25 + 23.8542 = 48.8542)
        z: 0 
      },
      dimensions: { width: 0.67, height: 0.67, depth: 14.046875 }, // 8" I-beam (0.67'), 14' 9/16" tall
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        beam_type: 'I-beam',
        beam_size: '8_inch',
        beam_layers: 1,
        load_bearing: true,
        description: '14\' 9/16" tall steel I-beam (8 inch) - single layer, seventh beam (LAST)'
      }
    },
    
    // ROOM WALLS - 7 horizontal walls centered on each I-beam
    // Building width: 88.75', Room wall width: 78.875' (88.75 - 10 = 78.875)
    // Creates 5' hallways on both sides (5' + 78.875' + 5' = 88.875')
    
    // Room wall 1 - Room 2's north wall (separates Room 2 from area above)
    {
      id: 'room-wall-1',
      type: 'wall' as const,
      position: { 
        x: 36.0625, // Aligned with new left longways wall position
        y: 198.0417, // Room 2's north boundary
        z: 0 
      },
      dimensions: { width: 70.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, connects to east longway wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_south: 2,
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'Room wall 1 - Room 2\'s north wall (separates Room 2 from area above)',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(70.6875 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },

    // Room wall 2 - centered on second I-beam (separates Room 2 from Room 3)
    {
      id: 'room-wall-2',
      type: 'wall' as const,
      position: { 
        x: 36.0625, // Aligned with new left longways wall position
        y: 173.4792, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 70.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, connects to east longway wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 2,
        room_south: 3,
        description: 'Room wall 2 - separates Room 2 (north) from Room 3 (south)'
      }
    },

    // Room 2 East Divider Wall - 12' west of interior wall (north-south divider)
    {
      id: 'room-2-east-divider-wall',
      type: 'wall' as const,
      position: { 
        x: 94.75, // 12' west of east longway wall (106.75 - 12 = 94.75)
        y: 173.4792, // Start at Room 2 south wall
        z: 0 
      },
      dimensions: { width: 0.375, height: 24.5625, depth: 17 }, // 4.5" thick, spans Room 2 height (198.0417 - 173.4792 = 24.5625'), 17' tall interior wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_west: 'room-2-west',
        room_east: 'room-2-east',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'Room 2 east divider wall - 12\' west of east longway wall, divides Room 2 into west and east sections',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(24.5625 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },

    // FIREWALL - Room 4's north wall / Room 3's south wall - EXTENDS TO EXTERIOR WALLS
    {
      id: 'room-wall-4',
      type: 'wall' as const,
      position: { 
        x: 25, // Extended to west exterior wall
        y: 148.9167, // Precisely centered on I-beam Y position minus half wall thickness - MOVED NORTH ONE WALL
        z: 0 
      },
      dimensions: { width: 87.75, height: 0.5, depth: 17 }, // 6" thick firewall (0.5'), 17' tall interior wall
      rotation: 0,
      material: 'concrete',
      color: '#dc2626', // Fire-rated red color
      metadata: { 
        category: 'fire-safety', 
        material_type: 'fire-rated-concrete',
        load_bearing: true,
        fire_rating: '2-hour',
        extends_to_exterior: true,
        crosses_hallways: true,
        firewall_marking: 'subtle',
        room_north: 3,
        room_south: 4,
        description: 'FIREWALL - Room 4 north wall / Room 3 south wall - extends to exterior walls across hallways'
      }
    },
    // Room wall 4 - centered on fourth I-beam (separates Room 4 from Room 5) - REGULAR WALL REPLACING FIREWALL'S OLD POSITION
    {
      id: 'room-wall-4-regular',
      type: 'wall' as const,
      position: { 
        x: 36.0625, // Aligned with new left longways wall position
        y: 124.3542, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 70.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, connects to east longway wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 4,
        room_south: 5,
        description: 'Room wall 4 - separates Room 4 (north) from Room 5 (south)'
      }
    },
    // Room wall 5 - centered on fifth I-beam (separates Room 5 from Room 6)
    {
      id: 'room-wall-5',
      type: 'wall' as const,
      position: { 
        x: 36.0625, // Aligned with new left longways wall position
        y: 99.7917, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 70.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, connects to east longway wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 5,
        room_south: 6,
        description: 'Room wall 5 - separates Room 5 (north) from Room 6 (south)'
      }
    },
    // Room wall 6 - centered on sixth I-beam (separates Room 6 from Room 7)
    {
      id: 'room-wall-6',
      type: 'wall' as const,
      position: { 
        x: 36.0625, // Aligned with new left longways wall position
        y: 75.2292, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 70.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, connects to east longway wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 6,
        room_south: 7,
        description: 'Room wall 6 - separates Room 6 (north) from Room 7 (south)'
      }
    },
    // Room wall 7 - centered on seventh I-beam (separates Room 7 from Room 8)
    {
      id: 'room-wall-7',
      type: 'wall' as const,
      position: { 
        x: 36.0625, // Aligned with new left longways wall position
        y: 48.6667, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 70.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, connects to east longway wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 7,
        room_south: 8,
        description: 'Room wall 7 - separates Room 7 (north) from Room 8 (south)'
      }
    },

    // LONGWAYS WALLS - 2 vertical walls to close rooms, stopping 4' from north/south for hallway
    
    // Left longways wall - runs north-south, recessed 15' from left exterior wall, stops at north hallway
    {
      id: 'longways-wall-left',
      type: 'wall' as const,
      position: { 
        x: 37.0625, // Adjusted for 12' wide west hallway (25 + 12 = 37.0625)
        y: 25, // Extended to south exterior wall
        z: 0 
      },
      dimensions: { width: 0.375, height: 173.0417, depth: 17 }, // 4.5" thick, full length to room 2's north wall: 198.0417-25 = 173.0417'
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall - 12\' high with room openings, extended to south exterior wall for Room 8 expansion',
        openings: [
          {
            id: 'room-8-west-opening',
            type: 'door',
            position: { x: 11.83, z: 0 }, // Room 8 centered in its section (29 + 23.6667/2 = 40.83 - 29 = 11.83)
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 8 west entrance - 15\' hallway double door' }
          },
          {
            id: 'room-7-west-opening', 
            type: 'door',
            position: { x: 31.77, z: 0 }, // Room 7 centered (75.2292 + 48.6667)/2 - 29 = 31.77
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 7 west entrance - 15\' hallway double door' }
          },
          {
            id: 'room-6-west-opening',
            type: 'door', 
            position: { x: 58.51, z: 0 }, // Room 6 centered (75.2292 + 99.7917)/2 - 29 = 58.51
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 6 west entrance - 15\' hallway double door' }
          },
          {
            id: 'room-5-west-opening',
            type: 'door',
            position: { x: 83.07, z: 0 }, // Room 5 centered (99.7917 + 124.3542)/2 - 29 = 83.07
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 5 west entrance - 15\' hallway double door' }
          },
          {
            id: 'room-4-west-opening',
            type: 'door',
            position: { x: 107.64, z: 0 }, // Room 4 centered (124.3542 + 148.9167)/2 - 29 = 107.64
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 4 west entrance - 15\' hallway double door' }
          },
          {
            id: 'room-3-west-opening',
            type: 'door',
            position: { x: 132.20, z: 0 }, // Room 3 centered (148.9167 + 173.4792)/2 - 29 = 132.20
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 3 west entrance - 15\' hallway double door' }
          },
          {
            id: 'room-2-west-opening',
            type: 'door',
            position: { x: 156.76, z: 0 }, // Room 2 centered (173.4792 + 198.0417)/2 - 29 = 156.76
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 2 west entrance - 15\' hallway double door' }
          }
        ]
      }
    },
    
          // Right longways wall - runs north-south, recessed 6' from right exterior wall
      // STARTS at room-wall-7 (room 7's south wall) - Room 8 now extends full width to east exterior wall
      // Continues north past double tier dry room, creating continuous wall
      {
        id: 'longways-wall-right',
        type: 'wall' as const,
        position: { 
          x: 106.75, // 6' from right exterior wall (112.75 - 6 + wall thickness/2 = 106.75)
          y: 25, // Extended to south exterior wall
          z: 0 
        },
        dimensions: { width: 0.375, height: 173.0417, depth: 17 }, // Full length to control area (198.0417 - 25 = 173.0417')
        rotation: 0,
        material: 'concrete',
        color: '#ffffff',
        metadata: { 
          category: 'room-walls', 
          material_type: 'drywall',
          load_bearing: false,
          description: 'Right longways wall - 12\' high with room openings, shortened to open control area to east hallway, 6\' from east exterior wall',
          openings: [
            {
              id: 'room-7-east-opening',
              type: 'door',
              position: { x: 13.10, z: 0 }, // Room 7 centered (49.0417 + 75.2292)/2 - 49.0417 = 13.10
              dimensions: { width: 3, height: 8 },
              metadata: { doorType: 'single', description: 'Room 7 east entrance - 3\' hallway single door' }
            },
            {
              id: 'room-6-east-opening',
              type: 'door',
              position: { x: 38.47, z: 0 }, // Room 6 centered (75.2292 + 99.7917)/2 - 49.0417 = 38.47
              dimensions: { width: 3, height: 8 },
              metadata: { doorType: 'single', description: 'Room 6 east entrance - 3\' hallway single door' }
            },
            {
              id: 'room-5-east-opening',
              type: 'door',
              position: { x: 63.03, z: 0 }, // Room 5 centered (99.7917 + 124.3542)/2 - 49.0417 = 63.03
              dimensions: { width: 3, height: 8 },
              metadata: { doorType: 'single', description: 'Room 5 east entrance - 3\' hallway single door' }
            },
            {
              id: 'room-4-east-opening',
              type: 'door',
              position: { x: 87.60, z: 0 }, // Room 4 centered (124.3542 + 148.9167)/2 - 49.0417 = 87.60
              dimensions: { width: 3, height: 8 },
              metadata: { doorType: 'single', description: 'Room 4 east entrance - 3\' hallway single door' }
            },
            {
              id: 'room-3-east-opening',
              type: 'door',
              position: { x: 112.16, z: 0 }, // Room 3 centered (148.9167 + 173.4792)/2 - 49.0417 = 112.16
              dimensions: { width: 3, height: 8 },
              metadata: { doorType: 'single', description: 'Room 3 east entrance - 3\' hallway single door' }
            },
            {
              id: 'room-2-east-opening',
              type: 'door',
              position: { x: 136.72, z: 0 }, // Room 2 centered (173.4792 + 198.0417)/2 - 49.0417 = 136.72
              dimensions: { width: 3, height: 8 },
              metadata: { doorType: 'single', description: 'Room 2 east entrance - 3\' hallway single door' }
            }
          ]
        }
      },

    // HALLWAY WALLS - North area is now open control area (hallway wall removed)
    

    











    












    // SUPPORT TRUSS SYSTEM - 9 trusses spanning east-west across building (88.75' width)
    // Trusses are 4' 10 1/16" wide vertically, 8" thick beams on each end
    // Curved from 14.046875' center height (I-beam level) to 12' exterior walls
    
    // Truss 1 - Over south exterior wall
    {
      id: 'support-truss-south',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 25, // Over south exterior wall
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        description: 'Support truss over south exterior wall - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 2 - Over first I-beam (north-center)
    {
      id: 'support-truss-ibeam-1',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 198.2292, // Over first I-beam position
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        aligned_with: 'steel-beam-north-center',
        description: 'Support truss over first I-beam (north-center) - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 3 - Over second I-beam
    {
      id: 'support-truss-ibeam-2',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 173.6667, // Over second I-beam position
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        aligned_with: 'steel-beam-second',
        description: 'Support truss over second I-beam - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 4 - Over third I-beam
    {
      id: 'support-truss-ibeam-3',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 149.1042, // Over third I-beam position
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        aligned_with: 'steel-beam-third',
        description: 'Support truss over third I-beam - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 5 - Over fourth I-beam
    {
      id: 'support-truss-ibeam-4',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 124.5417, // Over fourth I-beam position
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        aligned_with: 'steel-beam-fourth',
        description: 'Support truss over fourth I-beam - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 6 - Over fifth I-beam
    {
      id: 'support-truss-ibeam-5',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 99.9792, // Over fifth I-beam position
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        aligned_with: 'steel-beam-fifth',
        description: 'Support truss over fifth I-beam - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 7 - Over sixth I-beam
    {
      id: 'support-truss-ibeam-6',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 75.4167, // Over sixth I-beam position
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        aligned_with: 'steel-beam-sixth',
        description: 'Support truss over sixth I-beam - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 8 - Over seventh I-beam
    {
      id: 'support-truss-ibeam-7',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 48.8542, // Over seventh I-beam position
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        aligned_with: 'steel-beam-seventh',
        description: 'Support truss over seventh I-beam - curved from 12\' to 14.046875\' center'
      }
    },

    // Truss 9 - Over north exterior wall
    {
      id: 'support-truss-north',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 222, // Over north exterior wall
        z: 12 // 12' height at exterior wall
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 4.8438, // 4' 10 1/16" (58.0625" = 4.8438')
        depth: 0.67 // 8" thick beams (0.67')
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'support_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        cross_members: 'cross_pattern',
        description: 'Support truss over north exterior wall - curved from 12\' to 14.046875\' center'
      }
    },

    // METAL ROOF PANELS - 8 sections spanning between trusses
    // Each panel follows the curved profile of the trusses (12' to 14.046875' center)
    // Positioned 0.1' above the top chord of trusses for clearance
    
    // Roof Panel 1 - Between south wall truss (y:25) and seventh I-beam truss (y:48.8542)
    {
      id: 'roof-panel-1',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 36.9271, // Midpoint between y:25 and y:48.8542 = (25 + 48.8542) / 2
        z: 16.8438 // Exactly at top of truss exterior height (12' base + 4.8438' truss height)
      },
      dimensions: { 
        width: 88.75, // Full building width
        height: 23.8542, // Distance between trusses (48.8542 - 25)
        depth: 0.05 // Thin metal roofing - 0.6" thick
      },
      rotation: 0,
      material: 'steel',
      color: '#708090', // Steel gray color
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #1 - between south wall and seventh I-beam trusses'
      }
    },

    // Roof Panel 2 - Between seventh I-beam truss (y:48.8542) and sixth I-beam truss (y:75.4167)
    {
      id: 'roof-panel-2',
      type: 'fixture' as const,
      position: { 
        x: 25,
        y: 62.13545, // Midpoint: (48.8542 + 75.4167) / 2
        z: 16.9469
      },
      dimensions: { 
        width: 88.75,
        height: 26.5625, // Distance: 75.4167 - 48.8542
        depth: 0.05
      },
      rotation: 0,
      material: 'steel',
      color: '#708090',
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #2 - between seventh and sixth I-beam trusses'
      }
    },

    // Roof Panel 3 - Between sixth I-beam truss (y:75.4167) and fifth I-beam truss (y:99.9792)
    {
      id: 'roof-panel-3',
      type: 'fixture' as const,
      position: { 
        x: 25,
        y: 87.69795, // Midpoint: (75.4167 + 99.9792) / 2
        z: 16.9469
      },
      dimensions: { 
        width: 88.75,
        height: 24.5625, // Distance: 99.9792 - 75.4167
        depth: 0.05
      },
      rotation: 0,
      material: 'steel',
      color: '#708090',
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #3 - between sixth and fifth I-beam trusses'
      }
    },

    // Roof Panel 4 - Between fifth I-beam truss (y:99.9792) and fourth I-beam truss (y:124.5417)
    {
      id: 'roof-panel-4',
      type: 'fixture' as const,
      position: { 
        x: 25,
        y: 112.26045, // Midpoint: (99.9792 + 124.5417) / 2
        z: 16.9469
      },
      dimensions: { 
        width: 88.75,
        height: 24.5625, // Distance: 124.5417 - 99.9792
        depth: 0.05
      },
      rotation: 0,
      material: 'steel',
      color: '#708090',
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #4 - between fifth and fourth I-beam trusses'
      }
    },

    // Roof Panel 5 - Between fourth I-beam truss (y:124.5417) and third I-beam truss (y:149.1042)
    {
      id: 'roof-panel-5',
      type: 'fixture' as const,
      position: { 
        x: 25,
        y: 136.82295, // Midpoint: (124.5417 + 149.1042) / 2
        z: 16.9469
      },
      dimensions: { 
        width: 88.75,
        height: 24.5625, // Distance: 149.1042 - 124.5417
        depth: 0.05
      },
      rotation: 0,
      material: 'steel',
      color: '#708090',
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #5 - between fourth and third I-beam trusses'
      }
    },

    // Roof Panel 6 - Between third I-beam truss (y:149.1042) and second I-beam truss (y:173.6667)
    {
      id: 'roof-panel-6',
      type: 'fixture' as const,
      position: { 
        x: 25,
        y: 161.38545, // Midpoint: (149.1042 + 173.6667) / 2
        z: 16.9469
      },
      dimensions: { 
        width: 88.75,
        height: 24.5625, // Distance: 173.6667 - 149.1042
        depth: 0.05
      },
      rotation: 0,
      material: 'steel',
      color: '#708090',
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #6 - between third and second I-beam trusses'
      }
    },

    // Roof Panel 7 - Between second I-beam truss (y:173.6667) and first I-beam truss (y:198.2292)
    {
      id: 'roof-panel-7',
      type: 'fixture' as const,
      position: { 
        x: 25,
        y: 185.94795, // Midpoint: (173.6667 + 198.2292) / 2
        z: 16.9469
      },
      dimensions: { 
        width: 88.75,
        height: 24.5625, // Distance: 198.2292 - 173.6667
        depth: 0.05
      },
      rotation: 0,
      material: 'steel',
      color: '#708090',
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #7 - between second and first I-beam trusses'
      }
    },

    // Roof Panel 8 - Between first I-beam truss (y:198.2292) and north wall truss (y:222)
    {
      id: 'roof-panel-8',
      type: 'fixture' as const,
      position: { 
        x: 25,
        y: 210.1146, // Midpoint: (198.2292 + 222) / 2
        z: 16.9469
      },
      dimensions: { 
        width: 88.75,
        height: 23.7708, // Distance: 222 - 198.2292
        depth: 0.05
      },
      rotation: 0,
      material: 'steel',
      color: '#708090',
      metadata: { 
        category: 'roof', 
        material_type: 'corrugated_metal',
        panel_type: 'standing_seam',
        load_bearing: false,
        curved_profile: true,
        center_height: 14.046875,
        exterior_height: 12,
        clearance_above_truss: 0.1,
        weather_resistant: true,
        description: 'Metal roof panel #8 - between first I-beam and north wall trusses'
      }
    },

    // LONGITUDINAL TRUSSES - Running along exterior walls to connect cross trusses
    // West wall longitudinal truss - 198' long, flat at 12' height
    {
      id: 'longitudinal-truss-west',
      type: 'fixture' as const,
      position: { 
        x: 25, // At west exterior wall
        y: 25, // Start at south wall
        z: 12 // 12' height (flat, no curve)
      },
      dimensions: { 
        width: 1, // 1' wide (runs north-south)
        height: 198, // Full building length
        depth: 4.8438 // Same height as cross trusses
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'longitudinal_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: false, // Flat truss
        cross_members: 'cross_pattern',
        description: 'Longitudinal truss along west wall - 198\' long, connects all cross trusses'
      }
    },

    // East wall longitudinal truss - 198' long, flat at 12' height
    {
      id: 'longitudinal-truss-east',
      type: 'fixture' as const,
      position: { 
        x: 112.75, // At east exterior wall (inside face)
        y: 25, // Start at south wall
        z: 12 // 12' height (flat, no curve)
      },
      dimensions: { 
        width: 1, // 1' wide (runs north-south)
        height: 198, // Full building length
        depth: 4.8438 // Same height as cross trusses
      },
      rotation: 0,
      material: 'steel',
      color: '#2c3e50',
      metadata: { 
        category: 'structural', 
        truss_type: 'longitudinal_truss',
        truss_size: '4_10_1_16_inch',
        beam_thickness: '8_inch',
        load_bearing: true,
        curved_profile: false, // Flat truss
        cross_members: 'cross_pattern',
        description: 'Longitudinal truss along east wall - 198\' long, connects all cross trusses'
      }
    },

    // PHASE 1 INDICATOR - Subtle tag for area north of firewall
    {
      id: 'phase-1-indicator',
      type: 'fixture' as const,
      position: { 
        x: 111, // Near east wall, unobtrusive location in east hallway
        y: 173.271, // Centered between firewall (124.3542) and north wall (222): (124.3542 + 222) / 2 = 173.271
        z: 10 // At 10' height - visible but not intrusive
      },
      dimensions: { 
        width: 2, // 24" wide tag for better visibility
        height: 0.75, // 9" tall
        depth: 0.1 // Thin sign plate
      },
      rotation: 0,
      material: 'metal',
      color: '#4b5563', // Medium gray color for subtle appearance
      metadata: { 
        category: 'signage',
        sign_type: 'phase_indicator',
        text: 'PHASE 1',
        font_size: '6_inch',
        text_color: '#f3f4f6',
        phase_boundary: 'firewall_north',
        firewall_y_position: 124.3542,
        north_wall_y_position: 222,
        covers_area: 'north_of_firewall',
        description: 'Phase 1 indicator - Centered between firewall and north exterior wall'
      }
    },

    // PHASE 2 INDICATOR - Subtle tag for area south of firewall
    {
      id: 'phase-2-indicator',
      type: 'fixture' as const,
      position: { 
        x: 27, // Near west wall, unobtrusive location in west hallway
        y: 74.6771, // Centered between south wall (25) and firewall (124.3542): (25 + 124.3542) / 2 = 74.6771
        z: 10 // At 10' height - visible but not intrusive, same as Phase 1
      },
      dimensions: { 
        width: 2, // 24" wide tag for better visibility, same as Phase 1
        height: 0.75, // 9" tall, same as Phase 1
        depth: 0.1 // Thin sign plate, same as Phase 1
      },
      rotation: 0,
      material: 'metal',
      color: '#4b5563', // Medium gray color for subtle appearance, same as Phase 1
      metadata: { 
        category: 'signage',
        sign_type: 'phase_indicator',
        text: 'PHASE 2',
        font_size: '6_inch',
        text_color: '#f3f4f6',
        phase_boundary: 'firewall_south',
        firewall_y_position: 124.3542,
        south_wall_y_position: 25,
        covers_area: 'south_of_firewall',
        description: 'Phase 2 indicator - Centered between south exterior wall and firewall'
      }
    },

    // IBC TOTES - DOUBLE STACKED (14 TOTAL) WITH 1" HORIZONTAL SPACING, 2' VERTICAL GAP
    // Bottom row - 7 totes
    {
      id: 'ibc-tote-bottom-1',
      type: 'fixture' as const,
      position: { 
        x: 54, // Positioned east of feeder tanks (47 + 5.33' tank + 1.67' clearance = 54')
        y: 198.4167, // Against the north face of Room 2's north wall
        z: 0 // Floor level
      },
      dimensions: { 
        width: 4, // 48 inches = 4 feet
        height: 3.33, // 40 inches = 3.33 feet
        depth: 3.83 // 46 inches = 3.83 feet (height)
      },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        material_tank: 'HDPE',
        material_cage: 'steel',
        stack_level: 'bottom',
        description: 'IBC Tote Bottom Stack #1 - 330 gallon capacity'
      }
    },
    {
      id: 'ibc-tote-bottom-2',
      type: 'fixture' as const,
      position: { 
        x: 58.083, // Maintain 4.083' spacing from first tote (54 + 4.083' = 58.083')
        y: 198.4167,
        z: 0
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'bottom',
        description: 'IBC Tote Bottom Stack #2'
      }
    },
    {
      id: 'ibc-tote-bottom-3',
      type: 'fixture' as const,
      position: { 
        x: 62.166, // Maintain 4.083' spacing (58.083 + 4.083' = 62.166')
        y: 198.4167,
        z: 0
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'bottom',
        description: 'IBC Tote Bottom Stack #3'
      }
    },
    {
      id: 'ibc-tote-bottom-4',
      type: 'fixture' as const,
      position: { 
        x: 66.249, // Maintain 4.083' spacing (62.166 + 4.083' = 66.249')
        y: 198.4167,
        z: 0
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'bottom',
        description: 'IBC Tote Bottom Stack #4'
      }
    },
    {
      id: 'ibc-tote-bottom-5',
      type: 'fixture' as const,
      position: { 
        x: 70.332, // Maintain 4.083' spacing (66.249 + 4.083' = 70.332')
        y: 198.4167,
        z: 0
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'bottom',
        description: 'IBC Tote Bottom Stack #5'
      }
    },
    {
      id: 'ibc-tote-bottom-6',
      type: 'fixture' as const,
      position: { 
        x: 74.415, // Maintain 4.083' spacing (70.332 + 4.083' = 74.415')
        y: 198.4167,
        z: 0
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'bottom',
        description: 'IBC Tote Bottom Stack #6'
      }
    },
    {
      id: 'ibc-tote-bottom-7',
      type: 'fixture' as const,
      position: { 
        x: 78.498, // Maintain 4.083' spacing (74.415 + 4.083' = 78.498')
        y: 198.4167,
        z: 0
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'bottom',
        description: 'IBC Tote Bottom Stack #7'
      }
    },
    
    // Top row - 7 totes with 2' vertical gap above bottom row
    {
      id: 'ibc-tote-top-1',
      type: 'fixture' as const,
      position: { 
        x: 54, // Same X position as bottom
        y: 198.4167, // Same Y position
        z: 5.83 // Bottom tote (3.83') + 2' gap = 5.83' height
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'top',
        liquid_level: 0.7, // Some with liquid
        description: 'IBC Tote Top Stack #1 - 330 gallon capacity'
      }
    },
    {
      id: 'ibc-tote-top-2',
      type: 'fixture' as const,
      position: { 
        x: 58.083, // Match bottom row spacing
        y: 198.4167,
        z: 5.83
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'top',
        description: 'IBC Tote Top Stack #2'
      }
    },
    {
      id: 'ibc-tote-top-3',
      type: 'fixture' as const,
      position: { 
        x: 62.166, // Match bottom row spacing
        y: 198.4167,
        z: 5.83
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'top',
        liquid_level: 0.5,
        description: 'IBC Tote Top Stack #3'
      }
    },
    {
      id: 'ibc-tote-top-4',
      type: 'fixture' as const,
      position: { 
        x: 66.249, // Match bottom row spacing
        y: 198.4167,
        z: 5.83
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'top',
        description: 'IBC Tote Top Stack #4'
      }
    },
    {
      id: 'ibc-tote-top-5',
      type: 'fixture' as const,
      position: { 
        x: 70.332, // Match bottom row spacing
        y: 198.4167,
        z: 5.83
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'top',
        liquid_level: 0.8,
        description: 'IBC Tote Top Stack #5'
      }
    },
    {
      id: 'ibc-tote-top-6',
      type: 'fixture' as const,
      position: { 
        x: 74.415, // Match bottom row spacing
        y: 198.4167,
        z: 5.83
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'top',
        description: 'IBC Tote Top Stack #6'
      }
    },
    {
      id: 'ibc-tote-top-7',
      type: 'fixture' as const,
      position: { 
        x: 78.498, // Match bottom row spacing
        y: 198.4167,
        z: 5.83
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'top',
        weathered: true, // One weathered for variety
        description: 'IBC Tote Top Stack #7'
      }
    },

    // Third tier - 7 totes with 2' vertical gap above top row
    {
      id: 'ibc-tote-third-1',
      type: 'fixture' as const,
      position: { 
        x: 54, // Same X position as bottom and top
        y: 198.4167, // Same Y position
        z: 11.66 // Top tote (5.83') + tote height (3.83') + 2' gap = 11.66' height
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'third',
        liquid_level: 0.8, // High liquid level
        description: 'IBC Tote Third Stack #1 - 330 gallon capacity'
      }
    },
    {
      id: 'ibc-tote-third-2',
      type: 'fixture' as const,
      position: { 
        x: 58.083, // Match spacing with lower tiers
        y: 198.4167,
        z: 11.66
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'third',
        liquid_level: 0.6,
        description: 'IBC Tote Third Stack #2'
      }
    },
    {
      id: 'ibc-tote-third-3',
      type: 'fixture' as const,
      position: { 
        x: 62.166, // Match spacing
        y: 198.4167,
        z: 11.66
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'third',
        liquid_level: 0.4,
        description: 'IBC Tote Third Stack #3'
      }
    },
    {
      id: 'ibc-tote-third-4',
      type: 'fixture' as const,
      position: { 
        x: 66.249, // Match spacing
        y: 198.4167,
        z: 11.66
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'third',
        liquid_level: 0.9, // Nearly full
        description: 'IBC Tote Third Stack #4'
      }
    },
    {
      id: 'ibc-tote-third-5',
      type: 'fixture' as const,
      position: { 
        x: 70.332, // Match spacing
        y: 198.4167,
        z: 11.66
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'third',
        liquid_level: 0.3,
        description: 'IBC Tote Third Stack #5'
      }
    },
    {
      id: 'ibc-tote-third-6',
      type: 'fixture' as const,
      position: { 
        x: 74.415, // Match spacing
        y: 198.4167,
        z: 11.66
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'third',
        liquid_level: 0.7,
        description: 'IBC Tote Third Stack #6'
      }
    },
    {
      id: 'ibc-tote-third-7',
      type: 'fixture' as const,
      position: { 
        x: 78.498, // Match spacing with bottom and top tiers
        y: 198.4167,
        z: 11.66
      },
      dimensions: { width: 4, height: 3.33, depth: 3.83 },
      rotation: 0,
      material: 'ibc_tote',
      color: '#f0f0f0',
      metadata: { 
        category: 'storage',
        equipment_type: 'ibc_tote',
        capacity_gallons: 330,
        stack_level: 'third',
        liquid_level: 0.5,
        weathered: true, // Some weathered for variety
        description: 'IBC Tote Third Stack #7'
      }
    },

    // NORWESCO 1000 GALLON TANKS - Two tanks west of the IBC totes
    // Positioned to the left/west of the westernmost IBC tote (x=44.877)
    {
      id: 'norwesco-tank-1',
      type: 'fixture' as const,
      position: { 
        x: 40.5, // Positioned to clear west hallway (37.0625 + 1' clearance + 2.67' tank radius = 40.67', rounded to 40.5')
        y: 198.4167, // Same Y position as IBC totes
        z: 0 // Floor level
      },
      dimensions: { 
        width: 5.33, // 64" diameter = 5.33'
        height: 5.33, // 64" diameter = 5.33' (circular footprint)
        depth: 6.67 // 80" height = 6.67'
      },
      rotation: 0,
      material: 'norwesco_tank',
      color: '#e8e8e8', // Light gray/white
      metadata: {
        category: 'storage',
        equipment_type: 'norwesco_tank',
        model_number: '40152',
        capacity_gallons: 1000,
        diameter_inches: 64,
        height_inches: 80,
        material_tank: 'polyethylene',
        manufacturer: 'Norwesco',
        description: 'Norwesco 40152 - 1000 Gallon Vertical Storage Tank #1'
      }
    },
    {
      id: 'norwesco-tank-2',
      type: 'fixture' as const,
      position: { 
        x: 47, // Positioned east of first tank (40.5 + 5.33' tank width + 1.17' spacing = 47')
        y: 198.4167, // Same Y position as IBC totes
        z: 0 // Floor level
      },
      dimensions: { 
        width: 5.33, // 64" diameter = 5.33'
        height: 5.33, // 64" diameter = 5.33' (circular footprint)
        depth: 6.67 // 80" height = 6.67'
      },
      rotation: 0,
      material: 'norwesco_tank',
      color: '#e8e8e8', // Light gray/white
      metadata: {
        category: 'storage',
        equipment_type: 'norwesco_tank',
        model_number: '40152',
        capacity_gallons: 1000,
        diameter_inches: 64,
        height_inches: 80,
        material_tank: 'polyethylene',
        manufacturer: 'Norwesco',
        description: 'Norwesco 40152 - 1000 Gallon Vertical Storage Tank #2'
      }
    },



    // BLACK GLOSS EPOXY FLOORS
    // High-performance black gloss epoxy flooring for hallways and control areas
    
    // West Longway Hallway - Black Gloss Epoxy Floor (15' wide hallway)
    {
      id: 'west-longway-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 25, // EXTENDED to south exterior wall
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 12.0625, // 12' hallway width (37.0625 - 25 = 12.0625')
        height: 173.0417, // FULL LENGTH from south exterior wall to Room 2 north wall (198.0417 - 25 = 173.0417')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'west-longway-hallway',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - West longway hallway (12\' x 173\')'
      }
    },
    
    // East Longway Hallway - Black Gloss Epoxy Floor (6' wide hallway)
    {
      id: 'east-longway-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 106.75, // Start at east longway wall
        y: 25, // EXTENDED to south exterior wall
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 6.0, // 6' hallway width (112.75 - 106.75 = 6.0')
        height: 173.0417, // FULL LENGTH from south exterior wall to Room 2 north wall (198.0417 - 25 = 173.0417')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'east-longway-hallway',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - East longway hallway (6\' x 173\')'
      }
    },
    
    // Room 8 - White Epoxy Floor (full room coverage)
    {
      id: 'room-8-white-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 37.0625, // Start at left longways wall (Room 8 west boundary)
        y: 25, // Start at south exterior wall
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 75.6875, // Room 8 width: east exterior wall to left longways wall (112.75 - 37.0625 = 75.6875')
        height: 23.6667, // Room 8 depth: south exterior wall to room-wall-7 (48.6667 - 25 = 23.6667')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#ffffff', // Pure white epoxy for Room 8
      metadata: { 
        category: 'flooring',
        material_type: 'white_epoxy',
        thickness_inches: 1.5,
        area: 'room-8',
        room: 'room-8',
        finish: 'semi-gloss',
        chemical_resistant: true,
        anti_slip: true,
        seamless: true,
        description: 'White epoxy floor - Room 8 (75.69\' x 23.67\')'
      }
    },


  ],
  scale: 1,
  units: 'feet' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
}

/**
 * Model templates for creating new warehouses
 */
export const MODEL_TEMPLATES = {
  EMPTY_1000: {
    id: 'empty-warehouse-1000',
    name: 'Empty 1000x1000 Warehouse',
    dimensions: { width: 1000, height: 1000 },
    elements: [],
    scale: 1,
    units: 'feet' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  
  EMPTY_500: {
    id: 'empty-warehouse-500',
    name: 'Empty 500x500 Warehouse',
    dimensions: { width: 500, height: 500 },
    elements: [],
    scale: 1,
    units: 'feet' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
} as const

/**
 * COVE BASE TRIM LIBRARY
 * Available cove base trim configurations for warehouse flooring
 */

/**
 * Creates a cove base trim element at specified position
 * @param position - The x, y, z coordinates in feet
 * @param config - Configuration options for the trim (optional)
 * @param id - Optional custom ID for the element
 */
export function createWarehouseCoveBaseTrim(
  position: { x: number; y: number; z: number },
  config?: Partial<CoveBaseTrimConfig>,
  id?: string
) {
  const trimConfig: CoveBaseTrimConfig = {
    ...defaultCoveBaseTrimConfig,
    ...config,
    position: { x: position.x, y: position.y, z: position.z },
    rotation: { x: 0, y: 0, z: config?.rotation?.z || 0 }
  };


  if (id) {
    trim.userData.id = id;
  }
  
  return trim;
}

/**
 * Creates a perimeter cove base trim system for a room
 * @param roomCorner - Bottom-left corner of the room
 * @param roomWidth - Width of the room in feet
 * @param roomLength - Length of the room in feet
 * @param config - Configuration options for all trim pieces
 */
export function createRoomCoveBaseTrimSystem(
  roomCorner: { x: number; y: number; z: number },
  roomWidth: number,
  roomLength: number,
  config?: Partial<CoveBaseTrimConfig>
) {
  const trimPieces = [];
  const baseConfig = { ...defaultCoveBaseTrimConfig, ...config };
  
  // Calculate standard 4-foot piece length
  const pieceLength = 48; // 4 feet in inches
  const pieceLengthFeet = 4;
  
  // South wall (bottom) - running east-west
  const southPieces = Math.ceil(roomWidth / pieceLengthFeet);
  for (let i = 0; i < southPieces; i++) {
    const pieceWidth = Math.min(pieceLengthFeet, roomWidth - (i * pieceLengthFeet));
    const position = {
      x: roomCorner.x + (i * pieceLengthFeet),
      y: roomCorner.y,
      z: roomCorner.z
    };
    
    const trimConfig = {
      ...baseConfig,
      length: pieceWidth * 12, // Convert to inches
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: 0, y: 0, z: 0 }
    };
    
    trimPieces.push(createCoveBaseTrim(trimConfig));
  }
  
  // North wall (top) - running east-west
  const northPieces = Math.ceil(roomWidth / pieceLengthFeet);
  for (let i = 0; i < northPieces; i++) {
    const pieceWidth = Math.min(pieceLengthFeet, roomWidth - (i * pieceLengthFeet));
    const position = {
      x: roomCorner.x + (i * pieceLengthFeet),
      y: roomCorner.y + roomLength,
      z: roomCorner.z
    };
    
    const trimConfig = {
      ...baseConfig,
      length: pieceWidth * 12, // Convert to inches
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: 0, y: 0, z: 0 }
    };
    
    trimPieces.push(createCoveBaseTrim(trimConfig));
  }
  
  // West wall (left) - running north-south
  const westPieces = Math.ceil;
  for (let i = 0; i < westPieces; i++) {
    const pieceLength = Math.min(pieceLengthFeet, roomLength - (i * pieceLengthFeet));
    const position = {
      x: roomCorner.x,
      y: roomCorner.y + (i * pieceLengthFeet),
      z: roomCorner.z
    };
    
    const trimConfig = {
      ...baseConfig,
      length: pieceLength * 12, // Convert to inches
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: 0, y: 0, z: Math.PI / 2 } // 90 degrees for north-south orientation
    };
    
    trimPieces.push(createCoveBaseTrim(trimConfig));
  }
  
  // East wall (right) - running north-south
  const eastPieces = Math.ceil(roomLength / pieceLengthFeet);
  for (let i = 0; i < eastPieces; i++) {
    const pieceLength = Math.min(pieceLengthFeet, roomLength - (i * pieceLengthFeet));
    const position = {
      x: roomCorner.x + roomWidth,
      y: roomCorner.y + (i * pieceLengthFeet),
      z: roomCorner.z
    };
    
    const trimConfig = {
      ...baseConfig,
      length: pieceLength * 12, // Convert to inches
      position: { x: position.x, y: position.y, z: position.z },
      rotation: { x: 0, y: 0, z: Math.PI / 2 } // 90 degrees for north-south orientation
    };
    
    trimPieces.push(createCoveBaseTrim(trimConfig));
  }
  
  return trimPieces;
}

/**
 * COVE BASE TRIM CATALOG
 * Pre-configured trim options for common warehouse applications
 */
export const COVE_BASE_TRIM_CATALOG = {
  // Standard vinyl cove base trims
  VINYL_4_INCH: {
    name: '4" Vinyl Cove Base',
    config: coveBaseTrimPresets.standard4inch,
    description: 'Standard 4" vinyl cove base for office areas'
  },
  
  VINYL_6_INCH: {
    name: '6" Vinyl Cove Base',
    config: coveBaseTrimPresets.standard6inch,
    description: 'Standard 6" vinyl cove base for storage areas'
  },
  
  VINYL_8_INCH: {
    name: '8" Vinyl Cove Base',
    config: coveBaseTrimPresets.standard8inch,
    description: 'Standard 8" vinyl cove base for production areas'
  },
  
  // Heavy duty rubber cove base
  RUBBER_HEAVY_DUTY: {
    name: 'Heavy Duty Rubber Cove Base',
    config: coveBaseTrimPresets.heavyDutyRubber,
    description: 'Heavy duty rubber cove base for high-traffic manufacturing areas'
  },
  
  // Aluminum trim for clean rooms
  ALUMINUM_TRIM: {
    name: 'Aluminum Cove Base Trim',
    config: coveBaseTrimPresets.aluminumTrim,
    description: 'Aluminum cove base trim for clean rooms and food processing'
  }
};

/**
 * Gets recommended cove base trim for a specific warehouse area
 * @param areaType - Type of warehouse area
 */
export function getRecommendedCoveBaseTrim(areaType: string) {
  const recommendations = {
    'office': COVE_BASE_TRIM_CATALOG.VINYL_4_INCH,
    'break_room': COVE_BASE_TRIM_CATALOG.VINYL_4_INCH,
    'storage': COVE_BASE_TRIM_CATALOG.VINYL_6_INCH,
    'warehouse': COVE_BASE_TRIM_CATALOG.VINYL_6_INCH,
    'production': COVE_BASE_TRIM_CATALOG.VINYL_8_INCH,
    'loading_dock': COVE_BASE_TRIM_CATALOG.VINYL_8_INCH,
    'manufacturing': COVE_BASE_TRIM_CATALOG.RUBBER_HEAVY_DUTY,
    'maintenance': COVE_BASE_TRIM_CATALOG.RUBBER_HEAVY_DUTY,
    'clean_room': COVE_BASE_TRIM_CATALOG.ALUMINUM_TRIM,
    'food_processing': COVE_BASE_TRIM_CATALOG.ALUMINUM_TRIM,
    'laboratory': COVE_BASE_TRIM_CATALOG.ALUMINUM_TRIM
  };
  
  return recommendations[areaType.toLowerCase()] || COVE_BASE_TRIM_CATALOG.VINYL_6_INCH;
}

/**
 * WAREHOUSE MODEL MANAGEMENT SYSTEM
 */

// Model validation schemas
export interface ModelValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Element categories for organization
export const ELEMENT_CATEGORIES = {
  EXTERIOR: 'exterior',
  INTERIOR: 'interior', 
  STRUCTURAL: 'structural',
  ACCESS: 'access',
} as const

// Element purposes for classification
export const ELEMENT_PURPOSES = {
  ROOM_END_WALL: 'room_end_wall',
  HALLWAY_DIVISION: 'hallway_division',
  DOOR_TOP_WALL: 'door_top_wall',
} as const

// Material types
export const MATERIAL_TYPES = {
  BRICK: 'brick',
  DRYWALL: 'drywall',
  STEEL: 'steel',
  WOOD: 'wood',
  CONCRETE: 'concrete',
} as const

/**
 * Validates a warehouse model for structural integrity and completeness
 */
export function validateWarehouseModel(model: FloorplanData): ModelValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check required dimensions
  if (!model.dimensions || model.dimensions.width <= 0 || model.dimensions.height <= 0) {
    errors.push('Model must have valid dimensions')
  }

  // Check for required elements
  const elements = model.elements || []
  const elementIds = new Set(elements.map(e => e.id))

  // Validate unique IDs
  if (elementIds.size !== elements.length) {
    errors.push('All elements must have unique IDs')
  }

  // Check for structural elements (optional for empty pad)
  const steelBeams = elements.filter(e => e.material === 'steel' && e.type === 'fixture')
  if (elements.length > 0 && steelBeams.length === 0) {
    warnings.push('No steel beams found - structural integrity may be compromised')
  }

  // Check for exterior walls (optional for empty pad)
  const exteriorWalls = elements.filter(e => 
    e.type === 'wall' && 
    e.metadata?.category === 'exterior'
  )
  if (elements.length > 0 && exteriorWalls.length < 4) {
    warnings.push('Model should have at least 4 exterior walls for enclosure')
  }

  // Validate element positions
  elements.forEach(element => {
    if (!element.position || 
        typeof element.position.x !== 'number' || 
        typeof element.position.y !== 'number') {
      errors.push(`Element ${element.id} has invalid position`)
    }

    if (!element.dimensions || 
        element.dimensions.width <= 0 || 
        element.dimensions.height <= 0) {
      errors.push(`Element ${element.id} has invalid dimensions`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Gets elements by category
 */
export function getElementsByCategory(model: FloorplanData, category: string) {
  return model.elements.filter(e => e.metadata?.category === category)
}

/**
 * Gets elements by room
 */
export function getElementsByRoom(model: FloorplanData, roomId: string) {
  return model.elements.filter(e => e.metadata?.room === roomId)
}

/**
 * Gets all rooms in the model
 */
export function getRooms(model: FloorplanData): string[] {
  const rooms = new Set<string>()
  model.elements.forEach(e => {
    if (e.metadata?.room) {
      rooms.add(e.metadata.room)
    }
  })
  return Array.from(rooms).sort()
}

/**
 * Creates a deep copy of a model for editing
 */
export function cloneModel(model: FloorplanData): FloorplanData {
  return JSON.parse(JSON.stringify(model))
}

/**
 * Updates model timestamp
 */
export function touchModel(model: FloorplanData): FloorplanData {
  return {
    ...model,
    updatedAt: new Date()
  }
} 
