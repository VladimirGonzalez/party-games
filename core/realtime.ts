import { supabase } from "./supabase";
import { Room } from "./types";

type RoomPayload = {
  state: Room;
};

export function subscribeRoom(
  roomId: string,
  callback: (roomDb: RoomPayload | null) => void
) {
  return supabase
    .channel("room-" + roomId)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => {
        // payload.new es `Record<string, unknown>` en Supabase strict types
        // Cast explícito y seguro — la forma del objeto la controla updateRoom
        callback(payload.new as RoomPayload);
      }
    )
    .subscribe();
}
