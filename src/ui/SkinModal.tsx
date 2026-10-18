import React, { useRef, useState } from 'react';
import { SkinManager, SKIN_PRESETS, SkinPreset } from '../game/skinManager';
import { sounds } from '../game/audio';
import { Upload, Check, User, X, Sparkles, AlertCircle } from 'lucide-react';
import * as THREE from 'three';

interface SkinModalProps {
  currentSkinId: string;
  onSelectPreset: (type: SkinPreset['type']) => void;
  onCustomSkinLoaded: (texture: THREE.CanvasTexture, dataUrl: string) => void;
  onClose: () => void;
}

export const SkinModal: React.FC<SkinModalProps> = ({
  currentSkinId,
  onSelectPreset,
  onCustomSkinLoaded,
  onClose,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [skinManager] = useState(() => new SkinManager());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      sounds.playClick();
      setStatusMsg({ text: 'Memuat skin .png...' });
      const { texture, dataUrl } = await skinManager.loadCustomSkinFile(file);
      onCustomSkinLoaded(texture, dataUrl);
      sounds.playPop();
      setStatusMsg({ text: 'Skin kustom .png berhasil dipasang!' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Gagal memuat skin .png';
      setStatusMsg({ text: message, error: true });
    }
  };

  const handleSelectPreset = (type: SkinPreset['type']) => {
    sounds.playClick();
    onSelectPreset(type);
    setStatusMsg({ text: `Skin ${type.toUpperCase()} aktif!` });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono select-none">
      <div className="w-full max-w-lg bg-stone-900 border-4 border-stone-600 p-6 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-stone-700 pb-2">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">
              Ganti Skin Minecraft
            </h2>
          </div>
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

        {/* 1. Custom Skin Upload (.png) */}
        <div className="bg-stone-950 border-2 border-stone-700 p-4 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-emerald-950/80 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-2">
            <Upload className="w-6 h-6 text-emerald-400" />
          </div>

          <h3 className="text-sm font-extrabold text-white uppercase mb-1">
            Unggah File Skin .PNG Sendiri
          </h3>
          <p className="text-xs text-zinc-400 mb-3 max-w-sm leading-relaxed">
            Pilih file gambar <code className="text-emerald-400">.png</code> skin Minecraft apa saja (format standar 64x64 atau 64x32 piksel).
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,.png"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-xs uppercase px-6 py-2.5 border-2 border-emerald-300 shadow flex items-center gap-2 transition"
          >
            <Upload className="w-4 h-4" />
            <span>Pilih File Gambar .PNG</span>
          </button>

          {statusMsg && (
            <div
              className={`text-xs font-bold mt-2.5 flex items-center gap-1.5 ${
                statusMsg.error ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {statusMsg.error ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* 2. Built-in Skin Presets */}
        <div>
          <div className="text-xs font-bold text-zinc-300 uppercase mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Atau Pilih Skin Bawaan Populer:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SKIN_PRESETS.map((preset) => {
              const isSelected = currentSkinId === preset.type;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset.type)}
                  className={`p-3 border-2 cursor-pointer transition active:scale-[0.99] flex items-center justify-between ${
                    isSelected
                      ? 'bg-stone-800 border-emerald-400 ring-2 ring-emerald-500/50 shadow'
                      : 'bg-stone-950/80 border-stone-700 hover:bg-stone-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 border border-black shadow rounded-xs"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span className="text-xs font-bold text-white">{preset.name}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 border border-emerald-800">
                      Aktif
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider border-2 border-emerald-400 shadow mt-2"
        >
          Selesai & Simpan Skin
        </button>
      </div>
    </div>
  );
};
