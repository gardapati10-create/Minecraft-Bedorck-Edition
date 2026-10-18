import React, { useState, useEffect, useRef } from 'react';
import { GameEngine } from './game/engine';
import { BedrockHUD } from './ui/BedrockHUD';
import { MainMenu } from './ui/MainMenu';
import { ServerBrowserModal } from './ui/ServerBrowserModal';
import { PauseMenuModal } from './ui/PauseMenuModal';
import { InventoryModal } from './ui/InventoryModal';
import { CraftingTableModal } from './ui/CraftingTableModal';
import { DeathModal } from './ui/DeathModal';
import { ChatModal } from './ui/ChatModal';
import { SettingsModal } from './ui/SettingsModal';
import { HelpModal } from './ui/HelpModal';
import { ShaderModal } from './ui/ShaderModal';
import { SkinModal } from './ui/SkinModal';
import { ChatMessage } from './game/network';
import { ItemStack, DEFAULT_HOTBAR, DEFAULT_INVENTORY, CameraPerspective } from './game/constants';
import { ShaderConfig, DEFAULT_SHADER_CONFIG, ShaderProfile } from './game/shaders';
import { SkinManager, SkinPreset } from './game/skinManager';
import { sounds } from './game/audio';
import * as THREE from 'three';

type GameState = 'TITLE' | 'SERVER_BROWSER' | 'PLAYING';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [roomId, setRoomId] = useState<string>('bedrock-lobby');
  const [playerName, setPlayerName] = useState<string>(() => {
    return 'Player_' + Math.floor(Math.random() * 900 + 100);
  });
  const [skinType, setSkinType] = useState<'steve' | 'alex'>('steve');
  const [currentSkinId, setCurrentSkinId] = useState<string>('steve');

  // Modals
  const [isPauseOpen, setIsPauseOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCraftingTableOpen, setIsCraftingTableOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isShaderOpen, setIsShaderOpen] = useState(false);
  const [isSkinOpen, setIsSkinOpen] = useState(false);
  const [deathReason, setDeathReason] = useState<string | null>(null);

  // Settings
  const [isMuted, setIsMuted] = useState(false);
  const [viewBobbing, setViewBobbing] = useState(true);
  const [shaderConfig, setShaderConfig] = useState<ShaderConfig>(DEFAULT_SHADER_CONFIG);

  // Survival Inventory: Starts 100% EMPTY!
  const [hotbar, setHotbar] = useState<(ItemStack | null)[]>(DEFAULT_HOTBAR);
  const [inventory, setInventory] = useState<(ItemStack | null)[]>(DEFAULT_INVENTORY);

  // Skin manager instance
  const [skinManager] = useState(() => new SkinManager());

  // HUD stats
  const [stats, setStats] = useState<{
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
    perspective: CameraPerspective;
    isHurt: boolean;
    targetedBlockId: number | null;
  }>({
    fps: 60,
    x: 0,
    y: 35,
    z: 0,
    ping: 15,
    playersCount: 1,
    health: 20,
    hunger: 20,
    xpLevel: 1,
    xpProgress: 0.35,
    selectedSlot: 0,
    perspective: 'first',
    isHurt: false,
    targetedBlockId: null,
  });

  // Chat messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: '§eServer',
      text: '§eSelamat datang di Bedrock Unlimited! Hancurkan balok untuk mendapatkan item.',
      isSystem: true,
      timestamp: Date.now(),
    },
  ]);

  // Touch device check
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Canvas mount container & engine instance
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Touch look tracking
  const touchLookRef = useRef<{ touchId: number | null; lastX: number; lastY: number }>({
    touchId: null,
    lastX: 0,
    lastY: 0,
  });

  // URL query parameter `?room=XYZ`
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
      setRoomId(roomParam.trim());
    }
  }, []);

  // Sync View Bobbing setting
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.player.viewBobbingEnabled = viewBobbing;
    }
  }, [viewBobbing]);

  // Sync Shader Settings
  const handleUpdateShaderConfig = (newConfig: Partial<ShaderConfig>) => {
    setShaderConfig((prev) => {
      const next = { ...prev, ...newConfig };
      if (engineRef.current) {
        engineRef.current.shaderManager.setConfig(next);
        if (newConfig.renderDistance) {
          engineRef.current.updateInfiniteChunks(true);
        }
      }
      return next;
    });
  };

  const handleSelectShaderProfile = (profile: ShaderProfile) => {
    if (engineRef.current) {
      engineRef.current.shaderManager.setProfile(profile);
      setShaderConfig({ ...engineRef.current.shaderManager.config });
    }
  };

  // Skin Customization Handlers
  const handleSelectPresetSkin = (type: SkinPreset['type']) => {
    setCurrentSkinId(type);
    if (type === 'steve' || type === 'alex') {
      setSkinType(type);
    }
    const texture = skinManager.setPreset(type);
    if (engineRef.current) {
      engineRef.current.updatePlayerSkin(texture, skinManager.currentDataUrl);
    }
  };

  const handleCustomSkinLoaded = (texture: THREE.CanvasTexture, dataUrl: string) => {
    setCurrentSkinId('custom');
    if (engineRef.current) {
      engineRef.current.updatePlayerSkin(texture, dataUrl);
    }
  };

  const startPlayingWorld = (targetRoomId: string) => {
    setRoomId(targetRoomId);
    setDeathReason(null);
    setGameState('PLAYING');
  };

  // Mount 3D Voxel Engine on 'PLAYING'
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    if (canvasMountRef.current && !engineRef.current) {
      const engine = new GameEngine({
        container: canvasMountRef.current,
        roomId,
        playerName,
        skinType,
        initialHotbar: hotbar,
        initialInventory: inventory,
        shaderConfig,
        onStatsUpdate: (newStats) => {
          setStats(newStats);
        },
        onHotbarChange: (newHotbar) => {
          setHotbar(newHotbar);
        },
        onInventoryChange: (newInventory) => {
          setInventory(newInventory);
        },
        onChatReceived: (msg) => {
          sounds.playPop();
          setChatMessages((prev) => [...prev.slice(-40), msg]);
        },
        onPointerLockChange: () => {},
        onOpenCraftingTable: () => {
          sounds.playPop();
          setIsCraftingTableOpen(true);
          engineRef.current?.exitPointerLock();
        },
        onPlayerDied: (reason) => {
          setDeathReason(reason);
          engineRef.current?.exitPointerLock();
        },
      });

      engine.start();
      engineRef.current = engine;

      // Apply initial custom skin if any
      if (skinManager.currentTexture) {
        engine.updatePlayerSkin(skinManager.currentTexture, skinManager.currentDataUrl);
      }

      if (!isTouchDevice) {
        setTimeout(() => {
          engine.requestPointerLock();
        }, 300);
      }
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, [gameState, roomId]);

  // Global Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'PLAYING') return;
      if (isChatOpen) return;

      if (e.code === 'KeyE') {
        e.preventDefault();
        if (isCraftingTableOpen) {
          setIsCraftingTableOpen(false);
          engineRef.current?.requestPointerLock();
        } else if (isInventoryOpen) {
          setIsInventoryOpen(false);
          engineRef.current?.requestPointerLock();
        } else {
          setIsInventoryOpen(true);
          engineRef.current?.exitPointerLock();
        }
      } else if (e.code === 'KeyT' || e.code === 'Enter') {
        e.preventDefault();
        setIsChatOpen(true);
        engineRef.current?.exitPointerLock();
      } else if (e.code === 'Escape') {
        e.preventDefault();
        if (deathReason) {
          return;
        } else if (isCraftingTableOpen) {
          setIsCraftingTableOpen(false);
          engineRef.current?.requestPointerLock();
        } else if (isSkinOpen) {
          setIsSkinOpen(false);
        } else if (isShaderOpen) {
          setIsShaderOpen(false);
        } else if (isInventoryOpen) {
          setIsInventoryOpen(false);
          engineRef.current?.requestPointerLock();
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isHelpOpen) {
          setIsHelpOpen(false);
        } else {
          setIsPauseOpen((prev) => {
            const next = !prev;
            if (next) engineRef.current?.exitPointerLock();
            else engineRef.current?.requestPointerLock();
            return next;
          });
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [
    gameState,
    isChatOpen,
    isInventoryOpen,
    isCraftingTableOpen,
    isSettingsOpen,
    isHelpOpen,
    isPauseOpen,
    isShaderOpen,
    isSkinOpen,
    deathReason,
  ]);

  // Hotbar slot selection
  const handleSelectSlot = (slotIndex: number) => {
    if (engineRef.current) {
      engineRef.current.selectHotbarSlot(slotIndex);
    }
  };

  const handleUpdateHotbarFromInv = (newHotbar: (ItemStack | null)[]) => {
    setHotbar(newHotbar);
    if (engineRef.current) {
      engineRef.current.hotbar = newHotbar;
      engineRef.current.updateHeldBlock();
    }
  };

  const handleUpdateInventoryFromInv = (newInventory: (ItemStack | null)[]) => {
    setInventory(newInventory);
    if (engineRef.current) {
      engineRef.current.inventory = newInventory;
    }
  };

  // Chat message send
  const handleSendChat = (text: string) => {
    if (text.startsWith('/spawn')) {
      if (engineRef.current) {
        const gy = engineRef.current.world.getTerrainHeight(24, 24);
        engineRef.current.player.position.set(24.5, gy + 3, 24.5);
        engineRef.current.player.velocity.set(0, 0, 0);
      }
      return;
    } else if (text.startsWith('/help')) {
      setIsHelpOpen(true);
      return;
    } else if (text.startsWith('/clear')) {
      setHotbar(Array(9).fill(null));
      setInventory(Array(27).fill(null));
      if (engineRef.current) {
        engineRef.current.hotbar = Array(9).fill(null);
        engineRef.current.inventory = Array(27).fill(null);
        engineRef.current.updateHeldBlock();
      }
      return;
    }

    if (engineRef.current) {
      engineRef.current.network.sendChat(text);
    }
  };

  // Perspective cycling (F5)
  const handleCyclePerspective = () => {
    if (engineRef.current) {
      engineRef.current.player.cyclePerspective();
    }
  };

  // Eat Food
  const handleEatFood = () => {
    if (engineRef.current) {
      engineRef.current.eatSelectedFood();
    }
  };

  // Place Block
  const handlePlaceBlock = () => {
    if (engineRef.current) {
      engineRef.current.placeOrInteract();
    }
  };

  // Mobile Touch Movement & Look
  const handleTouchMove = (x: number, y: number) => {
    if (engineRef.current) {
      engineRef.current.touchMovement = { x, y };
    }
  };

  const handleTouchJump = () => {
    if (engineRef.current) {
      engineRef.current.touchJump = true;
    }
  };

  const handleTouchSneak = () => {
    if (engineRef.current) {
      engineRef.current.player.isSneaking = !engineRef.current.player.isSneaking;
    }
  };

  const handleTouchBreakStart = () => {
    if (engineRef.current) {
      engineRef.current.handleAttackOrMine();
    }
  };

  const handleTouchBreakEnd = () => {
    if (engineRef.current) {
      engineRef.current.handleStopAttackOrMine();
    }
  };

  // Touch Camera Swipe Look on Canvas
  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      // Only capture touch if on the right half of the screen
      if (touch.clientX > window.innerWidth * 0.35 && touchLookRef.current.touchId === null) {
        touchLookRef.current = {
          touchId: touch.identifier,
          lastX: touch.clientX,
          lastY: touch.clientY,
        };
        break;
      }
    }
  };

  const handleCanvasTouchMove = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === touchLookRef.current.touchId && engineRef.current) {
        const dx = touch.clientX - touchLookRef.current.lastX;
        const dy = touch.clientY - touchLookRef.current.lastY;
        touchLookRef.current.lastX = touch.clientX;
        touchLookRef.current.lastY = touch.clientY;

        const sensitivity = 0.004;
        engineRef.current.player.yaw -= dx * sensitivity;
        engineRef.current.player.pitch -= dy * sensitivity;
        const maxPitch = (Math.PI / 2) * 0.98;
        engineRef.current.player.pitch = Math.max(-maxPitch, Math.min(maxPitch, engineRef.current.player.pitch));
        break;
      }
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchLookRef.current.touchId) {
        touchLookRef.current.touchId = null;
        break;
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none font-sans">
      {/* 1. MAIN MENU */}
      {gameState === 'TITLE' && (
        <MainMenu
          playerName={playerName}
          setPlayerName={setPlayerName}
          skinType={skinType}
          setSkinType={setSkinType}
          onPlayClick={() => setGameState('SERVER_BROWSER')}
          onSettingsClick={() => setIsSettingsOpen(true)}
          onHelpClick={() => setIsHelpOpen(true)}
          onOpenSkins={() => setIsSkinOpen(true)}
        />
      )}

      {/* 2. SERVER & WORLD BROWSER */}
      {gameState === 'SERVER_BROWSER' && (
        <ServerBrowserModal
          currentRoomId={roomId}
          onJoinWorld={(targetId) => startPlayingWorld(targetId)}
          onBack={() => setGameState('TITLE')}
        />
      )}

      {/* 3. IN-GAME VIEWPORT & HUD */}
      {gameState === 'PLAYING' && (
        <>
          <div
            ref={canvasMountRef}
            className="absolute inset-0 w-full h-full cursor-crosshair z-0"
            onTouchStart={handleCanvasTouchStart}
            onTouchMove={handleCanvasTouchMove}
            onTouchEnd={handleCanvasTouchEnd}
            onClick={() => {
              if (
                !isPauseOpen &&
                !isInventoryOpen &&
                !isCraftingTableOpen &&
                !isChatOpen &&
                !isSettingsOpen &&
                !isHelpOpen &&
                !isShaderOpen &&
                !isSkinOpen &&
                !deathReason &&
                !isTouchDevice
              ) {
                engineRef.current?.requestPointerLock();
              }
            }}
          />

          <BedrockHUD
            stats={stats}
            hotbar={hotbar}
            recentMessages={chatMessages}
            onSelectSlot={handleSelectSlot}
            onOpenChat={() => {
              sounds.playClick();
              setIsChatOpen(true);
              engineRef.current?.exitPointerLock();
            }}
            onOpenInventory={() => {
              sounds.playClick();
              setIsInventoryOpen(true);
              engineRef.current?.exitPointerLock();
            }}
            onOpenPause={() => {
              sounds.playClick();
              setIsPauseOpen(true);
              engineRef.current?.exitPointerLock();
            }}
            onOpenShaders={() => {
              sounds.playClick();
              setIsShaderOpen(true);
              engineRef.current?.exitPointerLock();
            }}
            onOpenSkins={() => {
              sounds.playClick();
              setIsSkinOpen(true);
              engineRef.current?.exitPointerLock();
            }}
            onCyclePerspective={handleCyclePerspective}
            onOpenCraftingTable={() => {
              sounds.playPop();
              setIsCraftingTableOpen(true);
              engineRef.current?.exitPointerLock();
            }}
            onEatFood={handleEatFood}
            roomId={roomId}
            isTouchDevice={isTouchDevice}
            onTouchJump={handleTouchJump}
            onTouchMove={handleTouchMove}
            onTouchSneak={handleTouchSneak}
            onTouchBreakStart={handleTouchBreakStart}
            onTouchBreakEnd={handleTouchBreakEnd}
            onPlaceBlock={handlePlaceBlock}
          />
        </>
      )}

      {/* DEATH SCREEN MODAL */}
      {deathReason && (
        <DeathModal
          reason={deathReason}
          xpLevel={stats.xpLevel}
          onRespawn={() => {
            setDeathReason(null);
            if (engineRef.current) {
              engineRef.current.respawn();
            }
          }}
          onQuitToTitle={() => {
            if (engineRef.current) {
              engineRef.current.dispose();
              engineRef.current = null;
            }
            setDeathReason(null);
            setGameState('TITLE');
          }}
        />
      )}

      {/* 3x3 CRAFTING TABLE MODAL */}
      {isCraftingTableOpen && (
        <CraftingTableModal
          hotbar={hotbar}
          inventory={inventory}
          onUpdateHotbar={handleUpdateHotbarFromInv}
          onUpdateInventory={handleUpdateInventoryFromInv}
          onClose={() => {
            setIsCraftingTableOpen(false);
            if (!isTouchDevice) {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* CUSTOM SKIN MODAL (Minecraft .png upload & presets) */}
      {isSkinOpen && (
        <SkinModal
          currentSkinId={currentSkinId}
          onSelectPreset={handleSelectPresetSkin}
          onCustomSkinLoaded={handleCustomSkinLoaded}
          onClose={() => {
            setIsSkinOpen(false);
            if (gameState === 'PLAYING' && !isPauseOpen && !isTouchDevice && !deathReason) {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* SHADER & VIDEO SETTINGS MODAL */}
      {isShaderOpen && (
        <ShaderModal
          config={shaderConfig}
          onUpdateConfig={handleUpdateShaderConfig}
          onSelectProfile={handleSelectShaderProfile}
          onClose={() => {
            setIsShaderOpen(false);
            if (gameState === 'PLAYING' && !isPauseOpen && !isTouchDevice && !deathReason) {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* PAUSE MENU MODAL */}
      {isPauseOpen && (
        <PauseMenuModal
          roomId={roomId}
          playersCount={stats.playersCount}
          onResume={() => {
            setIsPauseOpen(false);
            if (!isTouchDevice) {
              engineRef.current?.requestPointerLock();
            }
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenShaders={() => setIsShaderOpen(true)}
          onOpenSkins={() => setIsSkinOpen(true)}
          onQuitToTitle={() => {
            if (engineRef.current) {
              engineRef.current.dispose();
              engineRef.current = null;
            }
            setIsPauseOpen(false);
            setGameState('TITLE');
          }}
        />
      )}

      {/* 2x2 INVENTORY MODAL */}
      {isInventoryOpen && (
        <InventoryModal
          hotbar={hotbar}
          inventory={inventory}
          selectedSlot={stats.selectedSlot}
          onUpdateHotbar={handleUpdateHotbarFromInv}
          onUpdateInventory={handleUpdateInventoryFromInv}
          onClose={() => {
            setIsInventoryOpen(false);
            if (!isTouchDevice) {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* CHAT MODAL */}
      {isChatOpen && (
        <ChatModal
          messages={chatMessages}
          onSendMessage={handleSendChat}
          onClose={() => {
            setIsChatOpen(false);
            if (!isTouchDevice) {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          viewBobbing={viewBobbing}
          setViewBobbing={setViewBobbing}
          onOpenShaders={() => setIsShaderOpen(true)}
          onClose={() => {
            setIsSettingsOpen(false);
            if (gameState === 'PLAYING' && !isPauseOpen && !isTouchDevice && !deathReason) {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}

      {/* HELP & CONTROLS MODAL */}
      {isHelpOpen && (
        <HelpModal
          onClose={() => {
            setIsHelpOpen(false);
            if (gameState === 'PLAYING' && !isPauseOpen && !isTouchDevice && !deathReason) {
              engineRef.current?.requestPointerLock();
            }
          }}
        />
      )}
    </div>
  );
}
