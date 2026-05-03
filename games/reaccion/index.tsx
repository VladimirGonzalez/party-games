"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { GameModule, GameState, Player, GameAction, GameResult } from "@/core/types";

interface ReaccionState extends GameState {
  signal: "waiting" | "ready" | "go" | "done";
  winnerOfRound: string | null;
  startTime: number | null;
  roundWins: Record<string, number>;
  totalRounds: number;
}

export const reaccionGame: GameModule = {
  id: "reaccion",
  name: "Reacción",
  description: "¡Toca primero cuando veas la señal!",
  emoji: "⚡",
  minPlayers: 2,
  maxPlayers: 8,

  setup(players: Player[]): ReaccionState {
    const scores: Record<string, number> = {};
    const roundWins: Record<string, number> = {};
    players.forEach((p) => { scores[p.id] = 0; roundWins[p.id] = 0; });
    return {
      phase: "setup",
      currentPlayerId: null,
      round: 0,
      scores,
      signal: "waiting",
      winnerOfRound: null,
      startTime: null,
      roundWins,
      totalRounds: Math.min(10, players.length * 3),
    };
  },

  start(state: ReaccionState): ReaccionState {
    return { ...state, phase: "playing", signal: "waiting", winnerOfRound: null, startTime: null, round: state.round + 1 };
  },

  onAction(state: ReaccionState, action: GameAction): ReaccionState {
    if (action.type === "SET_GO") {
      return { ...state, signal: "go", startTime: action.payload as number };
    }

    if (action.type === "TAP" && state.signal === "go" && !state.winnerOfRound) {
      const reactionMs = Date.now() - (state.startTime ?? Date.now());
      const scores = { ...state.scores };
      const roundWins = { ...state.roundWins };
      scores[action.playerId] = (scores[action.playerId] ?? 0) + 1;
      roundWins[action.playerId] = (roundWins[action.playerId] ?? 0) + 1;

      const newState = { ...state, signal: "done" as const, winnerOfRound: action.playerId, scores, roundWins };

      if (state.round >= state.totalRounds) {
        return { ...newState, phase: "finished" };
      }
      return newState;
    }

    if (action.type === "NEXT_ROUND") {
      return reaccionGame.start(state);
    }

    return state;
  },

  end(state: ReaccionState): GameResult {
    const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
    return { winnerId: sorted[0]?.[0] ?? null, scores: state.scores, summary: "¡Reacción terminada!" };
  },

  render(state: ReaccionState, playerId: string, dispatch) {
    return <ReaccionView state={state} playerId={playerId} dispatch={dispatch} />;
  },
};

function ReaccionView({ state, playerId, dispatch }: { state: ReaccionState; playerId: string; dispatch: (a: GameAction) => void }) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHost = true; // In local MVP, first player manages the signal

  const startCountdown = useCallback(() => {
    if (state.signal !== "waiting") return;
    setCountdown(3);
    let count = 3;
    const tick = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(tick);
        setCountdown(null);
        // Random delay before GO
        const delay = 500 + Math.random() * 3000;
        timerRef.current = setTimeout(() => {
          dispatch({ type: "SET_GO", playerId, payload: Date.now() });
        }, delay);
      } else {
        setCountdown(count);
      }
    }, 1000);
  }, [state.signal, dispatch, playerId]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const bgColor =
    state.signal === "go" ? "bg-green-500" :
    state.signal === "done" ? (state.winnerOfRound === playerId ? "bg-blue-600" : "bg-gray-800") :
    "bg-gray-900";

  return (
    <div className={`flex flex-col items-center gap-6 p-4 w-full max-w-sm mx-auto min-h-[50vh] justify-center rounded-2xl transition-colors duration-150 ${bgColor}`}>
      <p className="text-gray-400 text-sm">Ronda {state.round} / {state.totalRounds}</p>

      {state.signal === "waiting" && (
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          {countdown !== null ? (
            <p className="text-white text-7xl font-black">{countdown}</p>
          ) : (
            <button
              onClick={startCountdown}
              className="bg-yellow-400 text-black font-black text-xl py-4 px-10 rounded-2xl active:scale-95 transition-all shadow-lg"
            >
              ¡Prepararse!
            </button>
          )}
        </div>
      )}

      {state.signal === "go" && (
        <button
          onClick={() => dispatch({ type: "TAP", playerId })}
          className="w-48 h-48 bg-white rounded-full text-5xl font-black text-green-600 shadow-2xl active:scale-90 transition-transform select-none"
        >
          ¡YA!
        </button>
      )}

      {state.signal === "done" && (
        <div className="text-center">
          {state.winnerOfRound === playerId ? (
            <>
              <div className="text-7xl mb-2">🏆</div>
              <p className="text-white text-2xl font-black">¡Ganaste esta ronda!</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-2">😔</div>
              <p className="text-white text-xl font-semibold">
                {state.winnerOfRound ? `${state.winnerOfRound} fue más rápido` : "Nadie reaccionó"}
              </p>
            </>
          )}
          <button
            onClick={() => dispatch({ type: "NEXT_ROUND", playerId })}
            className="mt-4 bg-white text-gray-900 font-bold py-2 px-8 rounded-xl"
          >
            Siguiente ronda →
          </button>
        </div>
      )}

      <div className="w-full bg-black/30 rounded-xl p-3">
        <p className="text-gray-300 text-xs mb-2 font-semibold uppercase tracking-wider">Puntos</p>
        {Object.entries(state.scores)
          .sort((a, b) => b[1] - a[1])
          .map(([id, pts]) => (
            <div key={id} className="flex justify-between text-sm py-0.5">
              <span className={id === playerId ? "text-yellow-300 font-bold" : "text-gray-300"}>
                {id === playerId ? "Tú" : id}
              </span>
              <span className="text-white font-bold">{pts}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
