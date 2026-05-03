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

export interface GameModule<TState extends GameState = GameState> {
  id: string;
  name: string;
  description: string;
  emoji: string;
  minPlayers: number;
  maxPlayers: number;

  setup(players: Player[]): TState;
  start(state: TState): TState;
  onAction(state: TState, action: GameAction): TState;
  end(state: TState): GameResult;

  render(
    state: TState,
    playerId: string,
    dispatch: (action: GameAction) => void
  ): ReactNode;
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
