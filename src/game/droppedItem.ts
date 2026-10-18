import * as THREE from 'three';
import { BLOCK_META } from './constants';
import { sounds } from './audio';
import { WorldManager } from './worldGen';

export class DroppedItemManager {
  private scene: THREE.Scene;
  private world: WorldManager;
  private items: {
    id: string;
    mesh: THREE.Mesh;
    blockId: number;
    spawnTime: number;
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    baseY: number;
  }[] = [];

  constructor(scene: THREE.Scene, world: WorldManager) {
    this.scene = scene;
    this.world = world;
  }

  // Spawn a floating dropped block item in the 3D world
  public spawnItem(x: number, y: number, z: number, blockId: number) {
    const meta = BLOCK_META[blockId];
    if (!meta || blockId === 0) return;

    // Mini 3D cube (0.28 scale)
    const geo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
    const mat = new THREE.MeshLambertMaterial({
      color: meta.itemColor,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;

    const startPos = new THREE.Vector3(
      x + 0.5 + (Math.random() - 0.5) * 0.2,
      y + 0.5,
      z + 0.5 + (Math.random() - 0.5) * 0.2
    );
    mesh.position.copy(startPos);
    this.scene.add(mesh);

    this.items.push({
      id: Math.random().toString(36).substring(2, 9),
      mesh,
      blockId,
      spawnTime: performance.now(),
      pos: startPos,
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        2.5,
        (Math.random() - 0.5) * 1.5
      ),
      baseY: y,
    });
  }

  // Update bobbing, rotation, gravity, and player pickup attraction
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onPickup: (blockId: number) => boolean
  ) {
    const now = performance.now();

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      const elapsed = (now - item.spawnTime) / 1000;

      // 1. Rotation & gentle floating bob
      item.mesh.rotation.y += dt * 3.5;
      item.mesh.rotation.x = Math.sin(elapsed * 2) * 0.15;

      // 2. Initial vertical pop and falling to resting ground
      if (item.vel.y !== 0) {
        item.vel.y -= 12 * dt; // gravity
        item.pos.addScaledVector(item.vel, dt);

        // Check ground underneath
        const groundBlock = this.world.getBlock(
          Math.floor(item.pos.x),
          Math.floor(item.pos.y - 0.1),
          Math.floor(item.pos.z)
        );
        if (groundBlock !== 0 && item.vel.y < 0) {
          item.pos.y = Math.floor(item.pos.y) + 0.2;
          item.vel.set(0, 0, 0);
          item.baseY = item.pos.y;
        }
      } else {
        // Floating sine bobbing when settled
        item.mesh.position.y = item.baseY + Math.sin(elapsed * 4) * 0.08;
      }

      item.mesh.position.x = item.pos.x;
      item.mesh.position.z = item.pos.z;

      // 3. Player Pickup Attraction
      const dist = item.mesh.position.distanceTo(playerPos);

      // Magnetic attraction within 2.2 blocks
      if (dist < 2.2 && elapsed > 0.3) {
        const dir = new THREE.Vector3().subVectors(playerPos, item.mesh.position).normalize();
        item.pos.addScaledVector(dir, Math.max(4.0, (2.5 - dist) * 8) * dt);
        item.mesh.position.copy(item.pos);

        // Collected!
        if (dist < 0.75) {
          const accepted = onPickup(item.blockId);
          if (accepted) {
            sounds.playPop();
            this.scene.remove(item.mesh);
            item.mesh.geometry.dispose();
            this.items.splice(i, 1);
            continue;
          }
        }
      }

      // Despawn after 5 minutes
      if (elapsed > 300) {
        this.scene.remove(item.mesh);
        item.mesh.geometry.dispose();
        this.items.splice(i, 1);
      }
    }
  }

  public dispose() {
    for (const item of this.items) {
      this.scene.remove(item.mesh);
      item.mesh.geometry.dispose();
    }
    this.items = [];
  }
}
