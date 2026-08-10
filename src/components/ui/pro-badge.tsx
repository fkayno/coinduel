/**
 * The one PRO badge component used everywhere (profile, dashboard, match
 * UI, match history) — always driven by a live `hasProAccess`/`getProStatusMap`
 * lookup passed in as a prop, never a stored/cached flag, so it disappears
 * automatically the instant access actually expires (see
 * src/lib/billing/entitlement.ts).
 */
export function ProBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-extrabold tracking-widest text-accent ${className}`}
    >
      PRO
    </span>
  );
}
