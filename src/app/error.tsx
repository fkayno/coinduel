"use client";

import { useEffect } from "react";

/**
 * Root error boundary — catches any unhandled error thrown while rendering
 * a page (a Prisma hiccup, a failed fetch, etc.) so users see a branded,
 * actionable screen instead of a bare crash. Next.js already strips
 * `error.message`/stack details from what reaches the browser in a
 * production build, so nothing sensitive leaks here.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">ERROR</span>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
        Something went wrong.
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        This is on us, not you. Try again — if it keeps happening, come back in a few minutes.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 rounded-md bg-accent px-6 py-3 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
      >
        TRY AGAIN
      </button>
    </div>
  );
}
