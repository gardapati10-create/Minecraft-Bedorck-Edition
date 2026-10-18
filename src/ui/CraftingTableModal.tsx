import React, { useState } from 'react';
import { BLOCK, BLOCK_META, ItemStack } from '../game/constants';
import { sounds } from '../game/audio';
import { X, Hammer, Sparkles, BookOpen } from 'lucide-react';

interface CraftingTableModalProps {
  hotbar: (ItemStack | null)[];
  inventory: (ItemStack | null)[];
  onUpdateHotbar: (newHotbar: (ItemStack | null)[]) => void;
  onUpdateInventory: (newInventory: (ItemStack | null)[]) => void;
  onClose: () => void;
}

interface RecipeDef {
  name: string;
  resultId: number;
  resultCount: number;
  ingredients: { blockId: number; count: number }[];
  description: string;
}

export const CRAFTING_RECIPES: RecipeDef[] = [
  {
    name: 'Oak Planks',
    resultId: BLOCK.OAK_PLANKS,
    resultCount: 4,
    ingredients: [{ blockId: BLOCK.OAK_LOG, count: 1 }],
    description: '1 Kayu Oak -> 4 Papan Oak',
  },
  {
    name: 'Sticks (Tongkat)',
    resultId: BLOCK.STICK,
    resultCount: 4,
    ingredients: [{ blockId: BLOCK.OAK_PLANKS, count: 2 }],
    description: '2 Papan Oak -> 4 Tongkat',
  },
  {
    name: 'Crafting Table',
    resultId: BLOCK.CRAFTING_TABLE,
    resultCount: 1,
    ingredients: [{ blockId: BLOCK.OAK_PLANKS, count: 4 }],
    description: '4 Papan Oak -> 1 Meja Pembuat',
  },
  {
    name: 'Wooden Pickaxe',
    resultId: BLOCK.WOODEN_PICKAXE,
    resultCount: 1,
    ingredients: [
      { blockId: BLOCK.OAK_PLANKS, count: 3 },
      { blockId: BLOCK.STICK, count: 2 },
    ],
    description: '3 Papan + 2 Tongkat',
  },
  {
    name: 'Stone Pickaxe',
    resultId: BLOCK.STONE_PICKAXE,
    resultCount: 1,
    ingredients: [
      { blockId: BLOCK.COBBLESTONE, count: 3 },
      { blockId: BLOCK.STICK, count: 2 },
    ],
    description: '3 Batu Kasar + 2 Tongkat',
  },
  {
    name: 'Iron Pickaxe',
    resultId: BLOCK.IRON_PICKAXE,
    resultCount: 1,
    ingredients: [
      { blockId: BLOCK.IRON_ORE, count: 3 },
      { blockId: BLOCK.STICK, count: 2 },
    ],
    description: '3 Besi + 2 Tongkat',
  },
  {
    name: 'Diamond Pickaxe',
    resultId: BLOCK.DIAMOND_PICKAXE,
    resultCount: 1,
    ingredients: [
      { blockId: BLOCK.DIAMOND_ORE, count: 3 },
      { blockId: BLOCK.STICK, count: 2 },
    ],
    description: '3 Berlian + 2 Tongkat',
  },
  {
    name: 'Stone Sword',
    resultId: BLOCK.STONE_SWORD,
    resultCount: 1,
    ingredients: [
      { blockId: BLOCK.COBBLESTONE, count: 2 },
      { blockId: BLOCK.STICK, count: 1 },
    ],
    description: '2 Batu Kasar + 1 Tongkat',
  },
  {
    name: 'Furnace (Tungku)',
    resultId: BLOCK.FURNACE,
    resultCount: 1,
    ingredients: [{ blockId: BLOCK.COBBLESTONE, count: 8 }],
    description: '8 Batu Kasar -> 1 Tungku',
  },
  {
    name: 'Chest (Peti)',
    resultId: BLOCK.CHEST,
    resultCount: 1,
    ingredients: [{ blockId: BLOCK.OAK_PLANKS, count: 8 }],
    description: '8 Papan Oak -> 1 Peti',
  },
  {
    name: 'Torches (Obor)',
    resultId: BLOCK.TORCH,
    resultCount: 4,
    ingredients: [
      { blockId: BLOCK.COAL_ORE, count: 1 },
      { blockId: BLOCK.STICK, count: 1 },
    ],
    description: '1 Batubara + 1 Tongkat -> 4 Obor',
  },
  {
    name: 'TNT',
    resultId: BLOCK.TNT,
    resultCount: 1,
    ingredients: [
      { blockId: BLOCK.SAND, count: 4 },
      { blockId: BLOCK.DIRT, count: 4 },
    ],
    description: '4 Pasir + 4 Tanah -> 1 TNT',
  },
  {
    name: 'Bookshelf (Rak Buku)',
    resultId: BLOCK.BOOKSHELF,
    resultCount: 1,
    ingredients: [{ blockId: BLOCK.OAK_PLANKS, count: 6 }],
    description: '6 Papan Oak -> 1 Rak Buku',
  },
  {
    name: 'Golden Apple',
    resultId: BLOCK.GOLDEN_APPLE,
    resultCount: 1,
    ingredients: [
      { blockId: BLOCK.APPLE, count: 1 },
      { blockId: BLOCK.GOLD_ORE, count: 8 },
    ],
    description: '1 Apel + 8 Emas -> 1 Apel Emas',
  },
  {
    name: 'Bread (Roti)',
    resultId: BLOCK.BREAD,
    resultCount: 1,
    ingredients: [{ blockId: BLOCK.GRASS, count: 3 }],
    description: '3 Tanaman Rumput -> 1 Roti',
  },
];

export const CraftingTableModal: React.FC<CraftingTableModalProps> = ({
  hotbar,
  inventory,
  onUpdateHotbar,
  onUpdateInventory,
  onClose,
}) => {
  // 3x3 crafting grid
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>(Array(9).fill(null));

  // Count item availability in player inventory & hotbar
  const countItemTotal = (blockId: number): number => {
    let total = 0;
    for (const item of hotbar) {
      if (item && item.blockId === blockId) total += item.count;
    }
    for (const item of inventory) {
      if (item && item.blockId === blockId) total += item.count;
    }
    return total;
  };

  // Consume items from player inventory & hotbar
  const consumeItems = (ingredients: { blockId: number; count: number }[]): boolean => {
    // Check first if player has enough of all ingredients
    for (const ing of ingredients) {
      if (countItemTotal(ing.blockId) < ing.count) return false;
    }

    const nextHotbar = hotbar.map((item) => (item ? { ...item } : null));
    const nextInv = inventory.map((item) => (item ? { ...item } : null));

    for (const ing of ingredients) {
      let needed = ing.count;

      // Consume from hotbar first
      for (let i = 0; i < nextHotbar.length; i++) {
        const item = nextHotbar[i];
        if (item && item.blockId === ing.blockId) {
          const take = Math.min(item.count, needed);
          item.count -= take;
          needed -= take;
          if (item.count <= 0) nextHotbar[i] = null;
          if (needed <= 0) break;
        }
      }

      // Then consume from inventory
      if (needed > 0) {
        for (let i = 0; i < nextInv.length; i++) {
          const item = nextInv[i];
          if (item && item.blockId === ing.blockId) {
            const take = Math.min(item.count, needed);
            item.count -= take;
            needed -= take;
            if (item.count <= 0) nextInv[i] = null;
            if (needed <= 0) break;
          }
        }
      }
    }

    onUpdateHotbar(nextHotbar);
    onUpdateInventory(nextInv);
    return true;
  };

  // Give crafted item to player
  const giveCraftedItem = (blockId: number, count: number): boolean => {
    const nextHotbar = hotbar.map((item) => (item ? { ...item } : null));
    const nextInv = inventory.map((item) => (item ? { ...item } : null));

    let remaining = count;

    // Try stacking in hotbar
    for (let i = 0; i < 9; i++) {
      const item = nextHotbar[i];
      if (item && item.blockId === blockId && item.count < 64) {
        const space = 64 - item.count;
        const add = Math.min(space, remaining);
        item.count += add;
        remaining -= add;
        if (remaining <= 0) break;
      }
    }

    // Try empty hotbar slot
    if (remaining > 0) {
      for (let i = 0; i < 9; i++) {
        if (!nextHotbar[i]) {
          nextHotbar[i] = { blockId, count: remaining };
          remaining = 0;
          break;
        }
      }
    }

    // Try stacking in inventory
    if (remaining > 0) {
      for (let i = 0; i < nextInv.length; i++) {
        const item = nextInv[i];
        if (item && item.blockId === blockId && item.count < 64) {
          const space = 64 - item.count;
          const add = Math.min(space, remaining);
          item.count += add;
          remaining -= add;
          if (remaining <= 0) break;
        }
      }
    }

    // Try empty inventory slot
    if (remaining > 0) {
      for (let i = 0; i < nextInv.length; i++) {
        if (!nextInv[i]) {
          nextInv[i] = { blockId, count: remaining };
          remaining = 0;
          break;
        }
      }
    }

    onUpdateHotbar(nextHotbar);
    onUpdateInventory(nextInv);
    return remaining === 0;
  };

  // Instant Craft Recipe Button
  const handleCraftRecipe = (recipe: RecipeDef) => {
    if (consumeItems(recipe.ingredients)) {
      giveCraftedItem(recipe.resultId, recipe.resultCount);
      sounds.playPop();
    }
  };

  // Calculate 3x3 manual craft output
  const calculate3x3Output = (): { blockId: number; count: number } | null => {
    const items = craftGrid.filter((b) => b && b.count > 0);
    if (items.length === 0) return null;

    // 1 Log -> 4 Planks
    if (items.length === 1 && items[0]!.blockId === BLOCK.OAK_LOG) {
      return { blockId: BLOCK.OAK_PLANKS, count: 4 };
    }

    // 2 Planks -> 4 Sticks
    if (items.length === 2 && items.every((b) => b!.blockId === BLOCK.OAK_PLANKS)) {
      return { blockId: BLOCK.STICK, count: 4 };
    }

    // 4 Planks -> Crafting Table
    if (items.length === 4 && items.every((b) => b!.blockId === BLOCK.OAK_PLANKS)) {
      return { blockId: BLOCK.CRAFTING_TABLE, count: 1 };
    }

    // 8 Cobblestone -> Furnace
    if (items.length === 8 && items.every((b) => b!.blockId === BLOCK.COBBLESTONE)) {
      return { blockId: BLOCK.FURNACE, count: 1 };
    }

    // 8 Planks -> Chest
    if (items.length === 8 && items.every((b) => b!.blockId === BLOCK.OAK_PLANKS)) {
      return { blockId: BLOCK.CHEST, count: 1 };
    }

    return null;
  };

  const manualOutput = calculate3x3Output();

  const handleTakeManualOutput = () => {
    if (!manualOutput) return;

    giveCraftedItem(manualOutput.blockId, manualOutput.count);
    sounds.playPop();

    // Decrement each slot in craftGrid
    setCraftGrid((prev) =>
      prev.map((item) => {
        if (!item) return null;
        if (item.count <= 1) return null;
        return { ...item, count: item.count - 1 };
      })
    );
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs font-mono p-2">
      <div className="relative w-full max-w-2xl bg-zinc-800 border-4 border-amber-800/90 rounded-sm shadow-2xl p-4 text-white max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 mb-3 border-b-2 border-zinc-700">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-amber-200">
              Crafting Table 3x3 (Meja Pembuat)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-zinc-700 hover:bg-red-700 border border-zinc-500 rounded text-white font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Section: 3x3 Grid + Output + Recipes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: 3x3 Grid & Output */}
          <div className="bg-zinc-900/80 p-3 border-2 border-zinc-700 rounded-sm flex flex-col items-center">
            <div className="text-xs font-bold text-zinc-300 mb-2 flex items-center gap-1.5 self-start">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Grid Pembuat 3x3:</span>
            </div>

            <div className="flex items-center gap-4 my-2">
              {/* 3x3 Grid Slots */}
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-950 p-2 border-2 border-zinc-700 rounded">
                {craftGrid.map((slot, index) => {
                  const meta = slot ? BLOCK_META[slot.blockId] : null;
                  return (
                    <div
                      key={`craft_slot_${index}`}
                      className="w-12 h-12 bg-zinc-800 border-2 border-zinc-600 rounded-xs flex items-center justify-center relative select-none"
                    >
                      {slot && meta ? (
                        <div
                          className="w-7 h-7 border border-black flex items-center justify-center shadow"
                          style={{ backgroundColor: meta.itemColor }}
                        >
                          <span className="text-[10px] font-bold text-white drop-shadow">
                            {slot.count > 1 ? slot.count : ''}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[9px] text-zinc-600 font-bold">{index + 1}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Arrow */}
              <div className="text-xl text-amber-400 font-bold">➔</div>

              {/* Output Slot */}
              <div
                onClick={handleTakeManualOutput}
                className={`w-16 h-16 bg-zinc-950 border-3 ${
                  manualOutput
                    ? 'border-amber-400 cursor-pointer hover:bg-zinc-900 active:scale-95 ring-2 ring-amber-500/50'
                    : 'border-zinc-700 opacity-60'
                } rounded flex flex-col items-center justify-center relative`}
              >
                {manualOutput ? (
                  <>
                    <div
                      className="w-9 h-9 border-2 border-black flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: BLOCK_META[manualOutput.blockId]?.itemColor || '#888' }}
                    />
                    <span className="absolute bottom-1 right-1 text-xs font-black text-amber-300 drop-shadow">
                      {manualOutput.count}
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-zinc-500">Hasil</span>
                )}
              </div>
            </div>

            <div className="text-[11px] text-zinc-400 mt-2 text-center">
              Pilih resep cepat di sebelah kanan untuk membuat item secara otomatis!
            </div>
          </div>

          {/* Right: Recipe Book (Buku Resep) */}
          <div className="bg-zinc-900/80 p-3 border-2 border-zinc-700 rounded-sm flex flex-col max-h-64 overflow-y-auto">
            <div className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5 sticky top-0 bg-zinc-900/90 py-0.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Resep Cepat (Buku Kerajinan):</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {CRAFTING_RECIPES.map((recipe, idx) => {
                const canCraft = recipe.ingredients.every((ing) => countItemTotal(ing.blockId) >= ing.count);
                const resultMeta = BLOCK_META[recipe.resultId];

                return (
                  <button
                    key={`recipe_${idx}`}
                    onClick={() => handleCraftRecipe(recipe)}
                    disabled={!canCraft}
                    className={`flex items-center justify-between p-2 rounded-xs border transition ${
                      canCraft
                        ? 'bg-zinc-800 hover:bg-amber-900/40 border-zinc-600 hover:border-amber-400 text-white cursor-pointer active:scale-98'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 border border-black/80 flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: resultMeta?.itemColor || '#888' }}
                      >
                        {recipe.resultCount > 1 ? recipe.resultCount : ''}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold">{recipe.name}</div>
                        <div className="text-[10px] text-zinc-400">{recipe.description}</div>
                      </div>
                    </div>

                    <div
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        canCraft
                          ? 'bg-emerald-900/80 border-emerald-500 text-emerald-200'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      {canCraft ? 'BUAT' : 'Bahan Kurang'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inventory & Hotbar quick view */}
        <div className="mt-4 pt-3 border-t-2 border-zinc-700">
          <div className="text-xs font-bold text-zinc-400 mb-1.5">Barang di Inventory Anda:</div>
          <div className="grid grid-cols-9 gap-1 bg-zinc-950 p-2 border-2 border-zinc-700 rounded max-h-36 overflow-y-auto">
            {hotbar.concat(inventory).map((item, idx) => {
              const meta = item ? BLOCK_META[item.blockId] : null;
              return (
                <div
                  key={`inv_preview_${idx}`}
                  className="w-10 h-10 bg-zinc-800 border border-zinc-600 rounded-xs flex items-center justify-center relative"
                >
                  {item && meta ? (
                    <>
                      <div
                        className="w-6 h-6 border border-black/70 flex items-center justify-center shadow"
                        style={{ backgroundColor: meta.itemColor }}
                      />
                      <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white drop-shadow">
                        {item.count}
                      </span>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
