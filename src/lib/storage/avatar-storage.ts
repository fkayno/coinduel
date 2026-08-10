import { supabaseAvatarStorage } from "@/lib/storage/supabase-avatar-storage";

/**
 * Avatar storage abstraction. The rest of the app only ever talks to this
 * interface, never to a specific storage backend — mirrors the
 * `PnlProvider` pattern in src/lib/game/pnl-service.ts.
 *
 * Production implementation: Supabase Storage (public "avatars" bucket) —
 * see src/lib/storage/supabase-avatar-storage.ts. `save()` returns a direct
 * public URL, so nothing proxies image bytes through the Next.js server.
 * Swap the return of getAvatarStorage() for a different implementation of
 * the same interface later — no other code needs to change, since callers
 * only ever get back a URL.
 */
export interface AvatarStorage {
  /** Persists already-processed image bytes and returns the URL to store on the user record. */
  save(userId: string, bytes: Buffer, contentType: string): Promise<{ url: string }>;
  /** Deletes a user's stored avatar, if any. Never throws if nothing exists. */
  remove(userId: string): Promise<void>;
}

/** Single entry point the rest of the app calls. */
export function getAvatarStorage(): AvatarStorage {
  return supabaseAvatarStorage;
}
