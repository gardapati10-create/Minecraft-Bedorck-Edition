import * as THREE from 'three';
import { WorldManager } from './worldGen';
import { TextureAtlas } from './atlas';
import { ChunkMesh } from './voxelChunk';
import { PlayerController } from './playerPhysics';
import { PlayerAvatar } from './characterModel';
import { NetworkManager, RemotePlayer, ChatMessage } from './network';
import {
  BLOCK,
  BLOCK_META,
  CHUNK_SIZE_X,
  CHUNK_SIZE_Z,
  ItemStack,
  getBlockDrop,
  CameraPerspective,
} from './constants';
import { sounds } from './audio';
import { DroppedItemManager } from './droppedItem';
import { ShaderManager, ShaderConfig, DEFAULT_SHADER_CONFIG } from './shaders';
import { SkinManager } from './skinManager';
import { MobManager } from './mobs';

export interface GameEngineOptions {
  container: HTMLDivElement;
  roomId: string;
  playerName: string;
  skinType: 'steve' | 'alex';
  initialHotbar: (ItemStack | null)[];
  initialInventory: (ItemStack | null)[];
  shaderConfig?: Partial<ShaderConfig>;
  onStatsUpdate: (stats: {
    fps: number;
    x: number;
    y: number;
    z: number;
    ping: number;
    playersCount: number;
    health: number;
    hunger: number;
    xpLevel: number;
    xpProgress: number;
    selectedSlot: number;
    perspective: CameraPerspective;
    isHurt: boolean;
    targetedBlockId: number | null;
  }) => void;
  onHotbarChange: (hotbar: (ItemStack | null)[]) => void;
  onInventoryChange: (inventory: (ItemStack | null)[]) => void;
  onChatReceived: (msg: ChatMessage) => void;
  onPointerLockChange: (isLocked: boolean) => void;
  onOpenCraftingTable?: () => void;
  onPlayerDied?: (reason: string) => void;
}

export class GameEngine {
  private container: HTMLDivElement;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  public player: PlayerController;
  public world: WorldManager;
  private atlas: TextureAtlas;
  public network: NetworkManager;
  public shaderManager: ShaderManager;
  public droppedItems: DroppedItemManager;
  public mobManager: MobManager;

  // Infinite Chunks Map: "cx,cz" -> ChunkMesh
  private chunks: Map<string, ChunkMesh> = new Map();
  private chunkBuildQueue: { cx: number; cz: number; key: string; distSq: number }[] = [];
  private chunkMaterial: THREE.MeshLambertMaterial;
  private lastChunkX: number = 999999;
  private lastChunkZ: number = 999999;
  private chunkCheckTimer: number = 0;

  // Local player 3D avatar (visible in 3rd person)
  private localAvatar: PlayerAvatar;

  // Remote players
  private remoteAvatars: Map<string, PlayerAvatar> = new Map();

  // Selection outline & break overlay
  private selectionWireframe: THREE.LineSegments;
  private breakMesh: THREE.Mesh;
  private breakMaterials: THREE.MeshBasicMaterial[] = [];

  // Lighting & Sky
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private sunMesh: THREE.Mesh;
  private moonMesh: THREE.Mesh;
  private cloudsMesh: THREE.Mesh;
  private timeOfDay: number = 6000;

  // Particles
  private particles: {
    mesh: THREE.Mesh;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
  }[] = [];

  // Hotbar & Inventory (Survival: starts completely empty!)
  public hotbar: (ItemStack | null)[];
  public inventory: (ItemStack | null)[];
  public selectedSlot: number = 0;

  // Loop & inputs
  private isRunning: boolean = false;
  private animFrameId: number = 0;
  private clock: THREE.Clock = new THREE.Clock();
  private keys: Record<string, boolean> = {};
  public isPointerLocked: boolean = false;
  public touchMovement = { x: 0, y: 0 };
  public touchJump = false;

  private onStatsUpdate: GameEngineOptions['onStatsUpdate'];
  private onHotbarChange: GameEngineOptions['onHotbarChange'];
  private onInventoryChange: GameEngineOptions['onInventoryChange'];
  private onChatReceived: GameEngineOptions['onChatReceived'];
  private onPointerLockChange: GameEngineOptions['onPointerLockChange'];
  private onOpenCraftingTable?: () => void;
  private onPlayerDied?: (reason: string) => void;

  // FPS
  private frameCount: number = 0;
  private lastFpsTime: number = 0;
  private currentFps: number = 60;

  // Network sync
  private lastNetBroadcast: number = 0;

  // Mouse breaking state
  private isLeftMouseDown: boolean = false;
  private breakTimer: number = 0;
  private targetedBlockId: number | null = null;

  constructor(options: GameEngineOptions) {
    this.container = options.container;
    this.onStatsUpdate = options.onStatsUpdate;
    this.onHotbarChange = options.onHotbarChange;
    this.onInventoryChange = options.onInventoryChange;
    this.onChatReceived = options.onChatReceived;
    this.onPointerLockChange = options.onPointerLockChange;
    this.onOpenCraftingTable = options.onOpenCraftingTable;
    this.onPlayerDied = options.onPlayerDied;

    this.hotbar = [...options.initialHotbar];
    this.inventory = [...options.initialInventory];

    // 1. Scene & World
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#78a7ff');
    this.scene.fog = new THREE.FogExp2('#78a7ff', 0.015);

    this.world = new WorldManager();
    this.atlas = new TextureAtlas();
    this.player = new PlayerController(this.world);
    this.scene.add(this.player.camera);

    // Death callback
    this.player.onDeath = (reason) => {
      this.onPlayerDied?.(reason);
    };

    // 2. Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 3. Materials
    this.chunkMaterial = new THREE.MeshLambertMaterial({
      map: this.atlas.atlasTexture,
      vertexColors: true,
      transparent: true,
      alphaTest: 0.1,
    });

    // 4. Lighting
    this.hemiLight = new THREE.HemisphereLight('#b1e1ff', '#3b5323', 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight('#fff4e0', 1.2);
    this.dirLight.position.set(50, 80, 40);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 180;
    const d = 40;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.scene.add(this.dirLight);

    // 5. Shader & Lighting Manager
    this.shaderManager = new ShaderManager(
      this.renderer,
      this.scene,
      this.dirLight,
      this.hemiLight,
      options.shaderConfig || DEFAULT_SHADER_CONFIG
    );

    // 6. Dropped Items Manager
    this.droppedItems = new DroppedItemManager(this.scene, this.world);

    // 7. Mobs Manager (Zombies, Creepers, Cows, Pigs)
    this.mobManager = new MobManager(this.scene, this.world);
    this.mobManager.spawnInitialMobs(this.player.position);

    // 8. Local 3D Avatar (used when viewing in 3rd person / F5)
    this.localAvatar = new PlayerAvatar('local', options.playerName, options.skinType);
    this.localAvatar.setNameTagVisible(false);
    this.localAvatar.group.visible = false;
    this.scene.add(this.localAvatar.group);

    // 9. Sun & Moon
    const sunGeo = new THREE.PlaneGeometry(16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: '#fffbcf', side: THREE.DoubleSide });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.scene.add(this.sunMesh);

    const moonGeo = new THREE.PlaneGeometry(12, 12);
    const moonMat = new THREE.MeshBasicMaterial({ color: '#d8e4f5', side: THREE.DoubleSide });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // 10. Minecraft Clouds Layer
    const cloudsGeo = new THREE.PlaneGeometry(320, 320);
    const cloudsMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
    this.cloudsMesh.rotation.x = -Math.PI / 2;
    this.cloudsMesh.position.y = 48;
    this.scene.add(this.cloudsMesh);

    // 11. Selection Wireframe
    const boxWireGeo = new THREE.BoxGeometry(1.002, 1.002, 1.002);
    const edgesGeo = new THREE.EdgesGeometry(boxWireGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
    this.selectionWireframe = new THREE.LineSegments(edgesGeo, lineMat);
    this.selectionWireframe.visible = false;
    this.scene.add(this.selectionWireframe);

    // 12. Breaking Overlay Meshes
    const breakGeo = new THREE.BoxGeometry(1.004, 1.004, 1.004);
    for (let i = 0; i < 10; i++) {
      const tex = this.atlas.rawTextures[`destroy_stage_${i}`];
      this.breakMaterials.push(
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          opacity: 0.8,
          depthWrite: false,
        })
      );
    }
    this.breakMesh = new THREE.Mesh(breakGeo, this.breakMaterials[0]);
    this.breakMesh.visible = false;
    this.scene.add(this.breakMesh);

    // 13. Networking
    this.network = new NetworkManager();
    this.setupNetwork(options.roomId, options.playerName, options.skinType);

    // 14. Initial Infinite Chunks Stream
    this.updateInfiniteChunks(true);

    // 15. Event Listeners
    this.bindEvents();

    // Initial held item update
    this.updateHeldBlock();
  }

  private setupNetwork(roomId: string, playerName: string, skinType: 'steve' | 'alex') {
    this.network.connect(roomId, playerName, skinType, {
      onJoinSuccess: (data) => {
        if (data.seed) {
          this.world.setSeed(data.seed);
        }
        if (data.worldEdits) {
          for (const edit of data.worldEdits) {
            this.world.setBlock(edit.x, edit.y, edit.z, edit.block);
          }
        }
        if (data.players) {
          for (const p of data.players) {
            this.spawnRemotePlayer(p);
          }
        }
        this.rebuildAllChunks();
      },
      onPlayerJoined: (p) => {
        this.spawnRemotePlayer(p);
      },
      onPlayerLeft: (id) => {
        this.removeRemotePlayer(id);
      },
      onPlayerUpdate: (data) => {
        const avatar = this.remoteAvatars.get(data.id);
        if (avatar) {
          avatar.targetPos.set(data.x, data.y, data.z);
          avatar.targetYaw = data.yaw;
          avatar.targetPitch = data.pitch;
          avatar.isWalking = data.walking;
          avatar.setSneaking(data.sneaking);
          if (data.swinging) avatar.triggerSwing();
          if (data.heldItem && data.heldItem > 0) {
            const meta = BLOCK_META[data.heldItem];
            avatar.updateHeldItem(meta ? meta.itemColor : null);
          } else {
            avatar.updateHeldItem(null);
          }
        }
      },
      onSkinChange: (data) => {
        const avatar = this.remoteAvatars.get(data.id);
        if (avatar && data.skinData) {
          SkinManager.createTextureFromDataUrl(data.skinData).then((tex) => {
            avatar.updateSkinTexture(tex);
          });
        }
      },
      onBlockEdit: (edit) => {
        this.world.setBlock(edit.x, edit.y, edit.z, edit.block);
        this.rebuildChunkAt(edit.x, edit.z);
        if (edit.block === BLOCK.AIR) {
          sounds.playBlockBreak('grass');
        } else {
          sounds.playBlockPlace('grass');
        }
      },
      onChat: (msg) => {
        this.onChatReceived(msg);
      },
    });
  }

  // Update Player Skin (custom .png or preset)
  public updatePlayerSkin(skinTexture: THREE.CanvasTexture, skinDataUrl?: string) {
    this.player.updateSkinTexture(skinTexture);
    this.localAvatar.updateSkinTexture(skinTexture);
    if (skinDataUrl) {
      this.network.sendSkinChange(skinDataUrl);
    }
  }

  private spawnRemotePlayer(p: RemotePlayer) {
    if (this.remoteAvatars.has(p.id)) return;
    const avatar = new PlayerAvatar(p.id, p.name, p.skinType);
    avatar.group.position.set(p.x, p.y, p.z);
    this.scene.add(avatar.group);
    this.remoteAvatars.set(p.id, avatar);
  }

  private removeRemotePlayer(id: string) {
    const avatar = this.remoteAvatars.get(id);
    if (avatar) {
      this.scene.remove(avatar.group);
      avatar.dispose();
      this.remoteAvatars.delete(id);
    }
  }

  // Dynamic Infinite Chunks streaming around player
  public updateInfiniteChunks(force = false) {
    const playerX = this.player.position.x;
    const playerZ = this.player.position.z;

    const currentChunkX = Math.floor(playerX / CHUNK_SIZE_X);
    const currentChunkZ = Math.floor(playerZ / CHUNK_SIZE_Z);

    if (!force && currentChunkX === this.lastChunkX && currentChunkZ === this.lastChunkZ) {
      return;
    }

    this.lastChunkX = currentChunkX;
    this.lastChunkZ = currentChunkZ;

    const renderDist = this.shaderManager.config.renderDistance || 4;
    const activeKeys = new Set<string>();
    const newTasks: { cx: number; cz: number; key: string; distSq: number }[] = [];

    for (let dx = -renderDist; dx <= renderDist; dx++) {
      for (let dz = -renderDist; dz <= renderDist; dz++) {
        const distSq = dx * dx + dz * dz;
        if (distSq <= (renderDist + 0.5) * (renderDist + 0.5)) {
          const cx = currentChunkX + dx;
          const cz = currentChunkZ + dz;
          const key = `${cx},${cz}`;
          activeKeys.add(key);

          if (!this.chunks.has(key)) {
            newTasks.push({ cx, cz, key, distSq });
          }
        }
      }
    }

    // Sort chunk build queue by distance so nearest chunks build first
    newTasks.sort((a, b) => a.distSq - b.distSq);
    this.chunkBuildQueue = newTasks;

    // Unload distant chunks to guarantee zero lag and constant 60 FPS
    for (const [key, chunk] of this.chunks.entries()) {
      if (!activeKeys.has(key)) {
        this.scene.remove(chunk.mesh);
        chunk.dispose();
        this.chunks.delete(key);
      }
    }
  }

  public rebuildAllChunks() {
    for (const chunk of this.chunks.values()) {
      chunk.rebuild();
    }
  }

  public rebuildChunkAt(wx: number, wz: number) {
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);

    const key = `${cx},${cz}`;
    const chunk = this.chunks.get(key);
    if (chunk) chunk.rebuild();

    const lx = wx - cx * CHUNK_SIZE_X;
    const lz = wz - cz * CHUNK_SIZE_Z;
    if (lx === 0) this.chunks.get(`${cx - 1},${cz}`)?.rebuild();
    if (lx === CHUNK_SIZE_X - 1) this.chunks.get(`${cx + 1},${cz}`)?.rebuild();
    if (lz === 0) this.chunks.get(`${cx},${cz - 1}`)?.rebuild();
    if (lz === CHUNK_SIZE_Z - 1) this.chunks.get(`${cx},${cz + 1}`)?.rebuild();
  }

  public selectHotbarSlot(index: number) {
    if (index >= 0 && index < 9) {
      this.selectedSlot = index;
      this.updateHeldBlock();
      sounds.playPop();
    }
  }

  // When player holds a block, show block in hand. If empty hand, disappears completely!
  public updateHeldBlock() {
    const item = this.hotbar[this.selectedSlot];
    if (item && item.count > 0) {
      const meta = BLOCK_META[item.blockId];
      if (meta) {
        this.player.updateHeldItem(meta.itemColor);
        return;
      }
    }
    this.player.updateHeldItem(null);
  }

  // Collect dropped item into Hotbar or Inventory
  public collectItem(blockId: number): boolean {
    // 1. Try stacking in existing hotbar slot
    for (let i = 0; i < 9; i++) {
      const item = this.hotbar[i];
      if (item && item.blockId === blockId && item.count < 64) {
        item.count += 1;
        this.onHotbarChange([...this.hotbar]);
        this.updateHeldBlock();
        return true;
      }
    }

    // 2. Try first empty hotbar slot
    for (let i = 0; i < 9; i++) {
      if (!this.hotbar[i]) {
        this.hotbar[i] = { blockId, count: 1 };
        this.onHotbarChange([...this.hotbar]);
        this.updateHeldBlock();
        return true;
      }
    }

    // 3. Try stacking in inventory
    for (let i = 0; i < this.inventory.length; i++) {
      const item = this.inventory[i];
      if (item && item.blockId === blockId && item.count < 64) {
        item.count += 1;
        this.onInventoryChange([...this.inventory]);
        return true;
      }
    }

    // 4. Try first empty inventory slot
    for (let i = 0; i < this.inventory.length; i++) {
      if (!this.inventory[i]) {
        this.inventory[i] = { blockId, count: 1 };
        this.onInventoryChange([...this.inventory]);
        return true;
      }
    }

    return false;
  }

  private spawnBreakParticles(x: number, y: number, z: number, blockId: number) {
    const meta = BLOCK_META[blockId];
    const color = meta ? meta.itemColor : '#5c8e32';
    const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
    const mat = new THREE.MeshBasicMaterial({ color });

    for (let i = 0; i < 14; i++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        x + 0.5 + (Math.random() - 0.5) * 0.6,
        y + 0.5 + (Math.random() - 0.5) * 0.6,
        z + 0.5 + (Math.random() - 0.5) * 0.6
      );
      this.scene.add(mesh);

      this.particles.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 4,
          Math.random() * 3 + 1,
          (Math.random() - 0.5) * 4
        ),
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
      });
    }
  }

  // Break targeted block: drops physical item entity for survival pickup!
  private completeBlockBreak(x: number, y: number, z: number) {
    const current = this.world.getBlock(x, y, z);
    if (current === BLOCK.AIR || current === BLOCK.BEDROCK) return;

    this.world.setBlock(x, y, z, BLOCK.AIR);
    this.rebuildChunkAt(x, z);

    const meta = BLOCK_META[current];
    sounds.playBlockBreak(meta ? meta.soundType : 'grass');
    this.spawnBreakParticles(x, y, z, current);

    // Spawn 3D floating dropped item to pick up!
    const dropBlockId = getBlockDrop(current);
    if (dropBlockId !== BLOCK.AIR) {
      this.droppedItems.spawnItem(x, y, z, dropBlockId);
    }

    // Sync block break across multiplayer server
    this.network.sendBlockEdit(x, y, z, BLOCK.AIR);

    this.player.triggerSwing();
    this.breakMesh.visible = false;
    this.breakTimer = 0;
  }

  // Explosion (Creeper or TNT)
  public explodeAt(cx: number, cy: number, cz: number, radius = 2.5) {
    sounds.playBlockBreak('stone');
    const rCeil = Math.ceil(radius);
    for (let x = Math.floor(cx - rCeil); x <= Math.ceil(cx + rCeil); x++) {
      for (let y = Math.floor(cy - rCeil); y <= Math.ceil(cy + rCeil); y++) {
        for (let z = Math.floor(cz - rCeil); z <= Math.ceil(cz + rCeil); z++) {
          const distSq = (x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2;
          if (distSq <= radius ** 2) {
            const current = this.world.getBlock(x, y, z);
            if (current !== BLOCK.AIR && current !== BLOCK.BEDROCK) {
              this.world.setBlock(x, y, z, BLOCK.AIR);
              if (Math.random() < 0.35) {
                this.droppedItems.spawnItem(x, y, z, current);
              }
            }
          }
        }
      }
    }

    this.rebuildChunkAt(cx, cz);
    this.rebuildChunkAt(cx + rCeil, cz);
    this.rebuildChunkAt(cx - rCeil, cz);
    this.rebuildChunkAt(cx, cz + rCeil);
    this.rebuildChunkAt(cx, cz - rCeil);

    // Particle burst
    for (let i = 0; i < 20; i++) {
      const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
      const mat = new THREE.MeshBasicMaterial({ color: Math.random() < 0.5 ? '#ff4400' : '#444444' });
      const pMesh = new THREE.Mesh(geo, mat);
      pMesh.position.set(cx + (Math.random() - 0.5) * 1.5, cy + (Math.random() - 0.5) * 1.5, cz + (Math.random() - 0.5) * 1.5);
      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        velocity: new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6 + 2, (Math.random() - 0.5) * 8),
        life: 0,
        maxLife: 0.8,
      });
    }
  }

  // Attack Mob or Start Block Break
  public handleAttackOrMine() {
    // 1. Check if raycast hits any mob
    const rayDir = new THREE.Vector3();
    this.player.camera.getWorldDirection(rayDir);
    const hitMob = this.mobManager.raycastMob(this.player.camera.position, rayDir, 3.8);

    if (hitMob) {
      this.player.triggerSwing();
      const heldItem = this.hotbar[this.selectedSlot];
      const meta = heldItem ? BLOCK_META[heldItem.blockId] : null;
      const attackDamage = 2 + (meta?.attackBonus || 0);

      this.mobManager.attackMob(
        hitMob,
        attackDamage,
        rayDir,
        (x, y, z, blockId) => this.droppedItems.spawnItem(x, y, z, blockId)
      );
      return;
    }

    // 2. Otherwise start breaking block
    this.isLeftMouseDown = true;
    this.breakTimer = 0;
    this.player.triggerSwing();
  }

  // Stop breaking
  public handleStopAttackOrMine() {
    this.isLeftMouseDown = false;
    this.breakMesh.visible = false;
    this.breakTimer = 0;
  }

  // Eat held food
  public eatSelectedFood(): boolean {
    const heldItem = this.hotbar[this.selectedSlot];
    if (heldItem && heldItem.count > 0) {
      const meta = BLOCK_META[heldItem.blockId];
      if (meta?.isFood) {
        if (this.player.eatFood(heldItem.blockId)) {
          heldItem.count -= 1;
          if (heldItem.count <= 0) {
            this.hotbar[this.selectedSlot] = null;
          }
          this.onHotbarChange([...this.hotbar]);
          this.updateHeldBlock();
          this.player.triggerSwing();
          return true;
        }
      }
    }
    return false;
  }

  // Place block or interact with world (Crafting table, etc.)
  public placeOrInteract() {
    // 1. Check if aiming at Crafting Table
    const ray = this.player.raycastBlock(5.0);
    if (ray.hit) {
      const targetBlock = this.world.getBlock(ray.blockX, ray.blockY, ray.blockZ);
      if (targetBlock === BLOCK.CRAFTING_TABLE) {
        this.exitPointerLock();
        this.onOpenCraftingTable?.();
        return;
      }
    }

    // 2. Check if holding food: Eat food!
    if (this.eatSelectedFood()) {
      return;
    }

    // 3. Otherwise Place block from selected hotbar slot
    this.placeBlock();
  }

  // Place block from selected hotbar slot
  public placeBlock() {
    const currentItem = this.hotbar[this.selectedSlot];
    if (!currentItem || currentItem.count <= 0) {
      return;
    }

    const ray = this.player.raycastBlock();
    if (!ray.hit) return;

    const px = ray.blockX + ray.normalX;
    const py = ray.blockY + ray.normalY;
    const pz = ray.blockZ + ray.normalZ;

    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.player.position.x - 0.28, this.player.position.y, this.player.position.z - 0.28),
      new THREE.Vector3(this.player.position.x + 0.28, this.player.position.y + 1.8, this.player.position.z + 0.28)
    );
    const blockBox = new THREE.Box3(
      new THREE.Vector3(px, py, pz),
      new THREE.Vector3(px + 1, py + 1, pz + 1)
    );
    if (playerBox.intersectsBox(blockBox)) return;

    const blockToPlace = currentItem.blockId;
    this.world.setBlock(px, py, pz, blockToPlace);
    this.rebuildChunkAt(px, pz);

    const meta = BLOCK_META[blockToPlace];
    sounds.playBlockPlace(meta ? meta.soundType : 'grass');

    // Decrement item count in survival
    currentItem.count -= 1;
    if (currentItem.count <= 0) {
      this.hotbar[this.selectedSlot] = null;
    }
    this.onHotbarChange([...this.hotbar]);
    this.updateHeldBlock();

    // Sync to multiplayer server
    this.network.sendBlockEdit(px, py, pz, blockToPlace);

    this.player.triggerSwing();
  }

  // Respawn after death
  public respawn() {
    const groundY = this.world.getTerrainHeight(24, 24);
    this.player.respawn(new THREE.Vector3(24.5, groundY + 2, 24.5));
    this.requestPointerLock();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onWindowResize);

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', this.onMouseDown);
    dom.addEventListener('mouseup', this.onMouseUp);
    dom.addEventListener('contextmenu', (e) => e.preventDefault());
    dom.addEventListener('wheel', this.onWheel);

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement === dom;
      this.onPointerLockChange(this.isPointerLocked);
    });

    document.addEventListener('mousemove', this.onMouseMove);
  }

  public requestPointerLock() {
    this.renderer.domElement.requestPointerLock();
  }

  public exitPointerLock() {
    document.exitPointerLock?.();
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    // F5: Camera Perspective Cycle
    if (e.code === 'F5') {
      e.preventDefault();
      this.player.cyclePerspective();
      return;
    }

    if (e.code.startsWith('Digit')) {
      const num = parseInt(e.code.replace('Digit', ''), 10);
      if (num >= 1 && num <= 9) {
        this.selectHotbarSlot(num - 1);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isPointerLocked) return;
    const sensitivity = 0.0022;
    this.player.yaw -= e.movementX * sensitivity;
    this.player.pitch -= e.movementY * sensitivity;
    const maxPitch = (Math.PI / 2) * 0.98;
    this.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.player.pitch));
  };

  private onMouseDown = (e: MouseEvent) => {
    if (!this.isPointerLocked) {
      this.requestPointerLock();
      return;
    }

    if (e.button === 0) {
      this.handleAttackOrMine();
    } else if (e.button === 2) {
      this.placeOrInteract();
    }
  };

  private onMouseUp = (e: MouseEvent) => {
    if (e.button === 0) {
      this.handleStopAttackOrMine();
    }
  };

  private onWheel = (e: WheelEvent) => {
    if (e.deltaY > 0) {
      this.selectHotbarSlot((this.selectedSlot + 1) % 9);
    } else {
      this.selectHotbarSlot((this.selectedSlot - 1 + 9) % 9);
    }
  };

  private onWindowResize = () => {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.player.camera.aspect = width / height;
    this.player.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  // Main animation tick
  public start() {
    this.isRunning = true;
    this.clock.start();
    this.lastFpsTime = performance.now();

    const loop = () => {
      if (!this.isRunning) return;
      this.animFrameId = requestAnimationFrame(loop);

      const dt = Math.min(this.clock.getDelta(), 0.05);

      // FPS
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsTime >= 500) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsTime));
        this.frameCount = 0;
        this.lastFpsTime = now;
      }

      // Physics update
      this.player.update(dt, this.keys, this.touchMovement, this.touchJump);
      this.touchJump = false;

      // Infinite Chunk Streaming check every 200ms
      this.chunkCheckTimer += dt;
      if (this.chunkCheckTimer > 0.2) {
        this.chunkCheckTimer = 0;
        this.updateInfiniteChunks();
      }

      // Non-blocking chunk processor: build at most 1 chunk per frame for consistent 60fps zero-lag
      if (this.chunkBuildQueue.length > 0) {
        const task = this.chunkBuildQueue.shift()!;
        if (!this.chunks.has(task.key)) {
          const chunk = new ChunkMesh(task.cx, task.cz, this.world, this.atlas, this.chunkMaterial);
          this.scene.add(chunk.mesh);
          this.chunks.set(task.key, chunk);
        }
      }

      // Update Dropped Items & Magnetic Pickup
      this.droppedItems.update(dt, this.player.position, (blockId) => this.collectItem(blockId));

      // Update Mobs (Zombies, Creepers, Cows, Pigs)
      this.mobManager.update(
        dt,
        this.player.position,
        (damage, reason) => this.player.takeDamage(damage, reason),
        (x, y, z, radius) => this.explodeAt(x, y, z, radius),
        (x, y, z, blockId) => this.droppedItems.spawnItem(x, y, z, blockId)
      );

      // Raycast & Selection Wireframe
      const ray = this.player.raycastBlock();
      if (ray.hit) {
        this.targetedBlockId = this.world.getBlock(ray.blockX, ray.blockY, ray.blockZ);
        this.selectionWireframe.position.set(ray.blockX + 0.5, ray.blockY + 0.5, ray.blockZ + 0.5);
        this.selectionWireframe.visible = true;

        if (this.isLeftMouseDown) {
          const current = this.world.getBlock(ray.blockX, ray.blockY, ray.blockZ);
          const meta = BLOCK_META[current];
          const hardness = meta ? meta.hardness : 1.0;

          if (hardness > 500) {
            this.breakMesh.visible = false;
          } else {
            this.breakTimer += dt;
            const progress = Math.min(this.breakTimer / Math.max(hardness * 0.45, 0.2), 1.0);
            const stage = Math.min(Math.floor(progress * 10), 9);

            this.breakMesh.position.set(ray.blockX + 0.5, ray.blockY + 0.5, ray.blockZ + 0.5);
            this.breakMesh.material = this.breakMaterials[stage];
            this.breakMesh.visible = true;

            if (Math.random() < 0.1) {
              sounds.playBlockBreak(meta ? meta.soundType : 'grass');
            }

            if (progress >= 1.0) {
              this.completeBlockBreak(ray.blockX, ray.blockY, ray.blockZ);
            }
          }
        } else {
          this.breakMesh.visible = false;
        }
      } else {
        this.targetedBlockId = null;
        this.selectionWireframe.visible = false;
        this.breakMesh.visible = false;
      }

      // Day/Night Cycle & Sky
      this.timeOfDay = (this.timeOfDay + dt * 20) % 24000;
      const sunAngle = (this.timeOfDay / 24000) * Math.PI * 2 - Math.PI / 2;
      const sunDistance = 140;
      const sunX = Math.cos(sunAngle) * sunDistance;
      const sunY = Math.sin(sunAngle) * sunDistance;

      this.sunMesh.position.set(this.player.position.x + sunX, this.player.position.y + sunY, this.player.position.z);
      this.sunMesh.lookAt(this.player.position);

      this.moonMesh.position.set(this.player.position.x - sunX, this.player.position.y - sunY, this.player.position.z);
      this.moonMesh.lookAt(this.player.position);

      this.cloudsMesh.position.x = this.player.position.x + ((now * 0.003) % 40);
      this.cloudsMesh.position.z = this.player.position.z;

      const isDay = sunY > 0;
      const dayFactor = Math.max(0, Math.min(1, (sunY + 10) / 40));
      const skyR = 0.08 + 0.39 * dayFactor;
      const skyG = 0.12 + 0.54 * dayFactor;
      const skyB = 0.25 + 0.75 * dayFactor;
      const skyColor = new THREE.Color(skyR, skyG, skyB);
      this.scene.background = skyColor;
      if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
        this.scene.fog.color = skyColor;
      }

      this.dirLight.intensity = Math.max(0.12, dayFactor * 1.3);
      this.hemiLight.intensity = Math.max(0.18, dayFactor * 0.7);
      this.dirLight.position.set(
        this.player.position.x + (isDay ? sunX * 0.5 : -sunX * 0.5),
        this.player.position.y + Math.max(sunY * 0.5, 30),
        this.player.position.z + 30
      );

      // Particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life += dt;
        p.velocity.y -= 15 * dt;
        p.mesh.position.addScaledVector(p.velocity, dt);
        p.mesh.rotation.x += dt * 5;
        p.mesh.rotation.y += dt * 5;

        if (p.life >= p.maxLife) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          this.particles.splice(i, 1);
        }
      }

      // Local Avatar update in 3rd person perspective
      if (this.player.perspective === 'first') {
        this.localAvatar.group.visible = false;
      } else {
        this.localAvatar.group.visible = true;
        this.localAvatar.group.position.copy(this.player.position);
        this.localAvatar.targetYaw = this.player.yaw;
        this.localAvatar.targetPitch = this.player.pitch;
        this.localAvatar.isWalking = this.player.isWalking;
        this.localAvatar.isSwinging = this.player.isSwinging;
        this.localAvatar.setSneaking(this.player.isSneaking);
        this.localAvatar.update(dt);

        const curHeld = this.hotbar[this.selectedSlot];
        if (curHeld && curHeld.count > 0) {
          const meta = BLOCK_META[curHeld.blockId];
          this.localAvatar.updateHeldItem(meta ? meta.itemColor : null);
        } else {
          this.localAvatar.updateHeldItem(null);
        }
      }

      // Remote Players
      for (const avatar of this.remoteAvatars.values()) {
        avatar.update(dt);
      }

      // Multiplayer network position broadcast
      if (now - this.lastNetBroadcast > 40) {
        this.lastNetBroadcast = now;
        const curHeld = this.hotbar[this.selectedSlot];
        this.network.broadcastPlayerMove(
          this.player.position,
          this.player.yaw,
          this.player.pitch,
          this.player.isWalking,
          !this.player.isGrounded,
          this.player.isSneaking,
          this.player.isSwinging,
          curHeld ? curHeld.blockId : 0
        );
      }

      // Render
      this.renderer.render(this.scene, this.player.camera);

      // Send HUD updates
      this.onStatsUpdate({
        fps: this.currentFps,
        x: Math.round(this.player.position.x * 10) / 10,
        y: Math.round(this.player.position.y * 10) / 10,
        z: Math.round(this.player.position.z * 10) / 10,
        ping: this.network.ping,
        playersCount: this.remoteAvatars.size + 1,
        health: this.player.health,
        hunger: this.player.hunger,
        xpLevel: this.player.xpLevel,
        xpProgress: this.player.xpProgress,
        selectedSlot: this.selectedSlot,
        perspective: this.player.perspective,
        isHurt: this.player.hurtOverlayTimer > 0,
        targetedBlockId: this.targetedBlockId,
      });
    };

    loop();
  }

  public dispose() {
    this.isRunning = false;
    cancelAnimationFrame(this.animFrameId);

    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onWindowResize);
    document.removeEventListener('mousemove', this.onMouseMove);

    this.network.disconnect();
    this.droppedItems.dispose();
    this.mobManager.dispose();

    for (const chunk of this.chunks.values()) {
      this.scene.remove(chunk.mesh);
      chunk.dispose();
    }
    this.chunks.clear();

    for (const avatar of this.remoteAvatars.values()) {
      this.scene.remove(avatar.group);
      avatar.dispose();
    }
    this.remoteAvatars.clear();

    this.scene.remove(this.localAvatar.group);
    this.localAvatar.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
