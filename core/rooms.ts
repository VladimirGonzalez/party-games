import { supabase } from './supabase'
import { getSupabase } from "./supabase";

export async function createRoom(roomId: string) {
  await supabase.from('rooms').insert({
    id: roomId,
    status: 'lobby',
    state: {}
  })
}

export async function joinRoom(roomId: string, name: string) {
  await supabase.from('players').insert({
    room_id: roomId,
    name
  })
}

export async function updateRoom(roomId: string, state: unknown) {
  await supabase
    .from('rooms')
    .update({ state })
    .eq('id', roomId)
}

export async function updateRoom(roomId: string, state: unknown) {
  await getSupabase()
    .from("rooms")
    .update({ state })
    .eq("id", roomId);
}
