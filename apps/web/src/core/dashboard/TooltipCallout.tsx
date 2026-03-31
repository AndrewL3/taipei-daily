import { Lightbulb, X } from "lucide-react";

interface TooltipCalloutProps {
  message: string;
  onDismiss: () => void;
}

export default function TooltipCallout({
  message,
  onDismiss,
}: TooltipCalloutProps) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
      <Lightbulb className="h-4 w-4 shrink-0 text-primary/60" />
      <span className="flex-1 text-xs text-muted-foreground">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 p-0.5 text-muted-foreground/40 hover:text-muted-foreground"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
