"use client";
import React, { useState, useEffect } from "react";
import { GameModule, GameState, Player, GameAction, GameResult } from "@/core/types";

const WORDS = [
  "Elefante", "Bailar", "Cocinar", "Nadar", "Dormir",
  "Bicicleta", "Astronauta", "Dentista", "Fantasma", "Robot",
  "Pizza", "Médico", "Superhéroe", "Pescador", "Dinosaurio",
];

function pick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface MimicaState extends GameState {
  word: string;
  actorId: string;
  actorIndex: number;
  roundsPerPlayer: number;
  guessedThisRound: boolean;
}

// Helper: cast GameState → MimicaState (safe — setup() always initializes these fields)
function asMimica(state: GameState): MimicaState {
  return state as MimicaState;
}

export const mimicaGame: GameModule = {
  id: "mimica",
  name: "Mímica",
  description: "Actúa sin hablar. Tu equipo adivina.",
  emoji: "🎭",
  minPlayers: 2,
  maxPlayers: 10,

  setup(players: Player[]): GameState {
    const scores: Record<string, number> = {};
    players.forEach((p) => (scores[p.id] = 0));
    const state: MimicaState = {
      phase: "setup",
      currentPlayerId: players[0].id,
      round: 0,
      scores,
      word: "",
      actorId: players[0].id,
      actorIndex: 0,
      roundsPerPlayer: 2,
      guessedThisRound: false,
    };
    return state;
  },

  start(state: GameState): GameState {
    const s = asMimica(state);
    const next: MimicaState = {
      ...s,
      phase: "playing",
      round: s.round + 1,
      word: pick(WORDS),
      guessedThisRound: false,
      timer: 60,
    };
    return next;
  },

  onAction(state: GameState, action: GameAction): GameState {
    const s = asMimica(state);

    if (action.type === "GUESS_CORRECT") {
      const scores = { ...s.scores };
      scores[s.actorId] = (scores[s.actorId] ?? 0) + 1;
      scores[action.playerId] = (scores[action.playerId] ?? 0) + 1;

      const players = Object.keys(scores);
      const nextActorIndex = (s.actorIndex + 1) % players.length;
      const totalRounds = players.length * s.roundsPerPlayer;

      if (s.round >= totalRounds) {
        const finished: MimicaState = { ...s, scores, phase: "finished", guessedThisRound: true };
        return finished;
      }

      const next: MimicaState = {
        ...s,
        scores,
        guessedThisRound: true,
        actorIndex: nextActorIndex,
        actorId: players[nextActorIndex],
        currentPlayerId: players[nextActorIndex],
        word: pick(WORDS),
        round: s.round + 1,
        timer: 60,
      };
      return next;
    }

    if (action.type === "SKIP") {
      const players = Object.keys(s.scores);
      const totalRounds = players.length * s.roundsPerPlayer;
      if (s.round >= totalRounds) {
        return { ...s, phase: "finished" };
      }
      const nextActorIndex = (s.actorIndex + 1) % players.length;
      const next: MimicaState = {
        ...s,
        actorIndex: nextActorIndex,
        actorId: players[nextActorIndex],
        currentPlayerId: players[nextActorIndex],
        word: pick(WORDS),
        round: s.round + 1,
        timer: 60,
        guessedThisRound: false,
      };
      return next;
    }

    if (action.type === "TIMEOUT") {
      // Cast state para la llamada recursiva — es seguro, el mismo objeto
      return mimicaGame.onAction(state, { ...action, type: "SKIP" });
    }

    return state;
  },

  end(state: GameState): GameResult {
    const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
    return {
      winnerId: sorted[0]?.[0] ?? null,
      scores: state.scores,
      summary: "¡Ronda de mímica terminada!",
    };
  },

  render(state: GameState, playerId: string, dispatch) {
    return <MimicaView state={asMimica(state)} playerId={playerId} dispatch={dispatch} />;
  },
};

function MimicaView({
  state,
  playerId,
  dispatch,
}: {
  state: MimicaState;
  playerId: string;
  dispatch: (a: GameAction) => void;
}) {
  const isActor = state.actorId === playerId;
  const [timeLeft, setTimeLeft] = useState(state.timer ?? 60);

  useEffect(() => {
    setTimeLeft(state.timer ?? 60);
  }, [state.round, state.timer]);

  useEffect(() => {
    if (state.phase !== "playing" || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          dispatch({ type: "TIMEOUT", playerId });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.round, state.phase]);

  const pct = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 20 ? "#22c55e" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full max-w-sm mx-auto">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle
            cx="40" cy="40" r="34" fill="none"
            stroke={timerColor} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">
          {timeLeft}
        </span>
      </div>

      <div className="text-center">
        <p className="text-gray-400 text-sm mb-1">Turno #{state.round}</p>
        {isActor ? (
          <>
            <p className="text-gray-400 text-sm mb-3">¡Actúa esta palabra!</p>
            <div className="bg-yellow-400 text-black rounded-2xl px-8 py-6 text-4xl font-black tracking-tight shadow-lg">
              {state.word}
            </div>
            <p className="text-gray-500 text-xs mt-3">Los demás deben adivinar. ¡No puedes hablar!</p>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-sm mb-3">Alguien está actuando…</p>
            <div className="text-6xl mb-2">🎭</div>
            <p className="text-white font-semibold">¿Puedes adivinar?</p>
            {!state.guessedThisRound && (
              <button
                onClick={() => dispatch({ type: "GUESS_CORRECT", playerId })}
                className="mt-4 bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all active:scale-95"
              >
                ✅ ¡Adiviné!
              </button>
            )}
          </>
        )}
      </div>

      {isActor && (
        <button
          onClick={() => dispatch({ type: "SKIP", playerId })}
          className="text-gray-500 text-sm underline mt-2"
        >
          Pasar
        </button>
      )}

      <div className="w-full bg-gray-800 rounded-xl p-3 mt-2">
        <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wider">Puntos</p>
        {Object.entries(state.scores).map(([id, pts]) => (
          <div key={id} className="flex justify-between text-sm py-0.5">
            <span className={id === state.actorId ? "text-yellow-400 font-bold" : "text-gray-300"}>
              {id === playerId ? "Tú" : id} {id === state.actorId ? "🎭" : ""}
            </span>
            <span className="text-white font-bold">{pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
