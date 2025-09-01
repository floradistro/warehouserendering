import { FloorplanData } from './store'
import { CoveBaseTrimConfig, createCoveBaseTrim, defaultCoveBaseTrimConfig, coveBaseTrimPresets } from './cove-base-trim-model'
import * as THREE from 'three'


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
      metadata: { 
        category: 'exterior', 
        material_type: 'brick',
        openings: [
          {
            id: 'access-corridor-entrance',
            type: 'door',
            position: { x: 6.53, z: 0 }, // Centered in west hallway area: (38.0625 - 25)/2 = 6.53
            dimensions: { width: 2.67, height: 8 }, // 32" = 2.67' wide, 8' tall
            metadata: { doorType: 'double', description: 'Access corridor entrance - 32" double door from west hallway' }
          }
        ]
      }
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
    // Building width: 88.75', Room wall width: 74.6875' (extends to east exterior wall)
    // Creates 13' west hallway and no east hallway (13' + 74.6875' + 1' = 88.6875')
    
    // Room wall 1 - Room 2's north wall (separates Room 2 from area above)
    {
      id: 'room-wall-1',
      type: 'wall' as const,
      position: { 
        x: 38.0625, // Starts at left longways wall (west hallway boundary)
        y: 198.0417, // Room 2's north boundary
        z: 0 
      },
      dimensions: { width: 74.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, extends to east exterior wall
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
        },
        openings: [
          // REMOVED: All north doorways from Flower 1 room (Room 2)
          // {
          //   id: 'room-2-west-north-opening',
          //   type: 'door',
          //   position: { x: 22.85, z: 0 }, // West section center (59.91 - 37.0625 = 22.85)
          //   dimensions: { width: 8, height: 8 },
          //   metadata: { doorType: 'double', description: 'Room 2 west section north entrance - double door' }
          // },
          // {
          //   id: 'room-2-middle-north-opening',
          //   type: 'door', 
          //   position: { x: 51.69, z: 0 }, // Middle section center (88.75 - 37.0625 = 51.69)
          //   dimensions: { width: 8, height: 8 },
          //   metadata: { doorType: 'double', description: 'Room 2 middle section north entrance - double door' }
          // },
          // {
          //   id: 'room-2-east-north-opening',
          //   type: 'door',
          //   position: { x: 63.69, z: 0 }, // East section center (100.75 - 37.0625 = 63.69)
          //   dimensions: { width: 8, height: 8 },
          //   metadata: { doorType: 'double', description: 'Room 2 east section north entrance - double door' }
          // }
        ]
      }
    },

    // Room wall 2 - centered on second I-beam (separates Room 2 from Room 3)
    {
      id: 'room-wall-2',
      type: 'wall' as const,
      position: { 
        x: 38.0625, // Starts at left longways wall (west hallway boundary)
        y: 173.4792, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 74.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, extends to east exterior wall
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

    // REMOVED: Dry Room East Divider Wall - Wall removed to create one large dry room
    // {
    //   id: 'dry-room-east-divider-wall',
    //   type: 'wall' as const,
    //   position: { 
    //     x: 100.75, // Moved 6' east from 94.75 to 100.75 to make Dry 2 exactly 12' wide (112.75 - 12 = 100.75)
    //     y: 198.0417, // Start at Room 2 north wall, extend north
    //     z: 0 
    //   },
    //   dimensions: { width: 0.375, height: 23.9583, depth: 17 }, // 4.5" thick, spans to north wall (222 - 198.0417 = 23.9583'), 17' tall interior wall
    //   rotation: 0,
    //   material: 'concrete',
    //   color: '#ffffff',
    //   metadata: { 
    //     category: 'room-walls', 
    //     material_type: 'drywall',
    //     load_bearing: false,
    //     room_west: 'dry-1',
    //     room_east: 'dry-2',
    //     curved_top: true,
    //     follows_roof_profile: true,
    //     center_height: 16.8906,
    //     exterior_height: 16.8438,
    //     description: 'REMOVED - Dry room east divider wall - wall removed to create one large dry room',
    //     framing: {
    //       studSize: '2x4',
    //       studSpacing: 16, // inches on center
    //       studCount: Math.ceil(23.9583 * 12 / 16), // calculated stud count
    //       hasFraming: true
    //     }
    //   }
    // },

    // Dry Room West Divider Wall - Extended north to create Dry 1 room in former control area (moved 6' east)
    {
      id: 'dry-room-west-divider-wall',
      type: 'wall' as const,
      position: { 
        x: 88.75, // Moved 6' east from 82.75 to 88.75 (94.75 - 6 = 88.75)
        y: 198.0417, // Start at Room 2 north wall, extend north
        z: 0 
      },
      dimensions: { width: 0.375, height: 23.9583, depth: 17 }, // 4.5" thick, spans to north wall (222 - 198.0417 = 23.9583'), 17' tall interior wall
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        room_west: 'veg',
        room_east: 'dry-room', // Now references the merged large dry room
        curved_top: true,
        follows_roof_profile: true,
        center_height: 16.8906,
        exterior_height: 16.8438,
        description: 'Dry room west divider wall - separates Veg room from large Dry room (former Dry 1 + Dry 2 merged)',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(23.9583 * 12 / 16), // calculated stud count
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
        x: 38.0625, // Starts at left longways wall (west hallway boundary)
        y: 124.3542, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 74.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, extends to east exterior wall
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
        x: 38.0625, // Starts at left longways wall (west hallway boundary)
        y: 99.7917, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 74.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, extends to east exterior wall
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
        x: 38.0625, // Starts at left longways wall (west hallway boundary)
        y: 75.2292, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 74.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, extends to east exterior wall
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
        x: 38.0625, // Starts at left longways wall (west hallway boundary)
        y: 48.6667, // Precisely centered on I-beam Y position minus half wall thickness
        z: 0 
      },
      dimensions: { width: 74.6875, height: 0.375, depth: 17 }, // 4.5" thick (0.375'), 17' tall interior wall, extends to east exterior wall
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
        x: 38.0625, // Adjusted for 13' wide west hallway (25 + 13 = 38.0625)
        y: 25, // Extended to south exterior wall
        z: 0 
      },
      dimensions: { width: 0.375, height: 197, depth: 17 }, // 4.5" thick, extended to north exterior wall: 222-25 = 197'
      rotation: 0,
      material: 'concrete',
      color: '#ffffff',
      metadata: { 
        category: 'room-walls', 
        material_type: 'drywall',
        load_bearing: false,
        description: 'Left longways wall - 12\' high with room openings, extended to north exterior wall (control room removed)',
        openings: [
          {
            id: 'flower-7-west-opening',
            type: 'door',
            position: { x: 11.83, z: 0 }, // Flower 7 room centered in its section (29 + 23.6667/2 = 40.83 - 29 = 11.83)
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Flower 7 room west entrance - 12\' hallway double door' }
          },
          {
            id: 'flower-6-west-opening', 
            type: 'door',
            position: { x: 36.95, z: 0 }, // Flower 6 room centered (75.2292 + 48.6667)/2 - 25 = 36.95
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Flower 6 room west entrance - 12\' hallway double door' }
          },
          {
            id: 'flower-5-west-opening',
            type: 'door', 
            position: { x: 62.51, z: 0 }, // Flower 5 room centered (75.2292 + 99.7917)/2 - 25 = 62.51
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Flower 5 room west entrance - 12\' hallway double door' }
          },
          {
            id: 'flower-4-west-opening',
            type: 'door',
            position: { x: 87.07, z: 0 }, // Flower 4 room centered (99.7917 + 124.3542)/2 - 25 = 87.07
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Flower 4 room west entrance - 12\' hallway double door' }
          },
          {
            id: 'flower-3-west-opening',
            type: 'door',
            position: { x: 111.64, z: 0 }, // Flower 3 room centered (124.3542 + 148.9167)/2 - 25 = 111.64
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Flower 3 room west entrance - 12\' hallway double door' }
          },
          {
            id: 'flower-2-west-opening',
            type: 'door',
            position: { x: 136.20, z: 0 }, // Flower 2 room centered (148.9167 + 173.4792)/2 - 25 = 136.20
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Flower 2 room west entrance - 12\' hallway double door' }
          },
          {
            id: 'flower-1-west-opening',
            type: 'door',
            position: { x: 160.76, z: 0 }, // Flower 1 room centered (173.4792 + 198.0417)/2 - 25 = 160.76
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Flower 1 room west entrance - 12\' hallway double door' }
          },
          {
            id: 'veg-west-opening',
            type: 'door',
            position: { x: 185.02, z: 0 }, // Veg room centered (198.0417 + 222)/2 - 25 = 185.02
            dimensions: { width: 8, height: 8 },
            metadata: { doorType: 'double', description: 'Veg room west entrance - 12\' hallway double door' }
          }
        ]
      }
    },
    
      // REMOVED: East longways wall - rooms now extend to east exterior wall
      // The east hallway has been removed and rooms have been expanded 6' to the east
      /*
      {
        id: 'longways-wall-right',
        type: 'wall' as const,
        position: { 
          x: 106.75, // Was 6' from right exterior wall
          y: 25, // Extended to south exterior wall
          z: 0 
        },
        dimensions: { width: 0.375, height: 173.0417, depth: 17 },
        rotation: 0,
        material: 'concrete',
        color: '#ffffff',
        metadata: { 
          category: 'room-walls', 
          material_type: 'drywall',
          load_bearing: false,
          description: 'REMOVED - East hallway wall removed to expand rooms',
          openings: [
            // All east doors removed - rooms now extend to exterior wall
            {
              id: 'room-7-east-opening',
              type: 'door',
              position: { x: 136.72, z: 0 }, // Room 2 centered (173.4792 + 198.0417)/2 - 49.0417 = 136.72
              dimensions: { width: 3, height: 8 },
              metadata: { doorType: 'single', description: 'Room 2 east entrance - 3\' hallway single door' }
            }
          ]
        }
      },
      */

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

    // NEW EXTERIOR WALL - North extension, 1' from east wall, extending 20' north
    {
      id: 'wall-north-extension',
      type: 'wall' as const,
      position: { 
        x: 111.75, // 1' from east exterior wall (112.75 - 1 = 111.75)
        y: 222, // Start at north exterior wall
        z: 0 
      },
      dimensions: { 
        width: 1, // 1' thick wall
        height: 20, // 20' extending north
        depth: 12 // 12' tall wall
      },
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'brick',
        load_bearing: true,
        description: 'North exterior wall extension - 20\' north from main building, 1\' from east wall',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(20 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },

    // NEW EXTERIOR WALL - West extension from north wall, ending 39.25' from west exterior wall
    {
      id: 'wall-west-extension',
      type: 'wall' as const,
      position: { 
        x: 64.25, // End position: 39.25' from west exterior wall (25 + 39.25 = 64.25)
        y: 242, // At the end of north extension (222 + 20 = 242)
        z: 0 
      },
      dimensions: { 
        width: 47.5, // Length from north extension to end point (111.75 - 64.25 = 47.5')
        height: 1, // 1' thick wall
        depth: 12 // 12' tall wall
      },
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'brick',
        load_bearing: true,
        description: 'West exterior wall extension - 47.5\' west from north extension, ending 39.25\' from west wall',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(47.5 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },

    // NEW EXTERIOR WALL - South connecting wall from west extension to main building north wall
    {
      id: 'wall-south-connector',
      type: 'wall' as const,
      position: { 
        x: 64.25, // At the end of west extension wall
        y: 222, // Start at main building north wall
        z: 0 
      },
      dimensions: { 
        width: 1, // 1' thick wall
        height: 20, // 20' south to connect to main building (242 - 222 = 20')
        depth: 12 // 12' tall wall
      },
      rotation: 0,
      material: 'brick',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'brick',
        load_bearing: true,
        description: 'South connecting wall - 20\' south from west extension to main building north wall',
        framing: {
          studSize: '2x4',
          studSpacing: 16, // inches on center
          studCount: Math.ceil(20 * 12 / 16), // calculated stud count
          hasFraming: true
        }
      }
    },





    // REMOVED: IBC TOTES AND WATER TANKS - per user request
    /*
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
    */



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
        width: 13.0625, // 13' hallway width (38.0625 - 25 = 13.0625')
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
    // REMOVED: East Longway Hallway - rooms now extend to east exterior wall
    /*
    {
      id: 'east-longway-hallway-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 106.75, // Was at east longway wall
        y: 25, 
        z: -0.125 
      },
      dimensions: { 
        width: 6.0, // Was 6' hallway width
        height: 173.0417,
        depth: 0.125
      },
      rotation: 0,
      material: 'concrete',
      color: '#0a0a0a',
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'REMOVED-east-longway-hallway',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false,
        seamless: true,
        description: 'REMOVED - East hallway removed to expand rooms'
      }
    },
    */
    


    // Processing Room - Black Gloss Epoxy Floor (north extension room)
    {
      id: 'processing-room-black-epoxy-floor',
      type: 'fixture' as const,
      position: { 
        x: 64.25, // Start at west extension wall (Processing room west boundary)
        y: 222, // Start at main building north wall (Processing room south boundary)
        z: -0.125 // Slightly below floor level (-1.5" = -0.125')
      },
      dimensions: { 
        width: 47.5, // Processing room width: from west extension to north extension (111.75 - 64.25 = 47.5')
        height: 20, // Processing room depth: north extension length (242 - 222 = 20')
        depth: 0.125 // 1.5" thick epoxy system (0.125')
      },
      rotation: 0,
      material: 'concrete', // Use concrete for solid rendering
      color: '#0a0a0a', // Deep black gloss epoxy to match west hallway
      metadata: { 
        category: 'flooring',
        material_type: 'black_gloss_epoxy',
        thickness_inches: 1.5,
        area: 'processing-room',
        room: 'processing-room',
        finish: 'high-gloss',
        chemical_resistant: true,
        anti_slip: false, // Gloss finish
        seamless: true,
        description: 'Black gloss epoxy floor - Processing room (47.5\' x 20\') - matches west hallway'
      }
    },

    // ============================================================================
    // EXTERNAL HALLWAY - 6' wide connecting processing to northeast corner
    // ============================================================================
    // Runs along the north side of the building (outside/north of main building north wall)
    
    // External hallway floor - concrete pad (west of processing, hugging north building wall)
    {
      id: 'external-hallway-floor',
      type: 'fixture' as const,
      position: { 
        x: 25, // Start at building west wall, aligned with main building
        y: 222, // Directly against the north wall of main building
        z: -0.125 // Floor level
      },
      dimensions: { width: 39.25, height: 6, depth: 0.125 }, // 39.25' long x 6' wide (from west wall to processing room)
      rotation: 0,
      material: 'concrete',
      color: '#c0c0c0', // Light concrete color
      metadata: { 
        category: 'flooring',
        material_type: 'concrete_pad',
        area: 'external-hallway',
        description: 'External hallway floor west of processing, hugging north building wall (39.25\' x 6\')'
      }
    },

    // External hallway north wall (outer perimeter, 6' north of building wall)
    {
      id: 'external-hallway-north-wall',
      type: 'wall' as const,
      position: { x: 25, y: 228, z: 0 }, // 6' north of building north wall
      dimensions: { width: 39.25, height: 1, depth: 8 }, // 8' tall wall
      rotation: 0,
      material: 'concrete',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'concrete_block',
        description: 'External hallway north wall (39.25\' long, 8\' tall)',
        framing: {
          studSize: '2x4',
          studSpacing: 16,
          studCount: Math.ceil(39.25 * 12 / 16),
          hasFraming: true
        }
      }
    },

    // External hallway west wall (closes off the west end)
    {
      id: 'external-hallway-west-wall',
      type: 'wall' as const,
      position: { x: 25, y: 222, z: 0 }, // At building west wall
      dimensions: { width: 1, height: 6, depth: 8 }, // 6' long, 8' tall
      rotation: 0,
      material: 'concrete',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'concrete_block',
        description: 'External hallway west wall (6\' long, 8\' tall)',
        framing: {
          studSize: '2x4',
          studSpacing: 16,
          studCount: Math.ceil(6 * 12 / 16),
          hasFraming: true
        }
      }
    },

    // External hallway east wall (connects to processing room)
    {
      id: 'external-hallway-east-wall',
      type: 'wall' as const,
      position: { x: 64.25, y: 222, z: 0 }, // At processing room west edge
      dimensions: { width: 1, height: 6, depth: 8 }, // 6' long, 8' tall
      rotation: 0,
      material: 'concrete',
      color: '#8B7355',
      metadata: { 
        category: 'exterior', 
        material_type: 'concrete_block',
        description: 'External hallway east wall connecting to processing room (6\' long, 8\' tall)',
        framing: {
          studSize: '2x4',
          studSpacing: 16,
          studCount: Math.ceil(6 * 12 / 16),
          hasFraming: true
        }
      }
    },





    // ============================================================================
    // ROLLING TABLE FLOOR LAYOUT MARKINGS - FLOWER ROOMS 1-7
    // ============================================================================
    
    // ROOM 7 (FLOWER 7) - ROLLING TABLES AND AISLE LAYOUT WITH N/S AISLES
    // Room bounds: Y: 25 to 48.6667, X: 40.0625 to 112.75 (2' walkway from west longway wall)
    // Layout: North aisle (2.25') + 5 tables (4' each) + South aisle (2.25') = 24.5625'
    {
      id: 'room-7-north-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 25, z: 0.015 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.015 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 7,
        aisle_position: 'north',
        description: 'Room 7 - North Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },
    {
      id: 'room-7-table-1',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 27.25, z: 0.015 },
      dimensions: { width: 72.6875, height: 4, depth: 0.015 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 7,
        table_number: 1,
        description: 'Room 7 - Rolling Table Row 1 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-7-table-2',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 31.25, z: 0.015 },
      dimensions: { width: 72.6875, height: 4, depth: 0.015 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 7,
        table_number: 2,
        description: 'Room 7 - Rolling Table Row 2 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-7-table-3',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 35.25, z: 0.015 },
      dimensions: { width: 72.6875, height: 4, depth: 0.015 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 7,
        table_number: 3,
        description: 'Room 7 - Rolling Table Row 3 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-7-table-4',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 39.25, z: 0.015 },
      dimensions: { width: 72.6875, height: 4, depth: 0.015 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 7,
        table_number: 4,
        description: 'Room 7 - Rolling Table Row 4 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-7-table-5',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 43.25, z: 0.015 },
      dimensions: { width: 72.6875, height: 4, depth: 0.015 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 7,
        table_number: 5,
        description: 'Room 7 - Rolling Table Row 5 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-7-south-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 47.25, z: 0.015 },
      dimensions: { width: 72.6875, height: 1.4167, depth: 0.015 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 7,
        aisle_position: 'south',
        description: 'Room 7 - South Harvest Aisle (1.42\' x 72.7\') - E-W cart access (adjusted for room boundary)'
      }
    },

    // ROOM 6 (FLOWER 6) - ROLLING TABLES AND AISLE LAYOUT WITH N/S AISLES
    // Room bounds: Y: 48.6667 to 75.2292, X: 40.0625 to 112.75 (2' walkway from west longway wall)
    // Layout: North aisle (2.25') + 5 tables (4' each) + South aisle (2.25') = 24.5625'
    {
      id: 'room-6-north-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 48.6667, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 6,
        aisle_position: 'north',
        description: 'Room 6 - North Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },
    {
      id: 'room-6-table-1',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 50.9167, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 6,
        table_number: 1,
        description: 'Room 6 - Rolling Table Row 1 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-6-table-2',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 54.9167, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 6,
        table_number: 2,
        description: 'Room 6 - Rolling Table Row 2 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-6-table-3',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 58.9167, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 6,
        table_number: 3,
        description: 'Room 6 - Rolling Table Row 3 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-6-table-4',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 62.9167, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 6,
        table_number: 4,
        description: 'Room 6 - Rolling Table Row 4 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-6-table-5',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 66.9167, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 6,
        table_number: 5,
        description: 'Room 6 - Rolling Table Row 5 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-6-south-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 70.9167, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 6,
        aisle_position: 'south',
        description: 'Room 6 - South Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },

    // ROOM 5 (FLOWER 5) - ROLLING TABLES AND AISLE LAYOUT WITH N/S AISLES
    // Room bounds: Y: 75.2292 to 99.7917, X: 40.0625 to 112.75 (2' walkway from west longway wall)
    // Layout: North aisle (2.25') + 5 tables (4' each) + South aisle (2.25') = 24.5625'
    {
      id: 'room-5-north-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 75.2292, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 5,
        aisle_position: 'north',
        description: 'Room 5 - North Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },
    {
      id: 'room-5-table-1',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 77.4792, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 5,
        table_number: 1,
        description: 'Room 5 - Rolling Table Row 1 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-5-table-2',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 81.4792, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 5,
        table_number: 2,
        description: 'Room 5 - Rolling Table Row 2 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-5-table-3',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 85.4792, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 5,
        table_number: 3,
        description: 'Room 5 - Rolling Table Row 3 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-5-table-4',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 89.4792, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 5,
        table_number: 4,
        description: 'Room 5 - Rolling Table Row 4 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-5-table-5',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 93.4792, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 5,
        table_number: 5,
        description: 'Room 5 - Rolling Table Row 5 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-5-south-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 97.4792, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 5,
        aisle_position: 'south',
        description: 'Room 5 - South Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },

    // ROOM 4 (FLOWER 4) - ROLLING TABLES AND AISLE LAYOUT WITH N/S AISLES
    // Room bounds: Y: 99.7917 to 124.3542, X: 40.0625 to 112.75 (2' walkway from west longway wall)
    // Layout: North aisle (2.25') + 5 tables (4' each) + South aisle (2.25') = 24.5625'
    {
      id: 'room-4-north-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 99.7917, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 4,
        aisle_position: 'north',
        description: 'Room 4 - North Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },
    {
      id: 'room-4-table-1',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 102.0417, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 4,
        table_number: 1,
        description: 'Room 4 - Rolling Table Row 1 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-4-table-2',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 106.0417, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 4,
        table_number: 2,
        description: 'Room 4 - Rolling Table Row 2 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-4-table-3',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 110.0417, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 4,
        table_number: 3,
        description: 'Room 4 - Rolling Table Row 3 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-4-table-4',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 114.0417, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 4,
        table_number: 4,
        description: 'Room 4 - Rolling Table Row 4 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-4-table-5',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 118.0417, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 4,
        table_number: 5,
        description: 'Room 4 - Rolling Table Row 5 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-4-south-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 122.0417, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 4,
        aisle_position: 'south',
        description: 'Room 4 - South Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },

    // ROOM 3 (FLOWER 3) - ROLLING TABLES AND AISLE LAYOUT WITH N/S AISLES
    // Room bounds: Y: 124.3542 to 148.9167, X: 40.0625 to 112.75 (2' walkway from west longway wall)
    // Layout: North aisle (2.25') + 5 tables (4' each) + South aisle (2.25') = 24.5625'
    {
      id: 'room-3-north-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 124.3542, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 3,
        aisle_position: 'north',
        description: 'Room 3 - North Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },
    {
      id: 'room-3-table-1',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 126.6042, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 3,
        table_number: 1,
        description: 'Room 3 - Rolling Table Row 1 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-3-table-2',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 130.6042, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 3,
        table_number: 2,
        description: 'Room 3 - Rolling Table Row 2 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-3-table-3',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 134.6042, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 3,
        table_number: 3,
        description: 'Room 3 - Rolling Table Row 3 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-3-table-4',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 138.6042, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 3,
        table_number: 4,
        description: 'Room 3 - Rolling Table Row 4 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-3-table-5',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 142.6042, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 3,
        table_number: 5,
        description: 'Room 3 - Rolling Table Row 5 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-3-south-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 146.6042, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 3,
        aisle_position: 'south',
        description: 'Room 3 - South Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },

    // ROOM 2 (FLOWER 2) - ROLLING TABLES AND AISLE LAYOUT WITH N/S AISLES
    // Room bounds: Y: 148.9167 to 173.4792, X: 40.0625 to 112.75 (2' walkway from west longway wall)
    // Layout: North aisle (2.25') + 5 tables (4' each) + South aisle (2.25') = 24.5625'
    {
      id: 'room-2-north-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 148.9167, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 2,
        aisle_position: 'north',
        description: 'Room 2 - North Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },
    {
      id: 'room-2-table-1',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 151.1667, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 2,
        table_number: 1,
        description: 'Room 2 - Rolling Table Row 1 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-2-table-2',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 155.1667, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 2,
        table_number: 2,
        description: 'Room 2 - Rolling Table Row 2 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-2-table-3',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 159.1667, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 2,
        table_number: 3,
        description: 'Room 2 - Rolling Table Row 3 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-2-table-4',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 163.1667, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 2,
        table_number: 4,
        description: 'Room 2 - Rolling Table Row 4 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-2-table-5',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 167.1667, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 2,
        table_number: 5,
        description: 'Room 2 - Rolling Table Row 5 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-2-south-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 171.1667, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 2,
        aisle_position: 'south',
        description: 'Room 2 - South Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },

    // ROOM 1 (FLOWER 1) - ROLLING TABLES AND AISLE LAYOUT WITH N/S AISLES
    // Room bounds: Y: 173.4792 to 198.0417, X: 40.0625 to 112.75 (2' walkway from west longway wall)
    // Layout: North aisle (2.25') + 5 tables (4' each) + South aisle (2.25') = 24.5625'
    {
      id: 'room-1-north-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 173.4792, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 1,
        aisle_position: 'north',
        description: 'Room 1 - North Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
      }
    },
    {
      id: 'room-1-table-1',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 175.7292, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 1,
        table_number: 1,
        description: 'Room 1 - Rolling Table Row 1 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-1-table-2',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 179.7292, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 1,
        table_number: 2,
        description: 'Room 1 - Rolling Table Row 2 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-1-table-3',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 183.7292, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 1,
        table_number: 3,
        description: 'Room 1 - Rolling Table Row 3 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-1-table-4',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 187.7292, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 1,
        table_number: 4,
        description: 'Room 1 - Rolling Table Row 4 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-1-table-5',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 191.7292, z: 0.01 },
      dimensions: { width: 72.6875, height: 4, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'rolling-table',
        room: 1,
        table_number: 5,
        description: 'Room 1 - Rolling Table Row 5 (4\' x 72.7\') - 29 lights'
      }
    },
    {
      id: 'room-1-south-aisle',
      type: 'fixture' as const,
      position: { x: 40.0625, y: 195.7292, z: 0.01 },
      dimensions: { width: 72.6875, height: 2.25, depth: 0.01 },
      rotation: 0,
      material: 'concrete',
      color: 'transparent', // Hidden - rendered by BlueprintFloorPlan component
      metadata: { 
        category: 'cultivation-layout',
        type: 'harvest-aisle',
        room: 1,
        aisle_position: 'south',
        description: 'Room 1 - South Harvest Aisle (2.25\' x 72.7\') - E-W cart access'
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
    position: new THREE.Vector3(position.x, position.y, position.z),
    rotation: new THREE.Euler(0, 0, config?.rotation?.z || 0)
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
      position: new THREE.Vector3(position.x, position.y, position.z),
      rotation: new THREE.Euler(0, 0, 0)
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
      position: new THREE.Vector3(position.x, position.y, position.z),
      rotation: new THREE.Euler(0, 0, 0)
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
      position: new THREE.Vector3(position.x, position.y, position.z),
      rotation: new THREE.Euler(0, 0, Math.PI / 2) // 90 degrees for north-south orientation
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
      position: new THREE.Vector3(position.x, position.y, position.z),
      rotation: new THREE.Euler(0, 0, Math.PI / 2) // 90 degrees for north-south orientation
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
  
  return (recommendations as any)[areaType.toLowerCase()] || COVE_BASE_TRIM_CATALOG.VINYL_6_INCH;
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
