import { ReactNode } from "react";

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface GameResult {
  winnerId: string | null;
  scores: Record<string, number>;
  summary: string;
}

export interface GameAction {
  type: string;
  playerId: string;
  payload?: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface GameState extends Record<string, any> {
  phase: "setup" | "playing" | "round_end" | "finished";
  currentPlayerId: string | null;
  round: number;
  scores: Record<string, number>;
  timer?: number;
}

export interface GameModule {
  id: string;
  name: string;
  description: string;
  emoji: string;
  minPlayers: number;
  maxPlayers: number;
  setup(players: Player[]): GameState;
  start(state: GameState): GameState;
  onAction(state: GameState, action: GameAction): GameState;
  end(state: GameState): GameResult;
  render(state: GameState, playerId: string, dispatch: (action: GameAction) => void): ReactNode;
}

export type RoomPhase = "lobby" | "playing" | "results";

export interface Room {
  id: string;
  players: Player[];
  phase: RoomPhase;
  selectedGameId: string | null;
  gameState: GameState | null;
  lastResult: GameResult | null;
}
