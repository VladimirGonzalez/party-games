import { supabase } from './supabase'

export function subscribeRoom(roomId: string, callback: any) {
  return supabase
    .channel('room-' + roomId)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'rooms',
        filter: `id=eq.${roomId}`
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()
}