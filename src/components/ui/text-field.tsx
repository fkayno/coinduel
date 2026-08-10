import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
}

export function TextField({ label, error, id, name, className, ...props }: TextFieldProps) {
  const inputId = id ?? name;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold tracking-wide text-muted">
        {label}
      </label>
      <input
        id={inputId}
        name={name}
        className={`rounded-md border bg-surface-2 px-4 py-3 text-sm text-foreground outline-none transition-colors duration-150 placeholder:text-muted/60 focus:border-accent ${
          error ? "border-loss" : "border-border"
        } ${className ?? ""}`}
        {...props}
      />
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}
