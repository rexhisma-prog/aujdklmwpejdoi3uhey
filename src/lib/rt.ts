import { supabase } from "@/integrations/supabase/client";

/** Unique-topic channel for postgres_changes listeners (avoids reusing an already-subscribed channel). */
export const uniqueChannel = (name: string) =>
  supabase.channel(`${name}-${Math.random().toString(36).slice(2, 10)}`);

/** Shared-topic channel (broadcast/presence): drops any stale local copy first so .on() never runs after subscribe(). */
export function sharedChannel(name: string, opts?: Parameters<typeof supabase.channel>[1]) {
  supabase.getChannels().filter((c) => c.topic === `realtime:${name}`).forEach((c) => supabase.removeChannel(c));
  return supabase.channel(name, opts);
}
