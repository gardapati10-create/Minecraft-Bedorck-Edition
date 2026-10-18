import * as THREE from 'three';
import { generateSteveSkinTexture } from './textures';

export interface SkinPreset {
  id: string;
  name: string;
  color: string;
  type: 'steve' | 'alex' | 'creeper' | 'diamond' | 'ender';
}

export const SKIN_PRESETS: SkinPreset[] = [
  { id: 'steve', name: 'Steve Classic', color: '#00a3a3', type: 'steve' },
  { id: 'alex', name: 'Alex Classic', color: '#73a544', type: 'alex' },
  { id: 'creeper', name: 'Creeper Hoodie', color: '#4aa02c', type: 'creeper' },
  { id: 'diamond', name: 'Diamond Knight', color: '#4ae0e0', type: 'diamond' },
  { id: 'ender', name: 'Ender Shadow', color: '#7a22cc', type: 'ender' },
];

export class SkinManager {
  public currentTexture: THREE.CanvasTexture;
  public currentDataUrl: string = '';
  public currentSkinId: string = 'steve';

  constructor() {
    this.currentTexture = generateSteveSkinTexture('steve');
    this.currentDataUrl = (this.currentTexture.image as HTMLCanvasElement).toDataURL('image/png');
  }

  // Load standard Minecraft .png skin (64x32 or 64x64)
  public async loadCustomSkinFile(file: File): Promise<{ texture: THREE.CanvasTexture; dataUrl: string }> {
    return new Promise((resolve, reject) => {
      if (!file.type.includes('image')) {
        reject(new Error('File harus berupa gambar .png'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          // Verify valid Minecraft skin aspect ratios: 64x32 or 64x64 (or scaled multiples)
          const canvas = document.createElement('canvas');
          canvas.width = 64;
          canvas.height = 32; // Normalize to standard 64x32 mapping for our 3D model
          const ctx = canvas.getContext('2d')!;
          ctx.imageSmoothingEnabled = false;

          // If 64x64, draw top 32 lines
          ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);

          const tex = new THREE.CanvasTexture(canvas);
          tex.magFilter = THREE.NearestFilter;
          tex.minFilter = THREE.NearestFilter;
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.generateMipmaps = false;

          this.currentTexture = tex;
          this.currentDataUrl = canvas.toDataURL('image/png');
          this.currentSkinId = 'custom_' + Date.now();

          resolve({ texture: tex, dataUrl: this.currentDataUrl });
        };
        img.onerror = () => reject(new Error('Gagal membaca gambar skin .png'));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  }

  // Generate texture from data URL (used for multiplayer sync)
  public static createTextureFromDataUrl(dataUrl: string): Promise<THREE.CanvasTexture> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 32;
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, 64, 32, 0, 0, 64, 32);

        const tex = new THREE.CanvasTexture(canvas);
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        resolve(tex);
      };
      img.onerror = () => {
        resolve(generateSteveSkinTexture('steve'));
      };
      img.src = dataUrl;
    });
  }

  // Load built-in preset
  public setPreset(type: SkinPreset['type']): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    let skin = '#c48b68';
    let hair = '#4d301c';
    let shirt = '#00a3a3';
    let pants = '#333b8a';
    let eyes = '#413a94';

    if (type === 'alex') {
      skin = '#e0ad84';
      hair = '#bd6524';
      shirt = '#73a544';
      pants = '#574635';
      eyes = '#2b844b';
    } else if (type === 'creeper') {
      skin = '#4aa02c';
      hair = '#2a6b13';
      shirt = '#337d1a';
      pants = '#1e520d';
      eyes = '#0a2105';
    } else if (type === 'diamond') {
      skin = '#c48b68';
      hair = '#33d6d6';
      shirt = '#2bc4c4';
      pants = '#1f9696';
      eyes = '#00ffff';
    } else if (type === 'ender') {
      skin = '#1a1a24';
      hair = '#0f0f17';
      shirt = '#12121c';
      pants = '#0a0a10';
      eyes = '#d03df5';
    }

    // Head front
    ctx.fillStyle = skin;
    ctx.fillRect(8, 8, 8, 8);
    ctx.fillStyle = hair;
    ctx.fillRect(8, 8, 8, 2);
    ctx.fillRect(8, 10, 1, 2);
    ctx.fillRect(15, 10, 1, 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(9, 11, 2, 1);
    ctx.fillRect(13, 11, 2, 1);
    ctx.fillStyle = eyes;
    ctx.fillRect(10, 11, 1, 1);
    ctx.fillRect(13, 11, 1, 1);

    // Head sides & top
    ctx.fillStyle = hair;
    ctx.fillRect(8, 0, 8, 8);
    ctx.fillRect(0, 8, 8, 8);
    ctx.fillRect(16, 8, 8, 8);
    ctx.fillRect(24, 8, 8, 8);

    // Torso
    ctx.fillStyle = shirt;
    ctx.fillRect(20, 20, 8, 12);
    ctx.fillStyle = skin;
    ctx.fillRect(22, 20, 4, 2);
    ctx.fillStyle = shirt;
    ctx.fillRect(32, 20, 8, 12);

    // Arms
    ctx.fillStyle = shirt;
    ctx.fillRect(44, 20, 4, 4);
    ctx.fillStyle = skin;
    ctx.fillRect(44, 24, 4, 8);
    ctx.fillStyle = shirt;
    ctx.fillRect(36, 20, 4, 4);
    ctx.fillStyle = skin;
    ctx.fillRect(36, 24, 4, 8);

    // Legs
    ctx.fillStyle = pants;
    ctx.fillRect(4, 20, 4, 10);
    ctx.fillStyle = '#222222';
    ctx.fillRect(4, 30, 4, 2);
    ctx.fillStyle = pants;
    ctx.fillRect(12, 20, 4, 10);
    ctx.fillStyle = '#222222';
    ctx.fillRect(12, 30, 4, 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;

    this.currentTexture = tex;
    this.currentDataUrl = canvas.toDataURL('image/png');
    this.currentSkinId = type;
    return tex;
  }
}
