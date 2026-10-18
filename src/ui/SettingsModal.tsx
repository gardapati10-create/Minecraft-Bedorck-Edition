import React from 'react';
import { sounds } from '../game/audio';
import { Volume2, VolumeX, Eye, Compass, X } from 'lucide-react';

interface SettingsModalProps {
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  viewBobbing: boolean;
  setViewBobbing: (val: boolean) => void;
  onOpenShaders?: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isMuted,
  setIsMuted,
  viewBobbing,
  setViewBobbing,
  onOpenShaders,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono select-none">
      <div className="w-full max-w-md bg-stone-900 border-4 border-stone-600 p-6 shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-stone-700 pb-2">
          <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">
            Game Settings
          </h2>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-7 h-7 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options */}
        <div className="space-y-4 py-2">
          {/* Audio Mute */}
          <div className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span>Audio & Music:</span>
            </div>
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                sounds.setMuted(next);
                sounds.playClick();
              }}
              className={`px-3 py-1 text-xs font-bold border ${
                isMuted
                  ? 'bg-red-950/80 border-red-700 text-red-300'
                  : 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
              }`}
            >
              {isMuted ? 'Muted' : 'Sound ON'}
            </button>
          </div>

          {/* View Bobbing */}
          <div className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Eye className="w-4 h-4 text-sky-400" />
              <span>View Bobbing:</span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setViewBobbing(!viewBobbing);
              }}
              className={`px-3 py-1 text-xs font-bold border ${
                viewBobbing
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-stone-800 border-stone-600 text-zinc-400'
              }`}
            >
              {viewBobbing ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {/* Shaders & Video Button */}
          <div className="flex items-center justify-between p-3 bg-stone-950 border border-stone-800">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Shader & Video:</span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                onOpenShaders?.();
              }}
              className="px-3 py-1 text-xs font-bold border bg-amber-950/80 border-amber-600 text-amber-300 hover:bg-amber-900"
            >
              Atur Shader ➔
            </button>
          </div>

          {/* Graphics mode info */}
          <div className="p-3 bg-stone-950 border border-stone-800 text-xs text-zinc-300">
            <div className="flex items-center gap-2 font-bold mb-1">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Dunia Unlimited & Mesin Voxel:</span>
            </div>
            <div className="text-[11px] text-zinc-400 leading-relaxed">
              Dunia tanpa batas (infinite chunk streaming) dengan 60 FPS, pencahayaan PBR dinamis, dan bayangan realistis.
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider border-2 border-emerald-400 shadow mt-2"
        >
          Done
        </button>
      </div>
    </div>
  );
};
