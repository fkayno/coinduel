export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 animate-bounce rounded-full bg-accent" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
