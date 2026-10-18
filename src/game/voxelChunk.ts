import * as THREE from 'three';
import { WorldManager } from './worldGen';
import { TextureAtlas, UVRect } from './atlas';
import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, BLOCK } from './constants';

export class ChunkMesh {
  public mesh: THREE.Mesh;
  public chunkX: number;
  public chunkZ: number;
  private geometry: THREE.BufferGeometry;
  private material: THREE.MeshLambertMaterial;
  private world: WorldManager;
  private atlas: TextureAtlas;

  constructor(chunkX: number, chunkZ: number, world: WorldManager, atlas: TextureAtlas, material: THREE.MeshLambertMaterial) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.world = world;
    this.atlas = atlas;
    this.material = material;

    this.geometry = new THREE.BufferGeometry();
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.rebuild();
  }

  // Re-generate geometry with face culling
  public rebuild() {
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];
    const colors: number[] = [];

    const startX = this.chunkX * CHUNK_SIZE_X;
    const startZ = this.chunkZ * CHUNK_SIZE_Z;

    const addQuad = (
      p0: [number, number, number],
      p1: [number, number, number],
      p2: [number, number, number],
      p3: [number, number, number],
      norm: [number, number, number],
      uvRect: UVRect,
      shade: number
    ) => {
      // 2 triangles: p0-p1-p2 and p0-p2-p3
      positions.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
      for (let i = 0; i < 6; i++) {
        normals.push(...norm);
        colors.push(shade, shade, shade);
      }
      // UVs
      uvs.push(
        uvRect.uMin, uvRect.vMax,
        uvRect.uMin, uvRect.vMin,
        uvRect.uMax, uvRect.vMin,
        uvRect.uMin, uvRect.vMax,
        uvRect.uMax, uvRect.vMin,
        uvRect.uMax, uvRect.vMax
      );
    };

    for (let lx = 0; lx < CHUNK_SIZE_X; lx++) {
      const wx = startX + lx;
      for (let lz = 0; lz < CHUNK_SIZE_Z; lz++) {
        const wz = startZ + lz;
        for (let wy = 0; wy < CHUNK_SIZE_Y; wy++) {
          const block = this.world.getBlock(wx, wy, wz);
          if (block === BLOCK.AIR) continue;

          const isTranslucent = block === BLOCK.GLASS || block === BLOCK.OAK_LEAVES;

          // Helper to check neighbor visibility
          const shouldRenderFace = (nx: number, ny: number, nz: number) => {
            if (ny < 0 || ny >= CHUNK_SIZE_Y) return ny >= CHUNK_SIZE_Y;
            const nBlock = this.world.getBlock(nx, ny, nz);
            if (nBlock === BLOCK.AIR) return true;
            if (isTranslucent) {
              return nBlock !== block; // don't render face between same transparent blocks
            }
            return nBlock === BLOCK.GLASS || nBlock === BLOCK.OAK_LEAVES;
          };

          const x0 = wx, x1 = wx + 1;
          const y0 = wy, y1 = wy + 1;
          const z0 = wz, z1 = wz + 1;

          // 1. TOP FACE (+Y) - full brightness (1.0)
          if (shouldRenderFace(wx, wy + 1, wz)) {
            const uv = this.atlas.getFaceUV(block, 'top');
            addQuad(
              [x0, y1, z0],
              [x0, y1, z1],
              [x1, y1, z1],
              [x1, y1, z0],
              [0, 1, 0],
              uv,
              1.0
            );
          }

          // 2. BOTTOM FACE (-Y) - darker ambient shadow (0.55)
          if (shouldRenderFace(wx, wy - 1, wz)) {
            const uv = this.atlas.getFaceUV(block, 'bottom');
            addQuad(
              [x0, y0, z1],
              [x0, y0, z0],
              [x1, y0, z0],
              [x1, y0, z1],
              [0, -1, 0],
              uv,
              0.55
            );
          }

          // 3. FRONT FACE (+Z) - directional shade (0.8)
          if (shouldRenderFace(wx, wy, wz + 1)) {
            const uv = this.atlas.getFaceUV(block, 'side');
            addQuad(
              [x0, y1, z1],
              [x0, y0, z1],
              [x1, y0, z1],
              [x1, y1, z1],
              [0, 0, 1],
              uv,
              0.8
            );
          }

          // 4. BACK FACE (-Z) - directional shade (0.8)
          if (shouldRenderFace(wx, wy, wz - 1)) {
            const uv = this.atlas.getFaceUV(block, 'side');
            addQuad(
              [x1, y1, z0],
              [x1, y0, z0],
              [x0, y0, z0],
              [x0, y1, z0],
              [0, 0, -1],
              uv,
              0.8
            );
          }

          // 5. RIGHT FACE (+X) - directional shade (0.7)
          if (shouldRenderFace(wx + 1, wy, wz)) {
            const uv = this.atlas.getFaceUV(block, 'side');
            addQuad(
              [x1, y1, z1],
              [x1, y0, z1],
              [x1, y0, z0],
              [x1, y1, z0],
              [1, 0, 0],
              uv,
              0.7
            );
          }

          // 6. LEFT FACE (-X) - directional shade (0.7)
          if (shouldRenderFace(wx - 1, wy, wz)) {
            const uv = this.atlas.getFaceUV(block, 'side');
            addQuad(
              [x0, y1, z0],
              [x0, y0, z0],
              [x0, y0, z1],
              [x0, y1, z1],
              [-1, 0, 0],
              uv,
              0.7
            );
          }
        }
      }
    }

    this.geometry.dispose();
    this.geometry = new THREE.BufferGeometry();

    if (positions.length > 0) {
      this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      this.geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      this.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      this.geometry.computeBoundingBox();
      this.geometry.computeBoundingSphere();
    }

    this.mesh.geometry = this.geometry;
  }

  public dispose() {
    this.geometry.dispose();
  }
}
