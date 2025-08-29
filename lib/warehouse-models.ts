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
    
    // South dry room north wall - separates south and middle hallway (FULL HEIGHT TO ROOF)
    {
      id: 'room-wall-1',
      type: 'wall' as const,
      position: { 
        x: 81.875, // Adjusted to make east wall exactly 28.5' long (110.375 - 28.5 = 81.875)
        y: 208.5209, // North boundary of south dry room (198.0417 + 10.4792 = 208.5209)
        z: 0 
      },
      dimensions: { width: 28.5, height: 0.375, depth: 16.8906 }, // Width set to exactly 28.5' to reach east longway wall, 4.5" thick (0.375'), FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_south: 'dry-room-south',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'South dry room north wall - FULL HEIGHT to roof trusses (28.5\' long)',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(28.5 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },
    // Room wall 2 - centered on second I-beam (separates Room 2 from Room 3)
    {
      id: 'room-wall-2',
      type: 'wall' as const,
      position: { 
        x: 30.0625, // Precisely centered
        y: 173.4792, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 80.375, height: 0.375, depth: 12 }, // 4.5" thick (0.375'), fits between longways walls
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
    // Room wall 3 - centered on third I-beam (separates Room 3 from Room 4)
    {
      id: 'room-wall-3',
      type: 'wall' as const,
      position: { 
        x: 30.0625, // Precisely centered
        y: 148.9167, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 80.375, height: 0.375, depth: 12 }, // 4.5" thick (0.375'), fits between longways walls
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 3,
        room_south: 4,
        description: 'Room wall 3 - separates Room 3 (north) from Room 4 (south)'
      }
    },
    // FIREWALL - Room 5's north wall / Room 4's south wall - EXTENDS TO EXTERIOR WALLS
    {
      id: 'room-wall-4',
      type: 'wall' as const,
      position: { 
        x: 25, // Extended to west exterior wall
        y: 124.3542, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 87.75, height: 0.5, depth: 12 }, // 6" thick firewall (0.5'), extends full building width
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
        room_north: 4,
        room_south: 5,
        description: 'FIREWALL - Room 5 north wall / Room 4 south wall - extends to exterior walls across hallways'
      }
    },
    // Room wall 5 - centered on fifth I-beam (separates Room 5 from Room 6)
    {
      id: 'room-wall-5',
      type: 'wall' as const,
      position: { 
        x: 30.0625, // Precisely centered
        y: 99.7917, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 80.375, height: 0.375, depth: 12 }, // 4.5" thick (0.375'), fits between longways walls
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
        x: 30.0625, // Precisely centered
        y: 75.2292, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 80.375, height: 0.375, depth: 12 }, // 4.5" thick (0.375'), fits between longways walls
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
        x: 30.0625, // Precisely centered
        y: 48.6667, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 80.375, height: 0.375, depth: 12 }, // 4.5" thick (0.375'), fits between longways walls
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
    
    // Left longways wall - runs north-south, recessed 5' from left exterior wall, stops at north hallway
    {
      id: 'longways-wall-left',
      type: 'wall' as const,
      position: { 
        x: 30.0625, // Aligned with room walls (matches room-wall positions)
        y: 29, // Start 4' from south exterior wall (25 + 4 = 29)
        z: 0 
      },
      dimensions: { width: 0.375, height: 169.0417, depth: 12 }, // 4.5" thick, shortened to end at room 2's north wall: 198.0417-29 = 169.0417'
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall - 12\' high with room openings, shortened to end at room 2\'s north wall',
        openings: [
          {
            id: 'room-8-west-opening',
            type: 'door',
            position: { x: 11.83, z: 0 }, // Room 8 centered in its section (29 + 23.6667/2 = 40.83 - 29 = 11.83)
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 8 west entrance - 5\' hallway double door' }
          },
          {
            id: 'room-7-west-opening', 
            type: 'door',
            position: { x: 31.77, z: 0 }, // Room 7 centered (75.2292 + 48.6667)/2 - 29 = 31.77
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 7 west entrance - 5\' hallway double door' }
          },
          {
            id: 'room-6-west-opening',
            type: 'door', 
            position: { x: 58.51, z: 0 }, // Room 6 centered (75.2292 + 99.7917)/2 - 29 = 58.51
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 6 west entrance - 5\' hallway double door' }
          },
          {
            id: 'room-5-west-opening',
            type: 'door',
            position: { x: 83.07, z: 0 }, // Room 5 centered (99.7917 + 124.3542)/2 - 29 = 83.07
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 5 west entrance - 5\' hallway double door' }
          },
          {
            id: 'room-4-west-opening',
            type: 'door',
            position: { x: 107.64, z: 0 }, // Room 4 centered (124.3542 + 148.9167)/2 - 29 = 107.64
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 4 west entrance - 5\' hallway double door' }
          },
          {
            id: 'room-3-west-opening',
            type: 'door',
            position: { x: 132.20, z: 0 }, // Room 3 centered (148.9167 + 173.4792)/2 - 29 = 132.20
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 3 west entrance - 5\' hallway double door' }
          },
          {
            id: 'room-2-west-opening',
            type: 'door',
            position: { x: 156.76, z: 0 }, // Room 2 centered (173.4792 + 198.0417)/2 - 29 = 156.76
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 2 west entrance - 5\' hallway double door' }
          }
        ]
      }
    },
    
          // Right longways wall - runs north-south, recessed 3' from right exterior wall
      // STARTS at room-wall-7 (room 7's south wall) to leave room 8 open to east hallway
      // Continues north past double tier dry room, creating continuous wall
      {
        id: 'longways-wall-right',
        type: 'wall' as const,
        position: { 
          x: 110.375, // 3' from right exterior wall (112.75 - 3 + wall thickness/2 = 110.375)
          y: 49.0417, // Start after room-wall-7 (48.6667 + 0.375 wall thickness = 49.0417)
          z: 0 
        },
        dimensions: { width: 0.375, height: 172.9583, depth: 12 }, // Extended to north exterior wall (222 - 49.0417 = 172.9583')
        rotation: 0,
        material: 'concrete',
        color: '#ffffff',
        metadata: { 
          category: 'room-walls', 
          material_type: 'drywall',
          load_bearing: false,
          description: 'Right longways wall - 12\' high with room openings, continuous wall to north exterior, 3\' from east exterior wall',
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

    // HALLWAY WALLS - North and South walls to complete 4' perimeter hallway
    
    // South hallway wall - runs east-west, 4' from south exterior wall (northern boundary of Room 8)
    // Shortened to end 2' from south wall opening
    {
      id: 'hallway-wall-south',
      type: 'wall' as const,
      position: { 
        x: 30.0625, // Aligned with other room walls (matches room-wall positions)
        y: 29, // 4' from south exterior wall (25 + 4 = 29)
        z: 0 
      },
      dimensions: { width: 68.5625, height: 0.375, depth: 12 }, // Extended eastward (98.625 - 30.0625 = 68.5625')
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 8,
        description: 'South hallway wall - northern boundary of Room 8, shortened to end 2\' from south wall opening'
      }
    },
    
    // Room 8 closure wall - runs north-south from south exterior wall to room-wall-7
    // This wall closes both room 8 and the south hallway at x=96.625
    {
      id: 'room-8-closure-wall',
      type: 'wall' as const,
      position: { 
        x: 98.625, // At the end of the extended south hallway wall
        y: 25, // Start at south exterior wall
        z: 0 
      },
      dimensions: { width: 0.375, height: 23.6667, depth: 12 }, // 4.5" thick, extends to room-wall-7 (48.6667 - 25 = 23.6667')
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Room 8 closure wall - closes both room 8 and south hallway, connects south exterior wall to room-wall-7 (room 8 north wall)'
      }
    },
    
    // North hallway wall - separates Room 2 from south dry room (stays at original I-beam position) (FULL HEIGHT TO ROOF)
    {
      id: 'hallway-wall-north',
      type: 'wall' as const,
      position: { 
        x: 30.0625, // Aligned with other room walls (same as room-wall positions)
        y: 198.0417, // Precisely centered on I-beam Y position minus half wall thickness (stays at original position)
        z: 0 
      },
      dimensions: { width: 80.3125, height: 0.375, depth: 16.8906 }, // Ends at east longway wall: 110.375 - 30.0625 = 80.3125', 4.5" thick (0.375'), FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 'dry-room-south',
        room_south: 2,
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'North hallway wall - separates Room 2 from south dry room (SOUTH WALL - FULL HEIGHT to roof trusses)'
      }
    },





    // South dry room east wall - eastern boundary (FULL HEIGHT TO ROOF)
    {
      id: 'room-1-second-divider-wall',
      type: 'wall' as const,
      position: { 
        x: 110.375, // At the end of the north hallway wall (30 + 80.375 = 110.375)
        y: 198.0417, // Start at north hallway wall position and extend north
        z: 0 
      },
      dimensions: { width: 0.375, height: 10.4792, depth: 16.8906 }, // 4.5" thick, spans exactly 10.4792' for equal sized rooms, FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_west: 'dry-room-south',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'South dry room east wall - FULL HEIGHT to roof trusses (10.4792\' wide)'
      }
    },

    // South dry room west wall - western boundary (FULL HEIGHT TO ROOF)
    {
      id: 'dry-room-west-cap-wall',
      type: 'wall' as const,
      position: { 
        x: 81.875, // Adjusted to make the dry room exactly 28.5' long
        y: 198.0417, // Start at north hallway wall position and extend north
        z: 0 
      },
      dimensions: { width: 0.375, height: 10.4792, depth: 16.8906 }, // 4.5" thick, spans exactly 10.4792' for equal sized rooms, FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_east: 'dry-room-south',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'South dry room west wall - FULL HEIGHT to roof trusses (28.5\' long x 10.4792\' wide)',
        openings: [
          {
            id: 'south-dry-room-west-double-door',
            type: 'door' as const,
            position: { x: 5.2396, z: 0 }, // Centered on 10.4792' wall (10.4792/2 = 5.2396), at floor level
            dimensions: { width: 5, height: 8 }, // 5' wide (slim double door), 8' tall
            metadata: {
              doorType: 'double' as const,
              description: 'Slim double door - South dry room west entrance'
            }
          }
        ]
      }
    },

    // MIDDLE HALLWAY WALLS (3' wide hallway between dry rooms)
    // Middle hallway north wall (also south wall of north dry room) (FULL HEIGHT TO ROOF)
    {
      id: 'middle-hallway-south-wall',
      type: 'wall' as const,
      position: { 
        x: 81.875, // Aligned with dry rooms
        y: 211.5209, // North wall of middle hallway (208.5209 + 3 = 211.5209)
        z: 0 
      },
      dimensions: { width: 28.5, height: 0.375, depth: 16.8906 }, // Same 28.5' length, 4.5" thick, FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 'dry-room-north',
        room_south: 'middle-hallway',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'Middle hallway north wall / North dry room south wall - FULL HEIGHT to roof trusses'
      }
    },
    
    // North dry room west wall (FULL HEIGHT TO ROOF)
    {
      id: 'north-dry-room-west-wall',
      type: 'wall' as const,
      position: { 
        x: 81.875, // Western boundary of north dry room
        y: 211.5209, // Start at south wall of north dry room
        z: 0 
      },
      dimensions: { width: 0.375, height: 10.4791, depth: 16.8906 }, // 4.5" thick, extends to north exterior (222 - 211.5209 = 10.4791'), FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_east: 'dry-room-north',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'North dry room west wall - FULL HEIGHT to roof trusses (28.5\' long x 10.4791\' wide)',
        openings: [
          {
            id: 'north-dry-room-west-double-door',
            type: 'door' as const,
            position: { x: 5.23955, z: 0 }, // Centered on 10.4791' wall (10.4791/2 = 5.23955), at floor level
            dimensions: { width: 5, height: 8 }, // 5' wide (slim double door), 8' tall
            metadata: {
              doorType: 'double' as const,
              description: 'Slim double door - North dry room west entrance'
            }
          }
        ]
      }
    },

    // North dry room north wall (FULL HEIGHT TO ROOF)
    {
      id: 'north-dry-room-north-wall',
      type: 'wall' as const,
      position: { 
        x: 81.875, // Start at west wall of north dry room
        y: 222, // North exterior wall position
        z: 0 
      },
      dimensions: { width: 28.5, height: 0.375, depth: 16.8906 }, // 28.5' long, 4.5" thick, FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_south: 'dry-room-north',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'North dry room north wall - FULL HEIGHT to roof trusses (28.5\' long)'
      }
    },

    // North dry room east wall (FULL HEIGHT TO ROOF)
    {
      id: 'north-dry-room-east-wall',
      type: 'wall' as const,
      position: { 
        x: 110.375, // East boundary at longway wall position
        y: 211.5209, // Start at south wall of north dry room
        z: 0 
      },
      dimensions: { width: 0.375, height: 10.4791, depth: 16.8906 }, // 4.5" thick, extends to north exterior (222 - 211.5209 = 10.4791'), FULL HEIGHT to roof curve
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_west: 'dry-room-north',
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'North dry room east wall - FULL HEIGHT to roof trusses (10.4791\' wide)'
      }
    },

    // CATWALKS - 2.5' wide elevated walkways with ZERO GAP on door headers
    // South Dry Room Catwalk - Bottom touches door header with zero gap
    {
      id: 'south-dry-room-catwalk',
      type: 'platform' as const,
      position: { 
        x: 81.875, // Start at west wall where doorway is
        y: 198.0417 + 5.2396 - 1.25, // Door center minus half catwalk width (198.0417 + 5.2396 - 1.25 = 202.0313)
        z: 8.875 // RIGHT ON TOP of door frame assembly (8' door + 0.875' complete header structure)
      },
      dimensions: { 
        width: 28.5, // Length from west wall to east longway wall (110.375 - 81.875 = 28.5')
        height: 2.5, // Catwalk width of 2.5'
        depth: 0.25 // Platform thickness of 3"
      },
      rotation: 0,
      material: 'metal',
      color: '#6b7280',
      metadata: { 
        category: 'catwalk',
        material_type: 'steel_grating',
        load_capacity: 100, // psf
        has_railings: true,
        railing_height: 3.5, // 42" railings
        sits_on_header: true,
        description: 'South dry room catwalk - zero gap on door header'
      }
    },

    // North Dry Room Catwalk - Bottom touches door header with zero gap
    {
      id: 'north-dry-room-catwalk',
      type: 'platform' as const,
      position: { 
        x: 81.875, // Start at west wall where doorway is
        y: 211.5209 + 5.23955 - 1.25, // Door center minus half catwalk width (211.5209 + 5.23955 - 1.25 = 215.51045)
        z: 8.875 // RIGHT ON TOP of door frame assembly (8' door + 0.875' complete header structure)
      },
      dimensions: { 
        width: 28.5, // Length from west wall to east longway wall (110.375 - 81.875 = 28.5')
        height: 2.5, // Catwalk width of 2.5'
        depth: 0.25 // Platform thickness of 3"
      },
      rotation: 0,
      material: 'metal',
      color: '#6b7280',
      metadata: { 
        category: 'catwalk',
        material_type: 'steel_grating',
        load_capacity: 100, // psf
        has_railings: true,
        railing_height: 3.5, // 42" railings
        sits_on_header: true,
        description: 'North dry room catwalk - zero gap on door header'
      }
    },

    // CONNECTING CATWALK - 8' wide catwalk connecting both dry room catwalks on west side
    {
      id: 'west-connecting-catwalk',
      type: 'platform' as const,
      position: { 
        x: 73.5, // Extended 4' further west (77.5 - 4 = 73.5)
        y: 198.0417, // Start at south dry room south wall
        z: 8.875 // Same height as dry room catwalks
      },
      dimensions: { 
        width: 8, // 8' wide connecting catwalk (expanded from 4' to 8')
        height: 24.4791, // Length to span both dry rooms + middle hallway (222 - 198.0417 = 23.9583, rounded to 24.4791)
        depth: 0.25 // Platform thickness of 3"
      },
      rotation: 0,
      material: 'metal',
      color: '#6b7280',
      metadata: { 
        category: 'catwalk',
        material_type: 'steel_grating',
        load_capacity: 100, // psf
        has_railings: true,
        railing_height: 3.5, // 42" railings
        connects_catwalks: true,
        description: '8\' wide connecting catwalk on west side linking both dry room catwalks'
      }
    },

    // WEST CONNECTING CATWALK DETAILED METAL RAILING - OSHA Compliant (West Side Only)
    {
      id: 'west-connecting-catwalk-railing-system',
      type: 'railing' as const,
      position: { 
        x: 73.6, // Positioned 1.2" inward from new west edge of catwalk (73.5 + 0.1 = 73.6) for proper post mounting
        y: 198.0417, // Start at south end of catwalk
        z: 7.375 // Base sits on catwalk surface: 9.125 - (3.5/2) = 7.375 (accounts for depth/2 offset in positioning logic)
      },
      dimensions: { 
        width: 0.1, // Thin railing profile
        height: 24.4791, // Length along catwalk (north-south)
        depth: 3.5 // 42" high railing
      },
      rotation: 0,
      material: 'metal',
      color: '#708090',
      metadata: { 
        category: 'safety_railing',
        material_type: 'galvanized_steel',
        osha_compliant: true,
        height_inches: 42,
        mid_rail_height: 21,
        toe_kick_height: 4,
        post_spacing: 60, // 5 feet maximum
        rail_diameter: 1.5,
        post_diameter: 2,
        has_toe_kick: true,
        has_mid_rail: true,
        has_posts: true,
        num_posts: 6, // Every 5 feet along 24.48' length
        compliance_standard: 'OSHA_1910.29',
        detailed_rendering: true,
        railing_type: 'detailed_metal_handrail',
        description: 'West connecting catwalk detailed railing - OSHA compliant with posts, top rail, mid rail, and toe kick - mounted on catwalk edge'
      }
    },

    // EAST LONGWAY HALLWAY CEILING - 8' high ceiling creating 4' duct space above
    // Horizontal ceiling panel spanning the east hallway width and length
    {
      id: 'east-hallway-ceiling',
      type: 'fixture' as const, // Using fixture type for ceiling panel
      position: { 
        x: 110.375, // Start at right longways wall
        y: 29, // Start at south hallway wall
        z: 8 // 8' height for ceiling
      },
      dimensions: { 
        width: 2.375, // Width from right longway wall to east exterior wall (112.75 - 110.375 = 2.375')
        height: 193, // Extended to north exterior wall (222 - 29 = 193')
        depth: 0.25 // Thin ceiling material - 3" thick
      },
      rotation: 0, // No rotation needed - positioned as horizontal surface
      material: 'concrete',
      color: '#f5f5f5', // Light gray ceiling color
      metadata: { 
        category: 'ceiling', 
        material_type: 'drywall',
        load_bearing: false,
        ceiling_height: 8,
        duct_space_above: 4,
        is_ceiling: true,
        description: 'East longway hallway ceiling at 8\' height, extended to north exterior wall'
      }
    },

    // MIDDLE HALLWAY CEILING - 8' high ceiling for 3' wide hallway between dry rooms
    {
      id: 'middle-hallway-ceiling',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at west wall of dry rooms
        y: 208.5209, // Start at south wall of middle hallway
        z: 8 // 8' height for ceiling
      },
      dimensions: { 
        width: 28.5, // Same width as dry rooms (28.5')
        height: 3, // Exactly 3' wide hallway (211.5209 - 208.5209 = 3')
        depth: 0.25 // Thin ceiling material - 3" thick
      },
      rotation: 0,
      material: 'concrete',
      color: '#f5f5f5', // Light gray ceiling color
      metadata: { 
        category: 'ceiling', 
        material_type: 'drywall',
        load_bearing: false,
        ceiling_height: 8,
        duct_space_above: 4,
        is_ceiling: true,
        description: 'Middle hallway ceiling at 8\' height, 3\' wide hallway between dry rooms'
      }
    },

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
        x: 69.375, // Starting at the I-beam center position
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
        x: 65.292, // 4.083' spacing (4' tote + 0.083' gap = 1")
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
        x: 61.209, // 4.083' spacing
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
        x: 57.126, // 4.083' spacing
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
        x: 53.043, // 4.083' spacing
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
        x: 48.96, // 4.083' spacing
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
        x: 44.877, // 4.083' spacing
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
        x: 69.375, // Same X position as bottom
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
        x: 65.292, // Match bottom row spacing with 1" gaps
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
        x: 61.209, // Match bottom row spacing
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
        x: 57.126, // Match bottom row spacing
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
        x: 53.043, // Match bottom row spacing
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
        x: 48.96, // Match bottom row spacing
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
        x: 44.877, // Match bottom row spacing
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



    // NORWESCO 1000 GALLON TANKS - Two tanks west of the IBC totes
    // Positioned to the left/west of the westernmost IBC tote (x=44.877)
    {
      id: 'norwesco-tank-1',
      type: 'fixture' as const,
      position: { 
        x: 38, // West of the westernmost IBC tote (44.877 - 4' tote width - 2.877' spacing = 38')
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
        x: 31.5, // Second tank further west (38 - 5.33' tank width - 1.17' spacing = 31.5')
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

    // TJI I-JOISTS - 11 7/8" beams running N/S from Room 7 south wall to Room 2 north wall
    // Spaced 16" on center (1.33' spacing), perpendicular orientation
    // Total span: 149.375' (Room 7 south wall y:48.6667 to Room 2 north wall y:198.0417)
    // Width coverage: 80.3125' (x:30.0625 to x:110.375 between longways walls)
    // Number of beams: 60 beams at 16" OC spacing
    ...Array.from({ length: 60 }, (_, i) => {
      const beamXPosition = 30.0625 + (i * 1.33); // Start at left longways wall, increment by 16" spacing
      const beamStartY = 48.6667; // Room 7 south wall Y coordinate
      
      return {
        id: `tji-beam-ns-${i + 1}`,
        type: 'fixture' as const,
        position: { 
          x: beamXPosition,
          y: beamStartY, // Start at Room 7 south wall
          z: 12.5 // Positioned above 12' walls (12' + 0.5' clearance)
        },
        dimensions: { 
          width: 0.125, // 1.5" = 0.125' beam width
          height: 149.375, // Full span from Room 7 south wall to Room 2 north wall (198.0417 - 48.6667)
          depth: 0.99 // 11.875" = 0.99' beam depth
        },
        rotation: 0, // No rotation - running north-south
        material: 'tji_beam',
        color: '#D2B48C', // OSB brown color
        metadata: {
          category: 'structural',
          equipment_type: 'tji_ijoist',
          beam_size: '11_7_8_inch',
          material_web: 'OSB',
          material_flange: 'lumber',
          load_bearing: true,
          engineered_lumber: true,
          spacing_inches: 16,
          spacing_oc: '16" OC',
                     span_rooms: ['Room 7', 'Room 6', 'Room 5', 'Room 4', 'Room 3', 'Room 2'],
           start_location: 'Room 7 south wall',
          end_location: 'Room 2 north wall',
          beam_number: i + 1,
          total_beams: 60,
          length_feet: 149.375,
          description: `TJI I-Joist 11 7/8" #${i + 1} - 149.4' long spanning Room 7 to Room 2, 16" OC`
        }
      };
    }),

    // COVE BASE TRIM - 8" solid vinyl trim for all interior walls of rooms 2-7
    // Positioned INSIDE room walls for proper installation and realistic appearance
    // Using dark color for visibility against white walls
    
    // ROOM 2 COVE BASE TRIM (4 walls)
    // Room 2 boundaries: x: 30.0625 to 110.375 (79.3125'), y: 173.4792 to 198.0417 (24.5625')
    
    // Room 2 - South wall trim (INSIDE room)
    {
      id: 'cove-trim-room2-south',
      type: 'fixture' as const,
      position: { 
        x: 30.0625, // Start at west longway wall
        y: 173.6667, // INSIDE room wall (173.4792 + 0.1875 = 173.6667)
        z: 0 // Floor level
      },
      dimensions: { 
        width: 80.3125, // Full width between longway walls
        height: 0.375, // 4.5" thick for visibility (0.375')
        depth: 0.67 // 8" tall (8/12 = 0.67')
      },
      rotation: 0,
      material: 'concrete', // Use concrete material for solid rendering
      color: '#1a202c', // Very dark gray for maximum visibility
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        thickness_inches: 4.5,
        room: 'room-2',
        wall_side: 'south',
        description: '8" vinyl cove base trim - Room 2 south wall (inside)'
      }
    },
    
    // Room 2 - North wall trim (INSIDE room)
    {
      id: 'cove-trim-room2-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 197.8542, // INSIDE room wall (198.0417 - 0.1875 = 197.8542)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375, // 4.5" thick
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-2',
        wall_side: 'north',
        description: '8" vinyl cove base trim - Room 2 north wall (inside)'
      }
    },
    
    // Room 2 - West wall trim (INSIDE room)
    {
      id: 'cove-trim-room2-west',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE room wall (30.0625 + 0.1875 = 30.25)
        y: 173.4792,
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 24.5625, // Room length
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-2',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Room 2 west wall (inside)'
      }
    },
    
    // Room 2 - East wall trim (INSIDE room)
    {
      id: 'cove-trim-room2-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 173.4792,
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 24.5625, // Room length
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-2',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Room 2 east wall (inside)'
      }
    },

    // ROOM 3 COVE BASE TRIM (4 walls)
    // Room 3 boundaries: x: 30.0625 to 110.375, y: 148.9167 to 173.4792 (24.5625')
    
    // Room 3 - South wall trim (INSIDE room)
    {
      id: 'cove-trim-room3-south',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 149.1042, // INSIDE room wall (148.9167 + 0.1875 = 149.1042)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-3',
        wall_side: 'south',
        description: '8" vinyl cove base trim - Room 3 south wall (inside)'
      }
    },
    
    // Room 3 - North wall trim (INSIDE room)
    {
      id: 'cove-trim-room3-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 173.2917, // INSIDE room wall (173.4792 - 0.1875 = 173.2917)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-3',
        wall_side: 'north',
        description: '8" vinyl cove base trim - Room 3 north wall (inside)'
      }
    },
    
    // Room 3 - West wall trim
    {
      id: 'cove-trim-room3-west',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE room wall (30.0625 + 0.1875 = 30.25)
        y: 148.9167,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-3',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Room 3 west wall (inside)'
      }
    },
    
    // Room 3 - East wall trim
    {
      id: 'cove-trim-room3-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 148.9167,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-3',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Room 3 east wall (inside)'
      }
    },

    // ROOM 4 COVE BASE TRIM (4 walls)
    // Room 4 boundaries: x: 30.0625 to 110.375, y: 124.3542 to 148.9167 (24.5625')
    
    // Room 4 - South wall trim (INSIDE room)
    {
      id: 'cove-trim-room4-south',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 124.5417, // INSIDE room wall (124.3542 + 0.1875 = 124.5417)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-4',
        wall_side: 'south',
        firewall_adjacent: true,
        description: '8" vinyl cove base trim - Room 4 south wall (inside)'
      }
    },
    
    // Room 4 - North wall trim (INSIDE room)
    {
      id: 'cove-trim-room4-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 148.7292, // INSIDE room wall (148.9167 - 0.1875 = 148.7292)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-4',
        wall_side: 'north',
        description: '8" vinyl cove base trim - Room 4 north wall (inside)'
      }
    },
    
    // Room 4 - West wall trim
    {
      id: 'cove-trim-room4-west',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE room wall (30.0625 + 0.1875 = 30.25)
        y: 124.3542,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-4',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Room 4 west wall (inside)'
      }
    },
    
    // Room 4 - East wall trim
    {
      id: 'cove-trim-room4-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 124.3542,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-4',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Room 4 east wall (inside)'
      }
    },

    // ROOM 5 COVE BASE TRIM (4 walls)
    // Room 5 boundaries: x: 30.0625 to 110.375, y: 99.7917 to 124.3542 (24.5625')
    
    // Room 5 - South wall trim (INSIDE room)
    {
      id: 'cove-trim-room5-south',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 99.9792, // INSIDE room wall (99.7917 + 0.1875 = 99.9792)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-5',
        wall_side: 'south',
        description: '8" vinyl cove base trim - Room 5 south wall (inside)'
      }
    },
    
    // Room 5 - North wall trim (INSIDE room)
    {
      id: 'cove-trim-room5-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 124.1667, // INSIDE room wall (124.3542 - 0.1875 = 124.1667)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-5',
        wall_side: 'north',
        firewall_adjacent: true,
        description: '8" vinyl cove base trim - Room 5 north wall (inside)'
      }
    },
    
    // Room 5 - West wall trim
    {
      id: 'cove-trim-room5-west',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE room wall (30.0625 + 0.1875 = 30.25)
        y: 99.7917,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-5',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Room 5 west wall (inside)'
      }
    },
    
    // Room 5 - East wall trim
    {
      id: 'cove-trim-room5-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 99.7917,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-5',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Room 5 east wall (inside)'
      }
    },

    // ROOM 6 COVE BASE TRIM (4 walls)
    // Room 6 boundaries: x: 30.0625 to 110.375, y: 75.2292 to 99.7917 (24.5625')
    
    // Room 6 - South wall trim (INSIDE room)
    {
      id: 'cove-trim-room6-south',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 75.4167, // INSIDE room wall (75.2292 + 0.1875 = 75.4167)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-6',
        wall_side: 'south',
        description: '8" vinyl cove base trim - Room 6 south wall (inside)'
      }
    },
    
    // Room 6 - North wall trim (INSIDE room)
    {
      id: 'cove-trim-room6-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 99.6042, // INSIDE room wall (99.7917 - 0.1875 = 99.6042)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-6',
        wall_side: 'north',
        description: '8" vinyl cove base trim - Room 6 north wall (inside)'
      }
    },
    
    // Room 6 - West wall trim
    {
      id: 'cove-trim-room6-west',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE room wall (30.0625 + 0.1875 = 30.25)
        y: 75.2292,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-6',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Room 6 west wall (inside)'
      }
    },
    
    // Room 6 - East wall trim
    {
      id: 'cove-trim-room6-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 75.2292,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 24.5625,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-6',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Room 6 east wall (inside)'
      }
    },

    // ROOM 7 COVE BASE TRIM (4 walls)
    // Room 7 boundaries: x: 30.0625 to 110.375, y: 48.6667 to 75.2292 (26.5625')
    
    // Room 7 - South wall trim (INSIDE room)
    {
      id: 'cove-trim-room7-south',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 48.8542, // INSIDE room wall (48.6667 + 0.1875 = 48.8542)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-7',
        wall_side: 'south',
        description: '8" vinyl cove base trim - Room 7 south wall (inside)'
      }
    },
    
    // Room 7 - North wall trim (INSIDE room)
    {
      id: 'cove-trim-room7-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625,
        y: 75.0417, // INSIDE room wall (75.2292 - 0.1875 = 75.0417)
        z: 0
      },
      dimensions: { 
        width: 80.3125,
        height: 0.375,
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-7',
        wall_side: 'north',
        description: '8" vinyl cove base trim - Room 7 north wall (inside)'
      }
    },
    
    // Room 7 - West wall trim
    {
      id: 'cove-trim-room7-west',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE room wall (30.0625 + 0.1875 = 30.25)
        y: 48.6667,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 26.5625, // Room 7 length (75.2292 - 48.6667)
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-7',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Room 7 west wall (inside)'
      }
    },
    
    // Room 7 - East wall trim
    {
      id: 'cove-trim-room7-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 48.6667,
        z: 0
      },
      dimensions: { 
        width: 0.375,
        height: 26.5625, // Room 7 length
        depth: 0.67
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-7',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Room 7 east wall (inside)'
      }
    },

    // LONGWAYS WALLS COVE BASE TRIM - North/South running walls
    // These are the continuous walls that run the length of the building
    
    // LEFT LONGWAYS WALL TRIM (West side) - OUTSIDE towards west hallway
    // This wall runs from Room 7 south to Room 2 north (y: 48.6667 to y: 198.0417)
    {
      id: 'cove-trim-longways-left-west',
      type: 'fixture' as const,
      position: { 
        x: 29.875, // OUTSIDE longways wall (30.0625 - 0.1875 = 29.875)
        y: 48.6667, // Start at Room 7 south wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 149.375, // Full length (198.0417 - 48.6667 = 149.375')
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        wall_type: 'longways_wall',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Left longways wall (west side, outside)'
      }
    },
    
    // LEFT LONGWAYS WALL TRIM (East side) - INSIDE towards rooms
    {
      id: 'cove-trim-longways-left-east',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE longways wall (30.0625 + 0.1875 = 30.25)
        y: 48.6667, // Start at Room 7 south wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 149.375, // Full length
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        wall_type: 'longways_wall',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Left longways wall (east side, inside rooms)'
      }
    },

    // RIGHT LONGWAYS WALL TRIM (West side) - INSIDE towards rooms
    // This wall runs from Room 7 south to north exterior (y: 49.0417 to y: 222)
    {
      id: 'cove-trim-longways-right-west',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE longways wall (110.375 - 0.1875 = 110.1875)
        y: 49.0417, // Start after room-wall-7
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 172.9583, // Full length to north (222 - 49.0417 = 172.9583')
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        wall_type: 'longways_wall',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Right longways wall (west side, inside rooms)'
      }
    },
    
    // RIGHT LONGWAYS WALL TRIM (East side) - OUTSIDE towards east hallway
    {
      id: 'cove-trim-longways-right-east',
      type: 'fixture' as const,
      position: { 
        x: 110.5625, // OUTSIDE longways wall (110.375 + 0.1875 = 110.5625)
        y: 49.0417, // Start after room-wall-7
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 172.9583, // Full length to north
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        wall_type: 'longways_wall',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Right longways wall (east side, outside)'
      }
    },

    // ROOM 8 COVE BASE TRIM (4 walls)
    // Room 8 boundaries: South wall (y=25), North wall (room-wall-7, y=48.6667), 
    // West wall (south hallway wall, x=30.0625), East wall (room-8-closure-wall, x=98.625)
    
    // Room 8 - South wall trim (INSIDE room) - South exterior wall
    {
      id: 'cove-trim-room8-south',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at south exterior wall west edge
        y: 25.1875, // INSIDE room wall (25 + 0.1875 = 25.1875)
        z: 0 // Floor level
      },
      dimensions: { 
        width: 73.625, // Full width of south wall segment (98.625 - 25 = 73.625')
        height: 0.375, // 4.5" thick for visibility (0.375')
        depth: 0.67 // 8" tall (8/12 = 0.67')
      },
      rotation: 0,
      material: 'concrete', // Use concrete material for solid rendering
      color: '#1a202c', // Very dark gray for maximum visibility
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        thickness_inches: 4.5,
        room: 'room-8',
        wall_side: 'south',
        description: '8" vinyl cove base trim - Room 8 south wall (inside)'
      }
    },
    
    // Room 8 - North wall trim (INSIDE room) - room-wall-7
    {
      id: 'cove-trim-room8-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625, // Start at west longway wall
        y: 48.4792, // INSIDE room wall (48.6667 - 0.1875 = 48.4792)
        z: 0
      },
      dimensions: { 
        width: 68.5625, // Width from longway wall to closure wall (98.625 - 30.0625 = 68.5625')
        height: 0.375, // 4.5" thick
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-8',
        wall_side: 'north',
        description: '8" vinyl cove base trim - Room 8 north wall (inside)'
      }
    },
    
    // Room 8 - West wall trim (INSIDE room) - South hallway wall
    {
      id: 'cove-trim-room8-west',
      type: 'fixture' as const,
      position: { 
        x: 30.25, // INSIDE room wall (30.0625 + 0.1875 = 30.25)
        y: 25, // Start at south exterior wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 23.6667, // Height from south wall to room-wall-7 (48.6667 - 25 = 23.6667')
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-8',
        wall_side: 'west',
        description: '8" vinyl cove base trim - Room 8 west wall (inside)'
      }
    },
    
    // Room 8 - East wall trim (INSIDE room) - room-8-closure-wall
    {
      id: 'cove-trim-room8-east',
      type: 'fixture' as const,
      position: { 
        x: 98.4375, // INSIDE room wall (98.625 - 0.1875 = 98.4375)
        y: 25, // Start at south exterior wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 23.6667, // Height from south wall to room-wall-7 (48.6667 - 25 = 23.6667')
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'room-8',
        wall_side: 'east',
        description: '8" vinyl cove base trim - Room 8 east wall (inside)'
      }
    },

    // SOUTH DRY ROOM COVE BASE TRIM (4 walls)
    // South Dry Room boundaries: West wall (x=81.875), East wall (x=110.375), 
    // South wall (y=198.0417), North wall (y=208.5209)
    // Dimensions: 28.5' wide x 10.4792' deep
    
    // South Dry Room - South wall trim (INSIDE room) - North hallway wall
    {
      id: 'cove-trim-south-dry-room-south',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at west wall
        y: 198.2292, // INSIDE room wall (198.0417 + 0.1875 = 198.2292)
        z: 0 // Floor level
      },
      dimensions: { 
        width: 28.5, // Full width of dry room (110.375 - 81.875 = 28.5')
        height: 0.375, // 4.5" thick for visibility (0.375')
        depth: 0.67 // 8" tall (8/12 = 0.67')
      },
      rotation: 0,
      material: 'concrete', // Use concrete material for solid rendering
      color: '#1a202c', // Very dark gray for maximum visibility
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        thickness_inches: 4.5,
        room: 'south-dry-room',
        wall_side: 'south',
        description: '8" vinyl cove base trim - South Dry Room south wall (inside)'
      }
    },
    
    // South Dry Room - North wall trim (INSIDE room) - room-wall-1
    {
      id: 'cove-trim-south-dry-room-north',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at west wall
        y: 208.3334, // INSIDE room wall (208.5209 - 0.1875 = 208.3334)
        z: 0
      },
      dimensions: { 
        width: 28.5, // Full width of dry room
        height: 0.375, // 4.5" thick
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'south-dry-room',
        wall_side: 'north',
        description: '8" vinyl cove base trim - South Dry Room north wall (inside)'
      }
    },
    
    // South Dry Room - West wall trim (INSIDE room) - dry-room-west-cap-wall
    {
      id: 'cove-trim-south-dry-room-west',
      type: 'fixture' as const,
      position: { 
        x: 82.0625, // INSIDE room wall (81.875 + 0.1875 = 82.0625)
        y: 198.0417, // Start at south wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 10.4792, // Full depth of dry room (208.5209 - 198.0417 = 10.4792')
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'south-dry-room',
        wall_side: 'west',
        description: '8" vinyl cove base trim - South Dry Room west wall (inside)'
      }
    },
    
    // South Dry Room - East wall trim (INSIDE room) - room-1-second-divider-wall
    {
      id: 'cove-trim-south-dry-room-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 198.0417, // Start at south wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 10.4792, // Full depth of dry room
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'south-dry-room',
        wall_side: 'east',
        description: '8" vinyl cove base trim - South Dry Room east wall (inside)'
      }
    },

    // NORTH DRY ROOM COVE BASE TRIM (4 walls)
    // North Dry Room boundaries: West wall (x=81.875), East wall (x=110.375), 
    // South wall (y=211.5209), North wall (y=222)
    // Dimensions: 28.5' wide x 10.4791' deep
    
    // North Dry Room - South wall trim (INSIDE room) - middle-hallway-south-wall
    {
      id: 'cove-trim-north-dry-room-south',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at west wall
        y: 211.7084, // INSIDE room wall (211.5209 + 0.1875 = 211.7084)
        z: 0 // Floor level
      },
      dimensions: { 
        width: 28.5, // Full width of dry room (110.375 - 81.875 = 28.5')
        height: 0.375, // 4.5" thick for visibility (0.375')
        depth: 0.67 // 8" tall (8/12 = 0.67')
      },
      rotation: 0,
      material: 'concrete', // Use concrete material for solid rendering
      color: '#1a202c', // Very dark gray for maximum visibility
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        thickness_inches: 4.5,
        room: 'north-dry-room',
        wall_side: 'south',
        description: '8" vinyl cove base trim - North Dry Room south wall (inside)'
      }
    },
    
    // North Dry Room - North wall trim (INSIDE room) - north-dry-room-north-wall
    {
      id: 'cove-trim-north-dry-room-north',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at west wall
        y: 221.8125, // INSIDE room wall (222 - 0.1875 = 221.8125)
        z: 0
      },
      dimensions: { 
        width: 28.5, // Full width of dry room
        height: 0.375, // 4.5" thick
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'north-dry-room',
        wall_side: 'north',
        description: '8" vinyl cove base trim - North Dry Room north wall (inside)'
      }
    },
    
    // North Dry Room - West wall trim (INSIDE room) - north-dry-room-west-wall
    {
      id: 'cove-trim-north-dry-room-west',
      type: 'fixture' as const,
      position: { 
        x: 82.0625, // INSIDE room wall (81.875 + 0.1875 = 82.0625)
        y: 211.5209, // Start at south wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 10.4791, // Full depth of dry room (222 - 211.5209 = 10.4791')
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'north-dry-room',
        wall_side: 'west',
        description: '8" vinyl cove base trim - North Dry Room west wall (inside)'
      }
    },
    
    // North Dry Room - East wall trim (INSIDE room) - north-dry-room-east-wall
    {
      id: 'cove-trim-north-dry-room-east',
      type: 'fixture' as const,
      position: { 
        x: 110.1875, // INSIDE room wall (110.375 - 0.1875 = 110.1875)
        y: 211.5209, // Start at south wall
        z: 0
      },
      dimensions: { 
        width: 0.375, // 4.5" thick
        height: 10.4791, // Full depth of dry room
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c', // Very dark gray
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        room: 'north-dry-room',
        wall_side: 'east',
        description: '8" vinyl cove base trim - North Dry Room east wall (inside)'
      }
    },

    // DRY ROOM WHITE EPOXY FLOORS
    // High-performance white epoxy flooring for clean room environments
    
    // South Dry Room - White Epoxy Floor
    {
      id: 'south-dry-room-white-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at west wall
        y: 198.0417, // Start at south wall
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 28.5, // Full room width (110.375 - 81.875 = 28.5')
        height: 10.4792, // Full room depth (208.5209 - 198.0417 = 10.4792')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#ffffff', // Pure white epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'white_epoxy',
        thickness_inches: 1.5,
        room: 'south-dry-room',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_static: true,
        seamless: true,
        description: 'White epoxy floor - South Dry Room (28.5\' x 10.4792\')'
      }
    },
    
    // North Dry Room - White Epoxy Floor
    {
      id: 'north-dry-room-white-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at west wall
        y: 211.5209, // Start at south wall
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 28.5, // Full room width (110.375 - 81.875 = 28.5')
        height: 10.4791, // Full room depth (222 - 211.5209 = 10.4791')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#ffffff', // Pure white epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'white_epoxy',
        thickness_inches: 1.5,
        room: 'north-dry-room',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_static: true,
        seamless: true,
        description: 'White epoxy floor - North Dry Room (28.5\' x 10.4791\')'
      }
    },

    // HALLWAY WALLS COVE BASE TRIM
    
    // SOUTH HALLWAY WALL TRIM (North side) - OUTSIDE towards Room 8
    {
      id: 'cove-trim-south-hallway-north',
      type: 'fixture' as const,
      position: { 
        x: 30.0625, // Start at longways wall
        y: 28.8125, // OUTSIDE south hallway wall (29 - 0.1875 = 28.8125)
        z: 0
      },
      dimensions: { 
        width: 68.5625, // Length to end (98.625 - 30.0625 = 68.5625')
        height: 0.375, // 4.5" thick
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        wall_type: 'hallway_wall',
        wall_side: 'north',
        description: '8" vinyl cove base trim - South hallway wall (north side, outside)'
      }
    },
    
    // SOUTH HALLWAY WALL TRIM (South side) - INSIDE towards south hallway
    {
      id: 'cove-trim-south-hallway-south',
      type: 'fixture' as const,
      position: { 
        x: 30.0625, // Start at longways wall
        y: 29.1875, // INSIDE south hallway wall (29 + 0.1875 = 29.1875)
        z: 0
      },
      dimensions: { 
        width: 68.5625, // Length to end
        height: 0.375, // 4.5" thick
        depth: 0.67 // 8" tall
      },
      rotation: 0,
      material: 'concrete',
      color: '#1a202c',
      metadata: { 
        category: 'flooring_trim',
        material_type: 'vinyl_cove_base',
        height_inches: 8,
        wall_type: 'hallway_wall',
        wall_side: 'south',
        description: '8" vinyl cove base trim - South hallway wall (south side, inside)'
      }
    },

    // BLACK GLOSS EPOXY FLOORS
    // High-performance black gloss epoxy flooring for hallways and control areas
    
    // West Longway Hallway - Black Gloss Epoxy Floor (5' wide hallway)
    {
      id: 'west-longway-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 48.6667, // Start at Room 8 north wall (room-wall-7)
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 5.0625, // 5' hallway width (30.0625 - 25 = 5.0625')
        height: 149.3542, // From Room 8 north wall to Room 2 north wall (198.0417 - 48.6667 = 149.3542')
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
        description: 'Black gloss epoxy floor - West longway hallway (5\' x 149.35\')'
      }
    },
    
    // East Longway Hallway - Black Gloss Epoxy Floor (3' wide hallway)
    {
      id: 'east-longway-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 110.375, // Start at east longway wall
        y: 48.6667, // Start at Room 7 north wall (room-wall-7)
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 2.375, // 3' hallway width (112.75 - 110.375 = 2.375')
        height: 149.3542, // From Room 7 north wall to Room 2 north wall (198.0417 - 48.6667 = 149.3542')
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
        description: 'Black gloss epoxy floor - East longway hallway (3\' x 149.35\')'
      }
    },
    
    // South Cross Hallway - Black Gloss Epoxy Floor (4' wide hallway)
    {
      id: 'south-cross-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 30.0625, // Start at west longway wall
        y: 25, // Start at south exterior wall
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 68.5625, // From west to end of south hallway wall (98.625 - 30.0625 = 68.5625')
        height: 4, // 4' hallway width (29 - 25 = 4')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'south-cross-hallway',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - South cross hallway (4\' x 68.56\')'
      }
    },
    
    // Middle Cross Hallway - Black Gloss Epoxy Floor (3' wide hallway between dry rooms)
    {
      id: 'middle-cross-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 81.875, // Start at dry room west wall
        y: 208.5209, // Start at south wall of middle hallway
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 28.5, // Full dry room width (110.375 - 81.875 = 28.5')
        height: 3, // 3' hallway width (211.5209 - 208.5209 = 3')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'middle-cross-hallway',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - Middle cross hallway between dry rooms (3\' x 28.5\')'
      }
    },
    
    // Control Area - Black Gloss Epoxy Floor (northwest corner area)
    {
      id: 'control-area-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 198.0417, // Start at Room 2 north wall (north hallway wall)
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 51.875, // From west wall to dry rooms west edge (76.875 - 25 = 51.875')
        height: 24, // From Room 2 north wall to north wall (222 - 198.0417 = 23.9583', rounded to 24')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'control-area',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - Control area northwest corner (51.875\' x 24\')'
      }
    },
    
    // West End of South Hallway - Black Gloss Epoxy Floor (missing section)
    {
      id: 'west-end-south-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 25, // Start at south exterior wall
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 5.0625, // From west wall to west longway wall (30.0625 - 25 = 5.0625')
        height: 4, // 4' hallway width (29 - 25 = 4')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'west-end-south-hallway',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - West end of south hallway (5.0625\' x 4\')'
      }
    },
    
    // West Side of Room 8 Area - Black Gloss Epoxy Floor (gap between west wall and Room 8)
    {
      id: 'west-side-room8-area-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at west exterior wall
        y: 29, // Start after south hallway (29 = 25 + 4)
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 5.0625, // From west wall to west longway wall (30.0625 - 25 = 5.0625')
        height: 19.6667, // From end of south hallway to Room 8 north wall (48.6667 - 29 = 19.6667')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'west-side-room8-area',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - West side of Room 8 area (5.0625\' x 19.67\')'
      }
    },



    // ELECTRICAL PANEL - Eaton Pow-R-Line 600A on North Exterior Wall
    // Positioned 10' from west exterior wall, mounted on interior face of north wall
    {
      id: 'electrical-panel-main',
      type: 'fixture' as const,
      position: { 
        x: 35, // 10' from west exterior wall (25 + 10 = 35)
        y: 221, // Interior face of north wall (222 - 1 = 221)
        z: 3.5 // Lowered mounting height: 3.5' from floor (dropped 2') (bottom of panel at 5.5', top at 12.5')
      },
      dimensions: { width: 2.5, height: 7, depth: 0.67 }, // 30"x84"x8" = 2.5'x7'x0.67'
      rotation: 0,
      material: 'electrical_panel',
      color: '#808080', // Gray finish
      metadata: { 
        category: 'electrical',
        equipment_type: 'electrical_panel',
        manufacturer: 'eaton',
        model: 'Pow-R-Line',
        main_breaker: '600A',
        voltage: '120/208V',
        phases: '3-phase, 4-wire',
        circuit_breakers: 42,
        bus_type: 'copper',
        finish: 'gray',
        enclosure_type: 'surface',
        interrupting_capacity: '22kAIC',
        weight_lbs: 350,
        nec_clearances: {
          front: 36, // 36" minimum working space
          sides: 30, // 30" minimum
          top: 36    // 36" minimum
        },
        description: 'Eaton Pow-R-Line 600A main electrical panel - 84" × 30" × 8" (7\'0" × 2\'6" × 8")',
        installation_notes: 'Surface mounted on interior face of north exterior wall, 10\' from west wall'
      }
    },

    // WEST EXTERIOR WALL ELECTRICAL PANELS - 600A Distribution Panels
    // Positioned on west exterior wall across from truss beams for structural support
    // Panels face east into the west longway hallway

    // West Wall Panel #1 - Across from First Truss Beam (Room 2 North)
    {
      id: 'electrical-panel-west-wall-1',
      type: 'fixture' as const,
      position: { 
        x: 25, // Mounted directly on west exterior wall surface
        y: 198.2292, // Aligned with first truss beam position (Room 2 north)
        z: 3.5 // Lowered mounting height: 3.5' from floor (dropped 2')
      },
      dimensions: { width: 2.5, height: 7, depth: 0.67 }, // 30"x84"x8" = 2.5'x7'x0.67'
      rotation: 90, // Face east into hallway
      material: 'electrical_panel',
      color: '#808080', // Gray finish
      metadata: { 
        category: 'electrical',
        equipment_type: 'electrical_panel',
        manufacturer: 'eaton',
        model: 'Pow-R-Line',
        main_breaker: '600A',
        voltage: '120/208V or 277/480V',
        phases: '3-phase, 4-wire',
        circuit_breakers: 42,
        bus_type: 'copper',
        finish: 'gray',
        enclosure_type: 'surface',
        interrupting_capacity: '22kAIC',
        weight_lbs: 350,
        structural_support: 'first-truss-beam',
        nec_clearances: {
          front: 36, // 36" minimum working space (into hallway)
          sides: 30, // 30" minimum
          top: 36    // 36" minimum
        },
        description: 'West Wall 600A Panel #1 - mounted on west exterior wall across from first truss beam (Room 2 north)',
        installation_notes: 'Surface mounted directly on west exterior wall, structurally supported by first truss beam'
      }
    },

    // West Wall Panel #2 - Across from Third Truss Beam
    {
      id: 'electrical-panel-west-wall-2',
      type: 'fixture' as const,
      position: { 
        x: 25, // Mounted directly on west exterior wall surface
        y: 149.1042, // Aligned with third truss beam position
        z: 3.5 // Lowered mounting height: 3.5' from floor (dropped 2')
      },
      dimensions: { width: 2.5, height: 7, depth: 0.67 }, // 30"x84"x8" = 2.5'x7'x0.67'
      rotation: 90, // Face east into hallway
      material: 'electrical_panel',
      color: '#808080', // Gray finish
      metadata: { 
        category: 'electrical',
        equipment_type: 'electrical_panel',
        manufacturer: 'eaton',
        model: 'Pow-R-Line',
        main_breaker: '600A',
        voltage: '120/208V or 277/480V',
        phases: '3-phase, 4-wire',
        circuit_breakers: 42,
        bus_type: 'copper',
        finish: 'gray',
        enclosure_type: 'surface',
        interrupting_capacity: '22kAIC',
        weight_lbs: 350,
        structural_support: 'third-truss-beam',
        nec_clearances: {
          front: 36, // 36" minimum working space (into hallway)
          sides: 30, // 30" minimum
          top: 36    // 36" minimum
        },
        description: 'West Wall 600A Panel #2 - mounted on west exterior wall across from third truss beam',
        installation_notes: 'Surface mounted directly on west exterior wall, structurally supported by third truss beam'
      }
    },

    // West Wall Panel #3 - Across from Fifth Truss Beam (First South of Firewall)
    {
      id: 'electrical-panel-west-wall-3',
      type: 'fixture' as const,
      position: { 
        x: 25, // Mounted directly on west exterior wall surface
        y: 99.9792, // Aligned with fifth truss beam position (first truss south of firewall)
        z: 3.5 // Lowered mounting height: 3.5' from floor (dropped 2')
      },
      dimensions: { width: 2.5, height: 7, depth: 0.67 }, // 30"x84"x8" = 2.5'x7'x0.67'
      rotation: 90, // Face east into hallway
      material: 'electrical_panel',
      color: '#808080', // Gray finish
      metadata: { 
        category: 'electrical',
        equipment_type: 'electrical_panel',
        manufacturer: 'eaton',
        model: 'Pow-R-Line',
        main_breaker: '600A',
        voltage: '120/208V or 277/480V',
        phases: '3-phase, 4-wire',
        circuit_breakers: 42,
        bus_type: 'copper',
        finish: 'gray',
        enclosure_type: 'surface',
        interrupting_capacity: '22kAIC',
        weight_lbs: 350,
        structural_support: 'fifth-truss-beam',
        position_reference: 'first-truss-south-of-firewall',
        nec_clearances: {
          front: 36, // 36" minimum working space (into hallway)
          sides: 30, // 30" minimum
          top: 36    // 36" minimum
        },
        description: 'West Wall 600A Panel #3 - mounted on west exterior wall across from fifth truss beam (first truss south of firewall)',
        installation_notes: 'Surface mounted directly on west exterior wall, structurally supported by fifth truss beam'
      }
    },

    // West Wall Panel #4 - Across from Seventh Truss Beam (Second-to-Last from South)
    {
      id: 'electrical-panel-west-wall-4',
      type: 'fixture' as const,
      position: { 
        x: 25, // Mounted directly on west exterior wall surface
        y: 48.8542, // Aligned with seventh truss beam position (second-to-last from south exterior wall)
        z: 3.5 // Lowered mounting height: 3.5' from floor (dropped 2')
      },
      dimensions: { width: 2.5, height: 7, depth: 0.67 }, // 30"x84"x8" = 2.5'x7'x0.67'
      rotation: 90, // Face east into hallway
      material: 'electrical_panel',
      color: '#808080', // Gray finish
      metadata: { 
        category: 'electrical',
        equipment_type: 'electrical_panel',
        manufacturer: 'eaton',
        model: 'Pow-R-Line',
        main_breaker: '600A',
        voltage: '120/208V or 277/480V',
        phases: '3-phase, 4-wire',
        circuit_breakers: 42,
        bus_type: 'copper',
        finish: 'gray',
        enclosure_type: 'surface',
        interrupting_capacity: '22kAIC',
        weight_lbs: 350,
        structural_support: 'seventh-truss-beam',
        position_reference: 'second-to-last-from-south-wall',
        nec_clearances: {
          front: 36, // 36" minimum working space (into hallway)
          sides: 30, // 30" minimum
          top: 36    // 36" minimum
        },
        description: 'West Wall 600A Panel #4 - mounted on west exterior wall across from seventh truss beam (second-to-last from south exterior wall)',
        installation_notes: 'Surface mounted directly on west exterior wall, structurally supported by seventh truss beam'
      }
    },



  ],
  scale: 1,
  units: 'feet' as const,
  createdAt: new Date(),
  updatedAt: new Date(),
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

/**
 * WAREHOUSE EQUIPMENT AND FIXTURES
 */

/**
 * 330 Gallon IBC Tote - Industrial Bulk Container
 * Standard intermediate bulk container for liquid storage and transport
 * Dimensions: 48" L × 40" W × 46" H (4' × 3.33' × 3.83')
 */
export const IBC_TOTE_330_GALLON = {
  id: 'ibc-tote-330gal',
  type: 'fixture' as const,
  name: '330 Gallon IBC Tote',
  dimensions: { 
    width: 4, // 48 inches = 4 feet (length in original spec)
    height: 3.33, // 40 inches = 3.33 feet (width in original spec) 
    depth: 3.83 // 46 inches = 3.83 feet (height in original spec)
  },
  rotation: 0,
  material: 'composite', // HDPE tank with steel cage
  color: '#f0f0f0', // Light gray/white tank color
  metadata: {
    category: 'storage',
    equipment_type: 'ibc_tote',
    capacity_gallons: 330,
    capacity_liters: 1250,
    empty_weight_lbs: 140,
    max_fill_weight_lbs: 2900, // Approx with water (330 gal × 8.34 lbs/gal + 140)
    material_tank: 'HDPE',
    material_cage: 'steel',
    features: [
      'bottom_discharge_valve',
      'top_fill_cap',
      'forklift_accessible',
      'stackable',
      'un_approved'
    ],
    valve_height_feet: 0.5, // 6 inches from ground
    valve_size_inches: 2,
    pallet_integrated: true,
    description: '330 US Gallon IBC Tote - HDPE tank in steel cage with integrated pallet base'
  }
}

/**
 * Creates an IBC Tote element at specified position
 * @param position - The x, y, z coordinates in feet
 * @param id - Optional custom ID for the element
 * @param rotation - Optional rotation in degrees (default: 0)
 */
export function createIBCTote(
  position: { x: number; y: number; z: number },
  id?: string,
  rotation: number = 0
) {
  return {
    ...IBC_TOTE_330_GALLON,
    id: id || `ibc-tote-${Date.now()}`,
    position,
    rotation
  }
}

/**
 * Creates a row of IBC Totes
 * @param startPosition - Starting position for the row
 * @param count - Number of totes in the row
 * @param spacing - Space between totes in feet (default: 0.5)
 * @param direction - 'horizontal' or 'vertical' alignment
 */
export function createIBCToteRow(
  startPosition: { x: number; y: number; z: number },
  count: number,
  spacing: number = 0.5,
  direction: 'horizontal' | 'vertical' = 'horizontal'
) {
  const totes = []
  const toteWidth = IBC_TOTE_330_GALLON.dimensions.width
  const toteHeight = IBC_TOTE_330_GALLON.dimensions.height
  
  for (let i = 0; i < count; i++) {
    const position = {
      x: direction === 'horizontal' 
        ? startPosition.x + (i * (toteWidth + spacing))
        : startPosition.x,
      y: direction === 'vertical'
        ? startPosition.y + (i * (toteHeight + spacing))
        : startPosition.y,
      z: startPosition.z
    }
    
    totes.push(createIBCTote(position, `ibc-tote-row-${i}`))
  }
  
  return totes
}

/**
 * Creates a storage area filled with IBC Totes in a grid pattern
 * @param topLeftPosition - Top-left corner of the storage area
 * @param rows - Number of rows
 * @param columns - Number of columns
 * @param rowSpacing - Space between rows in feet
 * @param columnSpacing - Space between columns in feet
 */
export function createIBCToteStorageArea(
  topLeftPosition: { x: number; y: number; z: number },
  rows: number,
  columns: number,
  rowSpacing: number = 0.5,
  columnSpacing: number = 0.5
) {
  const totes = []
  const toteWidth = IBC_TOTE_330_GALLON.dimensions.width
  const toteHeight = IBC_TOTE_330_GALLON.dimensions.height
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const position = {
        x: topLeftPosition.x + (col * (toteWidth + columnSpacing)),
        y: topLeftPosition.y - (row * (toteHeight + rowSpacing)), // Subtract for top-to-bottom
        z: topLeftPosition.z
      }
      
      totes.push(createIBCTote(position, `ibc-tote-${row}-${col}`))
    }
  }
  
  return totes
}

/**
 * Norwesco 1000 Gallon Vertical Storage Tank (Model 40152)
 * Dimensions: 64" diameter × 80" height
 * Creates a fixture element for placement in the warehouse
 */
export function createNorwesco1000GallonTank(
  position: { x: number; y: number; z: number },
  id?: string
) {
  // Convert dimensions from inches to feet
  const tankDiameter = 64 / 12; // 64" = 5.33'
  const tankHeight = 80 / 12; // 80" = 6.67'
  
  return {
    id: id || `norwesco-tank-${Date.now()}`,
    type: 'fixture' as const,
    position,
    dimensions: { 
      width: tankDiameter, // 5.33'
      height: tankDiameter, // 5.33' (circular footprint)
      depth: tankHeight // 6.67' tall
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
      description: 'Norwesco 40152 - 1000 Gallon Vertical Storage Tank'
    }
  }
}

/**
 * TJI I-Joist Beam - 11 7/8" height
 * Standard engineered lumber joist with OSB web and lumber flanges
 * Dimensions: 1.5" width × 11.875" height × customizable length
 */
export const TJI_IJOIST_11_7_8 = {
  id: 'tji-ijoist-11-7-8',
  type: 'fixture' as const,
  name: 'TJI I-Joist 11 7/8"',
  dimensions: { 
    width: 0.125, // 1.5" = 0.125' 
    height: 8, // Default 8' length (customizable)
    depth: 0.99 // 11.875" = 0.99'
  },
  rotation: 0,
  material: 'tji_beam',
  color: '#D2B48C', // OSB brown color
  metadata: {
    category: 'structural',
    equipment_type: 'tji_ijoist',
    height_inches: 11.875,
    width_inches: 1.5,
    web_thickness_inches: 0.375,
    web_material: 'OSB',
    flange_material: 'lumber',
    load_bearing: true,
    engineered_lumber: true,
    description: 'TJI I-Joist 11 7/8" - OSB web with lumber flanges'
  }
}

/**
 * Creates a single TJI I-Joist beam at specified position
 * @param position - The x, y, z coordinates in feet
 * @param length - Length of the joist in feet (default: 8 feet)
 * @param id - Optional custom ID for the element
 * @param rotation - Optional rotation in degrees (default: 0)
 */
export function createTJIJoist11_7_8(
  position: { x: number; y: number; z: number },
  length: number = 8,
  id?: string,
  rotation: number = 0
) {
  return {
    ...TJI_IJOIST_11_7_8,
    id: id || `tji-joist-${Date.now()}`,
    position,
    dimensions: {
      ...TJI_IJOIST_11_7_8.dimensions,
      height: length // Length is the horizontal dimension
    },
    rotation,
    metadata: {
      ...TJI_IJOIST_11_7_8.metadata,
      length_feet: length,
      length_inches: length * 12,
      description: `TJI I-Joist 11 7/8" - ${length}' long - OSB web with lumber flanges`
    }
  }
}

/**
 * Creates an array of TJI I-Joists with specified spacing
 * @param startPosition - Starting position for the first joist
 * @param numberOfJoists - Number of joists to create (default: 6)
 * @param spacing - Spacing between joists in feet (default: 1.33' = 16" on center)
 * @param length - Length of each joist in feet (default: 8 feet)
 * @param direction - 'parallel-x' (joists run along X-axis) or 'parallel-y' (joists run along Y-axis)
 */
export function createTJIJoistArray11_7_8(
  startPosition: { x: number; y: number; z: number },
  numberOfJoists: number = 6,
  spacing: number = 1.33, // 16" on center
  length: number = 8,
  direction: 'parallel-x' | 'parallel-y' = 'parallel-x'
) {
  const joists = []
  
  for (let i = 0; i < numberOfJoists; i++) {
    const position = {
      x: direction === 'parallel-x' 
        ? startPosition.x
        : startPosition.x + (i * spacing),
      y: direction === 'parallel-y'
        ? startPosition.y  
        : startPosition.y + (i * spacing),
      z: startPosition.z
    }
    
    const rotation = direction === 'parallel-y' ? 90 : 0 // Rotate 90° if running parallel to Y-axis
    
    joists.push(createTJIJoist11_7_8(
      position, 
      length, 
      `tji-joist-array-${i}`, 
      rotation
    ))
  }
  
  return joists
}

/**
 * Creates a TJI joist floor system with cross-pattern layout
 * @param cornerPosition - Bottom-left corner of the floor system
 * @param systemWidth - Width of the floor system in feet
 * @param systemLength - Length of the floor system in feet  
 * @param joistSpacing - Spacing between joists in feet (default: 1.33' = 16" OC)
 * @param joistLength - Length of individual joists in feet
 */
export function createTJIFloorSystem11_7_8(
  cornerPosition: { x: number; y: number; z: number },
  systemWidth: number,
  systemLength: number,
  joistSpacing: number = 1.33, // 16" on center
  joistLength?: number
) {
  const joists = []
  
  // Calculate joist length if not provided (span the system width)
  const actualJoistLength = joistLength || systemWidth
  
  // Calculate number of joists needed
  const numberOfJoists = Math.ceil(systemLength / joistSpacing) + 1
  
  for (let i = 0; i < numberOfJoists; i++) {
    const position = {
      x: cornerPosition.x,
      y: cornerPosition.y + (i * joistSpacing),
      z: cornerPosition.z
    }
    
    joists.push(createTJIJoist11_7_8(
      position,
      actualJoistLength,
      `tji-floor-joist-${i}`,
      0 // Joists run parallel to X-axis (spanning width)
    ))
  }
  
  return joists
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
  },
  BASIC_100: {
    id: 'basic-warehouse-100',
    name: 'Basic 100x100 Warehouse',
    dimensions: { width: 100, height: 100 },
    elements: [
      {
        id: 'wall-bottom',
        type: 'wall' as const,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 100, height: 1, depth: 20 },
        rotation: 0,
        material: 'concrete',
        color: '#4a5568',
        metadata: { category: 'exterior', material_type: 'concrete' }
      },
      {
        id: 'wall-top',
        type: 'wall' as const,
        position: { x: 0, y: 99, z: 0 },
        dimensions: { width: 100, height: 1, depth: 20 },
        rotation: 0,
        material: 'concrete',
        color: '#4a5568',
        metadata: { category: 'exterior', material_type: 'concrete' }
      },
      {
        id: 'wall-left',
        type: 'wall' as const,
        position: { x: 0, y: 0, z: 0 },
        dimensions: { width: 1, height: 100, depth: 20 },
        rotation: 0,
        material: 'concrete',
        color: '#4a5568',
        metadata: { category: 'exterior', material_type: 'concrete' }
      },
      {
        id: 'wall-right',
        type: 'wall' as const,
        position: { x: 99, y: 0, z: 0 },
        dimensions: { width: 1, height: 100, depth: 20 },
        rotation: 0,
        material: 'concrete',
        color: '#4a5568',
        metadata: { category: 'exterior', material_type: 'concrete' }
      },
    ],
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

  const trim = createCoveBaseTrim(trimConfig);
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
  const westPieces = Math.ceil(roomLength / pieceLengthFeet);
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
    description: 'Standard 4" vinyl cove base for light commercial use',
    applications: ['offices', 'break_rooms', 'light_storage']
  },
  
  VINYL_6_INCH: {
    name: '6" Vinyl Cove Base', 
    config: coveBaseTrimPresets.standard6inch,
    description: 'Tall 6" vinyl cove base for enhanced wall protection',
    applications: ['warehouses', 'production_areas', 'loading_docks']
  },
  
  VINYL_8_INCH: {
    name: '8" Vinyl Cove Base',
    config: coveBaseTrimPresets.standard8inch,
    description: 'Extra tall 8" vinyl cove base for maximum protection',
    applications: ['industrial_areas', 'chemical_storage', 'heavy_equipment_zones']
  },
  
  // Heavy duty rubber options
  RUBBER_HEAVY_DUTY: {
    name: 'Heavy Duty Rubber Cove Base',
    config: coveBaseTrimPresets.heavyDutyRubber,
    description: 'Thick rubber cove base for high-impact environments',
    applications: ['manufacturing', 'automotive_bays', 'maintenance_areas']
  },
  
  // Aluminum trim for specialized areas
  ALUMINUM_TRIM: {
    name: 'Aluminum Cove Base',
    config: coveBaseTrimPresets.aluminumTrim,
    description: 'Metal cove base for clean rooms and food service areas',
    applications: ['clean_rooms', 'food_processing', 'laboratories', 'medical_facilities']
  }
} as const;

/**
 * Gets recommended cove base trim for a specific warehouse area
 * @param areaType - Type of warehouse area
 * @returns Recommended trim configuration
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