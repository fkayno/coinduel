import { getSupabaseClient } from "@/lib/supabase/client";
import type { AvatarStorage } from "@/lib/storage/avatar-storage";

const BUCKET_NAME = "avatars";

/**
 * SERVER-ONLY. Supabase Storage-backed AvatarStorage implementation —
 * replaces the previous Postgres `bytea` storage (src/lib/db/avatars.ts,
 * deleted). Each user's avatar lives at a single deterministic object path
 * (`{userId}.webp`) in the public "avatars" bucket (created by
 * scripts/supabase-storage-setup.ts) — re-uploading overwrites the same
 * object via `upsert: true` rather than accumulating orphaned files.
 *
 * All writes happen here, server-side, using the service_role key (see
 * src/lib/supabase/client.ts) — no client ever holds Supabase Storage
 * credentials. Per-user ownership ("you can only touch your own avatar") is
 * enforced by the caller (POST/DELETE /api/profile/avatar always act on
 * getCurrentUser()'s own id, never a client-supplied one), not by Supabase
 * RLS — this app has its own auth system, not Supabase Auth.
 */
export const supabaseAvatarStorage: AvatarStorage = {
  async save(userId, bytes, contentType) {
    const supabase = getSupabaseClient();
    const path = `${userId}.webp`;

    const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, bytes, {
      contentType,
      upsert: true,
    });
    if (error) throw new Error(`Failed to upload avatar: ${error.message}`);

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    // Cache-busting query param — the object path is stable per user, so
    // without this a replaced photo could keep serving a browser/CDN-cached
    // copy of the old one.
    return { url: `${data.publicUrl}?v=${Date.now()}` };
  },

  async remove(userId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([`${userId}.webp`]);
    // Supabase Storage's remove() doesn't error on a missing object, but
    // guard anyway so a transient failure here never blocks the caller.
    if (error) console.error(`Failed to remove avatar for ${userId}:`, error.message);
  },
};
