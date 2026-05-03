"use client";
/**
 * EJEMPLO: Cómo agregar un nuevo juego
 * =====================================
 * 1. Crea esta carpeta: /games/trivia/
 * 2. Define tu módulo implementando GameModule
 * 3. Importa y registra en /core/registry.ts con registerGame(triviaGame)
 * ¡Listo! Sin tocar ningún otro archivo.
 */

import React, { useState } from "react";
import { GameModule, GameState, Player, GameAction, GameResult } from "@/core/types";

const QUESTIONS = [
  { q: "¿Cuántos continentes hay?", options: ["5", "6", "7", "8"], correct: 2 },
  { q: "¿Cuál es el océano más grande?", options: ["Atlántico", "Índico", "Pacífico", "Ártico"], correct: 2 },
  { q: "¿En qué año llegó el hombre a la luna?", options: ["1965", "1967", "1969", "1971"], correct: 2 },
];

interface TriviaState extends GameState {
  questionIndex: number;
  answered: Record<string, number>; // playerId -> option index
}

export const triviaGame: GameModule = {
  id: "trivia",
  name: "Trivia",
  description: "Responde preguntas más rápido que los demás.",
  emoji: "🧠",
  minPlayers: 2,
  maxPlayers: 8,

  setup(players: Player[]): TriviaState {
    const scores: Record<string, number> = {};
    players.forEach((p) => (scores[p.id] = 0));
    return { phase: "setup", currentPlayerId: null, round: 0, scores, questionIndex: 0, answered: {} };
  },

  start(state: TriviaState): TriviaState {
    return { ...state, phase: "playing", round: state.round + 1, questionIndex: 0, answered: {}, timer: 15 };
  },

  onAction(state: TriviaState, action: GameAction): TriviaState {
    if (action.type === "ANSWER") {
      const answered = { ...state.answered, [action.playerId]: action.payload as number };
      const playerCount = Object.keys(state.scores).length;
      const q = QUESTIONS[state.questionIndex];

      // All answered or timeout → next question
      if (Object.keys(answered).length >= playerCount) {
        const scores = { ...state.scores };
        Object.entries(answered).forEach(([id, idx]) => {
          if (idx === q.correct) scores[id] = (scores[id] ?? 0) + 1;
        });

        const nextQ = state.questionIndex + 1;
        if (nextQ >= QUESTIONS.length) return { ...state, scores, phase: "finished", answered };
        return { ...state, scores, answered: {}, questionIndex: nextQ, timer: 15 };
      }

      return { ...state, answered };
    }
    return state;
  },

  end(state: TriviaState): GameResult {
    const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
    return { winnerId: sorted[0]?.[0] ?? null, scores: state.scores, summary: "¡Trivia terminada!" };
  },

  render(state: TriviaState, playerId: string, dispatch) {
    const q = QUESTIONS[state.questionIndex];
    const hasAnswered = state.answered[playerId] !== undefined;

    return (
      <div className="flex flex-col items-center gap-6 p-4 w-full max-w-sm mx-auto">
        <p className="text-gray-400 text-sm">Pregunta {state.questionIndex + 1} / {QUESTIONS.length}</p>
        <div className="bg-gray-800 rounded-2xl p-5 w-full">
          <p className="text-white text-xl font-bold text-center">{q.q}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !hasAnswered && dispatch({ type: "ANSWER", playerId, payload: i })}
              disabled={hasAnswered}
              className={`py-4 px-3 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                hasAnswered && state.answered[playerId] === i ? "bg-blue-500 text-white" :
                hasAnswered ? "bg-gray-800 text-gray-600" :
                "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        {hasAnswered && (
          <p className="text-gray-400 text-sm">Esperando a los demás…</p>
        )}
      </div>
    );
  },
};
