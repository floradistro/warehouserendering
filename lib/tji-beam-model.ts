import * as THREE from 'three'

/**
 * TJI I-JOIST BEAM THREE.JS MODEL
 * Creates detailed 3D geometry for 11 7/8" TJI beams
 * Compatible with the warehouse CAD system
 */

/**
 * Creates a Three.js I-Joist Object - 11 7/8" height
 * Call this function to create the joist geometry
 */
export function createIJoist_11_7_8(length: number = 96): THREE.Group {
    const group = new THREE.Group();
    
    // Dimensions in inches
    const joistWidth = 1.5;        // Standard flange width
    const joistHeight = 11.875;    // 11 7/8" height
    const webThickness = 0.375;    // 3/8" OSB web
    const joistLength = length;    // Customizable length
    
    // Scale factor (adjust as needed for your scene)
    const scale = 0.1; // 1 inch = 0.1 units
    
    // Convert to scene units
    const w = joistWidth * scale;
    const h = joistHeight * scale;
    const l = joistLength * scale;
    const webT = webThickness * scale;
    
    // Flange dimensions (top and bottom lumber pieces)
    const flangeHeight = h * 0.127; // About 1.5" for 11 7/8" joist
    const flangeWidth = w;
    
    // Materials
    const osbMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xD2B48C, // OSB brown color
        name: 'OSB_Web'
    });
    
    const lumberMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xF5DEB3, // Lumber beige color
        name: 'Lumber_Flange'
    });
    
    // Create OSB web (center vertical piece)
    const webGeometry = new THREE.BoxGeometry(webT, h - 2 * flangeHeight, l);
    const web = new THREE.Mesh(webGeometry, osbMaterial);
    web.name = 'OSB_Web';
    web.castShadow = true;
    web.receiveShadow = true;
    group.add(web);
    
    // Create top flange (lumber)
    const topFlangeGeometry = new THREE.BoxGeometry(flangeWidth, flangeHeight, l);
    const topFlange = new THREE.Mesh(topFlangeGeometry, lumberMaterial);
    topFlange.position.y = (h - flangeHeight) / 2;
    topFlange.name = 'Top_Flange';
    topFlange.castShadow = true;
    topFlange.receiveShadow = true;
    group.add(topFlange);
    
    // Create bottom flange (lumber)
    const bottomFlangeGeometry = new THREE.BoxGeometry(flangeWidth, flangeHeight, l);
    const bottomFlange = new THREE.Mesh(bottomFlangeGeometry, lumberMaterial);
    bottomFlange.position.y = -(h - flangeHeight) / 2;
    bottomFlange.name = 'Bottom_Flange';
    bottomFlange.castShadow = true;
    bottomFlange.receiveShadow = true;
    group.add(bottomFlange);
    
    // Set group name and metadata
    group.name = 'I_Joist_11_7_8';
    group.userData = {
        height: '11 7/8"',
        width: '1 1/2"',
        webThickness: '3/8"',
        length: length + '"',
        type: 'I-Joist',
        material: 'OSB_Web_with_Lumber_Flanges'
    };
    
    return group;
}

/**
 * Creates multiple joists with spacing for floor systems
 */
export function createJoistArray_11_7_8(numberOfJoists: number = 6, spacing: number = 16, length: number = 96): THREE.Group {
    const joistArray = new THREE.Group();
    
    for (let i = 0; i < numberOfJoists; i++) {
        const joist = createIJoist_11_7_8(length);
        
        // Position joist (spacing in inches, converted to scene units)
        joist.position.x = (i - (numberOfJoists - 1) / 2) * spacing * 0.1;
        
        joistArray.add(joist);
    }
    
    joistArray.name = 'I_Joist_Array_11_7_8';
    joistArray.userData = {
        numberOfJoists,
        spacing: spacing + '" OC',
        length: length + '"',
        type: 'I-Joist Array'
    };
    
    return joistArray;
}

/**
 * Creates a comprehensive floor joist system
 * @param width - Floor system width in inches
 * @param length - Floor system length in inches  
 * @param joistSpacing - Joist spacing in inches (default: 16" OC)
 * @param joistLength - Individual joist length in inches
 */
export function createFloorJoistSystem_11_7_8(
    width: number, 
    length: number, 
    joistSpacing: number = 16, 
    joistLength?: number
): THREE.Group {
    const floorSystem = new THREE.Group();
    
    // Use width as joist length if not specified
    const actualJoistLength = joistLength || width;
    
    // Calculate number of joists needed
    const numberOfJoists = Math.ceil(length / joistSpacing) + 1;
    
    for (let i = 0; i < numberOfJoists; i++) {
        const joist = createIJoist_11_7_8(actualJoistLength);
        
        // Position joists along the length dimension
        const yPosition = (i - (numberOfJoists - 1) / 2) * joistSpacing * 0.1;
        joist.position.y = yPosition;
        
        // Rotate joist to span the width
        joist.rotation.z = Math.PI / 2; // 90 degrees
        
        floorSystem.add(joist);
    }
    
    floorSystem.name = 'Floor_Joist_System_11_7_8';
    floorSystem.userData = {
        systemWidth: width + '"',
        systemLength: length + '"',
        numberOfJoists,
        joistSpacing: joistSpacing + '" OC',
        joistLength: actualJoistLength + '"',
        type: 'TJI Floor System'
    };
    
    return floorSystem;
}

/**
 * Creates a single joist positioned and oriented for the warehouse CAD system
 * This function converts from the warehouse coordinate system to Three.js
 * @param position - Position in warehouse coordinates (feet)
 * @param length - Length in feet
 * @param rotation - Rotation in degrees
 */
export function createWarehouseTJIJoist(
    position: { x: number; y: number; z: number },
    length: number,
    rotation: number = 0
): THREE.Group {
    // Convert length from feet to inches for the Three.js function
    const lengthInches = length * 12;
    
    const joist = createIJoist_11_7_8(lengthInches);
    
    // Convert position from feet to Three.js units (assuming 1 foot = 1 unit in Three.js)
    joist.position.set(position.x, position.z || 0, position.y); // Note: Y and Z swapped for Three.js coordinate system
    
    // Convert rotation from degrees to radians
    joist.rotation.y = (rotation * Math.PI) / 180;
    
    // Scale down since our Three.js function uses a 0.1 scale factor
    // But we want to match the warehouse coordinate system
    joist.scale.multiplyScalar(10); // Compensate for the 0.1 scale in createIJoist_11_7_8
    
    joist.userData = {
        ...joist.userData,
        warehousePosition: position,
        warehouseLengthFeet: length,
        warehouseRotationDegrees: rotation
    };
    
    return joist;
}

/**
 * Utility function to create material variants
 */
export function createTJIMaterials() {
    return {
        osbWeb: new THREE.MeshLambertMaterial({ 
            color: 0xD2B48C, // OSB brown
            name: 'OSB_Web'
        }),
        lumberFlange: new THREE.MeshLambertMaterial({ 
            color: 0xF5DEB3, // Lumber beige
            name: 'Lumber_Flange'
        }),
        weatheredOSB: new THREE.MeshLambertMaterial({
            color: 0xB8860B, // Darker brown for weathered OSB
            name: 'Weathered_OSB_Web'
        }),
        weatheredLumber: new THREE.MeshLambertMaterial({
            color: 0xDEB887, // Darker beige for weathered lumber
            name: 'Weathered_Lumber_Flange'
        })
    };
}

/**
 * Export usage examples and documentation
 */
export const TJI_USAGE_EXAMPLES = {
    singleJoist: {
        description: "Create a single 8-foot TJI joist",
        code: `const joist = createIJoist_11_7_8(96); // 96 inches = 8 feet
scene.add(joist);`
    },
    customLength: {
        description: "Create a 12-foot TJI joist", 
        code: `const joist12ft = createIJoist_11_7_8(144); // 144 inches = 12 feet
scene.add(joist12ft);`
    },
    joistArray: {
        description: "Create 8 joists spaced 16 inches on center, 12 feet long",
        code: `const joistSystem = createJoistArray_11_7_8(8, 16, 144);
scene.add(joistSystem);`
    },
    floorSystem: {
        description: "Create a complete floor system 20' x 30'",
        code: `const floorSystem = createFloorJoistSystem_11_7_8(240, 360, 16); // 20' x 30', 16" OC
scene.add(floorSystem);`
    },
    warehouseIntegration: {
        description: "Create a joist for the warehouse CAD system",
        code: `const joist = createWarehouseTJIJoist(
  { x: 50, y: 100, z: 8 }, // Position in feet
  12, // Length in feet  
  45  // Rotation in degrees
);
scene.add(joist);`
    }
};
