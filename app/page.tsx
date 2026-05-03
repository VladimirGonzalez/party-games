"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/core/store";

export default function HomePage() {
  const router = useRouter();
  const { createRoom, joinRoom, room } = useStore();
  const [mode, setMode] = useState<"idle" | "create" | "join">("idle");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");

  function handleCreate() {
    if (!name.trim()) return setError("Escribe tu nombre");
    createRoom(name.trim());
    router.push("/lobby");
  }

  function handleJoin() {
    if (!name.trim()) return setError("Escribe tu nombre");
    if (!roomId.trim()) return setError("Escribe el código de sala");
    const ok = joinRoom(roomId.trim().toUpperCase(), name.trim());
    if (!ok) return setError("Sala no encontrada. ¿El código es correcto?");
    router.push("/lobby");
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="text-6xl mb-3">🎉</div>
        <h1 className="text-white text-4xl font-black tracking-tight">Party Games</h1>
        <p className="text-gray-500 text-sm mt-1">Juegos para jugar en grupo</p>
      </div>

      {mode === "idle" && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setMode("create")}
            className="bg-yellow-400 text-black font-black text-lg py-4 rounded-2xl active:scale-95 transition-all shadow-lg"
          >
            🏠 Crear sala
          </button>
          <button
            onClick={() => setMode("join")}
            className="bg-gray-800 text-white font-bold text-lg py-4 rounded-2xl active:scale-95 transition-all border border-gray-700"
          >
            🚪 Unirse a sala
          </button>
        </div>
      )}

      {(mode === "create" || mode === "join") && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button onClick={() => { setMode("idle"); setError(""); }} className="text-gray-500 text-sm mb-1 text-left">← Volver</button>
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            className="bg-gray-800 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-lg outline-none focus:ring-2 focus:ring-yellow-400 border border-gray-700"
            maxLength={16}
            autoFocus
          />

          {mode === "join" && (
            <input
              type="text"
              placeholder="Código de sala"
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(""); }}
              className="bg-gray-800 text-white placeholder-gray-500 px-4 py-3 rounded-xl text-lg outline-none focus:ring-2 focus:ring-yellow-400 border border-gray-700 uppercase tracking-widest"
              maxLength={6}
            />
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            onClick={mode === "create" ? handleCreate : handleJoin}
            className="bg-yellow-400 text-black font-black text-lg py-4 rounded-2xl active:scale-95 transition-all shadow-lg mt-1"
          >
            {mode === "create" ? "Crear sala" : "Unirse"}
          </button>
        </div>
      )}

      <p className="text-gray-700 text-xs mt-12">Sin cuenta · Sin registro · Juega ya</p>
    </main>
  );
}
