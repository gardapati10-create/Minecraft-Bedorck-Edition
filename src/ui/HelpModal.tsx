import React from 'react';
import { sounds } from '../game/audio';
import { X, HelpCircle, Gamepad2, Users, Keyboard } from 'lucide-react';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-4 font-mono select-none">
      <div className="w-full max-w-lg bg-stone-900 border-4 border-stone-600 p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-stone-700 pb-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-extrabold text-white uppercase tracking-wider">
              Panduan Bermain / Controls
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

        {/* Controls Table */}
        <div className="space-y-3 text-xs">
          <div className="bg-stone-950 p-3 border border-stone-800">
            <div className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
              <Keyboard className="w-4 h-4 text-emerald-400" /> Kontrol Keyboard & Mouse:
            </div>
            <div className="grid grid-cols-2 gap-y-1.5 text-zinc-300">
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">W, A, S, D</kbd> : Bergerak / Gerak</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">Spasi</kbd> : Lompat (Jump)</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">Klik Kiri</kbd> : Menghancurkan Blok (Mine)</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">Klik Kanan</kbd> : Memasang Blok (Place)</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">1 - 9 / Scroll</kbd> : Pilih Slot Hotbar</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">E</kbd> : Buka Inventory / Crafting</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">T / Enter</kbd> : Chat & Perintah</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">Esc</kbd> : Pause / Menu</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">Ctrl</kbd> : Lari Cepat (Sprint)</div>
              <div><kbd className="bg-stone-800 px-1.5 py-0.5 border border-stone-600 rounded">Shift</kbd> : Jongkok (Sneak)</div>
            </div>
          </div>

          {/* Multiplayer Server Guide */}
          <div className="bg-stone-950 p-3 border border-stone-800 text-zinc-300">
            <div className="font-bold text-sky-400 mb-1.5 flex items-center gap-1.5 uppercase tracking-wide">
              <Users className="w-4 h-4 text-sky-400" /> Cara Main Bareng (Multiplayer / Server Lokal):
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-400 leading-relaxed">
              <li>Pilih tombol <strong className="text-white">Play</strong> lalu buat atau masukkan nama Room (contoh: <code className="text-emerald-400">mabar-123</code>).</li>
              <li>Bagikan nama Room atau salin tautan browser kepada teman Anda.</li>
              <li>Teman Anda langsung bergabung ke dunia yang sama tanpa akun berbayar dan tanpa biaya tambahan!</li>
              <li>Anda bisa melihat avatar 3D pemain lain, gerakannya, serta blok yang dihancurkan/dipasang secara realtime!</li>
            </ol>
          </div>

          {/* Features info */}
          <div className="bg-stone-950 p-3 border border-stone-800 text-zinc-300">
            <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
              <Gamepad2 className="w-4 h-4 text-amber-400" /> Fitur Bedrock Craft:
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400">
              <li><strong className="text-white">Dunia Tanpa Batas (Unlimited / Infinite):</strong> Jelajahi ke segala arah tanpa tembok pembatas, peta di-stream secara otomatis tanpa lag.</li>
              <li><strong className="text-white">Inventory Survival Nyata:</strong> Inventory mulai dalam keadaan kosong. Hancurkan balok (kayu, batu, tanah) untuk memunculkan balok 3D yang mengapung, dekati untuk mengambilnya!</li>
              <li><strong className="text-white">Paket Shader Bawaan (Tanpa Download):</strong> Klik tombol <span className="text-amber-400 font-bold">Shaders</span> di HUD atau menu untuk mengganti BSL, RTX Ray Tracing, Vanilla, Nostalgia, dan mengatur kecerahan serta bayangan secara realtime.</li>
              <li><strong className="text-white">Multiplayer Server Lokal Gratis:</strong> Main bareng teman cukup dengan membagikan nama Room atau tautan browser!</li>
            </ul>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider border-2 border-emerald-400 shadow mt-1"
        >
          Mengerti / Siap Main!
        </button>
      </div>
    </div>
  );
};
