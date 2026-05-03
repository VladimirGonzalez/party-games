"use client";

import { create } from "zustand";
import { Room, Player, GameAction } from "./types";
import { getGame } from "./registry";
import { subscribeRoom } from "./realtime";
import { updateRoom } from "./rooms";
import { RealtimeChannel } from "@supabase/supabase-js";

function generateId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

let channel = null;
let currentRoomId: string | null = null;
let isHost = false;

interface Store {
  room: Room | null;
  localPlayerId: string | null;

  createRoom(playerName: string): Promise<void>;
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

  async createRoom(playerName: string) {
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

    await updateRoom(roomId, roomData);

    channel = subscribeRoom(roomId, (roomDb: { state } | null) => {
      if (roomDb?.state) {
        set({ room: roomDb.state });
      }
    });
  },

  async joinRoom(roomId: string, playerName: string) {
    const playerId = generateId();

    const player: Player = {
      id: playerId,
      name: playerName,
      score: 0,
      isHost: false,
    };

    currentRoomId = roomId;
    isHost = false;

    channel = subscribeRoom(roomId, (roomDb: { state } | null) => {
      if (roomDb?.state) {
        set({ room: roomDb.state });
      }
    });

    set({ localPlayerId: playerId });

    return true;
  },

  selectGame(gameId: string) {
    const { room } = get();
    if (!room) return;

    const updated = { ...room, selectedGameId: gameId };

    set({ room: updated });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updated);
    }
  },

  startGame() {
    const { room } = get();
    if (!room?.selectedGameId) return;

    const game = getGame(room.selectedGameId);
    if (!game) return;

    const gameState = game.start(game.setup(room.players));

    const updated = {
      ...room,
      phase: "playing" as const,
      gameState,
    };

    set({ room: updated });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updated);
    }
  },

  dispatchAction(action: GameAction) {
    const { room } = get();
    if (!room?.selectedGameId || !room.gameState) return;

    const game = getGame(room.selectedGameId);
    if (!game) return;

    const newState = game.onAction(room.gameState, action);

    let updated: Room;

    if (newState.phase === "finished") {
      const result = game.end(newState);

      const updatedPlayers = room.players.map((p) => ({
        ...p,
        score: p.score + (result.scores[p.id] ?? 0),
      }));

      updated = {
        ...room,
        phase: "results",
        gameState: newState,
        lastResult: result,
        players: updatedPlayers,
      };
    } else {
      updated = {
        ...room,
        gameState: newState,
      };
    }

    set({ room: updated });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updated);
    }
  },

  nextRound() {
    const { room } = get();
    if (!room?.selectedGameId || !room.gameState) return;

    const game = getGame(room.selectedGameId);
    if (!game) return;

    const newState = game.start(room.gameState);

    const updated = {
      ...room,
      phase: "playing" as const,
      gameState: newState,
    };

    set({ room: updated });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updated);
    }
  },

  endGame() {
    const { room } = get();
    if (!room) return;

    const updated = {
      ...room,
      phase: "lobby" as const,
      gameState: null,
      lastResult: null,
    };

    set({ room: updated });

    if (isHost && currentRoomId) {
      updateRoom(currentRoomId, updated);
    }
  },

  resetRoom() {
    if (channel?.unsubscribe) {
      channel.unsubscribe();
    }

    channel = null;
    currentRoomId = null;
    isHost = false;

    set({ room: null, localPlayerId: null });
  },
}));