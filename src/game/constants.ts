export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 48;
export const CHUNK_SIZE_Z = 16;

export const BLOCK = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  COBBLESTONE: 4,
  OAK_LOG: 5,
  OAK_PLANKS: 6,
  OAK_LEAVES: 7,
  SAND: 8,
  GLASS: 9,
  BRICK: 10,
  COAL_ORE: 11,
  IRON_ORE: 12,
  DIAMOND_ORE: 13,
  BOOKSHELF: 14,
  CRAFTING_TABLE: 15,
  TNT: 16,
  GLOWSTONE: 17,
  BEDROCK: 18,
  WATER: 19,
  FURNACE: 20,
  CHEST: 21,
  OBSIDIAN: 22,
  GOLD_ORE: 23,
  REDSTONE_ORE: 24,
  STONE_BRICKS: 25,
  WHITE_WOOL: 26,
  TORCH: 27,
  EMERALD_ORE: 28,
  LAPIS_ORE: 29,
  SANDSTONE: 30,
  NETHERRACK: 31,
  STICK: 32,
  WOODEN_PICKAXE: 33,
  STONE_PICKAXE: 34,
  IRON_PICKAXE: 35,
  DIAMOND_PICKAXE: 36,
  WOODEN_SWORD: 37,
  STONE_SWORD: 38,
  IRON_SWORD: 39,
  DIAMOND_SWORD: 40,
  APPLE: 41,
  BREAD: 42,
  COOKED_BEEF: 43,
  GOLDEN_APPLE: 44,
  ROTTEN_FLESH: 45,
} as const;

export type BlockType = typeof BLOCK[keyof typeof BLOCK];
export type CameraPerspective = 'first' | 'third_back' | 'third_front';

export interface ItemStack {
  blockId: number;
  count: number;
}

export interface BlockMeta {
  id: number;
  name: string;
  soundType: 'grass' | 'wood' | 'stone' | 'sand' | 'glass';
  transparent: boolean;
  hardness: number; // break time in seconds
  lightEmission?: number;
  itemColor: string;
  isFood?: boolean;
  hungerRestore?: number; // restored hunger units (1 drumstick = 2 units)
  healRestore?: number;
  isTool?: boolean;
  attackBonus?: number;
}

export const BLOCK_META: Record<number, BlockMeta> = {
  [BLOCK.AIR]: { id: 0, name: 'Air', soundType: 'grass', transparent: true, hardness: 0, itemColor: '#00000000' },
  [BLOCK.GRASS]: { id: 1, name: 'Grass Block', soundType: 'grass', transparent: false, hardness: 0.6, itemColor: '#5c8e32' },
  [BLOCK.DIRT]: { id: 2, name: 'Dirt', soundType: 'grass', transparent: false, hardness: 0.5, itemColor: '#866043' },
  [BLOCK.STONE]: { id: 3, name: 'Stone', soundType: 'stone', transparent: false, hardness: 1.5, itemColor: '#7a7a7a' },
  [BLOCK.COBBLESTONE]: { id: 4, name: 'Cobblestone', soundType: 'stone', transparent: false, hardness: 2.0, itemColor: '#636363' },
  [BLOCK.OAK_LOG]: { id: 5, name: 'Oak Log', soundType: 'wood', transparent: false, hardness: 2.0, itemColor: '#6d5432' },
  [BLOCK.OAK_PLANKS]: { id: 6, name: 'Oak Planks', soundType: 'wood', transparent: false, hardness: 1.8, itemColor: '#b8945f' },
  [BLOCK.OAK_LEAVES]: { id: 7, name: 'Oak Leaves', soundType: 'grass', transparent: true, hardness: 0.2, itemColor: '#3d6c1b' },
  [BLOCK.SAND]: { id: 8, name: 'Sand', soundType: 'sand', transparent: false, hardness: 0.5, itemColor: '#dbd3a0' },
  [BLOCK.GLASS]: { id: 9, name: 'Glass', soundType: 'glass', transparent: true, hardness: 0.3, itemColor: '#d6f0f5' },
  [BLOCK.BRICK]: { id: 10, name: 'Bricks', soundType: 'stone', transparent: false, hardness: 2.0, itemColor: '#9c4436' },
  [BLOCK.COAL_ORE]: { id: 11, name: 'Coal Ore', soundType: 'stone', transparent: false, hardness: 3.0, itemColor: '#2b2b2b' },
  [BLOCK.IRON_ORE]: { id: 12, name: 'Iron Ore', soundType: 'stone', transparent: false, hardness: 3.5, itemColor: '#d8af93' },
  [BLOCK.DIAMOND_ORE]: { id: 13, name: 'Diamond Ore', soundType: 'stone', transparent: false, hardness: 4.5, itemColor: '#55ffff' },
  [BLOCK.BOOKSHELF]: { id: 14, name: 'Bookshelf', soundType: 'wood', transparent: false, hardness: 1.5, itemColor: '#8d6d45' },
  [BLOCK.CRAFTING_TABLE]: { id: 15, name: 'Crafting Table', soundType: 'wood', transparent: false, hardness: 2.0, itemColor: '#a07542' },
  [BLOCK.TNT]: { id: 16, name: 'TNT', soundType: 'grass', transparent: false, hardness: 0.1, itemColor: '#db3226' },
  [BLOCK.GLOWSTONE]: { id: 17, name: 'Glowstone', soundType: 'glass', transparent: false, hardness: 0.3, lightEmission: 15, itemColor: '#ffdd55' },
  [BLOCK.BEDROCK]: { id: 18, name: 'Bedrock', soundType: 'stone', transparent: false, hardness: 9999, itemColor: '#222222' },
  [BLOCK.WATER]: { id: 19, name: 'Water', soundType: 'sand', transparent: true, hardness: 9999, itemColor: '#2954a6' },
  [BLOCK.FURNACE]: { id: 20, name: 'Furnace', soundType: 'stone', transparent: false, hardness: 2.5, itemColor: '#6e6e6e' },
  [BLOCK.CHEST]: { id: 21, name: 'Chest', soundType: 'wood', transparent: false, hardness: 2.0, itemColor: '#9c7336' },
  [BLOCK.OBSIDIAN]: { id: 22, name: 'Obsidian', soundType: 'stone', transparent: false, hardness: 12.0, itemColor: '#1d172e' },
  [BLOCK.GOLD_ORE]: { id: 23, name: 'Gold Ore', soundType: 'stone', transparent: false, hardness: 3.0, itemColor: '#fcee58' },
  [BLOCK.REDSTONE_ORE]: { id: 24, name: 'Redstone Ore', soundType: 'stone', transparent: false, hardness: 3.0, lightEmission: 7, itemColor: '#ff2222' },
  [BLOCK.STONE_BRICKS]: { id: 25, name: 'Stone Bricks', soundType: 'stone', transparent: false, hardness: 1.8, itemColor: '#787878' },
  [BLOCK.WHITE_WOOL]: { id: 26, name: 'White Wool', soundType: 'grass', transparent: false, hardness: 0.8, itemColor: '#e8e8e8' },
  [BLOCK.TORCH]: { id: 27, name: 'Torch', soundType: 'wood', transparent: true, hardness: 0.1, lightEmission: 14, itemColor: '#ffaa33' },
  [BLOCK.EMERALD_ORE]: { id: 28, name: 'Emerald Ore', soundType: 'stone', transparent: false, hardness: 3.5, itemColor: '#17dd62' },
  [BLOCK.LAPIS_ORE]: { id: 29, name: 'Lapis Ore', soundType: 'stone', transparent: false, hardness: 3.0, itemColor: '#103bb2' },
  [BLOCK.SANDSTONE]: { id: 30, name: 'Sandstone', soundType: 'stone', transparent: false, hardness: 1.2, itemColor: '#ded59b' },
  [BLOCK.NETHERRACK]: { id: 31, name: 'Netherrack', soundType: 'stone', transparent: false, hardness: 0.6, itemColor: '#7a2222' },
  [BLOCK.STICK]: { id: 32, name: 'Stick', soundType: 'wood', transparent: true, hardness: 0.1, itemColor: '#7d5c36', isTool: true },
  [BLOCK.WOODEN_PICKAXE]: { id: 33, name: 'Wooden Pickaxe', soundType: 'wood', transparent: true, hardness: 0.1, itemColor: '#8a6538', isTool: true, attackBonus: 2 },
  [BLOCK.STONE_PICKAXE]: { id: 34, name: 'Stone Pickaxe', soundType: 'stone', transparent: true, hardness: 0.1, itemColor: '#888888', isTool: true, attackBonus: 3 },
  [BLOCK.IRON_PICKAXE]: { id: 35, name: 'Iron Pickaxe', soundType: 'stone', transparent: true, hardness: 0.1, itemColor: '#e0e0e0', isTool: true, attackBonus: 4 },
  [BLOCK.DIAMOND_PICKAXE]: { id: 36, name: 'Diamond Pickaxe', soundType: 'stone', transparent: true, hardness: 0.1, itemColor: '#4dedf4', isTool: true, attackBonus: 5 },
  [BLOCK.WOODEN_SWORD]: { id: 37, name: 'Wooden Sword', soundType: 'wood', transparent: true, hardness: 0.1, itemColor: '#8a6538', isTool: true, attackBonus: 4 },
  [BLOCK.STONE_SWORD]: { id: 38, name: 'Stone Sword', soundType: 'stone', transparent: true, hardness: 0.1, itemColor: '#888888', isTool: true, attackBonus: 5 },
  [BLOCK.IRON_SWORD]: { id: 39, name: 'Iron Sword', soundType: 'stone', transparent: true, hardness: 0.1, itemColor: '#e0e0e0', isTool: true, attackBonus: 6 },
  [BLOCK.DIAMOND_SWORD]: { id: 40, name: 'Diamond Sword', soundType: 'stone', transparent: true, hardness: 0.1, itemColor: '#4dedf4', isTool: true, attackBonus: 7 },
  [BLOCK.APPLE]: { id: 41, name: 'Apple', soundType: 'grass', transparent: true, hardness: 0.1, itemColor: '#e52c2c', isFood: true, hungerRestore: 4 },
  [BLOCK.BREAD]: { id: 42, name: 'Bread', soundType: 'grass', transparent: true, hardness: 0.1, itemColor: '#9c6f2e', isFood: true, hungerRestore: 5 },
  [BLOCK.COOKED_BEEF]: { id: 43, name: 'Steak', soundType: 'grass', transparent: true, hardness: 0.1, itemColor: '#8b3820', isFood: true, hungerRestore: 8, healRestore: 2 },
  [BLOCK.GOLDEN_APPLE]: { id: 44, name: 'Golden Apple', soundType: 'grass', transparent: true, hardness: 0.1, itemColor: '#ffdd00', isFood: true, hungerRestore: 10, healRestore: 8 },
  [BLOCK.ROTTEN_FLESH]: { id: 45, name: 'Rotten Flesh', soundType: 'grass', transparent: true, hardness: 0.1, itemColor: '#5c4832', isFood: true, hungerRestore: 2 },
};

// Item drop rules
export function getBlockDrop(blockId: number): number {
  switch (blockId) {
    case BLOCK.GRASS:
      return BLOCK.DIRT;
    case BLOCK.STONE:
      return BLOCK.COBBLESTONE;
    case BLOCK.OAK_LEAVES:
      if (Math.random() < 0.1) return BLOCK.APPLE;
      return Math.random() < 0.4 ? BLOCK.OAK_LEAVES : BLOCK.OAK_PLANKS;
    case BLOCK.GLASS:
      return BLOCK.AIR;
    default:
      return blockId;
  }
}

// Initial hotbar is completely EMPTY in survival!
export const DEFAULT_HOTBAR: (ItemStack | null)[] = Array(9).fill(null);

// Initial inventory is completely EMPTY in survival!
export const DEFAULT_INVENTORY: (ItemStack | null)[] = Array(27).fill(null);
