import * as THREE from 'three';
import { generateBlockTextures } from './textures';
import { BLOCK } from './constants';

export interface UVRect {
  uMin: number;
  vMin: number;
  uMax: number;
  vMax: number;
}

export class TextureAtlas {
  public atlasTexture: THREE.CanvasTexture;
  private tileUVs: Map<string, UVRect> = new Map();
  public rawTextures: Record<string, THREE.CanvasTexture>;

  constructor() {
    this.rawTextures = generateBlockTextures();

    // 256x256 canvas = 16x16 grid of 16x16 tiles
    const atlasCanvas = document.createElement('canvas');
    atlasCanvas.width = 256;
    atlasCanvas.height = 256;
    const ctx = atlasCanvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const tileKeys = [
      'grass_top',          // 0
      'grass_side',         // 1
      'dirt',               // 2
      'stone',              // 3
      'cobblestone',        // 4
      'oak_log_side',       // 5
      'oak_log_top',        // 6
      'oak_planks',         // 7
      'oak_leaves',         // 8
      'sand',               // 9
      'glass',              // 10
      'brick',              // 11
      'coal_ore',           // 12
      'iron_ore',           // 13
      'diamond_ore',        // 14
      'bookshelf',          // 15
      'crafting_table_top', // 16
      'crafting_table_side',// 17
      'tnt_side',           // 18
      'tnt_top',            // 19
      'glowstone',          // 20
      'bedrock',            // 21
      'furnace_front',      // 22
      'chest_front',        // 23
      'chest_top',          // 24
      'obsidian',           // 25
      'gold_ore',           // 26
      'redstone_ore',       // 27
      'stone_bricks',       // 28
      'white_wool',         // 29
      'torch',              // 30
      'emerald_ore',        // 31
      'lapis_ore',          // 32
      'sandstone',          // 33
      'netherrack',         // 34
    ];

    tileKeys.forEach((key, index) => {
      const tileX = (index % 16) * 16;
      const tileY = Math.floor(index / 16) * 16;

      const tex = this.rawTextures[key];
      if (tex && tex.image) {
        ctx.drawImage(tex.image as CanvasImageSource, tileX, tileY, 16, 16);
      }

      // Three.js UV origin is bottom-left (v=0 is bottom, v=1 is top)
      const uMin = (tileX + 0.05) / 256;
      const uMax = (tileX + 16 - 0.05) / 256;
      const vMin = (256 - (tileY + 16) + 0.05) / 256;
      const vMax = (256 - tileY - 0.05) / 256;

      this.tileUVs.set(key, { uMin, vMin, uMax, vMax });
    });

    const tex = new THREE.CanvasTexture(atlasCanvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;

    this.atlasTexture = tex;
  }

  // Get UV for a specific block face ('top', 'bottom', 'side')
  public getFaceUV(blockId: number, face: 'top' | 'bottom' | 'side'): UVRect {
    let key = 'dirt';

    switch (blockId) {
      case BLOCK.GRASS:
        key = face === 'top' ? 'grass_top' : face === 'bottom' ? 'dirt' : 'grass_side';
        break;
      case BLOCK.DIRT:
        key = 'dirt';
        break;
      case BLOCK.STONE:
        key = 'stone';
        break;
      case BLOCK.COBBLESTONE:
        key = 'cobblestone';
        break;
      case BLOCK.OAK_LOG:
        key = face === 'top' || face === 'bottom' ? 'oak_log_top' : 'oak_log_side';
        break;
      case BLOCK.OAK_PLANKS:
        key = 'oak_planks';
        break;
      case BLOCK.OAK_LEAVES:
        key = 'oak_leaves';
        break;
      case BLOCK.SAND:
        key = 'sand';
        break;
      case BLOCK.GLASS:
        key = 'glass';
        break;
      case BLOCK.BRICK:
        key = 'brick';
        break;
      case BLOCK.COAL_ORE:
        key = 'coal_ore';
        break;
      case BLOCK.IRON_ORE:
        key = 'iron_ore';
        break;
      case BLOCK.DIAMOND_ORE:
        key = 'diamond_ore';
        break;
      case BLOCK.BOOKSHELF:
        key = face === 'top' || face === 'bottom' ? 'oak_planks' : 'bookshelf';
        break;
      case BLOCK.CRAFTING_TABLE:
        key = face === 'top' ? 'crafting_table_top' : face === 'bottom' ? 'oak_planks' : 'crafting_table_side';
        break;
      case BLOCK.TNT:
        key = face === 'top' || face === 'bottom' ? 'tnt_top' : 'tnt_side';
        break;
      case BLOCK.GLOWSTONE:
        key = 'glowstone';
        break;
      case BLOCK.BEDROCK:
        key = 'bedrock';
        break;
      case BLOCK.FURNACE:
        key = face === 'side' ? 'furnace_front' : 'stone';
        break;
      case BLOCK.CHEST:
        key = face === 'top' ? 'chest_top' : 'chest_front';
        break;
      case BLOCK.OBSIDIAN:
        key = 'obsidian';
        break;
      case BLOCK.GOLD_ORE:
        key = 'gold_ore';
        break;
      case BLOCK.REDSTONE_ORE:
        key = 'redstone_ore';
        break;
      case BLOCK.STONE_BRICKS:
        key = 'stone_bricks';
        break;
      case BLOCK.WHITE_WOOL:
        key = 'white_wool';
        break;
      case BLOCK.TORCH:
        key = 'torch';
        break;
      case BLOCK.EMERALD_ORE:
        key = 'emerald_ore';
        break;
      case BLOCK.LAPIS_ORE:
        key = 'lapis_ore';
        break;
      case BLOCK.SANDSTONE:
        key = 'sandstone';
        break;
      case BLOCK.NETHERRACK:
        key = 'netherrack';
        break;
      default:
        key = 'dirt';
        break;
    }

    return this.tileUVs.get(key) || { uMin: 0, vMin: 0, uMax: 0.0625, vMax: 0.0625 };
  }
}
