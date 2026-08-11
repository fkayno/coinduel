"use client";

import { useState } from "react";

interface ShareActionsProps {
  shareUrl: string;
  imageUrl: string;
}

export function ShareActions({ shareUrl, imageUrl }: ShareActionsProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied or unavailable — nothing meaningful to
      // recover into, the user can still select/copy the URL manually.
    }
  }

  async function handleDownloadImage() {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = "coinduel-result.png";
    link.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="mt-6 flex gap-3">
      <button
        type="button"
        onClick={handleCopyLink}
        className="rounded-md border border-border px-5 py-2.5 text-xs font-bold tracking-wide text-foreground transition-colors duration-150 hover:border-muted"
      >
        {copied ? "COPIED!" : "COPY LINK"}
      </button>
      <button
        type="button"
        onClick={handleDownloadImage}
        className="rounded-md bg-accent px-5 py-2.5 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
      >
        DOWNLOAD IMAGE
      </button>
    </div>
  );
}
