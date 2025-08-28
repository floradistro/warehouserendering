import { FloorplanData } from './store'

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
      material: 'concrete',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick', description: 'South wall left segment - west of opening' }
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
      material: 'concrete',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick', description: 'South wall right segment - east of opening (49.5" from east wall)' }
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
      material: 'concrete',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick' }
    },
    // Left wall (West) - 198' long
    {
      id: 'wall-left',
      type: 'wall' as const,
      position: { x: 25, y: 25, z: 0 },
      dimensions: { width: 1, height: 198, depth: 12 }, // 198' long
      rotation: 0,
      material: 'concrete',
      color: '#8B7355',
      metadata: { category: 'exterior', material_type: 'brick' }
    },
    // Right wall (East) - 198' long
    {
      id: 'wall-right',
      type: 'wall' as const,
      position: { x: 112.75, y: 25, z: 0 }, // 88.75' from left wall (25 + 87.75)
      dimensions: { width: 1, height: 198, depth: 12 }, // 198' long
      rotation: 0,
      material: 'concrete',
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
    
    // Room wall 1 - centered on first I-beam, extended to east exterior wall (separates Room 1 from Room 2)
    {
      id: 'room-wall-1',
      type: 'wall' as const,
      position: { 
        x: 30.0625, // Precisely centered: 5' + (78.875'/2) - (wall thickness/2) = 30.0625
        y: 198.0417, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 82.6875, height: 0.375, depth: 12 }, // Extended to east exterior wall: 112.75 - 30.0625 = 82.6875', 4.5" thick (0.375'), 12' tall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_north: 1,
        room_south: 2,
        description: 'Room wall 1 - separates Room 1 (north) from Room 2 (south), extended to east exterior wall'
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
      dimensions: { width: 78.875, height: 0.375, depth: 12 }, // 4.5" thick (0.375')
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
      dimensions: { width: 78.875, height: 0.375, depth: 12 }, // 4.5" thick (0.375')
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
      dimensions: { width: 78.875, height: 0.375, depth: 12 }, // 4.5" thick (0.375')
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
      dimensions: { width: 78.875, height: 0.375, depth: 12 }, // 4.5" thick (0.375')
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
      dimensions: { width: 78.875, height: 0.375, depth: 12 }, // 4.5" thick (0.375')
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
    
    // LEFT LONGWAYS WALL - Continuous 12' high wall with 8x8 openings for room access
    
    // Continuous left longways wall with openings
    {
      id: 'longways-wall-left-continuous',
      type: 'wall' as const,
      position: { 
        x: 30, // 5' from left exterior wall (25 + 5 = 30)
        y: 123.5, // Center position: (29 + 218) / 2 = 123.5
        z: 0 
      },
      dimensions: { width: 0.375, height: 189, depth: 12 }, // 189' long, 0.375' thick, 12' tall
      rotation: 90, // Rotate 90 degrees to run north-south
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left continuous longways wall - 12\' high with room openings',
        openings: [
          {
            id: 'room-8-west-opening',
            type: 'door',
            position: { x: -89, z: 0 }, // Position along wall length from center, z=0 (floor level)
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 8 west entrance' }
          },
          {
            id: 'room-7-west-opening', 
            type: 'door',
            position: { x: -65, z: 0 }, // Centered on Room 7
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 7 west entrance' }
          },
          {
            id: 'room-6-west-opening',
            type: 'door', 
            position: { x: -40, z: 0 }, // Centered on Room 6
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 6 west entrance' }
          },
          {
            id: 'room-5-west-opening',
            type: 'door',
            position: { x: -15, z: 0 }, // Centered on Room 5
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 5 west entrance' }
          },
          {
            id: 'room-4-west-opening',
            type: 'door',
            position: { x: 9, z: 0 }, // Centered on Room 4
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 4 west entrance' }
          },
          {
            id: 'room-3-west-opening',
            type: 'door',
            position: { x: 34, z: 0 }, // Centered on Room 3
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 3 west entrance' }
          },
          {
            id: 'room-2-west-opening',
            type: 'door',
            position: { x: 58, z: 0 }, // Centered on Room 2
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Room 2 west entrance' }
          }
        ]
      }
    },
    
    // Remaining segments removed - using continuous wall with openings above
    {
      id: 'longways-wall-left-segment-2',
      type: 'wall' as const,
      position: { 
        x: 30,
        y: 42.83, // After Room 8 opening (34.83 + 8 = 42.83)
        z: 0 
      },
      dimensions: { width: 0.375, height: 15.12, depth: 12 }, // To Room 7 opening start, 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall segment 2 - between Room 8 and Room 7 west openings'
      }
    },
    
    // Segment 3: From Room 7 opening to Room 6 opening
    {
      id: 'longways-wall-left-segment-3',
      type: 'wall' as const,
      position: { 
        x: 30,
        y: 65.95, // After Room 7 opening (57.95 + 8 = 65.95)
        z: 0 
      },
      dimensions: { width: 0.375, height: 15.56, depth: 12 }, // To Room 6 opening start, 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall segment 3 - between Room 7 and Room 6 west openings'
      }
    },
    
    // Segment 4: From Room 6 opening to Room 5 opening
    {
      id: 'longways-wall-left-segment-4',
      type: 'wall' as const,
      position: { 
        x: 30,
        y: 91.51, // After Room 6 opening (83.51 + 8 = 91.51)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.56, depth: 12 }, // To Room 5 opening start, 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall segment 4 - between Room 6 and Room 5 west openings'
      }
    },
    
    // Segment 5: From Room 5 opening to Room 4 opening
    {
      id: 'longways-wall-left-segment-5',
      type: 'wall' as const,
      position: { 
        x: 30,
        y: 116.07, // After Room 5 opening (108.07 + 8 = 116.07)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.57, depth: 12 }, // To Room 4 opening start, 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall segment 5 - between Room 5 and Room 4 west openings'
      }
    },
    
    // Segment 6: From Room 4 opening to Room 3 opening
    {
      id: 'longways-wall-left-segment-6',
      type: 'wall' as const,
      position: { 
        x: 30,
        y: 140.64, // After Room 4 opening (132.64 + 8 = 140.64)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.56, depth: 12 }, // To Room 3 opening start, 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall segment 6 - between Room 4 and Room 3 west openings'
      }
    },
    
    // Segment 7: From Room 3 opening to Room 2 opening
    {
      id: 'longways-wall-left-segment-7',
      type: 'wall' as const,
      position: { 
        x: 30,
        y: 165.20, // After Room 3 opening (157.20 + 8 = 165.20)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.56, depth: 12 }, // To Room 2 opening start, 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall segment 7 - between Room 3 and Room 2 west openings'
      }
    },
    
    // Segment 8: From Room 2 opening to north end
    {
      id: 'longways-wall-left-segment-8',
      type: 'wall' as const,
      position: { 
        x: 30,
        y: 189.76, // After Room 2 opening (181.76 + 8 = 189.76)
        z: 0 
      },
      dimensions: { width: 0.375, height: 28.24, depth: 12 }, // To north end, 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall segment 8 - from Room 2 west opening to north end'
      }
    },
    

    
    // RIGHT LONGWAYS WALL SEGMENTS - 12' high walls with 8x8 openings for room access
    // (Room 8 remains open to east hallway as originally designed)
    
    // Segment 1: From Room 7 wall to Room 7 opening
    {
      id: 'longways-wall-right-segment-1',
      type: 'wall' as const,
      position: { 
        x: 108.375, // 5' from right exterior wall (112.75 - 5 + wall thickness/2 = 108.375)
        y: 49.0417, // Start after room-wall-7 (48.6667 + 0.375 wall thickness = 49.0417)
        z: 0 
      },
      dimensions: { width: 0.375, height: 8.91, depth: 12 }, // To Room 7 opening start (57.95 - 49.04 = 8.91'), 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Right longways wall segment 1 - from Room 7 wall to Room 7 east opening'
      }
    },
    
    // Segment 2: From Room 7 opening to Room 6 opening
    {
      id: 'longways-wall-right-segment-2',
      type: 'wall' as const,
      position: { 
        x: 108.375,
        y: 65.95, // After Room 7 opening (57.95 + 8 = 65.95)
        z: 0 
      },
      dimensions: { width: 0.375, height: 17.56, depth: 12 }, // To Room 6 opening start (83.51 - 65.95 = 17.56'), 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Right longways wall segment 2 - between Room 7 and Room 6 east openings'
      }
    },
    
    // Segment 3: From Room 6 opening to Room 5 opening
    {
      id: 'longways-wall-right-segment-3',
      type: 'wall' as const,
      position: { 
        x: 108.375,
        y: 91.51, // After Room 6 opening (83.51 + 8 = 91.51)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.56, depth: 12 }, // To Room 5 opening start (108.07 - 91.51 = 16.56'), 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Right longways wall segment 3 - between Room 6 and Room 5 east openings'
      }
    },
    
    // Segment 4: From Room 5 opening to Room 4 opening
    {
      id: 'longways-wall-right-segment-4',
      type: 'wall' as const,
      position: { 
        x: 108.375,
        y: 116.07, // After Room 5 opening (108.07 + 8 = 116.07)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.57, depth: 12 }, // To Room 4 opening start (132.64 - 116.07 = 16.57'), 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Right longways wall segment 4 - between Room 5 and Room 4 east openings'
      }
    },
    
    // Segment 5: From Room 4 opening to Room 3 opening
    {
      id: 'longways-wall-right-segment-5',
      type: 'wall' as const,
      position: { 
        x: 108.375,
        y: 140.64, // After Room 4 opening (132.64 + 8 = 140.64)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.56, depth: 12 }, // To Room 3 opening start (157.20 - 140.64 = 16.56'), 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Right longways wall segment 5 - between Room 4 and Room 3 east openings'
      }
    },
    
    // Segment 6: From Room 3 opening to Room 2 opening
    {
      id: 'longways-wall-right-segment-6',
      type: 'wall' as const,
      position: { 
        x: 108.375,
        y: 165.20, // After Room 3 opening (157.20 + 8 = 165.20)
        z: 0 
      },
      dimensions: { width: 0.375, height: 16.56, depth: 12 }, // To Room 2 opening start (181.76 - 165.20 = 16.56'), 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Right longways wall segment 6 - between Room 3 and Room 2 east openings'
      }
    },
    
    // Segment 7: From Room 2 opening to room-wall-1
    {
      id: 'longways-wall-right-segment-7',
      type: 'wall' as const,
      position: { 
        x: 108.375,
        y: 189.76, // After Room 2 opening (181.76 + 8 = 189.76)
        z: 0 
      },
      dimensions: { width: 0.375, height: 8.28, depth: 12 }, // To room-wall-1 (198.04 - 189.76 = 8.28'), 12' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Right longways wall segment 7 - from Room 2 east opening to room-wall-1'
      }
    },

    // HALLWAY WALLS - North and South walls to complete 4' perimeter hallway
    
    // South hallway wall - runs east-west, 4' from south exterior wall (northern boundary of Room 8)
    // Shortened to end 2' from south wall opening
    {
      id: 'hallway-wall-south',
      type: 'wall' as const,
      position: { 
        x: 30, // Start at left longways wall
        y: 29, // 4' from south exterior wall (25 + 4 = 29)
        z: 0 
      },
      dimensions: { width: 66.625, height: 0.375, depth: 12 }, // Shortened to end 2' from opening (96.625 - 30 = 66.625')
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
        x: 96.625, // At the end of the shortened south hallway wall
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
    
    // North hallway wall - runs east-west, 4' from north exterior wall (southern boundary of Room 1)
    {
      id: 'hallway-wall-north',
      type: 'wall' as const,
      position: { 
        x: 30, // Start at left longways wall
        y: 218, // 4' from north exterior wall (222 - 4 = 218)
        z: 0 
      },
      dimensions: { width: 60.35, height: 0.375, depth: 12 }, // 60.35' long from west wall, shortened from 78.75'
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_south: 1,
        description: 'North hallway wall - southern boundary of Room 1 (northernmost room) - shortened to 60.35\' from west wall'
      }
    },

    // Room 1 divider wall - runs north-south to split Room 1 into Dry 1 (west) and Dry 2 (east)
    {
      id: 'room-1-divider-wall',
      type: 'wall' as const,
      position: { 
        x: 69.175, // Midpoint between west wall (30) and current north wall end (90.35): (30 + 90.35) / 2 = 60.175, adjusted for wall positioning
        y: 198.2292, // Start at room wall 1 position and extend north
        z: 0 
      },
      dimensions: { width: 0.375, height: 19.7708, depth: 12 }, // 4.5" thick, spans from room wall 1 to north hallway wall (218 - 198.2292 = 19.7708')
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_west: 'dry-1',
        room_east: 'dry-2',
        description: 'Room 1 divider wall - separates Dry 1 (west) from Dry 2 (east)'
      }
    },

    // Room 1 second divider wall - runs from end of shortened north wall to south room wall
    {
      id: 'room-1-second-divider-wall',
      type: 'wall' as const,
      position: { 
        x: 90.35, // At the end of the shortened north hallway wall (30 + 60.35 = 90.35)
        y: 198.2292, // Start at room wall 1 position and extend north
        z: 0 
      },
      dimensions: { width: 0.375, height: 19.7708, depth: 12 }, // 4.5" thick, spans from room wall 1 to north hallway wall (218 - 198.2292 = 19.7708')
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_west: 'dry-2',
        description: 'Room 1 second divider wall - eastern boundary of Dry 2, creating smaller enclosed area'
      }
    },

    // Northeast corner room - West wall (12' 9 9/16" from east exterior wall, extends to extended room-wall-1)
    {
      id: 'northeast-room-west-wall',
      type: 'wall' as const,
      position: { 
        x: 99.9844, // 12' 9 9/16" from east exterior wall: 112.75 - 12.7656 = 99.9844
        y: 198.0417, // Start at extended room-wall-1 and extend north
        z: 0 
      },
      dimensions: { width: 0.375, height: 23.9583, depth: 12 }, // 4.5" thick, extends from extended room-wall-1 to north exterior wall (222 - 198.0417 = 23.9583')
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Northeast corner room - west wall, extends from extended room-wall-1 to north exterior wall'
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
 * Model templates for creating new warehouses
 */
export const MODEL_TEMPLATES = {
  EMPTY_1000: {
    id: 'empty-warehouse-1000',
    name: 'Empty 1000x1000 Warehouse',
    dimensions: { width: 1000, height: 1000, depth: 40 },
    elements: [],
    scale: 1,
    units: 'feet' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  EMPTY_500: {
    id: 'empty-warehouse-500',
    name: 'Empty 500x500 Warehouse',
    dimensions: { width: 500, height: 500, depth: 30 },
    elements: [],
    scale: 1,
    units: 'feet' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  BASIC_100: {
    id: 'basic-warehouse-100',
    name: 'Basic 100x100 Warehouse',
    dimensions: { width: 100, height: 100, depth: 20 },
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