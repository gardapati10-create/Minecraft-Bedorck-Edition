import * as THREE from 'three';
import { WorldManager } from './worldGen';
import { BLOCK, BLOCK_META, CameraPerspective } from './constants';
import { sounds } from './audio';

export interface RaycastResult {
  hit: boolean;
  blockX: number;
  blockY: number;
  blockZ: number;
  normalX: number;
  normalY: number;
  normalZ: number;
}

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public position: THREE.Vector3 = new THREE.Vector3(24, 35, 24);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public yaw: number = 0;
  public pitch: number = 0;

  public isGrounded: boolean = false;
  public isSprinting: boolean = false;
  public isSneaking: boolean = false;
  public isWalking: boolean = false;

  public health: number = 20; // 10 full hearts (20 HP)
  public hunger: number = 20; // 10 drumsticks (20 points)
  public xpLevel: number = 1;
  public xpProgress: number = 0.35;

  // Perspective mode: F5 cycles between first, third_back, third_front
  public perspective: CameraPerspective = 'first';

  public isDead: boolean = false;
  public deathReason: string = '';
  public hurtOverlayTimer: number = 0;

  public onDeath?: (reason: string) => void;
  public onHurt?: (damage: number) => void;

  private world: WorldManager;
  public handGroup: THREE.Group;
  private handMesh: THREE.Mesh;
  private heldBlockMesh: THREE.Mesh;
  private swingProgress: number = 0;
  public isSwinging: boolean = false;

  private bobTimer: number = 0;
  public viewBobbingEnabled: boolean = true;
  private footstepTimer: number = 0;

  // Hunger timer: every 600s (10 min), loses 1 point (half drumstick)
  private hungerTimer: number = 0;
  private starvationTimer: number = 0;

  // Fall damage tracking
  private lastFallVelocityY: number = 0;

  // Breaking state
  public breakTarget: { x: number; y: number; z: number } | null = null;
  public breakProgress: number = 0;
  public breakStage: number = -1;

  constructor(world: WorldManager) {
    this.world = world;
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.05, 300);

    const groundY = world.getTerrainHeight(24, 24);
    this.position.set(24.5, groundY + 2, 24.5);

    // Hand & held item group for first-person
    this.handGroup = new THREE.Group();

    // 1. Forearm / Hand Mesh
    const handGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);
    const handMat = new THREE.MeshLambertMaterial({ color: '#c48b68' });
    this.handMesh = new THREE.Mesh(handGeo, handMat);
    this.handMesh.position.set(0.35, -0.32, -0.5);
    this.handMesh.rotation.set(-0.2, 0.3, -0.15);
    this.handGroup.add(this.handMesh);

    // 2. 3D Held Block Mesh (appears only when player holds a block!)
    const blockGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    const blockMat = new THREE.MeshLambertMaterial({ color: '#5c8e32' });
    this.heldBlockMesh = new THREE.Mesh(blockGeo, blockMat);
    this.heldBlockMesh.position.set(0, 0.22, -0.05);
    this.heldBlockMesh.rotation.set(0.2, 0.4, 0);
    this.heldBlockMesh.visible = false; // Initially empty!
    this.handMesh.add(this.heldBlockMesh);

    this.camera.add(this.handGroup);
  }

  // Cycle perspective (F5)
  public cyclePerspective(): CameraPerspective {
    if (this.perspective === 'first') {
      this.perspective = 'third_back';
    } else if (this.perspective === 'third_back') {
      this.perspective = 'third_front';
    } else {
      this.perspective = 'first';
    }
    sounds.playPop();
    return this.perspective;
  }

  // When player holds a block, show block. If empty, disappears!
  public updateHeldItem(itemColor: string | null) {
    if (itemColor) {
      this.heldBlockMesh.visible = true;
      (this.heldBlockMesh.material as THREE.MeshLambertMaterial).color.set(itemColor);
    } else {
      this.heldBlockMesh.visible = false;
    }
  }

  public updateSkinTexture(skinTex: THREE.CanvasTexture) {
    (this.handMesh.material as THREE.MeshLambertMaterial).map = skinTex;
    (this.handMesh.material as THREE.MeshLambertMaterial).needsUpdate = true;
  }

  public triggerSwing() {
    this.isSwinging = true;
    this.swingProgress = 0;
  }

  // Deal damage to player with sound and hurt animation
  public takeDamage(amount: number, reason: string = 'Damage') {
    if (this.isDead) return;

    this.health = Math.max(0, this.health - amount);
    this.hurtOverlayTimer = 0.35;
    sounds.playHurt();
    this.onHurt?.(amount);

    if (this.health <= 0) {
      this.isDead = true;
      this.deathReason = reason;
      this.onDeath?.(reason);
    }
  }

  // Eat food from hand
  public eatFood(foodBlockId: number): boolean {
    const meta = BLOCK_META[foodBlockId];
    if (!meta || !meta.isFood) return false;

    // Can only eat if hungry or if golden apple
    if (this.hunger >= 20 && foodBlockId !== BLOCK.GOLDEN_APPLE) return false;

    const restore = meta.hungerRestore || 4;
    this.hunger = Math.min(20, this.hunger + restore);

    if (meta.healRestore) {
      this.health = Math.min(20, this.health + meta.healRestore);
    }

    sounds.playPop();
    return true;
  }

  // Respawn at given spawn point
  public respawn(spawnPos: THREE.Vector3) {
    this.position.copy(spawnPos);
    this.velocity.set(0, 0, 0);
    this.health = 20;
    this.hunger = 20;
    this.isDead = false;
    this.deathReason = '';
    this.hurtOverlayTimer = 0;
  }

  // Fast DDA Voxel Raycast
  public raycastBlock(maxDistance = 5.5): RaycastResult {
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);

    // If third person front, cast from player eyes forward
    let px = this.position.x;
    let py = this.position.y + 1.62;
    let pz = this.position.z;

    if (this.perspective === 'first') {
      px = this.camera.position.x;
      py = this.camera.position.y;
      pz = this.camera.position.z;
    }

    let x = Math.floor(px);
    let y = Math.floor(py);
    let z = Math.floor(pz);

    const stepX = Math.sign(dir.x);
    const stepY = Math.sign(dir.y);
    const stepZ = Math.sign(dir.z);

    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

    const xOffset = stepX > 0 ? 1 - (px - x) : px - x;
    const yOffset = stepY > 0 ? 1 - (py - y) : py - y;
    const zOffset = stepZ > 0 ? 1 - (pz - z) : pz - z;

    let tMaxX = tDeltaX < Infinity ? tDeltaX * xOffset : Infinity;
    let tMaxY = tDeltaY < Infinity ? tDeltaY * yOffset : Infinity;
    let tMaxZ = tDeltaZ < Infinity ? tDeltaZ * zOffset : Infinity;

    let normalX = 0;
    let normalY = 0;
    let normalZ = 0;
    let dist = 0;

    while (dist <= maxDistance) {
      if (tMaxX < tMaxY) {
        if (tMaxX < tMaxZ) {
          x += stepX;
          dist = tMaxX;
          tMaxX += tDeltaX;
          normalX = -stepX;
          normalY = 0;
          normalZ = 0;
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      } else {
        if (tMaxY < tMaxZ) {
          y += stepY;
          dist = tMaxY;
          tMaxY += tDeltaY;
          normalX = 0;
          normalY = -stepY;
          normalZ = 0;
        } else {
          z += stepZ;
          dist = tMaxZ;
          tMaxZ += tDeltaZ;
          normalX = 0;
          normalY = 0;
          normalZ = -stepZ;
        }
      }

      const block = this.world.getBlock(x, y, z);
      if (block !== BLOCK.AIR && block !== BLOCK.WATER) {
        return { hit: true, blockX: x, blockY: y, blockZ: z, normalX, normalY, normalZ };
      }
    }

    return { hit: false, blockX: 0, blockY: 0, blockZ: 0, normalX: 0, normalY: 0, normalZ: 0 };
  }

  // AABB Voxel Collision
  public checkCollision(pos: THREE.Vector3, height = 1.8, width = 0.6): boolean {
    const halfW = width / 2;
    const minX = Math.floor(pos.x - halfW);
    const maxX = Math.floor(pos.x + halfW);
    const minY = Math.floor(pos.y);
    const maxY = Math.floor(pos.y + height);
    const minZ = Math.floor(pos.z - halfW);
    const maxZ = Math.floor(pos.z + halfW);

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        for (let z = minZ; z <= maxZ; z++) {
          const b = this.world.getBlock(x, y, z);
          if (b !== BLOCK.AIR && b !== BLOCK.WATER && b !== BLOCK.TORCH) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // Update loop
  public update(
    dt: number,
    keys: Record<string, boolean>,
    touchMovement: { x: number; y: number } = { x: 0, y: 0 },
    jumpRequested: boolean = false
  ) {
    if (this.isDead) return;

    if (this.hurtOverlayTimer > 0) {
      this.hurtOverlayTimer -= dt;
    }

    // Hunger drain timer: user specifically asked:
    // "saat menunggu 10 menit maka Rasa Lapar nya itu mengkurang setengah maksudku setengah block dalam 1 block dan ketika rasa lapar sudah menghabis maka player akan mati"
    // 10 minutes = 600s -> loses 1 hunger point (half drumstick)
    const drainMultiplier = this.isSprinting ? 2.5 : this.isWalking ? 1.2 : 1.0;
    this.hungerTimer += dt * drainMultiplier;
    if (this.hungerTimer >= 600) {
      this.hungerTimer = 0;
      this.hunger = Math.max(0, this.hunger - 1);
    }

    // Starvation damage when hunger is completely depleted
    if (this.hunger <= 0) {
      this.starvationTimer += dt;
      if (this.starvationTimer >= 2.5) {
        this.starvationTimer = 0;
        this.takeDamage(1, 'Kelaparan');
      }
    } else {
      this.starvationTimer = 0;
    }

    // Input & Speed
    this.isSprinting = !!(keys['ControlLeft'] || keys['KeyR']) && !this.isSneaking && this.hunger > 6;
    this.isSneaking = !!(keys['ShiftLeft'] || keys['KeyC']);

    let targetSpeed = 4.3; // standard walking speed
    if (this.isSprinting) targetSpeed = 6.2;
    if (this.isSneaking) targetSpeed = 1.8;

    const playerHeight = this.isSneaking ? 1.5 : 1.8;
    const eyeHeight = this.isSneaking ? 1.35 : 1.62;

    let moveForward = 0;
    let moveRight = 0;

    if (keys['KeyW'] || keys['ArrowUp']) moveForward += 1;
    if (keys['KeyS'] || keys['ArrowDown']) moveForward -= 1;
    if (keys['KeyA'] || keys['ArrowLeft']) moveRight -= 1;
    if (keys['KeyD'] || keys['ArrowRight']) moveRight += 1;

    // Mobile touch joystick
    moveForward -= touchMovement.y;
    moveRight += touchMovement.x;

    const moveLen = Math.sqrt(moveForward * moveForward + moveRight * moveRight);
    this.isWalking = moveLen > 0.05;

    const wishDir = new THREE.Vector3();
    if (moveLen > 0) {
      const normF = moveForward / moveLen;
      const normR = moveRight / moveLen;

      const sinYaw = Math.sin(this.yaw);
      const cosYaw = Math.cos(this.yaw);

      wishDir.x = -sinYaw * normF + cosYaw * normR;
      wishDir.z = -cosYaw * normF - sinYaw * normR;
      wishDir.multiplyScalar(targetSpeed);
    }

    // Horizontal acceleration & friction
    const friction = this.isGrounded ? 10.0 : 2.0;
    this.velocity.x += (wishDir.x - this.velocity.x) * Math.min(friction * dt, 1);
    this.velocity.z += (wishDir.z - this.velocity.z) * Math.min(friction * dt, 1);

    // Gravity
    const gravity = 26.0;
    this.velocity.y -= gravity * dt;
    this.velocity.y = Math.max(-30, this.velocity.y);

    // Save downward velocity right before collision resolution for fall damage calculation
    this.lastFallVelocityY = this.velocity.y;

    // Jump
    const wantsJump = keys['Space'] || jumpRequested;
    if (wantsJump && this.isGrounded) {
      this.velocity.y = 8.5; // Jump velocity
      this.isGrounded = false;
      sounds.playFootstep('grass');
    }

    // Collision Resolution on 3 separate axes
    // 1. Move Y
    const oldY = this.position.y;
    this.position.y += this.velocity.y * dt;
    if (this.checkCollision(this.position, playerHeight)) {
      if (this.velocity.y < 0) {
        // Fall damage calculation!
        if (this.lastFallVelocityY < -11.5) {
          const fallDamage = Math.floor((-this.lastFallVelocityY - 10) * 1.6);
          if (fallDamage > 0) {
            this.takeDamage(fallDamage, 'Jatuh dari Ketinggian');
          }
        }

        // Landed on ground
        this.position.y = Math.floor(oldY);
        while (this.checkCollision(this.position, playerHeight)) {
          this.position.y += 0.05;
        }
        this.isGrounded = true;
      } else {
        // Hit ceiling
        this.position.y = oldY;
      }
      this.velocity.y = 0;
    } else {
      this.isGrounded = false;
    }

    // 2. Move X
    const oldX = this.position.x;
    this.position.x += this.velocity.x * dt;
    if (this.checkCollision(this.position, playerHeight)) {
      this.position.y += 0.5;
      if (!this.checkCollision(this.position, playerHeight) && this.isGrounded) {
        // Step-up succeeded
      } else {
        this.position.y -= 0.5;
        this.position.x = oldX;
        this.velocity.x = 0;
      }
    }

    // 3. Move Z
    const oldZ = this.position.z;
    this.position.z += this.velocity.z * dt;
    if (this.checkCollision(this.position, playerHeight)) {
      this.position.y += 0.5;
      if (!this.checkCollision(this.position, playerHeight) && this.isGrounded) {
        // Step-up succeeded
      } else {
        this.position.y -= 0.5;
        this.position.z = oldZ;
        this.velocity.z = 0;
      }
    }

    // Void fallback
    if (this.position.y < -10) {
      const g = this.world.getTerrainHeight(24, 24);
      this.position.set(24.5, g + 3, 24.5);
      this.velocity.set(0, 0, 0);
      this.takeDamage(10, 'Jatuh ke Void');
    }

    // Footsteps
    if (this.isWalking && this.isGrounded) {
      this.footstepTimer += dt * (this.isSprinting ? 1.5 : 1.0);
      if (this.footstepTimer > 0.38) {
        this.footstepTimer = 0;
        const groundBlock = this.world.getBlock(
          Math.floor(this.position.x),
          Math.floor(this.position.y - 0.2),
          Math.floor(this.position.z)
        );
        const meta = BLOCK_META[groundBlock];
        sounds.playFootstep(meta ? meta.soundType : 'grass');
      }
    }

    // View Bobbing
    let bobY = 0;
    let bobX = 0;
    if (this.viewBobbingEnabled && this.isWalking && this.isGrounded) {
      this.bobTimer += dt * 12;
      bobY = Math.sin(this.bobTimer) * 0.05;
      bobX = Math.cos(this.bobTimer * 0.5) * 0.03;
    }

    // Position Camera according to F5 Perspective Mode
    if (this.perspective === 'first') {
      this.handGroup.visible = true;
      this.camera.position.set(
        this.position.x + bobX,
        this.position.y + eyeHeight + bobY,
        this.position.z
      );
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.yaw;
      this.camera.rotation.x = this.pitch;
    } else if (this.perspective === 'third_back') {
      this.handGroup.visible = false;
      const camDist = 3.6;
      const camX = this.position.x - Math.sin(this.yaw) * camDist * Math.cos(this.pitch);
      const camY = this.position.y + eyeHeight + Math.sin(this.pitch) * camDist + 0.3;
      const camZ = this.position.z - Math.cos(this.yaw) * camDist * Math.cos(this.pitch);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.position.x, this.position.y + eyeHeight, this.position.z);
    } else {
      // third_front (shows player avatar's face!)
      this.handGroup.visible = false;
      const camDist = 3.2;
      const camX = this.position.x + Math.sin(this.yaw) * camDist;
      const camY = this.position.y + eyeHeight + 0.2;
      const camZ = this.position.z + Math.cos(this.yaw) * camDist;

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(this.position.x, this.position.y + eyeHeight, this.position.z);
    }

    // Hand Animation
    if (this.isSwinging) {
      this.swingProgress += dt * 7;
      if (this.swingProgress >= 1) {
        this.isSwinging = false;
        this.swingProgress = 0;
      }
      const s = Math.sin(this.swingProgress * Math.PI);
      this.handMesh.position.set(0.35 - s * 0.1, -0.32 - s * 0.15, -0.5 - s * 0.1);
      this.handMesh.rotation.set(-0.2 - s * 0.8, 0.3 + s * 0.4, -0.15 - s * 0.5);
    } else {
      this.handMesh.position.set(0.35, -0.32, -0.5);
      this.handMesh.rotation.set(-0.2, 0.3, -0.15);
    }
  }
}
