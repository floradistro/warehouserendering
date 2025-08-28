# Textures

This folder contains texture assets for the 3D warehouse renderer.

## Usage

Place your texture files (`.jpg`, `.png`, `.webp`) in this directory and reference them in your Three.js components like:

```typescript
import { useLoader } from '@react-three/fiber'
import { TextureLoader } from 'three'

// Load texture
const texture = useLoader(TextureLoader, '/textures/your-texture.jpg')

// Apply to material
<meshStandardMaterial map={texture} />
```

## Recommended Formats
- **Diffuse maps**: `.jpg` or `.png`
- **Normal maps**: `.png` 
- **Roughness/Metalness**: `.jpg`
- **Environment maps**: `.hdr` or `.exr`

## File Organization
```
textures/
├── materials/
│   ├── concrete/
│   ├── metal/
│   └── wood/
├── environments/
└── ui/
```

## Performance Tips
- Use power-of-2 dimensions (256x256, 512x512, 1024x1024)
- Compress textures appropriately 
- Consider using WebP format for better compression
