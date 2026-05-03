"use client";
import { create } from "zustand";
import { Room, Player, GameAction } from "./types";
import { getGame } from "./registry";
import { subscribeRoom } from "./realtime";
import { updateRoom } from "./rooms";

function generateId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

let channel: any = null;
let currentRoomId: string | null = null;
let isHost = false;

interface Store {
  room: Room | null;
  localPlayerId: string | null;

  createRoom(playerName: string): void;
  joinRoom(roomId: string, playerName: string): Promise<boolean>;
  selectGame(gameId: string): void;
  startGame(): void;
  dispatchAction(action: GameAction): void;
  nextRound(): void;
  endGame(): void;
  resetRoom(): void;
}

export const useStore = create<Store>((set, get) => ({
  room: null,
  localPlayerId: null,

  async createRoom(playerName) {
    const playerId = generateId();
    const roomId = generateId();

    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: true,
    };

    const roomData: Room = {
      id: roomId,
      players: [player],
      phase: "lobby",
      selectedGameId: null,
      gameState: null,
      lastResult: null,
    };

    currentRoomId = roomId;
    isHost = true;

    set({
      localPlayerId: playerId,
      room: roomData,
    });

    // 🔥 subir a Supabase
    await updateRoom(roomId, roomData);

    // 🔥 escuchar cambios
    channel = subscribeRoom(roomId, (roomDb) => {
      if (roomDb?.state) {
        set({ room: roomDb.state });
      }
    });
  },

  async joinRoom(roomId, playerName) {
    const playerId = generateId();

    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: false,
    };

    currentRoomId = roomId;
    isHost = false;

    // 🔥 escuchar cambios primero
    channel = subscribeRoom(roomId, (roomDb) => {
      if (roomDb?.state) {
        set({ room: roomDb.state });
      }
    });

    set({
      localPlayerId: playerId,
    });

    // ⚠️ el host es quien realmente agrega jugadores al state
    return true;
  },

  selectGame(gameId) {
    const { room } = get();
    if (!room) return;

    const updatedRoom = { ...room, selectedGameId: gameId };

    set({ room: updatedRoom });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updatedRoom);
    }
  },

  startGame() {
    const { room } = get();
    if (!room?.selectedGameId) return;

    const game = getGame(room.selectedGameId);
    if (!game) return;

    const gameState = game.start(game.setup(room.players));

    const updatedRoom = {
      ...room,
      phase: "playing",
      gameState,
    };

    set({ room: updatedRoom });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updatedRoom);
    }
  },

  dispatchAction(action) {
    const { room } = get();
    if (!room?.selectedGameId || !room.gameState) return;

    const game = getGame(room.selectedGameId);
    if (!game) return;

    const newState = game.onAction(room.gameState, action);

    let updatedRoom: Room;

    if (newState.phase === "finished") {
      const result = game.end(newState);

      const updatedPlayers = room.players.map((p) => ({
        ...p,
        score: p.score + (result.scores[p.id] ?? 0),
      }));

      updatedRoom = {
        ...room,
        phase: "results",
        gameState: newState,
        lastResult: result,
        players: updatedPlayers,
      };
    } else {
      updatedRoom = {
        ...room,
        gameState: newState,
      };
    }

    set({ room: updatedRoom });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updatedRoom);
    }
  },

  nextRound() {
    const { room } = get();
    if (!room?.selectedGameId || !room.gameState) return;

    const game = getGame(room.selectedGameId);
    if (!game) return;

    const newState = game.start(room.gameState);

    const updatedRoom = {
      ...room,
      phase: "playing",
      gameState: newState,
    };

    set({ room: updatedRoom });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updatedRoom);
    }
  },

  endGame() {
    const { room } = get();
    if (!room) return;

    const updatedRoom = {
      ...room,
      phase: "lobby",
      gameState: null,
      lastResult: null,
    };

    set({ room: updatedRoom });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updatedRoom);
    }
  },

  resetRoom() {
    if (channel) {
      channel.unsubscribe();
      channel = null;
    }

    currentRoomId = null;
    isHost = false;

    set({ room: null, localPlayerId: null });
  },
}));