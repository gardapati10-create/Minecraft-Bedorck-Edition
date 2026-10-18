import React, { useState } from 'react';
import { BLOCK, BLOCK_META, ItemStack } from '../game/constants';
import { ChatMessage } from '../game/network';
import {
  MessageSquare,
  Users,
  Wifi,
  Copy,
  Check,
  Sparkles,
  User,
  Eye,
  Utensils,
  Hammer,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface BedrockHUDProps {
  stats: {
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
    perspective?: 'first' | 'third_back' | 'third_front';
    isHurt?: boolean;
    targetedBlockId?: number | null;
  };
  hotbar: (ItemStack | null)[];
  recentMessages?: ChatMessage[];
  onSelectSlot: (slot: number) => void;
  onOpenChat: () => void;
  onOpenInventory: () => void;
  onOpenPause: () => void;
  onOpenShaders: () => void;
  onOpenSkins?: () => void;
  onCyclePerspective?: () => void;
  onOpenCraftingTable?: () => void;
  onEatFood?: () => void;
  roomId: string;
  isTouchDevice: boolean;
  onTouchJump?: () => void;
  onTouchMove?: (x: number, y: number) => void;
  onTouchSneak?: () => void;
  onTouchBreakStart?: () => void;
  onTouchBreakEnd?: () => void;
  onPlaceBlock?: () => void;
}

export const BedrockHUD: React.FC<BedrockHUDProps> = ({
  stats,
  hotbar,
  recentMessages = [],
  onSelectSlot,
  onOpenChat,
  onOpenInventory,
  onOpenPause,
  onOpenShaders,
  onOpenSkins,
  onCyclePerspective,
  onOpenCraftingTable,
  onEatFood,
  roomId,
  isTouchDevice,
  onTouchJump,
  onTouchMove,
  onTouchSneak,
  onTouchBreakStart,
  onTouchBreakEnd,
  onPlaceBlock,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSneakingToggled, setIsSneakingToggled] = useState(false);

  const copyRoomLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedItem = hotbar[stats.selectedSlot];
  const selectedMeta = selectedItem ? BLOCK_META[selectedItem.blockId] : null;
  const isHoldingFood = selectedMeta?.isFood;
  const isTargetingCraftingTable = stats.targetedBlockId === BLOCK.CRAFTING_TABLE;

  // Hearts render (10 hearts = 20 HP)
  const renderHearts = () => {
    const hearts = [];
    for (let i = 0; i < 10; i++) {
      const heartHp = (i + 1) * 2;
      const isFull = stats.health >= heartHp;
      const isHalf = stats.health === heartHp - 1;
      hearts.push(
        <div key={`heart_${i}`} className="w-4 h-4 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-red-950/70 border border-black/80 rounded-xs" />
          {(isFull || isHalf) && (
            <div
              className={`absolute inset-0.5 bg-red-600 border-t border-l border-red-300 ${
                isHalf ? 'w-1.5' : 'w-full'
              }`}
            />
          )}
          {isFull && <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full opacity-80" />}
        </div>
      );
    }
    return hearts;
  };

  // Hunger render (10 drumsticks = 20 Hunger)
  const renderHunger = () => {
    const drumsticks = [];
    for (let i = 0; i < 10; i++) {
      const hungerVal = (i + 1) * 2;
      const isFull = stats.hunger >= hungerVal;
      const isHalf = stats.hunger === hungerVal - 1;
      drumsticks.push(
        <div key={`hunger_${i}`} className="w-4 h-4 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-950/60 border border-black/80 rounded-xs" />
          {(isFull || isHalf) && (
            <div
              className={`absolute inset-0.5 bg-amber-600 border-t border-l border-amber-300 rounded-xs flex items-center justify-center ${
                isHalf ? 'w-1.5' : 'w-full'
              }`}
            >
              <div className="w-1.5 h-1.5 bg-amber-800 rounded-full" />
            </div>
          )}
        </div>
      );
    }
    return drumsticks;
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden font-mono z-10 flex flex-col justify-between p-2 sm:p-3">
      {/* RED DAMAGE FLASH OVERLAY */}
      <div
        className={`absolute inset-0 bg-red-600/35 pointer-events-none transition-opacity duration-150 ${
          stats.isHurt ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* TOP BAR: Bedrock Coordinates & Top Buttons */}
      <div className="flex justify-between items-start">
        {/* Left: Coordinates & Floating Chat Feed */}
        <div className="flex flex-col gap-1.5 max-w-sm">
          {/* Coordinates Bedrock Style */}
          <div className="bg-black/65 backdrop-blur-none border-2 border-zinc-700/80 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-sm text-white text-xs shadow-md">
            <div className="text-zinc-400 font-bold tracking-wider text-[9px] uppercase">
              Bedrock Edition
            </div>
            <div className="font-bold text-xs sm:text-sm tracking-wide text-zinc-100">
              Posisi: <span className="text-emerald-400">{stats.x}</span>, <span className="text-sky-400">{stats.y}</span>, <span className="text-amber-400">{stats.z}</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-2">
              <span>FPS: <strong className="text-zinc-200">{stats.fps}</strong></span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5 text-emerald-400 inline" /> {stats.ping}ms
              </span>
            </div>
          </div>

          {/* Floating In-Game Chat Feed (Minecraft Bedrock style) */}
          {recentMessages.length > 0 && (
            <div className="flex flex-col gap-1 pointer-events-none mt-1">
              {recentMessages.slice(-4).map((msg) => (
                <div
                  key={msg.id}
                  className="bg-black/75 px-2 py-0.5 border-l-2 border-emerald-400 text-[10px] sm:text-[11px] leading-snug rounded-xs shadow"
                >
                  {msg.isSystem ? (
                    <span className="text-yellow-400 font-bold">{msg.text}</span>
                  ) : (
                    <>
                      <span className="text-emerald-400 font-bold">&lt;{msg.sender}&gt; </span>
                      <span className="text-zinc-100">{msg.text}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Server & Shader & Skin Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* F5 Camera Perspective Switcher */}
          <button
            onClick={onCyclePerspective}
            className="flex items-center gap-1 bg-purple-950/80 hover:bg-purple-900 border-2 border-purple-500 px-2 py-1 sm:px-2.5 sm:py-1.5 text-purple-200 text-xs font-bold transition shadow active:scale-95"
            title="Ganti Sudut Pandang Kamera [F5]"
          >
            <Eye className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">
              {stats.perspective === 'first' ? '1st' : stats.perspective === 'third_back' ? '3rd' : 'Front'}
            </span>
            <span className="sm:hidden text-[10px]">F5</span>
          </button>

          {/* Quick Skins Button */}
          <button
            onClick={onOpenSkins}
            className="flex items-center gap-1 bg-sky-950/80 hover:bg-sky-900 border-2 border-sky-500 px-2 py-1 sm:px-2.5 sm:py-1.5 text-sky-200 text-xs font-bold transition shadow active:scale-95"
            title="Ganti Skin (.png)"
          >
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Skins</span>
          </button>

          {/* Quick Shader Settings Button */}
          <button
            onClick={onOpenShaders}
            className="flex items-center gap-1 bg-amber-950/80 hover:bg-amber-900 border-2 border-amber-500 px-2 py-1 sm:px-2.5 sm:py-1.5 text-amber-200 text-xs font-bold transition shadow active:scale-95"
            title="Shader Packs & Kecerahan / Bayangan"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Shaders</span>
          </button>

          {/* Room info pill */}
          <button
            onClick={copyRoomLink}
            title="Salin tautan server untuk mabar bersama teman"
            className="hidden md:flex items-center gap-1.5 bg-zinc-900/85 hover:bg-zinc-800 active:scale-95 border-2 border-zinc-600 px-2.5 py-1.5 text-white text-xs font-bold transition shadow"
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Room: {roomId}</span>
            <span className="bg-emerald-600/80 text-[10px] px-1 py-0.2 rounded text-white ml-1">
              {stats.playersCount}
            </span>
            {copied ? (
              <Check className="w-3 h-3 text-emerald-300 ml-1" />
            ) : (
              <Copy className="w-3 h-3 text-zinc-400 ml-1" />
            )}
          </button>

          {/* Chat button */}
          <button
            onClick={onOpenChat}
            className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-zinc-900/85 hover:bg-zinc-800 active:scale-95 border-2 border-zinc-600 text-white transition shadow"
            title="Chat [T]"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-200" />
          </button>

          {/* Pause / Menu button */}
          <button
            onClick={onOpenPause}
            className="flex items-center justify-center px-2 sm:px-3 h-7 sm:h-8 bg-zinc-900/85 hover:bg-zinc-800 active:scale-95 border-2 border-zinc-600 text-white text-xs font-bold transition shadow"
            title="Pause Menu [ESC]"
          >
            ❚❚
          </button>
        </div>
      </div>

      {/* CENTER: Crosshair & Interaction Prompt */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
        <div className="relative w-5 h-5 flex items-center justify-center">
          <div className="w-4 h-0.5 bg-white/90 shadow-[0_0_2px_black]" />
          <div className="h-4 w-0.5 bg-white/90 absolute shadow-[0_0_2px_black]" />
        </div>

        {/* Dynamic Context Prompts */}
        {isTargetingCraftingTable && (
          <div className="mt-6 bg-black/80 border border-amber-400 px-3 py-1 rounded text-amber-300 text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse pointer-events-auto">
            <Hammer className="w-3.5 h-3.5" />
            <button onClick={onOpenCraftingTable} className="underline hover:text-white">
              Buka Meja Pembuat (Klik Kanan / Ketuk)
            </button>
          </div>
        )}

        {isHoldingFood && !isTargetingCraftingTable && (
          <div className="mt-6 bg-black/80 border border-emerald-400 px-3 py-1 rounded text-emerald-300 text-xs font-bold shadow-lg flex items-center gap-1.5 pointer-events-auto">
            <Utensils className="w-3.5 h-3.5" />
            <button onClick={onEatFood} className="underline hover:text-white">
              Makan {selectedMeta?.name} (Klik Kanan / Ketuk)
            </button>
          </div>
        )}
      </div>

      {/* MOBILE TOUCH CONTROLS (D-Pad on bottom-left, Actions on bottom-right) */}
      {isTouchDevice && (
        <div className="absolute inset-x-2 bottom-20 pointer-events-none flex justify-between items-end">
          {/* Virtual D-Pad (Left) */}
          <div className="pointer-events-auto relative w-32 h-32 bg-black/40 border-2 border-white/20 rounded-full flex items-center justify-center shadow-2xl">
            {/* Up / Forward */}
            <button
              onTouchStart={() => onTouchMove?.(0, -1)}
              onTouchEnd={() => onTouchMove?.(0, 0)}
              className="absolute top-1 w-10 h-10 bg-zinc-800/80 active:bg-zinc-600 border border-white/40 rounded flex items-center justify-center text-white"
            >
              <ArrowUp className="w-5 h-5" />
            </button>

            {/* Down / Backward */}
            <button
              onTouchStart={() => onTouchMove?.(0, 1)}
              onTouchEnd={() => onTouchMove?.(0, 0)}
              className="absolute bottom-1 w-10 h-10 bg-zinc-800/80 active:bg-zinc-600 border border-white/40 rounded flex items-center justify-center text-white"
            >
              <ArrowDown className="w-5 h-5" />
            </button>

            {/* Left */}
            <button
              onTouchStart={() => onTouchMove?.(-1, 0)}
              onTouchEnd={() => onTouchMove?.(0, 0)}
              className="absolute left-1 w-10 h-10 bg-zinc-800/80 active:bg-zinc-600 border border-white/40 rounded flex items-center justify-center text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Right */}
            <button
              onTouchStart={() => onTouchMove?.(1, 0)}
              onTouchEnd={() => onTouchMove?.(0, 0)}
              className="absolute right-1 w-10 h-10 bg-zinc-800/80 active:bg-zinc-600 border border-white/40 rounded flex items-center justify-center text-white"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Center: Sneak Toggle */}
            <button
              onClick={() => {
                setIsSneakingToggled(!isSneakingToggled);
                onTouchSneak?.();
              }}
              className={`w-8 h-8 rounded-full border border-white/40 flex items-center justify-center ${
                isSneakingToggled ? 'bg-amber-600 text-black font-bold' : 'bg-zinc-900/90 text-white'
              }`}
              title="Jongkok / Sneak"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>

          {/* Touch Action Buttons (Right) */}
          <div className="pointer-events-auto flex flex-col gap-2.5 items-end">
            <div className="flex gap-2">
              {/* Mine / Attack Button */}
              <button
                onTouchStart={onTouchBreakStart}
                onTouchEnd={onTouchBreakEnd}
                className="w-13 h-13 bg-red-950/85 active:bg-red-800 border-2 border-red-400 text-white font-bold rounded-full text-xs shadow-xl flex flex-col items-center justify-center"
              >
                <Hammer className="w-5 h-5 text-red-300" />
                <span className="text-[9px]">SERANG</span>
              </button>

              {/* Place Block Button */}
              <button
                onClick={onPlaceBlock}
                className="w-13 h-13 bg-emerald-950/85 active:bg-emerald-800 border-2 border-emerald-400 text-white font-bold rounded-full text-xs shadow-xl flex flex-col items-center justify-center"
              >
                <div className="w-4 h-4 bg-emerald-400 border border-black mb-0.5" />
                <span className="text-[9px]">PASANG</span>
              </button>
            </div>

            <div className="flex gap-2">
              {/* Interact / Crafting / Eat Button */}
              {(isTargetingCraftingTable || isHoldingFood) && (
                <button
                  onClick={() => {
                    if (isTargetingCraftingTable) onOpenCraftingTable?.();
                    else if (isHoldingFood) onEatFood?.();
                  }}
                  className="w-13 h-13 bg-amber-950/85 active:bg-amber-800 border-2 border-amber-400 text-white font-bold rounded-full text-xs shadow-xl flex flex-col items-center justify-center animate-bounce"
                >
                  {isTargetingCraftingTable ? (
                    <>
                      <Hammer className="w-4 h-4 text-amber-300" />
                      <span className="text-[9px]">BUKA</span>
                    </>
                  ) : (
                    <>
                      <Utensils className="w-4 h-4 text-emerald-300" />
                      <span className="text-[9px]">MAKAN</span>
                    </>
                  )}
                </button>
              )}

              {/* Jump Button (Big A button) */}
              <button
                onClick={onTouchJump}
                className="w-14 h-14 bg-zinc-900/85 active:bg-zinc-700 border-3 border-white text-white font-black rounded-full text-sm shadow-2xl flex items-center justify-center"
              >
                A
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM AREA: Health, Hunger, XP Bar, 9-Slot Hotbar */}
      <div className="flex flex-col items-center justify-end pb-1 w-full">
        {/* Status Rows: Hearts & Hunger */}
        <div className="flex justify-between items-center w-[360px] max-w-[90vw] px-1 mb-1.5">
          <div className="flex items-center gap-0.5">{renderHearts()}</div>
          <div className="flex items-center gap-0.5">{renderHunger()}</div>
        </div>

        {/* Experience Bar & Level */}
        <div className="relative w-[360px] max-w-[90vw] h-2 bg-black/75 border border-black rounded-xs mb-2 overflow-hidden flex items-center justify-center">
          <div
            className="absolute left-0 top-0 bottom-0 bg-lime-500 border-b border-lime-300"
            style={{ width: `${Math.round(stats.xpProgress * 100)}%` }}
          />
          <span className="absolute -top-3.5 text-lime-400 font-extrabold text-xs drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            {stats.xpLevel}
          </span>
        </div>

        {/* 9-Slot Bedrock Hotbar (Starts Empty in Survival!) */}
        <div className="flex items-center gap-1 bg-stone-900/90 p-1.5 border-4 border-stone-700 rounded-sm shadow-2xl pointer-events-auto">
          {hotbar.map((item, index) => {
            const isSelected = stats.selectedSlot === index;
            const meta = item ? BLOCK_META[item.blockId] : null;
            return (
              <button
                key={`hotbar_${index}`}
                onClick={() => onSelectSlot(index)}
                className={`w-9 h-9 sm:w-11 sm:h-11 flex flex-col items-center justify-center relative transition-all rounded-xs ${
                  isSelected
                    ? 'border-3 border-white bg-stone-700 scale-105 shadow-md ring-2 ring-black'
                    : 'border-2 border-stone-600 bg-stone-800/80 hover:bg-stone-700/70'
                }`}
              >
                {/* 3D Block representation if slot has item */}
                {item && item.count > 0 && meta ? (
                  <>
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-black/60 shadow-inner flex items-center justify-center"
                      style={{ backgroundColor: meta.itemColor }}
                    >
                      <div className="w-full h-1 bg-white/30 self-start" />
                    </div>
                    {/* Item count in bottom right */}
                    <span className="absolute bottom-0 right-1 text-[9px] sm:text-[10px] font-extrabold text-white drop-shadow-[0_1px_2px_black]">
                      {item.count}
                    </span>
                  </>
                ) : null}

                {/* Slot index number in top-left when empty */}
                {(!item || item.count === 0) && (
                  <span className="text-[8px] sm:text-[9px] text-zinc-600 font-bold">{index + 1}</span>
                )}
              </button>
            );
          })}

          {/* Inventory Button [E] */}
          <button
            onClick={onOpenInventory}
            className="w-9 h-9 sm:w-11 sm:h-11 ml-1 flex flex-col items-center justify-center bg-zinc-800 hover:bg-zinc-700 border-2 border-zinc-500 text-white font-bold text-xs active:scale-95"
            title="Buka Inventory [E]"
          >
            <span>...</span>
            <span className="text-[8px] sm:text-[9px] text-zinc-400">E</span>
          </button>
        </div>
      </div>
    </div>
  );
};
