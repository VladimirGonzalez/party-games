export const dynamic = "force-dynamic";
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/core/store";
import { getGame } from "@/core/registry";
export const dynamic = "force-dynamic";

export default function GamePage() {
  const router = useRouter();
  const { room, localPlayerId, dispatchAction } = useStore();

  useEffect(() => {
    if (!room) router.replace("/");
    else if (room.phase === "lobby") router.replace("/lobby");
    else if (room.phase === "results") router.replace("/results");
  }, [room, router]);

  if (!room || !room.selectedGameId || !room.gameState || !localPlayerId) return null;

  const game = getGame(room.selectedGameId);
  if (!game) return null;

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{game.emoji}</span>
          <span className="text-white font-bold">{game.name}</span>
        </div>
        <span className="text-gray-400 text-sm">
          Ronda {room.gameState.round}
        </span>
      </div>

      {/* Game render area */}
      <div className="flex-1 overflow-y-auto">
        {game.render(room.gameState, localPlayerId, dispatchAction)}
      </div>
    </main>
  );
}
