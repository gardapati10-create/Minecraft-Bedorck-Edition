import React, { useState, useEffect } from 'react';
import { sounds } from '../game/audio';
import { Globe, Users, Plus, ArrowLeft, Wifi, Share2, Sparkles } from 'lucide-react';

interface ServerBrowserModalProps {
  currentRoomId: string;
  onJoinWorld: (roomId: string) => void;
  onBack: () => void;
}

export const ServerBrowserModal: React.FC<ServerBrowserModalProps> = ({
  currentRoomId,
  onJoinWorld,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'worlds' | 'friends' | 'servers'>('servers');
  const [inputRoomId, setInputRoomId] = useState(currentRoomId || 'bedrock-lobby');
  const [onlineRooms, setOnlineRooms] = useState<
    { id: string; name: string; playerCount: number; mode: string }[]
  >([]);

  // Fetch active rooms from server API
  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setOnlineRooms(data);
      })
      .catch(() => {
        // Fallback default rooms
        setOnlineRooms([
          { id: 'bedrock-lobby', name: 'Global Survival Lobby', playerCount: 1, mode: 'survival' },
          { id: 'local-server', name: 'Local Network LAN', playerCount: 1, mode: 'survival' },
          { id: 'creative-hub', name: 'Creative Building Hub', playerCount: 1, mode: 'creative' },
        ]);
      });
  }, []);

  const handleJoin = (roomId: string) => {
    sounds.playClick();
    onJoinWorld(roomId.trim() || 'bedrock-lobby');
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between items-center select-none overflow-hidden p-4 sm:p-6 bg-zinc-950 font-mono">
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

      {/* TOP HEADER */}
      <div className="relative z-10 w-full max-w-2xl flex items-center justify-between border-b-2 border-stone-600 pb-3">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="flex items-center gap-2 bg-stone-800 hover:bg-stone-700 border-2 border-stone-600 px-3 py-1.5 text-white font-bold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-wider uppercase drop-shadow">
          Select World / Server
        </h2>
        <div className="w-16" />
      </div>

      {/* TABS (Bedrock Style) */}
      <div className="relative z-10 w-full max-w-2xl flex border-b-2 border-stone-700 mt-3">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('servers');
          }}
          className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'servers'
              ? 'bg-stone-700 text-white border-t-2 border-l-2 border-r-2 border-stone-500'
              : 'bg-stone-900/80 text-zinc-400 hover:bg-stone-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5 inline mr-1.5 text-emerald-400" />
          Servers & Multiplayer
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('friends');
          }}
          className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'friends'
              ? 'bg-stone-700 text-white border-t-2 border-l-2 border-r-2 border-stone-500'
              : 'bg-stone-900/80 text-zinc-400 hover:bg-stone-800'
          }`}
        >
          <Users className="w-3.5 h-3.5 inline mr-1.5 text-sky-400" />
          Friends & LAN
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('worlds');
          }}
          className={`flex-1 py-2 text-center text-xs font-bold uppercase tracking-wider transition ${
            activeTab === 'worlds'
              ? 'bg-stone-700 text-white border-t-2 border-l-2 border-r-2 border-stone-500'
              : 'bg-stone-900/80 text-zinc-400 hover:bg-stone-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
          Singleplayer
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="relative z-10 w-full max-w-2xl flex-1 overflow-y-auto py-4 flex flex-col gap-3">
        {/* ROOM CODE JOIN BAR */}
        <div className="bg-stone-900/90 border-4 border-stone-700 p-4 shadow-xl">
          <div className="text-xs font-bold text-zinc-300 uppercase mb-2 flex items-center justify-between">
            <span>Direct Server Room Code:</span>
            <span className="text-[10px] text-emerald-400">Zero Cost · Instant Join</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputRoomId}
              onChange={(e) => setInputRoomId(e.target.value)}
              placeholder="e.g. survival-lan or my-world"
              className="flex-1 bg-stone-950 border-2 border-stone-600 px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleJoin(inputRoomId)}
              className="bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-400 px-6 py-2 text-white font-extrabold text-sm uppercase tracking-wider active:scale-95 transition"
            >
              Join / Host
            </button>
          </div>
          <div className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Invite friends by sharing this room code or the browser URL!</span>
          </div>
        </div>

        {/* SERVER LIST / PRESETS */}
        <div className="flex flex-col gap-2">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
            Available World Servers:
          </div>

          {onlineRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleJoin(room.id)}
              className="bg-stone-800/90 hover:bg-stone-700/90 border-2 border-stone-600 p-3.5 flex items-center justify-between cursor-pointer transition active:scale-[0.99] shadow"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-stone-900 border border-stone-500 flex items-center justify-center font-bold text-emerald-400 text-sm">
                  ⛏
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span>{room.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-700 text-zinc-300 uppercase">
                      {room.mode}
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400 mt-0.5 flex items-center gap-2">
                    <span>ID: <code className="text-zinc-200">{room.id}</code></span>
                    <span>•</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> Online
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-1 rounded">
                    {room.playerCount} Players
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleJoin(room.id);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 border border-emerald-400 px-4 py-1.5 text-white font-bold text-xs uppercase"
                >
                  Play
                </button>
              </div>
            </div>
          ))}

          {/* Quick Create Custom Local Room */}
          <div
            onClick={() => handleJoin(`world-${Math.floor(Math.random() * 9000 + 1000)}`)}
            className="bg-stone-900/60 hover:bg-stone-800/60 border-2 border-dashed border-stone-600 p-3 flex items-center justify-center gap-2 cursor-pointer transition text-zinc-300 text-xs font-bold"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Create New Custom Multiplayer World</span>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="relative z-10 text-center text-xs text-zinc-400 pt-2 border-t border-stone-700 w-full max-w-2xl flex justify-between">
        <span>No subscription or Xbox account required</span>
        <span className="text-emerald-400 font-bold">100% Free Multiplayer</span>
      </div>
    </div>
  );
};
