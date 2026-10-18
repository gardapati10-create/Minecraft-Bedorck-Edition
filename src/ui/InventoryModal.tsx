import React, { useState } from 'react';
import { BLOCK, BLOCK_META, ItemStack } from '../game/constants';
import { sounds } from '../game/audio';
import { X, Sparkles, Hammer, Info } from 'lucide-react';

interface InventoryModalProps {
  hotbar: (ItemStack | null)[];
  inventory: (ItemStack | null)[];
  selectedSlot: number;
  onUpdateHotbar: (newHotbar: (ItemStack | null)[]) => void;
  onUpdateInventory: (newInventory: (ItemStack | null)[]) => void;
  onClose: () => void;
}

export const InventoryModal: React.FC<InventoryModalProps> = ({
  hotbar,
  inventory,
  selectedSlot,
  onUpdateHotbar,
  onUpdateInventory,
  onClose,
}) => {
  // 2x2 crafting grid: store item or null
  const [craftGrid, setCraftGrid] = useState<(ItemStack | null)[]>([null, null, null, null]);

  // Crafting calculation
  const getCraftOutput = (): { blockId: number; count: number } | null => {
    // 1 Wood -> 4 Planks
    const woodCount = craftGrid.filter((b) => b && b.blockId === BLOCK.OAK_LOG).length;
    const emptyCount = craftGrid.filter((b) => !b).length;
    if (woodCount === 1 && emptyCount === 3) {
      return { blockId: BLOCK.OAK_PLANKS, count: 4 };
    }

    // 4 Planks -> 1 Crafting Table
    const fourPlanks = craftGrid.every((b) => b && b.blockId === BLOCK.OAK_PLANKS);
    if (fourPlanks) {
      return { blockId: BLOCK.CRAFTING_TABLE, count: 1 };
    }

    // 2 Planks vertical -> 4 Sticks / Planks
    const twoPlanks = craftGrid.filter((b) => b && b.blockId === BLOCK.OAK_PLANKS).length === 2;
    if (twoPlanks && emptyCount === 2) {
      return { blockId: BLOCK.BOOKSHELF, count: 1 };
    }

    return null;
  };

  const craftOutput = getCraftOutput();

  // Swap item between inventory and hotbar
  const handleItemClick = (type: 'hotbar' | 'inventory', index: number) => {
    sounds.playPop();
    const sourceList = type === 'hotbar' ? [...hotbar] : [...inventory];
    const targetList = type === 'hotbar' ? [...inventory] : [...hotbar];

    const item = sourceList[index];
    if (!item || item.count <= 0) return;

    // Find first empty slot in target or stack
    let placed = false;
    for (let i = 0; i < targetList.length; i++) {
      if (targetList[i] && targetList[i]!.blockId === item.blockId && targetList[i]!.count < 64) {
        targetList[i]!.count += item.count;
        sourceList[index] = null;
        placed = true;
        break;
      }
    }

    if (!placed) {
      for (let i = 0; i < targetList.length; i++) {
        if (!targetList[i]) {
          targetList[i] = item;
          sourceList[index] = null;
          placed = true;
          break;
        }
      }
    }

    if (placed) {
      if (type === 'hotbar') {
        onUpdateHotbar(sourceList);
        onUpdateInventory(targetList);
      } else {
        onUpdateInventory(sourceList);
        onUpdateHotbar(targetList);
      }
    }
  };

  // Place item into crafting slot
  const handlePutInCraftGrid = (gridIndex: number) => {
    // Find first available wood/plank in hotbar/inventory
    let foundIndex = -1;
    let foundType: 'hotbar' | 'inventory' = 'hotbar';

    for (let i = 0; i < hotbar.length; i++) {
      if (hotbar[i] && (hotbar[i]!.blockId === BLOCK.OAK_LOG || hotbar[i]!.blockId === BLOCK.OAK_PLANKS)) {
        foundIndex = i;
        foundType = 'hotbar';
        break;
      }
    }

    if (foundIndex === -1) {
      for (let i = 0; i < inventory.length; i++) {
        if (inventory[i] && (inventory[i]!.blockId === BLOCK.OAK_LOG || inventory[i]!.blockId === BLOCK.OAK_PLANKS)) {
          foundIndex = i;
          foundType = 'inventory';
          break;
        }
      }
    }

    if (foundIndex !== -1) {
      sounds.playPop();
      const list = foundType === 'hotbar' ? [...hotbar] : [...inventory];
      const source = list[foundIndex]!;
      const newCraft = [...craftGrid];
      newCraft[gridIndex] = { blockId: source.blockId, count: 1 };
      setCraftGrid(newCraft);

      source.count -= 1;
      if (source.count <= 0) list[foundIndex] = null;

      if (foundType === 'hotbar') onUpdateHotbar(list);
      else onUpdateInventory(list);
    }
  };

  const handleCollectCraftResult = () => {
    if (!craftOutput) return;
    sounds.playPop();

    // Consume 1 of each item in craft grid
    const newCraft = craftGrid.map((slot) => {
      if (!slot) return null;
      if (slot.count > 1) return { ...slot, count: slot.count - 1 };
      return null;
    });
    setCraftGrid(newCraft);

    // Add to hotbar or inventory
    const newHotbar = [...hotbar];
    let placed = false;
    for (let i = 0; i < 9; i++) {
      if (!newHotbar[i]) {
        newHotbar[i] = { blockId: craftOutput.blockId, count: craftOutput.count };
        placed = true;
        onUpdateHotbar(newHotbar);
        break;
      }
    }
    if (!placed) {
      const newInv = [...inventory];
      for (let i = 0; i < 27; i++) {
        if (!newInv[i]) {
          newInv[i] = { blockId: craftOutput.blockId, count: craftOutput.count };
          onUpdateInventory(newInv);
          break;
        }
      }
    }
  };

  const totalGathered = hotbar.filter(Boolean).length + inventory.filter(Boolean).length;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono select-none">
      <div className="w-full max-w-xl bg-stone-800 border-4 border-stone-600 p-5 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-stone-600 pb-2">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-extrabold text-white uppercase tracking-wider">
              Survival Crafting & Inventory
            </h2>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-7 h-7 bg-stone-700 hover:bg-stone-600 border border-stone-500 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Survival explanation notice */}
        <div className="bg-stone-900 border border-stone-700 p-2.5 text-xs text-zinc-300 flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Mode Survival Otentik:</span> Inventory Anda mulai dalam keadaan kosong. Hancurkan balok di dunia (kayu, batu, tanah, pasir) lalu dekati balok yang mengapung untuk mengambilnya!
          </div>
        </div>

        {/* 2x2 Crafting & Character Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-900 border-2 border-stone-700 p-3">
          {/* 2x2 Crafting Grid */}
          <div>
            <div className="text-xs font-bold text-zinc-300 uppercase mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Crafting 2x2:
            </div>
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-950 border-2 border-stone-700">
                {craftGrid.map((item, idx) => {
                  const meta = item ? BLOCK_META[item.blockId] : null;
                  return (
                    <button
                      key={`craft_${idx}`}
                      onClick={() => handlePutInCraftGrid(idx)}
                      className="w-10 h-10 bg-stone-800 hover:bg-stone-700 border border-stone-600 flex flex-col items-center justify-center relative cursor-pointer"
                      title="Klik untuk menaruh kayu/plank"
                    >
                      {item && meta ? (
                        <>
                          <div
                            className="w-6 h-6 border border-black shadow"
                            style={{ backgroundColor: meta.itemColor }}
                          />
                          <span className="absolute bottom-0 right-1 text-[9px] font-bold text-white">
                            {item.count}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-zinc-600">+</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-zinc-400 font-bold">➔</div>

              {/* Output Result */}
              <div
                onClick={handleCollectCraftResult}
                className={`w-12 h-12 bg-stone-950 border-2 flex flex-col items-center justify-center relative cursor-pointer ${
                  craftOutput ? 'border-amber-400 bg-amber-950/20 shadow' : 'border-stone-700'
                }`}
                title="Ambil hasil craft"
              >
                {craftOutput && (
                  <>
                    <div
                      className="w-7 h-7 border border-black shadow"
                      style={{ backgroundColor: BLOCK_META[craftOutput.blockId]?.itemColor }}
                    />
                    <span className="absolute bottom-0 right-1 text-[10px] font-bold text-white drop-shadow">
                      {craftOutput.count}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="text-[10px] text-zinc-400 mt-2">
              Resep: 1 Batang Kayu ➔ 4 Planks | 4 Planks ➔ Meja Kerja
            </div>
          </div>

          {/* Player Stats & Inventory count */}
          <div className="flex flex-col justify-between text-xs text-zinc-300">
            <div>
              <div className="font-bold text-emerald-400 mb-1">Status Tas Pemain:</div>
              <div className="text-[11px] text-zinc-400">
                Item Tersimpan: <strong className="text-white">{totalGathered}</strong> / 36 slot
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                Klik balok mana saja untuk memindahkannya antara inventory dan hotbar!
              </p>
            </div>
            <div className="bg-stone-950 p-2 border border-stone-800 text-[10px] text-zinc-400">
              Tips: Pastikan ada balok di hotbar aktif agar bisa dipasang dengan klik kanan.
            </div>
          </div>
        </div>

        {/* 27-Slot Main Inventory Storage */}
        <div>
          <div className="text-xs font-bold text-zinc-300 uppercase mb-1.5 flex justify-between">
            <span>Inventory Penyimpanan (27 Slot):</span>
          </div>
          <div className="grid grid-cols-9 gap-1.5 p-2 bg-stone-900 border-2 border-stone-700 min-h-24">
            {inventory.map((item, idx) => {
              const meta = item ? BLOCK_META[item.blockId] : null;
              return (
                <button
                  key={`inv_${idx}`}
                  onClick={() => handleItemClick('inventory', idx)}
                  className="w-10 h-10 sm:w-11 sm:h-11 bg-stone-800 hover:bg-stone-700 border border-stone-600 flex flex-col items-center justify-center relative cursor-pointer active:scale-95 transition"
                >
                  {item && meta ? (
                    <>
                      <div
                        className="w-6 h-6 border border-black shadow"
                        style={{ backgroundColor: meta.itemColor }}
                      />
                      <span className="absolute bottom-0 right-1 text-[9px] font-bold text-white drop-shadow">
                        {item.count}
                      </span>
                    </>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        {/* 9-Slot Hotbar */}
        <div>
          <div className="text-xs font-bold text-zinc-300 uppercase mb-1 flex justify-between">
            <span>Hotbar Aktif (9 Slot):</span>
            <span className="text-emerald-400 text-[10px]">Slot Aktif: #{selectedSlot + 1}</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 bg-stone-900 border-2 border-stone-700">
            {hotbar.map((item, idx) => {
              const meta = item ? BLOCK_META[item.blockId] : null;
              const isSelected = selectedSlot === idx;
              return (
                <button
                  key={`inv_hotbar_${idx}`}
                  onClick={() => handleItemClick('hotbar', idx)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 flex flex-col items-center justify-center relative border-2 cursor-pointer transition ${
                    isSelected
                      ? 'border-emerald-400 bg-stone-700 ring-2 ring-emerald-500'
                      : 'border-stone-600 bg-stone-800 hover:bg-stone-700'
                  }`}
                >
                  {item && meta ? (
                    <>
                      <div
                        className="w-6 h-6 border border-black shadow"
                        style={{ backgroundColor: meta.itemColor }}
                      />
                      <span className="absolute bottom-0 right-1 text-[9px] font-bold text-white drop-shadow">
                        {item.count}
                      </span>
                    </>
                  ) : null}
                  <span className="absolute top-0.5 left-1 text-[8px] font-bold text-zinc-500">
                    {idx + 1}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
