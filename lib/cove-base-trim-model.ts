import * as THREE from 'three';

export interface CoveBaseTrimConfig {
  height: number; // inches
  thickness: number; // inches
  coveRadius: number; // inches
  length: number; // inches
  color: number; // hex color
  material: 'vinyl' | 'rubber' | 'aluminum';
  position: THREE.Vector3;
  rotation: THREE.Euler;
}

export const createCoveBaseTrim = (config: CoveBaseTrimConfig): THREE.Group => {
  const group = new THREE.Group();
  const scale = 1 / 12; // Convert inches to feet for scene scale
  
  // Convert dimensions to scene units
  const height = config.height * scale;
  const thickness = config.thickness * scale;
  const length = config.length * scale;
  const coveRadius = config.coveRadius * scale;
  
  // Material based on type
  let baseMaterial: THREE.Material;
  switch(config.material) {
    case 'vinyl':
      baseMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color,
        shininess: 20
      });
      break;
    case 'rubber':
      baseMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color,
        shininess: 5
      });
      break;
    case 'aluminum':
      baseMaterial = new THREE.MeshStandardMaterial({ 
        color: config.color,
        metalness: 0.8,
        roughness: 0.2
      });
      break;
    default:
      baseMaterial = new THREE.MeshPhongMaterial({ 
        color: config.color,
        shininess: 20
      });
  }
  
  // Create the cove base profile using a custom shape
  const createCoveProfile = (): THREE.Shape => {
    const shape = new THREE.Shape();
    
    // Start at bottom left
    shape.moveTo(0, 0);
    
    // Go up the wall face
    shape.lineTo(0, height - coveRadius);
    
    // Create the cove curve (quarter circle)
    shape.absarc(coveRadius, height - coveRadius, coveRadius, Math.PI, Math.PI * 1.5, false);
    
    // Go across the top
    shape.lineTo(thickness, height);
    
    // Go down the back
    shape.lineTo(thickness, 0);
    
    // Close the shape
    shape.lineTo(0, 0);
    
    return shape;
  };
  
  // Extrude the profile to create the trim
  const profile = createCoveProfile();
  const extrudeSettings: THREE.ExtrudeGeometryOptions = {
    depth: length,
    bevelEnabled: false
  };
  
  const geometry = new THREE.ExtrudeGeometry(profile, extrudeSettings);
  const coveBase = new THREE.Mesh(geometry, baseMaterial);
  
  // Position the cove base
  coveBase.rotation.y = -Math.PI / 2; // Rotate to face forward
  coveBase.position.x = -length / 2;
  coveBase.castShadow = true;
  coveBase.receiveShadow = true;
  
  // Add metadata for identification and editing
  coveBase.userData = {
    type: 'cove-base-trim',
    config: config,
    height: config.height,
    thickness: config.thickness,
    coveRadius: config.coveRadius,
    length: config.length,
    material: config.material
  };
  
  group.add(coveBase);
  
  // Apply position and rotation
  group.position.copy(config.position);
  group.rotation.copy(config.rotation);
  
  // Add group metadata
  group.userData = {
    type: 'cove-base-trim',
    config: config,
    selectable: true,
    editable: true
  };
  
  return group;
};

export const updateCoveBaseTrim = (group: THREE.Group, newConfig: Partial<CoveBaseTrimConfig>): void => {
  const currentConfig = group.userData.config as CoveBaseTrimConfig;
  const updatedConfig = { ...currentConfig, ...newConfig };
  
  // Remove old mesh
  const oldMesh = group.children[0];
  group.remove(oldMesh);
  if (oldMesh instanceof THREE.Mesh) {
    oldMesh.geometry.dispose();
    if (Array.isArray(oldMesh.material)) {
      oldMesh.material.forEach(material => material.dispose());
    } else {
      oldMesh.material.dispose();
    }
  }
  
  // Create new trim with updated config
  const newTrim = createCoveBaseTrim(updatedConfig);
  const newMesh = newTrim.children[0];
  
  // Add new mesh to existing group
  group.add(newMesh);
  
  // Update group metadata
  group.userData.config = updatedConfig;
};

export const getCoveBaseTrimDimensions = (config: CoveBaseTrimConfig) => {
  return {
    width: config.length,
    height: config.height,
    depth: config.thickness,
    volume: (config.length * config.height * config.thickness) / 1728, // cubic feet
    surfaceArea: (2 * config.length * config.height + 2 * config.length * config.thickness) / 144 // square feet
  };
};

export const defaultCoveBaseTrimConfig: CoveBaseTrimConfig = {
  height: 8,
  thickness: 0.125,
  coveRadius: 0.75,
  length: 48,
  color: 0xffffff,
  material: 'vinyl',
  position: new THREE.Vector3(0, 0, 0),
  rotation: new THREE.Euler(0, 0, 0)
};

// Preset configurations for common cove base trim types
export const coveBaseTrimPresets = {
  standard4inch: {
    ...defaultCoveBaseTrimConfig,
    height: 4,
    thickness: 0.125,
    coveRadius: 0.5
  },
  standard6inch: {
    ...defaultCoveBaseTrimConfig,
    height: 6,
    thickness: 0.125,
    coveRadius: 0.75
  },
  standard8inch: {
    ...defaultCoveBaseTrimConfig,
    height: 8,
    thickness: 0.125,
    coveRadius: 0.75
  },
  heavyDutyRubber: {
    ...defaultCoveBaseTrimConfig,
    height: 8,
    thickness: 0.25,
    coveRadius: 0.75,
    material: 'rubber' as const,
    color: 0x2c2c2c
  },
  aluminumTrim: {
    ...defaultCoveBaseTrimConfig,
    height: 6,
    thickness: 0.125,
    coveRadius: 0.5,
    material: 'aluminum' as const,
    color: 0xc0c0c0
  }
};
