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

export const mimicaGame: GameModule = {
  id: "mimica",
  name: "Mímica",
  description: "Actúa sin hablar. Tu equipo adivina.",
  emoji: "🎭",
  minPlayers: 2,
  maxPlayers: 10,

  setup(players: Player[]): MimicaState {
    const scores: Record<string, number> = {};
    players.forEach((p) => (scores[p.id] = 0));

    return {
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
  },

  start(state: MimicaState): MimicaState {
    return {
      ...state,
      phase: "playing",
      round: state.round + 1,
      word: pick(WORDS),
      guessedThisRound: false,
      timer: 60,
    };
  },

  onAction(state: MimicaState, action: GameAction): MimicaState {
    if (action.type === "GUESS_CORRECT") {
      const scores = { ...state.scores };

      scores[state.actorId] = (scores[state.actorId] ?? 0) + 1;
      scores[action.playerId] = (scores[action.playerId] ?? 0) + 1;

      const players = Object.keys(scores);
      const nextActorIndex = (state.actorIndex + 1) % players.length;
      const totalRounds = players.length * state.roundsPerPlayer;

      if (state.round >= totalRounds) {
        return { ...state, scores, phase: "finished", guessedThisRound: true };
      }

      return {
        ...state,
        scores,
        guessedThisRound: true,
        actorIndex: nextActorIndex,
        actorId: players[nextActorIndex],
        currentPlayerId: players[nextActorIndex],
        word: pick(WORDS),
        round: state.round + 1,
        timer: 60,
      };
    }

    if (action.type === "SKIP") {
      const players = Object.keys(state.scores);
      const nextActorIndex = (state.actorIndex + 1) % players.length;

      return {
        ...state,
        actorIndex: nextActorIndex,
        actorId: players[nextActorIndex],
        currentPlayerId: players[nextActorIndex],
        word: pick(WORDS),
        round: state.round + 1,
        timer: 60,
        guessedThisRound: false,
      };
    }

    if (action.type === "TIMEOUT") {
      return this.onAction(state, { ...action, type: "SKIP" });
    }

    return state;
  },

  end(state: MimicaState): GameResult {
    const sorted = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);

    return {
      winnerId: sorted[0]?.[0] ?? null,
      scores: state.scores,
      summary: "¡Ronda de mímica terminada!",
    };
  },

  render(state: MimicaState, playerId: string, dispatch) {
    return (
      <MimicaView state={state} playerId={playerId} dispatch={dispatch} />
    );
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
  }, [state.round, state.phase, timeLeft]);

  return (
    <div className="text-white">
      <h1>Mímica 🎭</h1>
      <p>Turno: {state.round}</p>

      {isActor ? (
        <div>
          <h2>{state.word}</h2>
        </div>
      ) : (
        <button onClick={() => dispatch({ type: "GUESS_CORRECT", playerId })}>
          Adiviné
        </button>
      )}
    </div>
  );
}