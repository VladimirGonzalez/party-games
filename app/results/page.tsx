"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/core/store";
import { getGame } from "@/core/registry";

export default function ResultsPage() {
  const router = useRouter();
  const { room, localPlayerId, nextRound, endGame } = useStore();

  useEffect(() => {
    if (!room) router.replace("/");
    else if (room.phase === "lobby") router.replace("/lobby");
    else if (room.phase === "playing") router.replace("/game");
  }, [room, router]);

  if (!room || !room.lastResult || !localPlayerId) return null;

  const result = room.lastResult;
  const game = room.selectedGameId ? getGame(room.selectedGameId) : null;

  const sortedPlayers = [...room.players].sort(
    (a, b) => (result.scores[b.id] ?? 0) - (result.scores[a.id] ?? 0)
  );

  const winner = room.players.find((p) => p.id === result.winnerId);
  const localIsWinner = result.winnerId === localPlayerId;

  function handleNextRound() {
    nextRound();
    router.push("/game");
  }

  function handleEndGame() {
    endGame();
    router.push("/lobby");
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 max-w-md mx-auto">
      {/* Winner banner */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">{localIsWinner ? "🏆" : "🎮"}</div>
        <h1 className="text-white text-3xl font-black">
          {localIsWinner ? "¡Ganaste!" : winner ? `${winner.name} ganó` : "¡Fin!"}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{result.summary}</p>
      </div>

      {/* Leaderboard */}
      <div className="w-full bg-gray-800 rounded-2xl p-4 mb-6">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">Marcador</p>
        {sortedPlayers.map((p, i) => {
          const pts = result.scores[p.id] ?? 0;
          const totalPts = p.score;
          const isFirst = i === 0;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 py-2 ${i < sortedPlayers.length - 1 ? "border-b border-gray-700" : ""}`}
            >
              <span className="text-2xl">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}.`}</span>
              <div className="flex-1">
                <p className={`font-bold ${p.id === localPlayerId ? "text-yellow-400" : "text-white"}`}>
                  {p.name} {p.id === localPlayerId ? "(tú)" : ""}
                </p>
                <p className="text-gray-500 text-xs">Total acumulado: {totalPts} pts</p>
              </div>
              <div className="text-right">
                <p className={`font-black text-lg ${isFirst ? "text-yellow-400" : "text-gray-300"}`}>
                  +{pts}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="w-full flex flex-col gap-3">
        <button
          onClick={handleNextRound}
          className="bg-yellow-400 text-black font-black text-lg py-4 rounded-2xl active:scale-95 transition-all shadow-lg"
        >
          ¡Otra ronda! 🔄
        </button>
        <button
          onClick={handleEndGame}
          className="bg-gray-800 text-white font-bold text-base py-3 rounded-2xl active:scale-95 transition-all border border-gray-700"
        >
          Elegir otro juego
        </button>
      </div>
    </main>
  );
}
