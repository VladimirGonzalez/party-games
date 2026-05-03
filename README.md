# 🎉 Party Games

App modular de party games para jugar en grupo. Mobile-first, sin backend, desplegable en Vercel en minutos.

---

## Estructura del proyecto

```
/app
  page.tsx          → Home (crear/unirse a sala)
  /lobby/page.tsx   → Sala de espera + selector de juego
  /game/page.tsx    → Pantalla de juego activo
  /results/page.tsx → Resultados + puntuación
  layout.tsx
  globals.css

/core
  types.ts          → Interfaces: Player, GameModule, GameState, Room…
  registry.ts       → Registro dinámico de juegos
  store.ts          → Estado global con Zustand

/games
  /mimica/          → Mímica (actúa sin hablar)
  /sonido/          → Sonidos (imita sin palabras)
  /sin-decir/       → Hablar sin palabras prohibidas
  /reaccion/        → Reacción rápida (toca primero)
  /trivia/          → Ejemplo de cómo agregar un nuevo juego
```

---

## Cómo funciona el sistema

### GameModule Interface

Cada juego exporta un objeto que implementa `GameModule`:

```ts
type GameModule = {
  id: string
  name: string
  description: string
  emoji: string
  minPlayers: number
  maxPlayers: number

  setup(players): GameState        // Estado inicial
  start(state): GameState          // Inicia/reinicia ronda
  onAction(state, action): GameState // Procesa acciones de jugadores
  end(state): GameResult           // Calcula resultado final
  render(state, playerId, dispatch): ReactNode // UI del juego
}
```

### Estado global (Zustand)

```
createRoom → joinRoom → selectGame → startGame → dispatchAction → [results] → nextRound | endGame
```

El store coordina la Room (lobby, playing, results) y delega la lógica de juego al GameModule correspondiente.

### Registro dinámico

`/core/registry.ts` registra todos los juegos. Para agregar uno nuevo: una sola línea.

---

## Agregar un nuevo juego (3 pasos)

### 1. Crear carpeta con tu juego

```
/games/mi-juego/index.tsx
```

### 2. Implementar GameModule

```tsx
export const miJuegoGame: GameModule = {
  id: "mi-juego",
  name: "Mi Juego",
  description: "Descripción corta",
  emoji: "🎯",
  minPlayers: 2,
  maxPlayers: 8,

  setup(players) {
    const scores = Object.fromEntries(players.map(p => [p.id, 0]));
    return { phase: "setup", currentPlayerId: null, round: 0, scores };
  },

  start(state) {
    return { ...state, phase: "playing", round: state.round + 1 };
  },

  onAction(state, action) {
    // Lógica del juego
    return state;
  },

  end(state) {
    const [[winnerId]] = Object.entries(state.scores).sort((a, b) => b[1] - a[1]);
    return { winnerId, scores: state.scores, summary: "¡Fin!" };
  },

  render(state, playerId, dispatch) {
    return <div>Mi UI del juego</div>;
  },
};
```

### 3. Registrar en el registry

```ts
// core/registry.ts
import { miJuegoGame } from "@/games/mi-juego";
registerGame(miJuegoGame); // ← Una línea
```

**¡Listo!** El juego aparece automáticamente en el lobby.

---

## Correr en local

```bash
git clone <repo>
cd party-games
npm install
npm run dev
```

Abre http://localhost:3000

**Para probar multijugador local:**
1. Abre dos pestañas del navegador
2. En la primera: "Crear sala" → anota el código
3. En la segunda: "Unirse" → pega el código

> Nota: El MVP usa estado in-memory (Zustand). Ambas pestañas deben estar en la misma sesión del navegador. Para multidispositivo real, añade un backend con WebSockets (Pusher, Ably, o Socket.io).

---

## Deploy en Vercel

```bash
# Instala Vercel CLI si no lo tienes
npm i -g vercel

# Deploy
vercel

# O conecta el repo en vercel.com → Import Project
```

Variables de entorno: ninguna necesaria para el MVP.

---

## Juegos incluidos

| Juego | Jugadores | Descripción |
|-------|-----------|-------------|
| 🎭 Mímica | 2-10 | Actúa una palabra sin hablar |
| 🔊 Sonidos | 2-10 | Imita un sonido sin palabras ni gestos |
| 🤐 Sin Decir | 2-10 | Explica sin usar las palabras prohibidas |
| ⚡ Reacción | 2-8 | Toca el botón primero cuando aparezca la señal |

---

## Próximos juegos fáciles de agregar

- 🕵️ Impostor (un jugador tiene otra palabra)
- 🎲 Verdad o Reto
- 🧠 Trivia (ejemplo incluido en `/games/trivia/`)
- 📍 Adivina el lugar (geografía)
- 🎭 Teatro espontáneo (roles asignados)

---

## Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **Tailwind CSS** (mobile-first)
- **Zustand** (estado global)
- **Vercel** (deploy)
