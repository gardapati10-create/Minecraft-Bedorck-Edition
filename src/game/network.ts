// Multiplayer Client Network Manager supporting WebSockets with BroadcastChannel fallback
import * as THREE from 'three';

export interface RemotePlayer {
  id: string;
  name: string;
  skinType: 'steve' | 'alex';
  skinData?: string;
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
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  color?: string;
  isSystem?: boolean;
  timestamp: number;
}

type NetworkCallback = {
  onJoinSuccess?: (data: {
    playerId: string;
    roomId: string;
    seed: number;
    worldEdits: { x: number; y: number; z: number; block: number }[];
    players: RemotePlayer[];
  }) => void;
  onPlayerJoined?: (player: RemotePlayer) => void;
  onPlayerLeft?: (playerId: string) => void;
  onPlayerUpdate?: (data: RemotePlayer) => void;
  onSkinChange?: (data: { id: string; skinData: string }) => void;
  onBlockEdit?: (data: { x: number; y: number; z: number; block: number; playerId: string }) => void;
  onChat?: (msg: ChatMessage) => void;
  onPing?: (pingMs: number) => void;
};

export class NetworkManager {
  private ws: WebSocket | null = null;
  private bc: BroadcastChannel | null = null;
  private callbacks: NetworkCallback = {};
  public isConnected: boolean = false;
  public roomId: string = 'bedrock-lobby';
  public playerId: string = '';
  public playerName: string = 'Steve';
  public skinType: 'steve' | 'alex' = 'steve';
  public ping: number = 0;

  private pingTimer: number | null = null;
  private lastPingSent: number = 0;

  constructor() {
    this.playerId = 'player_' + Math.random().toString(36).substring(2, 8);
    try {
      this.bc = new BroadcastChannel('bedrock_craft_broadcast');
      this.bc.onmessage = (e) => this.handleMessage(e.data);
    } catch {
      // BroadcastChannel unsupported
    }
  }

  public connect(roomId: string, playerName: string, skinType: 'steve' | 'alex', callbacks: NetworkCallback) {
    this.roomId = roomId;
    this.playerName = playerName;
    this.skinType = skinType;
    this.callbacks = callbacks;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.send({
          type: 'join',
          roomId: this.roomId,
          playerId: this.playerId,
          playerName: this.playerName,
          skinType: this.skinType,
        });

        // Start ping loop
        this.pingTimer = window.setInterval(() => {
          this.lastPingSent = performance.now();
          this.send({ type: 'ping', time: this.lastPingSent });
        }, 3000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onerror = () => {
        console.warn('WebSocket connection failed, falling back to local BroadcastChannel.');
        this.isConnected = false;
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        if (this.pingTimer) clearInterval(this.pingTimer);
      };
    } catch {
      this.isConnected = false;
    }
  }

  private handleMessage(msg: Record<string, unknown>) {
    switch (msg.type) {
      case 'joined':
        this.callbacks.onJoinSuccess?.(msg as unknown as Parameters<NonNullable<NetworkCallback['onJoinSuccess']>>[0]);
        break;
      case 'player_joined':
        this.callbacks.onPlayerJoined?.((msg as unknown as { player: RemotePlayer }).player);
        break;
      case 'player_left':
        this.callbacks.onPlayerLeft?.((msg as unknown as { id: string }).id);
        break;
      case 'player_update':
        this.callbacks.onPlayerUpdate?.(msg as unknown as RemotePlayer);
        break;
      case 'skin_change':
        this.callbacks.onSkinChange?.(msg as unknown as { id: string; skinData: string });
        break;
      case 'block_edit':
        this.callbacks.onBlockEdit?.(msg as unknown as Parameters<NonNullable<NetworkCallback['onBlockEdit']>>[0]);
        break;
      case 'chat': {
        const chat = msg as unknown as ChatMessage;
        chat.id = chat.id || `${Date.now()}_${Math.random()}`;
        this.callbacks.onChat?.(chat);
        break;
      }
      case 'pong': {
        if (this.lastPingSent > 0) {
          this.ping = Math.round(performance.now() - this.lastPingSent);
          this.callbacks.onPing?.(this.ping);
        }
        break;
      }
    }
  }

  public send(data: Record<string, unknown>) {
    const payload = JSON.stringify(data);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else if (this.bc) {
      // Local broadcast fallback
      this.bc.postMessage(data);
    }
  }

  public broadcastPlayerMove(
    pos: THREE.Vector3,
    yaw: number,
    pitch: number,
    walking: boolean,
    jumping: boolean,
    sneaking: boolean,
    swinging: boolean,
    heldItem: number
  ) {
    this.send({
      type: 'player_update',
      x: Math.round(pos.x * 100) / 100,
      y: Math.round(pos.y * 100) / 100,
      z: Math.round(pos.z * 100) / 100,
      yaw: Math.round(yaw * 100) / 100,
      pitch: Math.round(pitch * 100) / 100,
      walking,
      jumping,
      sneaking,
      swinging,
      heldItem,
    });
  }

  public sendBlockEdit(x: number, y: number, z: number, block: number) {
    this.send({
      type: 'block_edit',
      x,
      y,
      z,
      block,
    });
  }

  public sendChat(text: string) {
    this.send({
      type: 'chat',
      text,
    });
  }

  public sendSkinChange(skinData: string) {
    this.send({
      type: 'skin_change',
      id: this.playerId,
      skinData,
    });
  }

  public disconnect() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}
