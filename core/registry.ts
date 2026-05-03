"use client";
import { GameModule } from "./types";
import { mimicaGame } from "@/games/mimica";
import { sonidoGame } from "@/games/sonido";
import { sinDecirGame } from "@/games/sin-decir";
import { reaccionGame } from "@/games/reaccion";

const registry = new Map<string, GameModule>();

function registerGame(game: GameModule) {
  registry.set(game.id, game);
}

// Register all games here — adding a new game = one line
registerGame(mimicaGame);
registerGame(sonidoGame);
registerGame(sinDecirGame);
registerGame(reaccionGame);

export function getGame(id: string): GameModule | undefined {
  return registry.get(id);
}

export function getAllGames(): GameModule[] {
  return Array.from(registry.values());
}
