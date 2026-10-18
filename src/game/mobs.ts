import * as THREE from 'three';
import { WorldManager } from './worldGen';
import { BLOCK } from './constants';
import { sounds } from './audio';

export type MobType = 'zombie' | 'creeper' | 'pig' | 'cow';

export interface MobEntity {
  id: string;
  type: MobType;
  mesh: THREE.Group;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  health: number;
  maxHealth: number;
  isGrounded: boolean;
  walkTimer: number;
  attackCooldown: number;
  creeperFuse: number; // 0 to 1.5
  isHissing: boolean;
  hurtFlashTimer: number;
  headMesh?: THREE.Mesh;
  leftLeg?: THREE.Mesh;
  rightLeg?: THREE.Mesh;
  leftArm?: THREE.Mesh;
  rightArm?: THREE.Mesh;
}

export class MobManager {
  private scene: THREE.Scene;
  private world: WorldManager;
  public mobs: MobEntity[] = [];
  private spawnTimer: number = 0;
  private maxMobs: number = 10;

  constructor(scene: THREE.Scene, world: WorldManager) {
    this.scene = scene;
    this.world = world;
  }

  // Spawn initial set of mobs around starting area
  public spawnInitialMobs(playerPos: THREE.Vector3) {
    const types: MobType[] = ['zombie', 'creeper', 'pig', 'cow', 'zombie', 'cow'];
    for (let i = 0; i < types.length; i++) {
      const angle = (i / types.length) * Math.PI * 2;
      const dist = 14 + Math.random() * 12;
      const x = playerPos.x + Math.cos(angle) * dist;
      const z = playerPos.z + Math.sin(angle) * dist;
      this.spawnMob(types[i], x, z);
    }
  }

  public spawnMob(type: MobType, x: number, z: number): MobEntity | null {
    if (this.mobs.length >= this.maxMobs) return null;

    const groundY = this.world.getTerrainHeight(Math.floor(x), Math.floor(z));
    if (groundY <= 0) return null;

    const group = new THREE.Group();
    group.position.set(x, groundY + 1, z);

    let health = 20;
    let headMesh: THREE.Mesh | undefined;
    let leftLeg: THREE.Mesh | undefined;
    let rightLeg: THREE.Mesh | undefined;
    let leftArm: THREE.Mesh | undefined;
    let rightArm: THREE.Mesh | undefined;

    if (type === 'zombie') {
      health = 20;
      // Head
      const headMat = new THREE.MeshLambertMaterial({ color: '#44752c' });
      const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 1.6;
      group.add(headMesh);

      // Torso
      const bodyMat = new THREE.MeshLambertMaterial({ color: '#2b7899' });
      const bodyGeo = new THREE.BoxGeometry(0.5, 0.75, 0.25);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.95;
      group.add(body);

      // Arms (held outstretched forward)
      const armMat = headMat;
      const armGeo = new THREE.BoxGeometry(0.2, 0.7, 0.2);
      leftArm = new THREE.Mesh(armGeo, armMat);
      leftArm.position.set(-0.35, 1.15, -0.3);
      leftArm.rotation.x = -Math.PI / 2;
      group.add(leftArm);

      rightArm = new THREE.Mesh(armGeo, armMat);
      rightArm.position.set(0.35, 1.15, -0.3);
      rightArm.rotation.x = -Math.PI / 2;
      group.add(rightArm);

      // Legs
      const legMat = new THREE.MeshLambertMaterial({ color: '#273468' });
      const legGeo = new THREE.BoxGeometry(0.22, 0.75, 0.22);
      leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.14, 0.38, 0);
      group.add(leftLeg);

      rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.14, 0.38, 0);
      group.add(rightLeg);
    } else if (type === 'creeper') {
      health = 16;
      // Head
      const headMat = new THREE.MeshLambertMaterial({ color: '#4b9438' });
      const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 1.35;
      group.add(headMesh);

      // Torso
      const bodyMat = new THREE.MeshLambertMaterial({ color: '#38782a' });
      const bodyGeo = new THREE.BoxGeometry(0.45, 0.7, 0.28);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.75;
      group.add(body);

      // 4 Legs
      const legMat = new THREE.MeshLambertMaterial({ color: '#2b5c20' });
      const legGeo = new THREE.BoxGeometry(0.18, 0.4, 0.18);

      leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.15, 0.2, 0.12);
      group.add(leftLeg);

      rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.15, 0.2, 0.12);
      group.add(rightLeg);

      const backLeftLeg = new THREE.Mesh(legGeo, legMat);
      backLeftLeg.position.set(-0.15, 0.2, -0.12);
      group.add(backLeftLeg);

      const backRightLeg = new THREE.Mesh(legGeo, legMat);
      backRightLeg.position.set(0.15, 0.2, -0.12);
      group.add(backRightLeg);
    } else if (type === 'cow' || type === 'pig') {
      health = 10;
      const isPig = type === 'pig';
      const bodyColor = isPig ? '#f09bb2' : '#573d26';
      const headColor = isPig ? '#f4aabf' : '#69482d';

      // Body (horizontal)
      const bodyMat = new THREE.MeshLambertMaterial({ color: bodyColor });
      const bodyGeo = new THREE.BoxGeometry(0.65, 0.55, 0.95);
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.y = 0.65;
      group.add(body);

      // Head
      const headMat = new THREE.MeshLambertMaterial({ color: headColor });
      const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
      headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.set(0, 0.85, -0.55);
      group.add(headMesh);

      // 4 Legs
      const legMat = new THREE.MeshLambertMaterial({ color: isPig ? '#df89a1' : '#47321e' });
      const legGeo = new THREE.BoxGeometry(0.18, 0.45, 0.18);

      leftLeg = new THREE.Mesh(legGeo, legMat);
      leftLeg.position.set(-0.2, 0.22, -0.3);
      group.add(leftLeg);

      rightLeg = new THREE.Mesh(legGeo, legMat);
      rightLeg.position.set(0.2, 0.22, -0.3);
      group.add(rightLeg);

      const bl = new THREE.Mesh(legGeo, legMat);
      bl.position.set(-0.2, 0.22, 0.3);
      group.add(bl);

      const br = new THREE.Mesh(legGeo, legMat);
      br.position.set(0.2, 0.22, 0.3);
      group.add(br);
    }

    this.scene.add(group);

    const mob: MobEntity = {
      id: `mob_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      mesh: group,
      position: group.position,
      velocity: new THREE.Vector3(0, 0, 0),
      yaw: Math.random() * Math.PI * 2,
      health,
      maxHealth: health,
      isGrounded: false,
      walkTimer: 0,
      attackCooldown: 0,
      creeperFuse: 0,
      isHissing: false,
      hurtFlashTimer: 0,
      headMesh,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
    };

    this.mobs.push(mob);
    return mob;
  }

  // Update mob AI, physics, animation, and player combat
  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onPlayerHurt: (damage: number, reason: string) => void,
    onExplosion: (x: number, y: number, z: number, radius: number) => void,
    onItemDrop: (x: number, y: number, z: number, blockId: number) => void
  ) {
    // Dynamic periodic mob spawning around player
    this.spawnTimer += dt;
    if (this.spawnTimer > 12) {
      this.spawnTimer = 0;
      if (this.mobs.length < this.maxMobs) {
        const types: MobType[] = ['zombie', 'creeper', 'cow', 'pig'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        const dist = 18 + Math.random() * 10;
        const angle = Math.random() * Math.PI * 2;
        this.spawnMob(chosen, playerPos.x + Math.cos(angle) * dist, playerPos.z + Math.sin(angle) * dist);
      }
    }

    for (let i = this.mobs.length - 1; i >= 0; i--) {
      const mob = this.mobs[i];

      // Red hurt flash cooldown
      if (mob.hurtFlashTimer > 0) {
        mob.hurtFlashTimer -= dt;
      }

      // Attack cooldown
      if (mob.attackCooldown > 0) {
        mob.attackCooldown -= dt;
      }

      const distToPlayer = mob.position.distanceTo(playerPos);

      // Despawn if too far away (> 48 blocks)
      if (distToPlayer > 48) {
        this.removeMob(i);
        continue;
      }

      // Behavior Logic
      let targetSpeed = 0;
      let moveDir = new THREE.Vector3();

      if (mob.type === 'zombie') {
        if (distToPlayer < 18) {
          // Chase player
          const dx = playerPos.x - mob.position.x;
          const dz = playerPos.z - mob.position.z;
          mob.yaw = Math.atan2(dx, dz);
          targetSpeed = 3.2;
          moveDir.set(Math.sin(mob.yaw), 0, Math.cos(mob.yaw));

          // Attack player when in range (< 1.4 blocks)
          if (distToPlayer < 1.4 && mob.attackCooldown <= 0) {
            mob.attackCooldown = 1.2;
            onPlayerHurt(3, 'Zombie');
            // Knockback player slightly
            playerPos.x += moveDir.x * 0.4;
            playerPos.z += moveDir.z * 0.4;
          }
        } else {
          // Idle wander
          mob.walkTimer += dt;
          if (Math.random() < 0.02) mob.yaw += (Math.random() - 0.5) * 2;
          targetSpeed = 1.0;
          moveDir.set(Math.sin(mob.yaw), 0, Math.cos(mob.yaw));
        }
      } else if (mob.type === 'creeper') {
        if (distToPlayer < 16) {
          const dx = playerPos.x - mob.position.x;
          const dz = playerPos.z - mob.position.z;
          mob.yaw = Math.atan2(dx, dz);

          if (distToPlayer < 2.5) {
            // Start swelling / hissing fuse
            targetSpeed = 0;
            mob.isHissing = true;
            mob.creeperFuse += dt;

            // Flash scale
            const scale = 1 + (mob.creeperFuse / 1.5) * 0.35;
            mob.mesh.scale.set(scale, scale, scale);

            if (mob.creeperFuse >= 1.4) {
              // EXPLODE!
              onExplosion(mob.position.x, mob.position.y, mob.position.z, 2.8);
              if (distToPlayer < 4.5) {
                const damage = Math.round((1 - distToPlayer / 4.5) * 16) + 4;
                onPlayerHurt(damage, 'Creeper');
              }
              this.removeMob(i);
              continue;
            }
          } else {
            // Approach player
            mob.isHissing = false;
            mob.creeperFuse = Math.max(0, mob.creeperFuse - dt * 2);
            mob.mesh.scale.set(1, 1, 1);
            targetSpeed = 2.8;
            moveDir.set(Math.sin(mob.yaw), 0, Math.cos(mob.yaw));
          }
        } else {
          // Wander
          targetSpeed = 0.8;
          if (Math.random() < 0.02) mob.yaw += (Math.random() - 0.5) * 2;
          moveDir.set(Math.sin(mob.yaw), 0, Math.cos(mob.yaw));
        }
      } else {
        // Cow or Pig: peaceful wander
        mob.walkTimer += dt;
        if (Math.random() < 0.03) mob.yaw += (Math.random() - 0.5) * 2;
        targetSpeed = 1.2;
        moveDir.set(Math.sin(mob.yaw), 0, Math.cos(mob.yaw));
      }

      // Physics & movement
      const friction = mob.isGrounded ? 8.0 : 2.0;
      mob.velocity.x += (moveDir.x * targetSpeed - mob.velocity.x) * Math.min(friction * dt, 1);
      mob.velocity.z += (moveDir.z * targetSpeed - mob.velocity.z) * Math.min(friction * dt, 1);

      // Gravity
      mob.velocity.y -= 24 * dt;
      mob.velocity.y = Math.max(-25, mob.velocity.y);

      // Move Y
      mob.position.y += mob.velocity.y * dt;
      const groundAtMob = this.world.getTerrainHeight(Math.floor(mob.position.x), Math.floor(mob.position.z));
      if (mob.position.y <= groundAtMob + 1) {
        mob.position.y = groundAtMob + 1;
        mob.velocity.y = 0;
        mob.isGrounded = true;
      } else {
        mob.isGrounded = false;
      }

      // Move X & Z with step up
      mob.position.x += mob.velocity.x * dt;
      mob.position.z += mob.velocity.z * dt;

      // Auto step-up for small 1-block obstacles when walking
      const frontX = Math.floor(mob.position.x + moveDir.x * 0.4);
      const frontZ = Math.floor(mob.position.z + moveDir.z * 0.4);
      const frontHeight = this.world.getTerrainHeight(frontX, frontZ);
      if (frontHeight === groundAtMob + 1 && mob.isGrounded) {
        mob.velocity.y = 7.0; // Hop up step
        mob.isGrounded = false;
      }

      // Update orientation
      mob.mesh.rotation.y = mob.yaw;

      // Walking animation
      if (targetSpeed > 0.1 && (mob.leftLeg || mob.rightLeg)) {
        mob.walkTimer += dt * 6;
        const swing = Math.sin(mob.walkTimer) * 0.4;
        if (mob.leftLeg) mob.leftLeg.rotation.x = swing;
        if (mob.rightLeg) mob.rightLeg.rotation.x = -swing;
      }
    }
  }

  // Check if player ray intersects any mob (combat hitbox)
  public raycastMob(rayOrigin: THREE.Vector3, rayDir: THREE.Vector3, maxDist = 3.8): MobEntity | null {
    let closestMob: MobEntity | null = null;
    let closestDist = maxDist;

    for (const mob of this.mobs) {
      // Approximate bounding sphere around mob position
      const mobCenter = mob.position.clone().add(new THREE.Vector3(0, 0.8, 0));
      const toMob = mobCenter.clone().sub(rayOrigin);
      const projection = toMob.dot(rayDir);

      if (projection > 0 && projection < closestDist) {
        const perpDist = toMob.clone().sub(rayDir.clone().multiplyScalar(projection)).length();
        if (perpDist < 0.85) {
          closestDist = projection;
          closestMob = mob;
        }
      }
    }

    return closestMob;
  }

  // Player attacks mob
  public attackMob(
    mob: MobEntity,
    damage: number,
    knockbackDir: THREE.Vector3,
    onItemDrop: (x: number, y: number, z: number, blockId: number) => void
  ): boolean {
    mob.health -= damage;
    mob.hurtFlashTimer = 0.2;
    sounds.playHurt();

    // Knockback
    mob.velocity.x += knockbackDir.x * 5;
    mob.velocity.z += knockbackDir.z * 5;
    mob.velocity.y = 4.0;

    if (mob.health <= 0) {
      // Mob dies!
      const idx = this.mobs.indexOf(mob);
      if (idx !== -1) {
        // Drop loot items!
        if (mob.type === 'zombie') {
          onItemDrop(mob.position.x, mob.position.y + 0.5, mob.position.z, BLOCK.ROTTEN_FLESH);
          if (Math.random() < 0.3) {
            onItemDrop(mob.position.x, mob.position.y + 0.5, mob.position.z, BLOCK.IRON_ORE);
          }
        } else if (mob.type === 'creeper') {
          onItemDrop(mob.position.x, mob.position.y + 0.5, mob.position.z, BLOCK.TNT);
        } else if (mob.type === 'cow') {
          onItemDrop(mob.position.x, mob.position.y + 0.5, mob.position.z, BLOCK.COOKED_BEEF);
        } else if (mob.type === 'pig') {
          onItemDrop(mob.position.x, mob.position.y + 0.5, mob.position.z, BLOCK.COOKED_BEEF);
        }

        this.removeMob(idx);
      }
      return true; // killed
    }
    return false;
  }

  private removeMob(index: number) {
    if (index >= 0 && index < this.mobs.length) {
      const mob = this.mobs[index];
      this.scene.remove(mob.mesh);
      this.mobs.splice(index, 1);
    }
  }

  public dispose() {
    for (const mob of this.mobs) {
      this.scene.remove(mob.mesh);
    }
    this.mobs = [];
  }
}
