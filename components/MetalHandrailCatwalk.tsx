import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

const MetalHandrailCatwalk = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState({
    length: 120,
    postSpacing: 60,
    handrailHeight: 42,
    midRailHeight: 21,
    toeKickHeight: 4,
    railDiameter: 1.5,
    postDiameter: 2
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Clear any existing content
    if (mountRef.current) {
      mountRef.current.innerHTML = '';
    }

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera
    const camera = new THREE.PerspectiveCamera(75, 800 / 600, 0.1, 1000);
    camera.position.set(6, 4, 8);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(800, 600);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add to DOM
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);

    // Create handrail system
    const createHandrail = () => {
      const handrailGroup = new THREE.Group();
      const scale = 0.02; // Scale factor
      
      // Materials
      const steelMaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
      const galvanizedMaterial = new THREE.MeshLambertMaterial({ color: 0x8A9BA8 });
      
      // Dimensions
      const length = config.length * scale;
      const spacing = config.postSpacing * scale;
      const topHeight = config.handrailHeight * scale;
      const midHeight = config.midRailHeight * scale;
      const toeHeight = config.toeKickHeight * scale;
      const railRadius = (config.railDiameter / 2) * scale;
      const postRadius = (config.postDiameter / 2) * scale;
      
      // Number of posts
      const numPosts = Math.ceil(config.length / config.postSpacing) + 1;
      
      // Create posts
      for (let i = 0; i < numPosts; i++) {
        const postGeometry = new THREE.CylinderGeometry(postRadius, postRadius, topHeight + 0.02, 12);
        const post = new THREE.Mesh(postGeometry, galvanizedMaterial);
        post.position.x = (i * spacing) - (length / 2);
        post.position.y = (topHeight + 0.02) / 2;
        post.castShadow = true;
        handrailGroup.add(post);
        
        // Base plate
        const plateGeometry = new THREE.BoxGeometry(0.12, 0.012, 0.12); // 6"x6"x0.5"
        const plate = new THREE.Mesh(plateGeometry, galvanizedMaterial);
        plate.position.x = (i * spacing) - (length / 2);
        plate.position.y = -0.006;
        plate.castShadow = true;
        handrailGroup.add(plate);
      }
      
      // Top rail
      const topRailGeometry = new THREE.CylinderGeometry(railRadius, railRadius, length, 12);
      const topRail = new THREE.Mesh(topRailGeometry, steelMaterial);
      topRail.rotation.z = Math.PI / 2;
      topRail.position.y = topHeight;
      topRail.castShadow = true;
      handrailGroup.add(topRail);
      
      // Mid rail
      const midRailGeometry = new THREE.CylinderGeometry(railRadius, railRadius, length, 12);
      const midRail = new THREE.Mesh(midRailGeometry, steelMaterial);
      midRail.rotation.z = Math.PI / 2;
      midRail.position.y = midHeight;
      midRail.castShadow = true;
      handrailGroup.add(midRail);
      
      // Toe kick
      const toeGeometry = new THREE.BoxGeometry(length, toeHeight * scale, 0.005); // 1/4" thick
      const toeKick = new THREE.Mesh(toeGeometry, steelMaterial);
      toeKick.position.y = (toeHeight * scale) / 2;
      toeKick.castShadow = true;
      handrailGroup.add(toeKick);
      
      // Catwalk deck (for context)
      const deckGeometry = new THREE.BoxGeometry(length, 0.01, 0.72); // 36" wide
      const deckMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x555555, 
        transparent: true, 
        opacity: 0.6 
      });
      const deck = new THREE.Mesh(deckGeometry, deckMaterial);
      deck.position.y = -0.015;
      deck.position.z = -0.36;
      deck.receiveShadow = true;
      handrailGroup.add(deck);
      
      return handrailGroup;
    };

    // Add handrail to scene
    let currentHandrail = createHandrail();
    scene.add(currentHandrail);

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
      rotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, rotationX));

      // Update camera position
      const radius = 10;
      camera.position.x = radius * Math.cos(rotationX) * Math.cos(rotationY);
      camera.position.y = radius * Math.sin(rotationX) + 2;
      camera.position.z = radius * Math.cos(rotationX) * Math.sin(rotationY);
      camera.lookAt(0, 1, 0);

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    // Add event listeners
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Update function for config changes
    const updateHandrail = () => {
      scene.remove(currentHandrail);
      currentHandrail = createHandrail();
      scene.add(currentHandrail);
    };

    // Store update function globally for config changes
    (window as any).updateHandrailSystem = updateHandrail;

    // Cleanup
    return () => {
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      
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
        <h2 className="text-lg font-bold mb-4 text-gray-800">OSHA Handrail System</h2>
        
        <div className="space-y-4">
          <div className="bg-green-100 p-3 rounded">
            <h3 className="font-semibold text-green-800 mb-2 text-sm">Compliance</h3>
            <ul className="text-xs text-green-700 space-y-1">
              <li>✓ 42" top rail height</li>
              <li>✓ 21" mid-rail height</li>
              <li>✓ 4" toe kick</li>
              <li>✓ Max 5' post spacing</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Length: {config.length}" ({Math.floor(config.length/12)}'-{config.length%12}")
            </label>
            <input
              type="range"
              min="60"
              max="240"
              step="12"
              value={config.length}
              onChange={(e) => setConfig({...config, length: parseInt(e.target.value)})}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Post Spacing</label>
            <select
              value={config.postSpacing}
              onChange={(e) => setConfig({...config, postSpacing: parseInt(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              <option value="48">4' (48")</option>
              <option value="60">5' (60") - Max</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rail Size</label>
            <select
              value={config.railDiameter}
              onChange={(e) => setConfig({...config, railDiameter: parseFloat(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              <option value="1.25">1¼" Schedule 40</option>
              <option value="1.5">1½" Schedule 40</option>
              <option value="2">2" Schedule 40</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Post Size</label>
            <select
              value={config.postDiameter}
              onChange={(e) => setConfig({...config, postDiameter: parseFloat(e.target.value)})}
              className="w-full p-2 border rounded"
            >
              <option value="2">2" Schedule 40</option>
              <option value="2.5">2½" Schedule 40</option>
              <option value="3">3" Schedule 40</option>
            </select>
          </div>

          <div className="bg-gray-100 p-3 rounded text-xs">
            <h3 className="font-medium mb-2">Current System:</h3>
            <p>Posts: {Math.ceil(config.length / config.postSpacing) + 1}</p>
            <p>Material: Galvanized Steel</p>
            <p>Mounting: Welded base plates</p>
          </div>
        </div>
      </div>

      {/* 3D View */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-2">
          <div ref={mountRef} className="border rounded" />
          <p className="text-xs text-gray-600 text-center mt-2">
            Drag to rotate view • Steel gray = rails • Light gray = posts
          </p>
        </div>
      </div>
    </div>
  );
};

export default MetalHandrailCatwalk;
