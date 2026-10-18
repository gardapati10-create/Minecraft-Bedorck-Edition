import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

interface PlayerState {
  id: string;
  name: string;
  skinType: string;
  x: number;
  y: number;
  z: number;
  yaw: number;
  pitch: number;
  walking: boolean;
  jumping: boolean;
  sneaking: boolean;
  swinging: boolean;
  heldItem: number;
  ping: number;
  lastSeen: number;
}

interface Room {
  id: string;
  name: string;
  seed: number;
  mode: 'survival' | 'creative';
  createdAt: number;
  // Sparse world edits: key "x,y,z" -> blockId (0 = air)
  worldEdits: Map<string, number>;
  clients: Map<WebSocket, PlayerState>;
  timeOfDay: number; // 0 to 24000 ticks
}

const rooms = new Map<string, Room>();

function getOrCreateRoom(roomId: string, name?: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      name: name || `World ${roomId}`,
      seed: Math.abs(hashCode(roomId)) || 12345,
      mode: 'survival',
      createdAt: Date.now(),
      worldEdits: new Map(),
      clients: new Map(),
      timeOfDay: 6000, // daytime
    };
    rooms.set(roomId, room);
  }
  return room;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json());

  // Room status API
  app.get('/api/rooms', (_req, res) => {
    const list = Array.from(rooms.values()).map((r) => ({
      id: r.id,
      name: r.name,
      playerCount: r.clients.size,
      seed: r.seed,
      mode: r.mode,
      createdAt: r.createdAt,
    }));
    res.json(list);
  });

  // WebSocket Server attached to same HTTP server
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    let currentRoom: Room | null = null;
    let playerId = '';

    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.type) {
          case 'join': {
            const requestedRoomId = msg.roomId || 'bedrock-lobby';
            const room = getOrCreateRoom(requestedRoomId, msg.roomName);
            currentRoom = room;
            playerId = msg.playerId || `steve-${Math.random().toString(36).substring(2, 7)}`;

            const playerState: PlayerState = {
              id: playerId,
              name: msg.playerName || 'Steve',
              skinType: msg.skinType || 'steve',
              x: msg.x || 0,
              y: msg.y || 68,
              z: msg.z || 0,
              yaw: 0,
              pitch: 0,
              walking: false,
              jumping: false,
              sneaking: false,
              swinging: false,
              heldItem: 1,
              ping: 0,
              lastSeen: Date.now(),
            };

            room.clients.set(ws, playerState);

            // Send existing world edits to new player
            const editsArray: { x: number; y: number; z: number; block: number }[] = [];
            for (const [key, block] of room.worldEdits.entries()) {
              const [x, y, z] = key.split(',').map(Number);
              editsArray.push({ x, y, z, block });
            }

            // Existing other players
            const otherPlayers: PlayerState[] = [];
            for (const [client, state] of room.clients.entries()) {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                otherPlayers.push(state);
              }
            }

            // Acknowledge join
            ws.send(
              JSON.stringify({
                type: 'joined',
                playerId,
                roomId: room.id,
                seed: room.seed,
                timeOfDay: room.timeOfDay,
                worldEdits: editsArray,
                players: otherPlayers,
              })
            );

            // Broadcast new player to all others
            const joinBroadcast = JSON.stringify({
              type: 'player_joined',
              player: playerState,
            });
            for (const [client] of room.clients.entries()) {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(joinBroadcast);
              }
            }

            // Broadcast chat announcement
            const announce = JSON.stringify({
              type: 'chat',
              sender: '§eServer',
              text: `§e${playerState.name} joined the game!`,
              isSystem: true,
              timestamp: Date.now(),
            });
            for (const [client] of room.clients.entries()) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(announce);
              }
            }
            break;
          }

          case 'player_update': {
            if (!currentRoom) return;
            const state = currentRoom.clients.get(ws);
            if (!state) return;

            state.x = msg.x ?? state.x;
            state.y = msg.y ?? state.y;
            state.z = msg.z ?? state.z;
            state.yaw = msg.yaw ?? state.yaw;
            state.pitch = msg.pitch ?? state.pitch;
            state.walking = !!msg.walking;
            state.jumping = !!msg.jumping;
            state.sneaking = !!msg.sneaking;
            state.swinging = !!msg.swinging;
            state.heldItem = msg.heldItem ?? state.heldItem;
            state.lastSeen = Date.now();

            // Broadcast to other players in room
            const updateMsg = JSON.stringify({
              type: 'player_update',
              id: playerId,
              ...msg,
            });

            for (const [client] of currentRoom.clients.entries()) {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(updateMsg);
              }
            }
            break;
          }

          case 'skin_change': {
            if (!currentRoom) return;
            const skinMsg = JSON.stringify({
              type: 'skin_change',
              id: playerId,
              skinData: msg.skinData,
            });
            for (const [client] of currentRoom.clients.entries()) {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(skinMsg);
              }
            }
            break;
          }

          case 'block_edit': {
            if (!currentRoom) return;
            const { x, y, z, block } = msg;
            const key = `${x},${y},${z}`;
            currentRoom.worldEdits.set(key, block);

            // Broadcast to all clients in this room (including sender for confirmation)
            const blockMsg = JSON.stringify({
              type: 'block_edit',
              x,
              y,
              z,
              block,
              playerId,
            });

            for (const [client] of currentRoom.clients.entries()) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(blockMsg);
              }
            }
            break;
          }

          case 'chat': {
            if (!currentRoom) return;
            const state = currentRoom.clients.get(ws);
            const chatMsg = JSON.stringify({
              type: 'chat',
              sender: state ? state.name : 'Player',
              text: msg.text,
              color: msg.color || '#ffffff',
              timestamp: Date.now(),
            });

            for (const [client] of currentRoom.clients.entries()) {
              if (client.readyState === WebSocket.OPEN) {
                client.send(chatMsg);
              }
            }
            break;
          }

          case 'ping': {
            ws.send(JSON.stringify({ type: 'pong', time: msg.time }));
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
      }
    });

    ws.on('close', () => {
      if (currentRoom) {
        const state = currentRoom.clients.get(ws);
        currentRoom.clients.delete(ws);

        if (state) {
          const leaveMsg = JSON.stringify({
            type: 'player_left',
            id: playerId,
          });
          const chatLeave = JSON.stringify({
            type: 'chat',
            sender: '§eServer',
            text: `§e${state.name} left the game`,
            isSystem: true,
            timestamp: Date.now(),
          });

          for (const [client] of currentRoom.clients.entries()) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(leaveMsg);
              client.send(chatLeave);
            }
          }
        }

        // Clean empty room if inactive after 10 minutes
        if (currentRoom.clients.size === 0 && currentRoom.id !== 'bedrock-lobby') {
          setTimeout(() => {
            if (currentRoom && currentRoom.clients.size === 0) {
              rooms.delete(currentRoom.id);
            }
          }, 10 * 60 * 1000);
        }
      }
    });
  });

  // Time loop for day/night broadcast (1 game minute = 500ms)
  setInterval(() => {
    for (const room of rooms.values()) {
      if (room.clients.size > 0) {
        room.timeOfDay = (room.timeOfDay + 20) % 24000;
      }
    }
  }, 1000);

  // Vite middleware in development vs static serving in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  server.listen(PORT, () => {
    console.log(`Bedrock Craft server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
