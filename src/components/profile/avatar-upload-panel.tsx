"use client";

import { useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

interface AvatarUploadPanelProps {
  username: string;
  initialProfileImageUrl: string | null;
}

export function AvatarUploadPanel({ username, initialProfileImageUrl }: AvatarUploadPanelProps) {
  const [savedUrl, setSavedUrl] = useState(initialProfileImageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "removing">("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Revoke the local object URL when it's replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    setError(null);

    // Client-side checks are pure UX — the server re-validates everything
    // (real file signature, size, re-encoding) regardless of what a
    // manipulated client claims here.
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Image must be 5MB or smaller.");
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleCancelSelection() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  }

  async function handleSave() {
    if (!selectedFile) return;
    setStatus("saving");
    setError(null);

    try {
      const body = new FormData();
      body.append("file", selectedFile);
      const res = await fetch("/api/profile/avatar", { method: "POST", body });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Could not save your profile picture.");
      }

      setSavedUrl(data.profileImageUrl);
      handleCancelSelection();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile picture.");
    } finally {
      setStatus("idle");
    }
  }

  async function handleRemove() {
    setStatus("removing");
    setError(null);

    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not remove your profile picture.");
      }
      setSavedUrl(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove your profile picture.");
    } finally {
      setStatus("idle");
    }
  }

  const displayUrl = previewUrl ?? savedUrl;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5">
        <span className="relative inline-block h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-border bg-surface-2">
          {displayUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayUrl} alt={`@${username}`} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl font-extrabold text-accent">
              {username.slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>

        <div className="flex flex-col gap-2">
          <span className="text-[10px] font-semibold tracking-widest text-muted">
            {previewUrl ? "PREVIEW — NOT SAVED YET" : "CURRENT PROFILE IMAGE"}
          </span>
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-border px-4 py-2 text-xs font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
            >
              UPLOAD IMAGE
            </button>
            {savedUrl && !previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={status === "removing"}
                className="rounded-md border border-loss/50 px-4 py-2 text-xs font-bold tracking-wide text-loss transition-colors duration-150 hover:bg-loss/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {status === "removing" ? "REMOVING..." : "REMOVE"}
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-loss">{error}</p>}

      {previewUrl && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={status === "saving"}
            className="rounded-md bg-accent px-6 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "saving" ? "SAVING..." : "SAVE CHANGES"}
          </button>
          <button
            type="button"
            onClick={handleCancelSelection}
            disabled={status === "saving"}
            className="text-xs font-semibold text-muted transition-colors duration-150 hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      )}

      <p className="text-[11px] text-muted">JPG, PNG, or WEBP. Max 5MB. Displayed as a circle.</p>
    </div>
  );
}
