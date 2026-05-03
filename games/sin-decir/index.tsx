"use client";
import React, { useState, useEffect } from "react";
import { GameModule, GameState, Player, GameAction, GameResult } from "@/core/types";

interface Card {
  word: string;
  forbidden: string[];
}

const CARDS: Card[] = [
  { word: "Playa", forbidden: ["mar", "arena", "sol", "vacaciones", "agua"] },
  { word: "Pizza", forbidden: ["queso", "tomate", "italiana", "horno", "cortar"] },
  { word: "Fútbol", forbidden: ["pelota", "gol", "deporte", "jugador", "cancha"] },
  { word: "Avión", forbidden: ["volar", "piloto", "aeropuerto", "cielo", "viaje"] },
  { word: "Perro", forbidden: ["mascota", "ladrar", "hueso", "cola", "peludo"] },
  { word: "Netflix", forbidden: ["serie", "película", "ver", "streaming", "pantalla"] },
  { word: "Cumpleaños", forbidden: ["pastel", "vela", "regalo", "año", "celebrar"] },
  { word: "Dentista", forbidden: ["diente", "muela", "dolor", "taladro", "boca"] },
  { word: "Teléfono", forbidden: ["llamar", "celular", "pantalla", "aplicación", "hablar"] },
  { word: "Libro", forbidden: ["leer", "página", "autor", "historia", "papel"] },
];

interface SinDecirState extends GameState {
  card: Card;
  actorId: string;
  actorIndex: number;
  violations: number;
}

export const sinDecirGame: GameModule = {
  id: "sin-decir",
  name: "Sin Decir",
  description: "Explica sin usar las palabras prohibidas.",
  emoji: "🤐",
  minPlayers: 2,
  maxPlayers: 10,

  setup(players: Player[]): SinDecirState {
    const scores: Record<string, number> = {};
    players.forEach((p) => (scores[p.id] = 0));
    return {
      phase: "setup",
      currentPlayerId: players[0].id,
      round: 0,
      scores,
      card: CARDS[0],
      actorId: players[0].id,
      actorIndex: 0,
      violations: 0,
    };
  },

  start(state: SinDecirState): SinDecirState {
    const card = CARDS[Math.floor(Math.random() * CARDS.length)];
    return { ...state, phase: "playing", round: state.round + 1, card, violations: 0, timer: 60 };
  },

  onAction(state: SinDecirState, action: GameAction): SinDecirState {
    const players = Object.keys(state.scores);
    const totalRounds = players.length * 2;
    const nextIndex = (state.actorIndex + 1) % players.length;
    const card = CARDS[Math.floor(Math.random() * CARDS.length)];

    if (action.type === "GUESS_CORRECT") {
      const scores = { ...state.scores };
      scores[state.actorId] = (scores[state.actorId] ?? 0) + 2;
      scores[action.playerId] = (scores[action.playerId] ?? 0) + 1;
      if (state.round >= totalRounds) return { ...state, scores, phase: "finished" };
      return { ...state, scores, actorIndex: nextIndex, actorId: players[nextIndex], currentPlayerId: players[nextIndex], card, round: state.round + 1, violations: 0, timer: 60 };
    }

    if (action.type === "VIOLATION") {
      const scores = { ...state.scores };
      scores[state.actorId] = Math.max(0, (scores[state.actorId] ?? 0) - 1);
      return { ...state, scores, violations: state.violations + 1 };
    }

    if (action.type === "SKIP" || action.type === "TIMEOUT") {
      if (state.round >= totalRounds) return { ...state, phase: "finished" };
      return { ...state, actorIndex: nextIndex, actorId: players[nextIndex], currentPlayerId: players[nextIndex], card, round: state.round + 1, violations: 0, timer: 60 };
    }

    return state;
  },

  end(state: SinDecirState): GameResult {
    const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
    return { winnerId: sorted[0]?.[0] ?? null, scores: state.scores, summary: "¡Hablar sin decir terminado!" };
  },

  render(state: SinDecirState, playerId: string, dispatch) {
    return <SinDecirView state={state} playerId={playerId} dispatch={dispatch} />;
  },
};

function SinDecirView({ state, playerId, dispatch }: { state: SinDecirState; playerId: string; dispatch: (a: GameAction) => void }) {
  const isActor = state.actorId === playerId;
  const [timeLeft, setTimeLeft] = useState(state.timer ?? 60);

  useEffect(() => { setTimeLeft(state.timer ?? 60); }, [state.round]);

  useEffect(() => {
    if (state.phase !== "playing" || timeLeft <= 0) return;
    const t = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(t); dispatch({ type: "TIMEOUT", playerId }); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [state.round, state.phase]);

  const pct = (timeLeft / 60) * 100;
  const timerColor = timeLeft > 20 ? "#22c55e" : timeLeft > 10 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-5 p-4 w-full max-w-sm mx-auto">
      <div className="relative w-20 h-20">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={timerColor} strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - pct / 100)}`}
            strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-xl">{timeLeft}</span>
      </div>

      {isActor ? (
        <div className="w-full">
          <div className="bg-gray-800 rounded-2xl p-4 mb-4">
            <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider">Explica esta palabra</p>
            <p className="text-white text-3xl font-black mb-4">{state.card.word}</p>
            <p className="text-red-400 text-xs font-semibold mb-2 uppercase tracking-wider">🚫 Palabras prohibidas</p>
            <div className="flex flex-wrap gap-2">
              {state.card.forbidden.map((w) => (
                <span key={w} className="bg-red-900 text-red-300 px-3 py-1 rounded-full text-sm font-medium">{w}</span>
              ))}
            </div>
          </div>
          {state.violations > 0 && (
            <p className="text-red-400 text-sm text-center mb-2">⚠️ {state.violations} violación{state.violations > 1 ? "es" : ""}</p>
          )}
          <div className="flex gap-2">
            <button onClick={() => dispatch({ type: "SKIP", playerId })} className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-xl text-sm font-medium">Pasar</button>
          </div>
        </div>
      ) : (
        <div className="w-full text-center">
          <p className="text-gray-400 text-sm mb-3">Escucha y adivina. También puedes señalar violaciones.</p>
          <div className="text-5xl mb-4">🤐</div>
          <div className="flex flex-col gap-3">
            <button onClick={() => dispatch({ type: "GUESS_CORRECT", playerId })} className="bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-6 rounded-xl text-lg active:scale-95">✅ ¡Adiviné!</button>
            <button onClick={() => dispatch({ type: "VIOLATION", playerId })} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-xl active:scale-95">🚫 ¡Usó una palabra!</button>
          </div>
        </div>
      )}

      <div className="w-full bg-gray-800 rounded-xl p-3">
        <p className="text-gray-400 text-xs mb-2 font-semibold uppercase tracking-wider">Puntos</p>
        {Object.entries(state.scores).map(([id, pts]) => (
          <div key={id} className="flex justify-between text-sm py-0.5">
            <span className={id === state.actorId ? "text-orange-400 font-bold" : "text-gray-300"}>
              {id === playerId ? "Tú" : id} {id === state.actorId ? "🤐" : ""}
            </span>
            <span className="text-white font-bold">{pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
