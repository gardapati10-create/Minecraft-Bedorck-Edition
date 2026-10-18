import React from 'react';
import { sounds } from '../game/audio';
import { RotateCcw, Home, Skull } from 'lucide-react';

interface DeathModalProps {
  reason: string;
  xpLevel: number;
  onRespawn: () => void;
  onQuitToTitle: () => void;
}

export const DeathModal: React.FC<DeathModalProps> = ({
  reason,
  xpLevel,
  onRespawn,
  onQuitToTitle,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/85 backdrop-blur-xs font-mono select-none p-4">
      <div className="flex flex-col items-center max-w-md w-full bg-black/70 border-4 border-red-700/80 p-6 rounded-sm shadow-2xl text-center">
        <Skull className="w-16 h-16 text-red-500 mb-2 animate-bounce" />

        <h1 className="text-3xl sm:text-4xl font-extrabold text-red-400 drop-shadow-[0_2px_4px_rgba(0,0,0,1)] uppercase tracking-wider">
          Anda Mati!
        </h1>

        <p className="text-zinc-300 text-sm mt-2 mb-4">
          Penyebab: <strong className="text-red-300">{reason || 'Kehabisan Nyawa'}</strong>
        </p>

        <div className="bg-red-950/60 border border-red-800/80 px-4 py-2 rounded mb-6 text-xs text-zinc-300">
          Tingkat Pengalaman (XP Level): <strong className="text-lime-400 text-sm">{xpLevel}</strong>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={() => {
              sounds.playClick();
              onRespawn();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-700 hover:bg-red-600 active:scale-95 border-2 border-red-400 text-white font-bold text-sm shadow transition"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Respawn</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onQuitToTitle();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 active:scale-95 border-2 border-zinc-600 text-white font-bold text-sm shadow transition"
          >
            <Home className="w-4 h-4" />
            <span>Menu Utama</span>
          </button>
        </div>
      </div>
    </div>
  );
};
