import React from 'react';
import { sounds } from '../game/audio';
import { Play, Settings, User, HelpCircle, ShieldCheck } from 'lucide-react';

interface MainMenuProps {
  playerName: string;
  setPlayerName: (name: string) => void;
  skinType: 'steve' | 'alex';
  setSkinType: (skin: 'steve' | 'alex') => void;
  onPlayClick: () => void;
  onSettingsClick: () => void;
  onHelpClick: () => void;
  onOpenSkins?: () => void;
}

const SPLASHES = [
  'Multiplayer Ready!',
  '100% Free & Open Voxel Sandbox!',
  'Local Servers for Friends!',
  'No Paywalls!',
  'Now with Fast Voxel Engine!',
  'Survival & Creative!',
  'Bedrock Style UI & HUD!',
];

export const MainMenu: React.FC<MainMenuProps> = ({
  playerName,
  setPlayerName,
  skinType,
  setSkinType,
  onPlayClick,
  onSettingsClick,
  onHelpClick,
  onOpenSkins,
}) => {
  const [splash] = React.useState(() => SPLASHES[Math.floor(Math.random() * SPLASHES.length)]);

  const handleAction = (cb: () => void) => {
    sounds.playClick();
    cb();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center select-none overflow-hidden p-6 bg-zinc-950 font-mono">
      {/* Background Dirt Pattern */}
      <div
        className="absolute inset-0 opacity-40 bg-repeat pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#4d3725 15%, transparent 16%), radial-gradient(#2b1d12 15%, transparent 16%)`,
          backgroundColor: '#382517',
          backgroundPosition: '0 0, 8px 8px',
          backgroundSize: '16px 16px',
        }}
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

      {/* TOP: Version badge */}
      <div className="relative z-10 w-full flex justify-between items-center text-xs text-zinc-400">
        <div className="flex items-center gap-2 bg-black/60 px-3 py-1 border border-zinc-700">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-zinc-200">Bedrock Craft v1.21</span>
        </div>
        <div className="bg-black/60 px-3 py-1 border border-zinc-700 text-zinc-300">
          Status: <span className="text-emerald-400 font-bold">Online Server Ready</span>
        </div>
      </div>

      {/* CENTER: Title Logo Lockup & Buttons */}
      <div className="relative z-10 flex flex-col items-center max-w-md w-full">
        {/* Title Lockup */}
        <div className="relative mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-zinc-100 tracking-wider uppercase drop-shadow-[0_6px_0_#2b2b2b] border-b-4 border-zinc-600 pb-2">
            BEDROCK<span className="text-emerald-400"> CRAFT</span>
          </h1>
          <div className="text-zinc-400 text-xs sm:text-sm font-bold tracking-widest uppercase mt-1">
            Free Multiplayer Edition
          </div>

          {/* Yellow Bouncing Splash Text */}
          <div className="absolute -bottom-4 right-0 transform translate-x-4 rotate-[-15deg] animate-pulse">
            <span className="text-yellow-300 font-extrabold text-sm sm:text-base drop-shadow-[0_2px_2px_black] bg-black/40 px-2 py-0.5 border border-yellow-400/50">
              {splash}
            </span>
          </div>
        </div>

        {/* Player Profile / Name Input */}
        <div className="w-full bg-stone-900/90 border-4 border-stone-700 p-4 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" /> Player Profile:
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  setSkinType('steve');
                }}
                className={`text-[11px] px-2 py-0.5 border font-bold ${
                  skinType === 'steve'
                    ? 'bg-sky-700 border-sky-400 text-white'
                    : 'bg-stone-800 border-stone-600 text-zinc-400'
                }`}
              >
                Steve
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setSkinType('alex');
                }}
                className={`text-[11px] px-2 py-0.5 border font-bold ${
                  skinType === 'alex'
                    ? 'bg-emerald-700 border-emerald-400 text-white'
                    : 'bg-stone-800 border-stone-600 text-zinc-400'
                }`}
              >
                Alex
              </button>
            </div>
          </div>
          <input
            type="text"
            value={playerName}
            maxLength={16}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="Enter GamerTag..."
            className="w-full bg-stone-950 border-2 border-stone-600 px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500 placeholder-zinc-500"
          />
        </div>

        {/* Bedrock Style Action Buttons */}
        <div className="w-full flex flex-col gap-3">
          {/* Big Green Play Button */}
          <button
            onClick={() => handleAction(onPlayClick)}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 active:translate-y-1 text-white font-extrabold text-lg uppercase tracking-wider border-4 border-t-emerald-300 border-l-emerald-300 border-b-emerald-900 border-r-emerald-900 shadow-xl flex items-center justify-center gap-3 transition-all"
          >
            <Play className="w-6 h-6 fill-current text-white" />
            <span>PLAY</span>
          </button>

          {/* Change Skin Button */}
          <button
            onClick={() => handleAction(() => onOpenSkins?.())}
            className="w-full h-11 bg-sky-800 hover:bg-sky-700 active:translate-y-1 text-white font-bold text-sm uppercase tracking-wider border-4 border-t-sky-500 border-l-sky-500 border-b-sky-950 border-r-sky-950 shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <User className="w-4 h-4 text-sky-200" />
            <span>Change Skins (Upload .PNG)</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => handleAction(onSettingsClick)}
            className="w-full h-11 bg-stone-700 hover:bg-stone-600 active:translate-y-1 text-white font-bold text-sm uppercase tracking-wider border-4 border-t-stone-500 border-l-stone-500 border-b-stone-950 border-r-stone-950 shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Settings className="w-4 h-4 text-zinc-200" />
            <span>Settings</span>
          </button>

          {/* How to Play / Controls Button */}
          <button
            onClick={() => handleAction(onHelpClick)}
            className="w-full h-11 bg-stone-700 hover:bg-stone-600 active:translate-y-1 text-white font-bold text-sm uppercase tracking-wider border-4 border-t-stone-500 border-l-stone-500 border-b-stone-950 border-r-stone-950 shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-zinc-200" />
            <span>How to Play & Controls</span>
          </button>
        </div>
      </div>

      {/* FOOTER: Bedrock Copy & Controls hint */}
      <div className="relative z-10 text-center text-[11px] text-zinc-400">
        <div>Bedrock Craft Sandbox · Free Multiplayer on Local & Online Servers</div>
        <div className="text-zinc-500 text-[10px] mt-0.5">WASD to Move · Space to Jump · Left Click Mine · Right Click Place</div>
      </div>
    </div>
  );
};
