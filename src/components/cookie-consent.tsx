"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "coinduel-cookie-consent";

/**
 * CoinDuel only sets one cookie — the session cookie that keeps you logged
 * in — so there's nothing to opt in/out of separately. This is a notice,
 * not a preferences center.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Justified exception to react-hooks/set-state-in-effect: whether
    // consent was already given lives in localStorage, which doesn't exist
    // during server rendering — there's no render-time way to know this on
    // first paint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-border bg-background/95 px-6 py-4 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-center text-xs leading-relaxed text-muted sm:text-left">
          CoinDuel uses a single essential cookie to keep you signed in — no ads, no analytics,
          no tracking cookies. See our{" "}
          <Link href="/privacy" className="font-semibold text-accent hover:text-accent-dim">
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 rounded-md bg-accent px-5 py-2 text-xs font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
        >
          GOT IT
        </button>
      </div>
    </div>
  );
}
