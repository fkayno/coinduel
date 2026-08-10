"use client";

import { useState } from "react";

const SIZE_CLASSES = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-28 w-28 text-4xl",
} as const;

export type AvatarSize = keyof typeof SIZE_CLASSES;

interface AvatarProps {
  username: string;
  profileImageUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

/**
 * Always a perfect circle (`rounded-full` + `object-fit: cover`) — never a
 * square profile picture anywhere in the app. Falls back to a branded
 * letter avatar (dark surface, accent-green initial, thin border) when no
 * image is set — deliberately monochrome/consistent rather than a
 * per-user hashed color, to read as a competitive-gaming profile mark
 * rather than a social-media auto-avatar. Also falls back the same way if
 * the image URL 404s/fails to load (a deleted Storage object, a stale
 * snapshot on an old match record, etc.) instead of showing the browser's
 * native broken-image icon.
 */
export function Avatar({ username, profileImageUrl, size = "md", className = "" }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const sizeClass = SIZE_CLASSES[size];

  if (profileImageUrl && !failed) {
    return (
      <span
        className={`inline-block shrink-0 overflow-hidden rounded-full border border-border bg-surface-2 ${sizeClass} ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profileImageUrl}
          alt={`@${username}`}
          onError={() => setFailed(true)}
          className="h-full w-full rounded-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-surface-2 font-extrabold text-accent ${sizeClass} ${className}`}
      aria-label={`@${username}`}
    >
      {username.slice(0, 1).toUpperCase()}
    </span>
  );
}
