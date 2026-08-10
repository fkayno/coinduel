/**
 * One-time (idempotent) setup script — creates the "avatars" Supabase
 * Storage bucket used for profile pictures. Public read (avatars are shown
 * to every visitor: leaderboard, match history, opponent's camera feed),
 * but NO client ever writes to it directly — all uploads go through
 * POST /api/profile/avatar using the service_role key server-side, which
 * bypasses RLS entirely. Since no anon/authenticated-role policies are
 * granted here, the Supabase anon key (even if it were ever exposed) could
 * not write to this bucket — only the server-only service_role key can.
 *
 * Run with: npm run supabase:storage:setup
 * Safe to re-run — no-ops if the bucket already exists.
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const BUCKET_NAME = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // matches src/lib/storage/image-validation.ts

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env first.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Failed to list buckets:", listError.message);
    process.exit(1);
  }

  if (buckets.some((b) => b.name === BUCKET_NAME)) {
    console.log(`Bucket "${BUCKET_NAME}" already exists — nothing to do.`);
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: MAX_AVATAR_BYTES,
    allowedMimeTypes: ["image/webp"], // the app always re-encodes uploads to webp before storing
  });

  if (createError) {
    console.error("Failed to create bucket:", createError.message);
    process.exit(1);
  }

  console.log(`Created public bucket "${BUCKET_NAME}" (max ${MAX_AVATAR_BYTES / 1024 / 1024}MB, image/webp only).`);
}

main().catch((error) => {
  console.error("Supabase storage setup failed:", error);
  process.exit(1);
});
