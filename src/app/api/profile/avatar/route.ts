import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { clearUserProfileImage, setUserProfileImage } from "@/lib/db/users";
import { getAvatarStorage } from "@/lib/storage/avatar-storage";
import { InvalidImageError, MAX_AVATAR_UPLOAD_BYTES, processAvatarUpload } from "@/lib/storage/image-validation";
import { hasProAccess } from "@/lib/billing/entitlement";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Uploads/replaces the AUTHENTICATED user's own avatar. The user id always
 * comes from the server-verified session (getCurrentUser()) — never from
 * the request body — so there is no way to change another account's
 * profile picture by editing the request from dev tools.
 *
 * Profile pictures are a CoinDuel Pro feature — gated server-side here, not
 * just by hiding the upload button in the UI (a client could otherwise POST
 * directly to this route and bypass a UI-only restriction).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  if (!checkRateLimit(`avatar-upload:${user.id}`, 10, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 });
  }

  if (!(await hasProAccess(user.id))) {
    return NextResponse.json(
      { error: "Profile pictures are a CoinDuel Pro feature.", upgradeUrl: "/pricing" },
      { status: 403 }
    );
  }

  // Cheap early rejection before spending time parsing a huge body. The
  // real, authoritative size check still happens on the decoded bytes
  // below — this is just to avoid buffering something absurd first.
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_AVATAR_UPLOAD_BYTES * 2) {
    return NextResponse.json({ error: "Image must be 5MB or smaller." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const rawBytes = Buffer.from(await file.arrayBuffer());

  let processed: Buffer;
  try {
    processed = await processAvatarUpload(rawBytes);
  } catch (error) {
    const message = error instanceof InvalidImageError ? error.message : "Could not process image.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { url } = await getAvatarStorage().save(user.id, processed, "image/webp");
  await setUserProfileImage(user.id, url);

  return NextResponse.json({ profileImageUrl: url });
}

/**
 * Removes the AUTHENTICATED user's own avatar, reverting to the default.
 * Deliberately NOT Pro-gated — always available regardless of plan, so a
 * user whose Pro access has lapsed can still clear a previously-uploaded
 * image rather than being stuck with it.
 */
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  await getAvatarStorage().remove(user.id);
  await clearUserProfileImage(user.id);

  return NextResponse.json({ ok: true });
}
