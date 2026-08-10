import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="text-xs font-semibold tracking-[0.3em] text-muted">404</span>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground">
        Page not found.
      </h1>
      <p className="mt-4 text-sm leading-6 text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-md bg-accent px-6 py-3 text-sm font-bold tracking-wide text-black transition-all duration-150 hover:bg-accent-dim active:scale-[0.98]"
      >
        BACK TO HOME
      </Link>
    </div>
  );
}
