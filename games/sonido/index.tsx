"use client";
import React, { useState, useEffect } from "react";
import { GameModule, GameState, Player, GameAction, GameResult } from "@/core/types";

const SOUNDS = [
  { label: "Perro ladrando", emoji: "🐶" },
  { label: "Gato maullando", emoji: "🐱" },
  { label: "Tren llegando", emoji: "🚂" },
  { label: "Bebé llorando", emoji: "👶" },
  { label: "Teléfono antiguo", emoji: "📞" },
  { label: "Trueno", emoji: "⛈️" },
  { label: "Aplauso", emoji: "👏" },
  { label: "Ambulancia", emoji: "🚑" },
  { label: "Vaca", emoji: "🐄" },
  { label: "Violin desafinado", emoji: "🎻" },
  { label: "Motor de moto", emoji: "🏍️" },
  { label: "Comer chips", emoji: "🍟" },
];

interface SonidoState extends GameState {
  sound: { label: string; emoji: string };
  actorId: string;
  actorIndex: number;
  guessedThisRound: boolean;
}

function asSonido(state: GameState): SonidoState {
  return state as SonidoState;
}

export const sonidoGame: GameModule = {
  id: "sonido",
  name: "Sonidos",
  description: "Imita el sonido. Sin palabras ni gestos.",
  emoji: "🔊",
  minPlayers: 2,
  maxPlayers: 10,

  setup(players: Player[]): GameState {
    const scores: Record<string, number> = {};
    players.forEach((p) => (scores[p.id] = 0));
    const state: SonidoState = {
      phase: "setup",
      currentPlayerId: players[0].id,
      round: 0,
      scores,
      sound: SOUNDS[0],
      actorId: players[0].id,
      actorIndex: 0,
      guessedThisRound: false,
    };
    return state;
  },

  start(state: GameState): GameState {
    const s = asSonido(state);
    const next: SonidoState = {
      ...s,
      phase: "playing",
      round: s.round + 1,
      sound: SOUNDS[Math.floor(Math.random() * SOUNDS.length)],
      guessedThisRound: false,
      timer: 45,
    };
    return next;
  },

  onAction(state: GameState, action: GameAction): GameState {
    const s = asSonido(state);
    const players = Object.keys(s.scores);
    const totalRounds = players.length * 2;
    const nextActorIndex = (s.actorIndex + 1) % players.length;

    if (action.type === "GUESS_CORRECT") {
      const scores = { ...s.scores };
      scores[s.actorId] = (scores[s.actorId] ?? 0) + 1;
      scores[action.playerId] = (scores[action.playerId] ?? 0) + 1;

      if (s.round >= totalRounds) {
        return { ...s, scores, phase: "finished", guessedThisRound: true };
      }

      const next: SonidoState = {
        ...s, scores, guessedThisRound: true,
        actorIndex: nextActorIndex,
        actorId: players[nextActorIndex],
        currentPlayerId: players[nextActorIndex],
        sound: SOUNDS[Math.floor(Math.random() * SOUNDS.length)],
        round: s.round + 1,
        timer: 45,
      };
      return next;
    }

    if (action.type === "SKIP" || action.type === "TIMEOUT") {
      if (s.round >= totalRounds) return { ...s, phase: "finished" };
      const next: SonidoState = {
        ...s, guessedThisRound: false,
        actorIndex: nextActorIndex,
        actorId: players[nextActorIndex],
        currentPlayerId: players[nextActorIndex],
        sound: SOUNDS[Math.floor(Math.random() * SOUNDS.length)],
        round: s.round + 1,
        timer: 45,
      };
      return next;
    }

    return state;
  },

  end(state: GameState): GameResult {
    const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
    return {
      winnerId: sorted[0]?.[0] ?? null,
      scores: state.scores,
      summary: "¡Ronda de sonidos terminada!",
    };
  },

  render(state: GameState, playerId: string, dispatch) {
    return <SonidoView state={asSonido(state)} playerId={playerId} dispatch={dispatch} />;
  },
};

function SonidoView({
  state,
  playerId,
  dispatch,
}: {
  state: SonidoState;
  playerId: string;
  dispatch: (a: GameAction) => void;
}) {
  const isActor = state.actorId === playerId;
  const [timeLeft, setTimeLeft] = useState(state.timer ?? 45);

  useEffect(() => { setTimeLeft(state.timer ?? 45); }, [state.round, state.timer]);

  useEffect(() => {
    if (state.phase !== "playing" || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); dispatch({ type: "TIMEOUT", playerId }); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.round, state.phase]);

  const pct = (timeLeft / 45) * 100;
  const timerColor = timeLeft > 15 ? "#22c55e" : timeLeft > 8 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-6 p-4 w-full max-w-sm mx-auto">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={timerColor} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">{timeLeft}</span>
      </div>

      <div className="text-center w-full">
        <p className="text-gray-400 text-sm mb-1">Turno #{state.round}</p>
        {isActor ? (
          <>
            <p className="text-gray-400 text-sm mb-3">¡Imita este sonido!</p>
            <div className="bg-purple-500 text-white rounded-2xl px-6 py-6 shadow-lg">
              <div className="text-6xl mb-3">{state.sound.emoji}</div>
              <div className="text-2xl font-black">{state.sound.label}</div>
            </div>
            <p className="text-gray-500 text-xs mt-3">Solo sonido. ¡Sin palabras ni gestos!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-3">👂</div>
            <p className="text-white font-semibold text-lg">Escucha e intenta adivinar</p>
            {!state.guessedThisRound && (
              <button
                onClick={() => dispatch({ type: "GUESS_CORRECT", playerId })}
                className="mt-4 bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-8 rounded-xl text-lg transition-all active:scale-95"
              >
                ✅ ¡Lo adiviné!
              </button>
            )}
          </>
        )}
      </div>

      {isActor && (
        <button onClick={() => dispatch({ type: "SKIP", playerId })} className="text-gray-500 text-sm underline">
          Pasar
        </button>
      )}

      <div className="w-full bg-gray-800 rounded-xl p-3">
        <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wider">Puntos</p>
        {Object.entries(state.scores).map(([id, pts]) => (
          <div key={id} className="flex justify-between text-sm py-0.5">
            <span className={id === state.actorId ? "text-purple-400 font-bold" : "text-gray-300"}>
              {id === playerId ? "Tú" : id} {id === state.actorId ? "🔊" : ""}
            </span>
            <span className="text-white font-bold">{pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
