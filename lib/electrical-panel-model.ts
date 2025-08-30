import * as THREE from 'three'

/**
 * Three.js 600 Amp Commercial Electrical Panel Object
 * Creates detailed electrical panel with manufacturer-specific dimensions
 */
export function createCommercial600AmpPanel(manufacturer = 'square-d', options = {}) {
    const panelGroup = new THREE.Group();
    
    // Manufacturer-specific dimensions (in inches, converted to scene units)
    const manufacturers = {
        'square-d': { 
            height: 91,    // 7'7" Square D I-Line
            width: 32,     // 2'8" 
            depth: 8       // 8" deep
        },
        'schneider': { 
            height: 62,    // 5'2" Schneider Electric
            width: 20,     // 1'8"
            depth: 6       // 6" deep
        },
        'eaton': { 
            height: 84,    // 7'0" Eaton Pow-R-Line
            width: 30,     // 2'6"
            depth: 8       // 8" deep
        },
        'siemens': { 
            height: 88,    // 7'4" Siemens P4
            width: 34,     // 2'10"
            depth: 10      // 10" deep
        }
    };
    
    // Get dimensions for selected manufacturer
    const dims = manufacturers[manufacturer as keyof typeof manufacturers] || manufacturers['square-d'];
    
    // Default options
    const config = {
        circuitBreakers: 42,
        busType: 'copper', // 'copper' or 'aluminum'
        finish: 'gray', // 'gray', 'white', 'stainless'
        enclosureType: 'surface', // 'surface', 'flush', 'outdoor'
        ...options
    };
    
    // Scale factor (convert inches to feet: 1 foot = 12 inches)
    const scale = 1/12;
    
    // Convert to scene units (feet)
    const height = dims.height * scale;
    const width = dims.width * scale;
    const depth = dims.depth * scale;
    
    // Material colors
    const finishColors = {
        gray: 0x808080,
        white: 0xf8f8f8,
        stainless: 0xc0c0c0
    };
    
    // Main enclosure material
    const enclosureMaterial = new THREE.MeshPhongMaterial({ 
        color: finishColors[config.finish as keyof typeof finishColors],
        name: 'Enclosure_Material'
    });
    
    // === MAIN ENCLOSURE ===
    const enclosureGeometry = new THREE.BoxGeometry(width, height, depth);
    const enclosure = new THREE.Mesh(enclosureGeometry, enclosureMaterial);
    enclosure.position.y = height / 2;
    enclosure.castShadow = true;
    enclosure.receiveShadow = true;
    enclosure.name = 'Main_Enclosure';
    panelGroup.add(enclosure);
    
    // === DOOR/COVER ===
    const doorGeometry = new THREE.BoxGeometry(width + 0.02, height + 0.02, 0.05);
    const door = new THREE.Mesh(doorGeometry, enclosureMaterial);
    door.position.y = height / 2;
    door.position.z = depth / 2 + 0.025;
    door.castShadow = true;
    door.receiveShadow = true;
    door.name = 'Panel_Door';
    panelGroup.add(door);
    
    // === DOOR HANDLE ===
    const handleGeometry = new THREE.BoxGeometry(0.02, 0.15, 0.05);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.x = width / 2 - 0.05;
    handle.position.y = height / 2 + 0.2;
    handle.position.z = depth / 2 + 0.08;
    handle.castShadow = true;
    handle.name = 'Door_Handle';
    panelGroup.add(handle);
    
    // === INTERIOR COMPONENTS ===
    
    // Back panel
    const backPanelGeometry = new THREE.BoxGeometry(width - 0.1, height - 0.1, 0.02);
    const backPanelMaterial = new THREE.MeshPhongMaterial({ color: 0xe0e0e0 });
    const backPanel = new THREE.Mesh(backPanelGeometry, backPanelMaterial);
    backPanel.position.y = height / 2;
    backPanel.position.z = -depth / 2 + 0.01;
    backPanel.name = 'Back_Panel';
    panelGroup.add(backPanel);
    
    // === MAIN BREAKER (600A) ===
    const mainBreakerGeometry = new THREE.BoxGeometry(0.35, 0.18, 0.1);
    const mainBreakerMaterial = new THREE.MeshPhongMaterial({ color: 0x2c2c2c });
    const mainBreaker = new THREE.Mesh(mainBreakerGeometry, mainBreakerMaterial);
    mainBreaker.position.y = height - 0.25;
    mainBreaker.position.z = -depth / 2 + 0.06;
    mainBreaker.castShadow = true;
    mainBreaker.name = 'Main_Breaker_600A';
    panelGroup.add(mainBreaker);
    
    // === BUS BARS ===
    const busColor = config.busType === 'copper' ? 0xb87333 : 0xc0c0c0;
    const busMaterial = new THREE.MeshPhongMaterial({ 
        color: busColor,
        shininess: 60,
        name: config.busType === 'copper' ? 'Copper_Bus' : 'Aluminum_Bus'
    });
    
    // Three main bus bars (A, B, C phases)
    for (let i = 0; i < 3; i++) {
        const busGeometry = new THREE.BoxGeometry(0.025, height - 0.5, 0.008);
        const bus = new THREE.Mesh(busGeometry, busMaterial);
        bus.position.x = (i - 1) * 0.1; // Space them 0.1 units apart
        bus.position.y = (height - 0.5) / 2 + 0.05; // Start below main breaker
        bus.position.z = -depth / 2 + 0.035;
        bus.name = `Bus_Bar_Phase_${['A','B','C'][i]}`;
        panelGroup.add(bus);
    }
    
    // === CIRCUIT BREAKERS ===
    const breakerGeometry = new THREE.BoxGeometry(0.045, 0.09, 0.07);
    const breakerMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    
    // Calculate breaker layout
    const breakersPerRow = 2;
    const startY = height - 0.45; // Start below main breaker and bus connections
    const breakerSpacingY = 0.105; // Vertical spacing between breaker rows
    const breakerSpacingX = 0.12; // Horizontal spacing between columns
    
    // Create circuit breakers
    for (let i = 0; i < config.circuitBreakers && i < 60; i++) {
        const row = Math.floor(i / breakersPerRow);
        const col = i % breakersPerRow;
        
        const breaker = new THREE.Mesh(breakerGeometry, breakerMaterial);
        breaker.position.x = (col === 0) ? -breakerSpacingX/2 : breakerSpacingX/2;
        breaker.position.y = startY - (row * breakerSpacingY);
        breaker.position.z = -depth / 2 + 0.045;
        breaker.castShadow = true;
        breaker.name = `Circuit_Breaker_${i + 1}`;
        
        // Only add if breaker fits in panel height
        if (breaker.position.y > 0.15) {
            panelGroup.add(breaker);
        }
    }
    
    // === LABELS AND MARKINGS ===
    
    // Manufacturer label
    const labelGeometry = new THREE.PlaneGeometry(0.6, 0.12);
    const labelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const manufacturerLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    manufacturerLabel.position.y = height - 0.15;
    manufacturerLabel.position.z = depth / 2 + 0.051;
    manufacturerLabel.name = 'Manufacturer_Label';
    panelGroup.add(manufacturerLabel);
    
    // Warning/danger labels
    const warningGeometry = new THREE.PlaneGeometry(0.35, 0.1);
    const warningMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xff4444,
        transparent: true,
        opacity: 0.8
    });
    const dangerLabel = new THREE.Mesh(warningGeometry, warningMaterial);
    dangerLabel.position.y = height - 0.35;
    dangerLabel.position.z = depth / 2 + 0.051;
    dangerLabel.name = 'Danger_Label';
    panelGroup.add(dangerLabel);
    
    // Circuit directory
    const directoryGeometry = new THREE.BoxGeometry(0.28, 0.45, 0.015);
    const directoryMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    const circuitDirectory = new THREE.Mesh(directoryGeometry, directoryMaterial);
    circuitDirectory.position.x = width / 2 - 0.18;
    circuitDirectory.position.y = height / 2 - 0.1;
    circuitDirectory.position.z = depth / 2 + 0.052;
    circuitDirectory.name = 'Circuit_Directory';
    panelGroup.add(circuitDirectory);
    
    // === MOUNTING HARDWARE ===
    
    // Mounting brackets (4 corners)
    const bracketGeometry = new THREE.BoxGeometry(0.04, 0.04, 0.1);
    const bracketMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    
    const bracketPositions = [
        [-width/2 - 0.02, height - 0.08], // Top left
        [width/2 + 0.02, height - 0.08],  // Top right
        [-width/2 - 0.02, 0.08],          // Bottom left
        [width/2 + 0.02, 0.08]            // Bottom right
    ];
    
    bracketPositions.forEach((pos, index) => {
        const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
        bracket.position.x = pos[0];
        bracket.position.y = pos[1];
        bracket.position.z = -depth / 2 - 0.05;
        bracket.name = `Mounting_Bracket_${index + 1}`;
        panelGroup.add(bracket);
    });
    
    // === METADATA ===
    panelGroup.name = `Commercial_600A_Panel_${manufacturer.toUpperCase()}`;
    panelGroup.userData = {
        manufacturer: manufacturer,
        model: `${manufacturer.toUpperCase()}_600A`,
        mainBreakerSize: '600A',
        voltage: '120/208V or 277/480V',
        phases: '3-phase, 4-wire',
        circuitBreakers: config.circuitBreakers,
        busType: config.busType,
        dimensions: {
            height: dims.height + '"',
            width: dims.width + '"',
            depth: dims.depth + '"',
            heightFeet: Math.floor(dims.height/12) + "'-" + (dims.height%12) + '"',
            widthFeet: Math.floor(dims.width/12) + "'-" + (dims.width%12) + '"'
        },
        weight: '250-400 lbs',
        enclosureType: config.enclosureType,
        finish: config.finish,
        interruptingCapacity: '22kAIC or 65kAIC',
        busBars: config.busType + ' 600A',
        type: 'Commercial_Electrical_Panel'
    };
    
    return panelGroup;
}

/**
 * Creates a detailed Eaton Pow-R-Line electrical panel
 */
export function createDetailedEatonPanel(options = {}) {
    return createCommercial600AmpPanel('eaton', {
        circuitBreakers: 42,
        busType: 'copper',
        finish: 'gray',
        enclosureType: 'surface',
        ...options
    });
}

/**
 * Creates a 200A distribution panel for room electrical service
 */
export function createCommercial200AmpPanel(manufacturer = 'eaton', options = {}) {
    const panelGroup = new THREE.Group();
    
    // 200A panel dimensions (smaller than 600A panels)
    const manufacturers = {
        'square-d': { 
            height: 42,    // 3'6" Square D QO series
            width: 14,     // 1'2" 
            depth: 4       // 4" deep
        },
        'schneider': { 
            height: 40,    // 3'4" Schneider Electric
            width: 14,     // 1'2"
            depth: 4       // 4" deep
        },
        'eaton': { 
            height: 40,    // 3'4" Eaton BR series
            width: 14,     // 1'2"
            depth: 4       // 4" deep
        },
        'siemens': { 
            height: 42,    // 3'6" Siemens QP series
            width: 14,     // 1'2"
            depth: 4       // 4" deep
        }
    };
    
    // Get dimensions for selected manufacturer
    const dims = manufacturers[manufacturer as keyof typeof manufacturers] || manufacturers['eaton'];
    
    // Default options for 200A panel
    const config = {
        circuitBreakers: 24,
        busType: 'copper', 
        finish: 'gray',
        enclosureType: 'surface',
        ...options
    };
    
    // Scale factor (convert inches to feet: 1 foot = 12 inches)
    const scale = 1/12;
    
    // Convert to scene units (feet)
    const height = dims.height * scale;
    const width = dims.width * scale;
    const depth = dims.depth * scale;
    
    // Material colors
    const finishColors = {
        gray: 0x808080,
        white: 0xf8f8f8,
        stainless: 0xc0c0c0
    };
    
    // Main enclosure material
    const enclosureMaterial = new THREE.MeshPhongMaterial({ 
        color: finishColors[config.finish as keyof typeof finishColors],
        name: 'Enclosure_Material_200A'
    });
    
    // === MAIN ENCLOSURE ===
    const enclosureGeometry = new THREE.BoxGeometry(width, height, depth);
    const enclosure = new THREE.Mesh(enclosureGeometry, enclosureMaterial);
    enclosure.position.y = height / 2;
    enclosure.castShadow = true;
    enclosure.receiveShadow = true;
    enclosure.name = 'Main_Enclosure_200A';
    panelGroup.add(enclosure);
    
    // === DOOR/COVER ===
    const doorGeometry = new THREE.BoxGeometry(width + 0.01, height + 0.01, 0.02);
    const door = new THREE.Mesh(doorGeometry, enclosureMaterial);
    door.position.y = height / 2;
    door.position.z = depth / 2 + 0.01;
    door.castShadow = true;
    door.receiveShadow = true;
    door.name = 'Panel_Door_200A';
    panelGroup.add(door);
    
    // === DOOR HANDLE ===
    const handleGeometry = new THREE.BoxGeometry(0.01, 0.08, 0.02);
    const handleMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.x = width / 2 - 0.02;
    handle.position.y = height / 2 + 0.1;
    handle.position.z = depth / 2 + 0.02;
    handle.castShadow = true;
    handle.name = 'Door_Handle_200A';
    panelGroup.add(handle);
    
    // === MAIN BREAKER (200A) ===
    const mainBreakerGeometry = new THREE.BoxGeometry(0.2, 0.12, 0.06);
    const mainBreakerMaterial = new THREE.MeshPhongMaterial({ color: 0x2c2c2c });
    const mainBreaker = new THREE.Mesh(mainBreakerGeometry, mainBreakerMaterial);
    mainBreaker.position.y = height - 0.15;
    mainBreaker.position.z = -depth / 2 + 0.04;
    mainBreaker.castShadow = true;
    mainBreaker.name = 'Main_Breaker_200A';
    panelGroup.add(mainBreaker);
    
    // === BUS BARS (Single Phase + Neutral) ===
    const busColor = config.busType === 'copper' ? 0xb87333 : 0xc0c0c0;
    const busMaterial = new THREE.MeshPhongMaterial({ 
        color: busColor,
        shininess: 60,
        name: config.busType === 'copper' ? 'Copper_Bus_200A' : 'Aluminum_Bus_200A'
    });
    
    // Two main bus bars (hot legs) + neutral
    for (let i = 0; i < 2; i++) {
        const busGeometry = new THREE.BoxGeometry(0.015, height - 0.25, 0.005);
        const bus = new THREE.Mesh(busGeometry, busMaterial);
        bus.position.x = (i - 0.5) * 0.06; // Space them closer
        bus.position.y = (height - 0.25) / 2 + 0.03; // Start below main breaker
        bus.position.z = -depth / 2 + 0.02;
        bus.name = `Bus_Bar_200A_${i + 1}`;
        panelGroup.add(bus);
    }
    
    // === CIRCUIT BREAKERS ===
    const breakerGeometry = new THREE.BoxGeometry(0.025, 0.06, 0.04);
    const breakerMaterial = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
    
    // Calculate breaker layout
    const breakersPerRow = 2;
    const startY = height - 0.25; // Start below main breaker
    const breakerSpacingY = 0.07; // Vertical spacing between breaker rows
    const breakerSpacingX = 0.08; // Horizontal spacing between columns
    
    // Create circuit breakers
    for (let i = 0; i < config.circuitBreakers && i < 40; i++) {
        const row = Math.floor(i / breakersPerRow);
        const col = i % breakersPerRow;
        
        const breaker = new THREE.Mesh(breakerGeometry, breakerMaterial);
        breaker.position.x = (col === 0) ? -breakerSpacingX/2 : breakerSpacingX/2;
        breaker.position.y = startY - (row * breakerSpacingY);
        breaker.position.z = -depth / 2 + 0.025;
        breaker.castShadow = true;
        breaker.name = `Circuit_Breaker_200A_${i + 1}`;
        
        // Only add if breaker fits in panel height
        if (breaker.position.y > 0.08) {
            panelGroup.add(breaker);
        }
    }
    
    // === LABELS ===
    const labelGeometry = new THREE.PlaneGeometry(0.25, 0.06);
    const labelMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.9
    });
    const manufacturerLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    manufacturerLabel.position.y = height - 0.08;
    manufacturerLabel.position.z = depth / 2 + 0.021;
    manufacturerLabel.name = 'Manufacturer_Label_200A';
    panelGroup.add(manufacturerLabel);
    
    // === METADATA ===
    panelGroup.name = `Commercial_200A_Panel_${manufacturer.toUpperCase()}`;
    panelGroup.userData = {
        manufacturer: manufacturer,
        model: `${manufacturer.toUpperCase()}_200A`,
        mainBreakerSize: '200A',
        voltage: '120/240V',
        phases: 'single-phase, 3-wire',
        circuitBreakers: config.circuitBreakers,
        busType: config.busType,
        dimensions: {
            height: dims.height + '"',
            width: dims.width + '"',
            depth: dims.depth + '"',
            heightFeet: Math.floor(dims.height/12) + "'-" + (dims.height%12) + '"',
            widthFeet: Math.floor(dims.width/12) + "'-" + (dims.width%12) + '"'
        },
        weight: '50-80 lbs',
        enclosureType: config.enclosureType,
        finish: config.finish,
        interruptingCapacity: '10kAIC',
        busBars: config.busType + ' 200A',
        type: 'Commercial_200A_Panel'
    };
    
    return panelGroup;
}

/**
 * Creates a detailed 200A distribution panel
 */
export function createDetailed200APanel(options = {}) {
    return createCommercial200AmpPanel('eaton', {
        circuitBreakers: 24,
        busType: 'copper',
        finish: 'gray',
        enclosureType: 'surface',
        ...options
    });
}

/**
 * Creates a simple electrical panel for 2D/distant views
 */
export function createSimpleElectricalPanel() {
    const panelGroup = new THREE.Group();
    
    // Simple box representation
    const geometry = new THREE.BoxGeometry(0.6, 1.68, 0.16); // 30"x84"x8" scaled
    const material = new THREE.MeshPhongMaterial({ color: 0x808080 });
    const panel = new THREE.Mesh(geometry, material);
    
    panel.position.y = 0.84; // Half height
    panel.castShadow = true;
    panel.receiveShadow = true;
    panel.name = 'Simple_Electrical_Panel';
    
    panelGroup.add(panel);
    panelGroup.name = 'Simple_Electrical_Panel_Group';
    
    return panelGroup;
}
