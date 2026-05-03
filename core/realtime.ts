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
        callback(payload.new as RoomPayload);
      }
    )
    .subscribe();
}