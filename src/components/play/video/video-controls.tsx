"use client";

interface VideoControlsProps {
  cameraOn: boolean;
  micOn: boolean;
  cameraDenied: boolean;
  micDenied: boolean;
  onToggleCamera: () => void;
  onToggleMic: () => void;
  onLeave: () => void;
}

export function VideoControls({
  cameraOn,
  micOn,
  cameraDenied,
  micDenied,
  onToggleCamera,
  onToggleMic,
  onLeave,
}: VideoControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onToggleCamera}
        disabled={cameraDenied}
        className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
          cameraOn
            ? "border-border text-foreground hover:border-muted"
            : "border-loss/60 text-loss"
        }`}
      >
        {cameraOn ? "CAMERA ON" : "CAMERA OFF"}
      </button>
      <button
        type="button"
        onClick={onToggleMic}
        disabled={micDenied}
        className={`rounded-full border px-4 py-2 text-xs font-semibold tracking-wide transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
          micOn ? "border-border text-foreground hover:border-muted" : "border-loss/60 text-loss"
        }`}
      >
        {micOn ? "MIC ON" : "MIC OFF"}
      </button>
      <button
        type="button"
        onClick={onLeave}
        className="rounded-full border border-loss/60 px-4 py-2 text-xs font-semibold tracking-wide text-loss transition-colors duration-150 hover:bg-loss/10"
      >
        LEAVE MATCH
      </button>
    </div>
  );
}
