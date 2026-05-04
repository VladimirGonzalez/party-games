export const dynamic = "force-dynamic";
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/core/store";
import { getAllGames } from "@/core/registry";
export const dynamic = "force-dynamic";

export default function LobbyPage() {
  const router = useRouter();
  const { room, localPlayerId, selectGame, startGame } = useStore();
  const games = getAllGames();

  useEffect(() => {
    if (!room) router.replace("/");
    if (room?.phase === "playing") router.replace("/game");
    if (room?.phase === "results") router.replace("/results");
  }, [room, router]);

  if (!room) return null;

  const localPlayer = room.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost;
  const canStart = !!room.selectedGameId && room.players.length >= 2;
  const selectedGame = games.find((g) => g.id === room.selectedGameId);

  function handleStart() {
    startGame();
    router.push("/game");
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-2">
        <div>
          <h2 className="text-white text-xl font-black">Sala</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-gray-400 text-sm">Código:</span>
            <span className="text-yellow-400 font-black tracking-widest text-lg">{room.id}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Jugadores</p>
          <p className="text-white text-2xl font-black">{room.players.length}</p>
        </div>
      </div>

      {/* Players */}
      <div className="bg-gray-800 rounded-2xl p-4 mb-5">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">En la sala</p>
        <div className="flex flex-col gap-2">
          {room.players.map((p) => (
            <div key={p.id} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold text-white">
                {p.name[0].toUpperCase()}
              </div>
              <span className={`font-semibold ${p.id === localPlayerId ? "text-yellow-400" : "text-white"}`}>
                {p.name} {p.id === localPlayerId ? "(tú)" : ""} {p.isHost ? "👑" : ""}
              </span>
            </div>
          ))}
        </div>
        {room.players.length < 2 && (
          <p className="text-gray-500 text-xs mt-3">Comparte el código para que otros se unan</p>
        )}
      </div>

      {/* Game picker */}
      <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Elige un juego</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {games.map((g) => {
          const selected = room.selectedGameId === g.id;
          const available = room.players.length >= g.minPlayers;
          return (
            <button
              key={g.id}
              onClick={() => isHost && selectGame(g.id)}
              disabled={!isHost}
              className={`rounded-2xl p-4 text-left transition-all border-2 active:scale-95 ${
                selected
                  ? "bg-yellow-400 border-yellow-400 text-black"
                  : available
                  ? "bg-gray-800 border-gray-700 text-white hover:border-gray-500"
                  : "bg-gray-900 border-gray-800 text-gray-600 opacity-60"
              }`}
            >
              <div className="text-3xl mb-2">{g.emoji}</div>
              <p className={`font-bold text-sm ${selected ? "text-black" : "text-white"}`}>{g.name}</p>
              <p className={`text-xs mt-0.5 ${selected ? "text-black/60" : "text-gray-500"}`}>{g.description}</p>
              <p className={`text-xs mt-1 ${selected ? "text-black/50" : "text-gray-600"}`}>
                {g.minPlayers}–{g.maxPlayers} jugadores
              </p>
            </button>
          );
        })}
      </div>

      {/* Start */}
      {isHost ? (
        <button
          onClick={handleStart}
          disabled={!canStart}
          className={`py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${
            canStart
              ? "bg-yellow-400 text-black shadow-lg"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }`}
        >
          {canStart ? `¡Empezar ${selectedGame?.name}!` : "Selecciona un juego (mín. 2 jugadores)"}
        </button>
      ) : (
        <div className="bg-gray-800 rounded-2xl py-4 text-center">
          <p className="text-gray-400 text-sm">Esperando al host…</p>
        </div>
      )}
    </main>
  );
}
