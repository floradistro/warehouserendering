import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const CoveBaseTrim = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState({
    height: 8, // inches
    thickness: 0.125, // 1/8" thick
    coveRadius: 0.75, // 3/4" cove radius
    length: 48, // 4 feet standard length
    color: 0xffffff, // white
    material: 'vinyl' // vinyl, rubber, or aluminum
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content
    mountRef.current.innerHTML = '';

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f9fa);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(3, 2, 4);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 8, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Add fill light
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-3, 4, -2);
    scene.add(fillLight);

    // Create cove base trim
    const createCoveBase = () => {
      const group = new THREE.Group();
      const scale = 0.05; // Scale factor for visualization
      
      // Convert dimensions
      const height = config.height * scale;
      const thickness = config.thickness * scale;
      const length = config.length * scale;
      const coveRadius = config.coveRadius * scale;
      
      // Material based on type
      let baseMaterial;
      switch(config.material) {
        case 'vinyl':
          baseMaterial = new THREE.MeshLambertMaterial({ 
            color: config.color
          });
          break;
        case 'rubber':
          baseMaterial = new THREE.MeshLambertMaterial({ 
            color: config.color
          });
          break;
        case 'aluminum':
          baseMaterial = new THREE.MeshLambertMaterial({ 
            color: config.color
          });
          break;
        default:
          baseMaterial = new THREE.MeshLambertMaterial({ 
            color: config.color
          });
      }
      
      // Create the cove base profile using a custom shape
      const createCoveProfile = () => {
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
      const extrudeSettings = {
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
      
      group.add(coveBase);
      
      return group;
    };

    // Add cove base to scene
    let currentCoveBase = createCoveBase();
    scene.add(currentCoveBase);

    // Add wall and floor for context
    const addContext = () => {
      // Floor
      const floorGeometry = new THREE.PlaneGeometry(15, 10);
      const floorMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xe8e8e8,
        side: THREE.DoubleSide
      });
      const floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = -0.01;
      floor.receiveShadow = true;
      scene.add(floor);
      
      // Wall
      const wallGeometry = new THREE.PlaneGeometry(15, 8);
      const wallMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xf5f5f5,
        side: THREE.DoubleSide
      });
      const wall = new THREE.Mesh(wallGeometry, wallMaterial);
      wall.position.y = 2;
      wall.position.z = -0.01;
      wall.receiveShadow = true;
      scene.add(wall);
    };
    
    addContext();

    // Mouse controls
    let isRotating = false;
    let previousMousePosition = { x: 0, y: 0 };
    let rotationY = 0;
    let rotationX = 0;

    const onMouseDown = (event: MouseEvent) => {
      isRotating = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const onMouseUp = () => {
      isRotating = false;
    };

    const onMouseMove = (event: MouseEvent) => {
      if (!isRotating) return;

      const deltaMove = {
        x: event.clientX - previousMousePosition.x,
        y: event.clientY - previousMousePosition.y
      };

      rotationY += deltaMove.x * 0.005;
      rotationX += deltaMove.y * 0.005;

      // Limit vertical rotation
      rotationX = Math.max(-Math.PI/3, Math.min(Math.PI/3, rotationX));

      // Update camera position
      const radius = 8;
      camera.position.x = radius * Math.cos(rotationX) * Math.cos(rotationY);
      camera.position.y = radius * Math.sin(rotationX) + 1;
      camera.position.z = radius * Math.cos(rotationX) * Math.sin(rotationY);
      camera.lookAt(0, 0.5, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    // Zoom with mouse wheel
    const onWheel = (event: WheelEvent) => {
      const zoomSpeed = 0.1;
      const direction = event.deltaY > 0 ? 1 : -1;
      
      camera.position.multiplyScalar(1 + direction * zoomSpeed);
      
      // Limit zoom
      const distance = camera.position.length();
      if (distance < 2) {
        camera.position.normalize().multiplyScalar(2);
      } else if (distance > 20) {
        camera.position.normalize().multiplyScalar(20);
      }
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('wheel', onWheel);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Update function for config changes
    const updateCoveBase = () => {
      scene.remove(currentCoveBase);
      currentCoveBase = createCoveBase();
      scene.add(currentCoveBase);
    };

    // Store update function globally
    (window as any).updateCoveBaseSystem = updateCoveBase;

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('wheel', onWheel);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [config]);

  return (
    <div className="w-full h-screen bg-gray-100 flex">
      {/* Controls */}
      <div className="w-80 bg-white p-4 shadow-lg overflow-y-auto">
        <h2 className="text-lg font-bold mb-4 text-gray-800">8" Cove Base Trim</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-100 p-3 rounded">
            <h3 className="font-semibold text-blue-800 mb-2 text-sm">Specifications</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Height: {config.height}"</li>
              <li>• Thickness: {config.thickness}"</li>
              <li>• Cove radius: {config.coveRadius}"</li>
              <li>• Standard length: {config.length}"</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Height (inches)</label>
            <select
              value={config.height}
              onChange={(e) => setConfig({...config, height: parseFloat(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              <option value="4">4" Standard</option>
              <option value="6">6" Tall</option>
              <option value="8">8" Extra Tall</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Length (inches)</label>
            <input
              type="range"
              min="12"
              max="120"
              step="12"
              value={config.length}
              onChange={(e) => setConfig({...config, length: parseInt(e.target.value)})}
              className="w-full"
            />
            <div className="text-xs text-gray-600 mt-1">
              {config.length}" ({Math.floor(config.length/12)}'-{config.length%12}")
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Material Type</label>
            <select
              value={config.material}
              onChange={(e) => setConfig({...config, material: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="vinyl">Vinyl (Standard)</option>
              <option value="rubber">Rubber (Heavy Duty)</option>
              <option value="aluminum">Aluminum (Metal)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setConfig({...config, color: 0xffffff})}
                className={`w-full h-8 border-2 rounded ${config.color === 0xffffff ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: '#ffffff' }}
                title="White"
              />
              <button
                onClick={() => setConfig({...config, color: 0x2c2c2c})}
                className={`w-full h-8 border-2 rounded ${config.color === 0x2c2c2c ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: '#2c2c2c' }}
                title="Black"
              />
              <button
                onClick={() => setConfig({...config, color: 0x8b4513})}
                className={`w-full h-8 border-2 rounded ${config.color === 0x8b4513 ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: '#8b4513' }}
                title="Brown"
              />
              <button
                onClick={() => setConfig({...config, color: 0x808080})}
                className={`w-full h-8 border-2 rounded ${config.color === 0x808080 ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: '#808080' }}
                title="Gray"
              />
              <button
                onClick={() => setConfig({...config, color: 0xf5f5dc})}
                className={`w-full h-8 border-2 rounded ${config.color === 0xf5f5dc ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: '#f5f5dc' }}
                title="Beige"
              />
              <button
                onClick={() => setConfig({...config, color: 0x000080})}
                className={`w-full h-8 border-2 rounded ${config.color === 0x000080 ? 'border-blue-500' : 'border-gray-300'}`}
                style={{ backgroundColor: '#000080' }}
                title="Navy"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cove Radius: {config.coveRadius}"
            </label>
            <input
              type="range"
              min="0.25"
              max="1.5"
              step="0.25"
              value={config.coveRadius}
              onChange={(e) => setConfig({...config, coveRadius: parseFloat(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Thickness: {config.thickness}"
            </label>
            <select
              value={config.thickness}
              onChange={(e) => setConfig({...config, thickness: parseFloat(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              <option value="0.125">1/8" Standard</option>
              <option value="0.25">1/4" Heavy Duty</option>
            </select>
          </div>

          <div className="bg-gray-100 p-3 rounded text-xs">
            <h3 className="font-medium mb-2">Installation Notes:</h3>
            <ul className="space-y-1">
              <li>• Adheres with contact cement</li>
              <li>• Creates seamless wall-to-floor transition</li>
              <li>• Easy to clean and maintain</li>
              <li>• Protects wall from impacts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 3D View */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div ref={mountRef} className="border rounded" />
          <p className="text-xs text-gray-600 text-center mt-2">
            Drag to rotate • Scroll to zoom • Cove creates smooth wall-to-floor transition
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoveBaseTrim;
