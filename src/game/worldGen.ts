import { BLOCK, BlockType } from './constants';

// Fast 2D Simplex/Perlin-like noise generator
class FastNoise {
  private perm: number[] = [];

  constructor(seed: number) {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates shuffle with seed
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    for (let i = 255; i > 0; i--) {
      s = (s * 16807) % 2147483647;
      const j = Math.floor((s / 2147483647) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    this.perm = p.concat(p);
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise2D(x: number, y: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
    const u = fade(xf);
    const v = fade(yf);

    const aa = this.perm[this.perm[X] + Y];
    const ab = this.perm[this.perm[X] + Y + 1];
    const ba = this.perm[this.perm[X + 1] + Y];
    const bb = this.perm[this.perm[X + 1] + Y + 1];

    const x1 = (1 - u) * this.grad(aa, xf, yf) + u * this.grad(ba, xf - 1, yf);
    const x2 = (1 - u) * this.grad(ab, xf, yf - 1) + u * this.grad(bb, xf - 1, yf - 1);
    return (1 - v) * x1 + v * x2;
  }

  // Multi-octave fractal noise
  public fbm2D(x: number, y: number, octaves = 4): number {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }
    return total / maxValue;
  }
}

export class WorldManager {
  private noise: FastNoise;
  private seed: number;
  public edits: Map<string, number> = new Map();
  // Cache tree locations so they don't recalculate repeatedly
  private treeCache: Map<string, boolean> = new Map();

  constructor(seed = 12345) {
    this.seed = seed;
    this.noise = new FastNoise(seed);
  }

  public setSeed(seed: number) {
    this.seed = seed;
    this.noise = new FastNoise(seed);
    this.edits.clear();
    this.treeCache.clear();
  }

  public getKey(x: number, y: number, z: number): string {
    return `${x},${y},${z}`;
  }

  // Calculate ground height at (x, z)
  public getTerrainHeight(x: number, z: number): number {
    const scale = 0.02;
    const raw = this.noise.fbm2D(x * scale, z * scale, 3);
    // Base height 24, variations between 18 and 38
    const height = Math.floor(26 + raw * 14);
    return Math.max(4, Math.min(44, height));
  }

  // Check if a tree trunk should generate at this (x, z)
  public hasTreeAt(x: number, z: number): boolean {
    const key = `${x},${z}`;
    if (this.treeCache.size > 8000) {
      this.treeCache.clear();
    }

    // Fixed spacing grid check
    if (Math.abs(x) % 6 === 0 && Math.abs(z) % 6 === 0) {
      // Deterministic pseudo hash
      const h = Math.abs(Math.sin(x * 12.9898 + z * 78.233 + this.seed) * 43758.5453);
      const val = h - Math.floor(h);
      const hasTree = val > 0.45;
      this.treeCache.set(key, hasTree);
      return hasTree;
    }
    this.treeCache.set(key, false);
    return false;
  }

  // Base procedural block lookup before edits
  private getBaseBlock(x: number, y: number, z: number): BlockType {
    if (y < 0 || y > 50) return BLOCK.AIR;
    if (y === 0) return BLOCK.BEDROCK;

    const groundY = this.getTerrainHeight(x, z);

    // Tree generation logic
    // Check nearby columns for trees within radius 2
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        const tx = x + dx;
        const tz = z + dz;
        if (this.hasTreeAt(tx, tz)) {
          const tGround = this.getTerrainHeight(tx, tz);
          const trunkHeight = 5;
          const treeBase = tGround + 1;

          // Trunk (dx=0, dz=0)
          if (dx === 0 && dz === 0) {
            if (y >= treeBase && y < treeBase + trunkHeight) {
              return BLOCK.OAK_LOG;
            }
          }

          // Leaves crown
          const relY = y - (treeBase + trunkHeight - 2);
          if (relY >= 0 && relY <= 3) {
            const distSq = dx * dx + dz * dz;
            if (relY <= 1 && distSq <= 5) {
              return BLOCK.OAK_LEAVES;
            } else if (relY === 2 && distSq <= 3) {
              return BLOCK.OAK_LEAVES;
            } else if (relY === 3 && distSq <= 1) {
              return BLOCK.OAK_LEAVES;
            }
          }
        }
      }
    }

    // Above ground
    if (y > groundY) {
      return BLOCK.AIR;
    }

    // Surface layer
    if (y === groundY) {
      // Sandy beach if lower
      if (groundY <= 24) return BLOCK.SAND;
      return BLOCK.GRASS;
    }

    // Subsurface dirt (3 layers below grass)
    if (y >= groundY - 3) {
      if (groundY <= 24) return BLOCK.SAND;
      return BLOCK.DIRT;
    }

    // Underground stone & ores
    // Deterministic ore noise
    const oreHash = Math.abs(Math.sin(x * 91.3 + y * 47.7 + z * 12.9) * 10000) % 100;
    if (y < 10 && oreHash < 1.5) {
      return BLOCK.DIAMOND_ORE;
    } else if (y < 25 && oreHash < 4.0) {
      return BLOCK.IRON_ORE;
    } else if (y < 35 && oreHash < 8.0) {
      return BLOCK.COAL_ORE;
    }

    return BLOCK.STONE;
  }

  // Active block lookup considering player edits & multiplayer
  public getBlock(x: number, y: number, z: number): number {
    const key = this.getKey(x, y, z);
    if (this.edits.has(key)) {
      return this.edits.get(key)!;
    }
    return this.getBaseBlock(x, y, z);
  }

  public setBlock(x: number, y: number, z: number, blockId: number) {
    const key = this.getKey(x, y, z);
    this.edits.set(key, blockId);
  }

  // Check if voxel is solid for player physics & face culling
  public isSolid(x: number, y: number, z: number): boolean {
    const b = this.getBlock(x, y, z);
    return b !== BLOCK.AIR && b !== BLOCK.WATER;
  }

  // Check if voxel is transparent (air, leaves, glass, water)
  public isTransparent(x: number, y: number, z: number): boolean {
    const b = this.getBlock(x, y, z);
    return b === BLOCK.AIR || b === BLOCK.GLASS || b === BLOCK.OAK_LEAVES || b === BLOCK.WATER;
  }
}
