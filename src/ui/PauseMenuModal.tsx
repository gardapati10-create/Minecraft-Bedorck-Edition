import React, { useState } from 'react';
import { sounds } from '../game/audio';
import { Play, Copy, Check, Settings, LogOut, Users } from 'lucide-react';

interface PauseMenuModalProps {
  roomId: string;
  playersCount: number;
  onResume: () => void;
  onOpenSettings: () => void;
  onOpenShaders?: () => void;
  onOpenSkins?: () => void;
  onQuitToTitle: () => void;
}

export const PauseMenuModal: React.FC<PauseMenuModalProps> = ({
  roomId,
  playersCount,
  onResume,
  onOpenSettings,
  onOpenShaders,
  onOpenSkins,
  onQuitToTitle,
}) => {
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    sounds.playClick();
    const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-none p-4 font-mono select-none">
      <div className="w-full max-w-sm bg-stone-900 border-4 border-stone-600 p-6 shadow-2xl flex flex-col items-center">
        {/* Title */}
        <h2 className="text-2xl font-extrabold text-white uppercase tracking-wider mb-6 drop-shadow border-b-2 border-stone-700 pb-2 w-full text-center">
          Game Paused
        </h2>

        {/* Server & Room Info */}
        <div className="w-full bg-stone-950 border-2 border-stone-700 p-3 mb-5 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <div>
              <span className="font-bold text-white">Room:</span> {roomId}
              <div className="text-[10px] text-zinc-400">{playersCount} player(s) online</div>
            </div>
          </div>
          <button
            onClick={copyInvite}
            className="flex items-center gap-1 bg-stone-800 hover:bg-stone-700 border border-stone-600 px-2.5 py-1 text-white text-[11px] font-bold"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-300" />
                <span>Invite Link</span>
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onResume();
            }}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 active:translate-y-0.5 text-white font-extrabold text-sm uppercase tracking-wider border-4 border-t-emerald-300 border-l-emerald-300 border-b-emerald-950 border-r-emerald-950 shadow flex items-center justify-center gap-2 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume Game</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenSkins?.();
            }}
            className="w-full h-11 bg-sky-800 hover:bg-sky-700 active:translate-y-0.5 text-white font-bold text-xs uppercase tracking-wider border-4 border-t-sky-500 border-l-sky-500 border-b-sky-950 border-r-sky-950 shadow flex items-center justify-center gap-2 transition"
          >
            <Users className="w-4 h-4" />
            <span>Change Skins (Upload .PNG)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenShaders?.();
            }}
            className="w-full h-11 bg-amber-900/90 hover:bg-amber-800 active:translate-y-0.5 text-amber-200 font-bold text-xs uppercase tracking-wider border-4 border-t-amber-600 border-l-amber-600 border-b-amber-950 border-r-amber-950 shadow flex items-center justify-center gap-2 transition"
          >
            <span>✨</span>
            <span>Shader & Video Settings</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenSettings();
            }}
            className="w-full h-11 bg-stone-700 hover:bg-stone-600 active:translate-y-0.5 text-white font-bold text-xs uppercase tracking-wider border-4 border-t-stone-500 border-l-stone-500 border-b-stone-950 border-r-stone-950 shadow flex items-center justify-center gap-2 transition"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onQuitToTitle();
            }}
            className="w-full h-11 bg-red-800 hover:bg-red-700 active:translate-y-0.5 text-white font-bold text-xs uppercase tracking-wider border-4 border-t-red-500 border-l-red-500 border-b-red-950 border-r-red-950 shadow flex items-center justify-center gap-2 transition mt-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Save & Quit to Title</span>
          </button>
        </div>
      </div>
    </div>
  );
};
