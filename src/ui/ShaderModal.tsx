import React from 'react';
import { ShaderConfig, ShaderProfile, ShadowQuality, FogSetting } from '../game/shaders';
import { sounds } from '../game/audio';
import { Sun, Sparkles, Sliders, Moon, Check, X, ShieldAlert } from 'lucide-react';

interface ShaderModalProps {
  config: ShaderConfig;
  onUpdateConfig: (newConfig: Partial<ShaderConfig>) => void;
  onSelectProfile: (profile: ShaderProfile) => void;
  onClose: () => void;
}

export const ShaderModal: React.FC<ShaderModalProps> = ({
  config,
  onUpdateConfig,
  onSelectProfile,
  onClose,
}) => {
  const profiles: { id: ShaderProfile; name: string; tag: string; desc: string; icon: string }[] = [
    {
      id: 'bsl',
      name: 'BSL Vibrant Shaders',
      tag: 'Recommended',
      desc: 'Warm golden sunlight, rich vibrant colors, soft realistic shadows & atmospheric sky.',
      icon: '✨',
    },
    {
      id: 'rtx',
      name: 'RTX Ray Tracing Ultra',
      tag: 'Cinema PBR',
      desc: 'ACES Filmic cinema tone mapping, ultra-soft contact shadows, realistic lighting.',
      icon: '💎',
    },
    {
      id: 'vanilla',
      name: 'Vanilla Bedrock Classic',
      tag: 'Original',
      desc: 'Standard clean Minecraft Bedrock edition visuals, fast performance.',
      icon: '⛏',
    },
    {
      id: 'nostalgia',
      name: 'Nostalgia Alpha Edition',
      tag: 'Retro 2011',
      desc: 'Classic saturated neon green grass, harsh contrast, retro Minecraft alpha fog.',
      icon: '🌿',
    },
    {
      id: 'night_vision',
      name: 'Night Vision & Twilight',
      tag: 'Bright Caves',
      desc: 'Enhanced maximum gamma brightness for exploring dark caves and nighttime.',
      icon: '🌙',
    },
  ];

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono select-none">
      <div className="w-full max-w-2xl bg-stone-900 border-4 border-stone-600 p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-stone-700 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-extrabold text-white uppercase tracking-wider">
              Shader Packs & Video Settings
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

        {/* Info banner: Built-in Shaders (No Download Required) */}
        <div className="bg-emerald-950/60 border border-emerald-700/80 p-2.5 text-xs text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Shader Bawaan (Tanpa Download):</strong> Semua efek shader terintegrasi langsung dengan mesin WebGL 3D tanpa perlu mengunduh file eksternal!
          </span>
        </div>

        {/* 1. Shader Profiles Grid */}
        <div>
          <div className="text-xs font-bold text-zinc-300 uppercase mb-2 flex items-center gap-1.5">
            <Sun className="w-4 h-4 text-amber-400" /> Pilih Paket Shader (Shader Profile):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {profiles.map((p) => {
              const isSelected = config.profile === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    sounds.playClick();
                    onSelectProfile(p.id);
                  }}
                  className={`p-3 border-2 cursor-pointer transition active:scale-[0.99] flex flex-col justify-between ${
                    isSelected
                      ? 'bg-stone-800 border-emerald-400 ring-2 ring-emerald-500/50 shadow-lg'
                      : 'bg-stone-950/80 border-stone-700 hover:bg-stone-800/80'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 font-bold uppercase rounded ${
                          isSelected
                            ? 'bg-emerald-500 text-black'
                            : 'bg-stone-800 text-zinc-400'
                        }`}
                      >
                        {p.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-relaxed">{p.desc}</p>
                  </div>

                  {isSelected && (
                    <div className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Aktif Sekarang
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Fine-Tuning Controls */}
        <div className="bg-stone-950 border-2 border-stone-700 p-3 space-y-3">
          <div className="text-xs font-bold text-zinc-200 uppercase flex items-center gap-1.5 border-b border-stone-800 pb-1.5">
            <Sliders className="w-3.5 h-3.5 text-sky-400" /> Kustomisasi Kecerahan, Bayangan & Atmosfer:
          </div>

          {/* Brightness (Gamma) Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>Kecerahan (Brightness / Gamma):</span>
              <strong className="text-emerald-400">
                {config.brightness}% {config.brightness > 85 ? '(Terang)' : config.brightness < 40 ? '(Moody)' : '(Normal)'}
              </strong>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={config.brightness}
              onChange={(e) => onUpdateConfig({ brightness: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Shadow Quality Buttons */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>Kualitas Bayangan (Shadows):</span>
              <strong className="text-emerald-400 uppercase">{config.shadowQuality}</strong>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {(['off', 'low', 'medium', 'high', 'ultra'] as ShadowQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    sounds.playClick();
                    onUpdateConfig({ shadowQuality: q });
                  }}
                  className={`py-1 text-[11px] font-bold border uppercase ${
                    config.shadowQuality === q
                      ? 'bg-emerald-600 border-emerald-300 text-white'
                      : 'bg-stone-900 border-stone-700 text-zinc-400 hover:bg-stone-800'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Exposure Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>Pencahayaan (Exposure / Contrast):</span>
              <strong className="text-emerald-400">{config.exposure.toFixed(2)}x</strong>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.8"
              step="0.05"
              value={config.exposure}
              onChange={(e) => onUpdateConfig({ exposure: Number(e.target.value) })}
              className="w-full accent-sky-500 cursor-pointer"
            />
          </div>

          {/* Fog Distance */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>Kabut Atmosfer (Fog Distance):</span>
              <strong className="text-emerald-400 uppercase">{config.fog}</strong>
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['near', 'medium', 'far', 'off'] as FogSetting[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    sounds.playClick();
                    onUpdateConfig({ fog: f });
                  }}
                  className={`py-1 text-[11px] font-bold border uppercase ${
                    config.fog === f
                      ? 'bg-sky-600 border-sky-300 text-white'
                      : 'bg-stone-900 border-stone-700 text-zinc-400 hover:bg-stone-800'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Render Distance (Infinite World Chunk Radius) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-zinc-300">
              <span>Jarak Pandang (Render Distance):</span>
              <strong className="text-emerald-400">
                {config.renderDistance} Chunks ({(config.renderDistance * 2 + 1) * 16} blocks)
              </strong>
            </div>
            <input
              type="range"
              min="2"
              max="5"
              step="1"
              value={config.renderDistance}
              onChange={(e) => onUpdateConfig({ renderDistance: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Done Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 text-white font-extrabold text-sm uppercase tracking-wider shadow"
        >
          Terapkan & Selesai
        </button>
      </div>
    </div>
  );
};
