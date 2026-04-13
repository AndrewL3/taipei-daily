import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { ModuleDefinition } from "../types";

interface QuickActionsPopoverProps {
  module: ModuleDefinition;
  anchorRect: DOMRect;
  onClose: () => void;
}

export default function QuickActionsPopover({
  module,
  anchorRect,
  onClose,
}: QuickActionsPopoverProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  // Dismiss on outside click or scroll
  useEffect(() => {
    const handlePointer = (e: Event) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleScroll = () => onClose();
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("touchstart", handlePointer);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("touchstart", handlePointer);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [onClose]);

  // Focus first action for keyboard accessibility
  useEffect(() => {
    const firstButton = ref.current?.querySelector("button");
    firstButton?.focus();
  }, []);

  const actions = module.quickActions;
  if (!actions || actions.length === 0) return null;

  const top = anchorRect.bottom + 8;
  const right = window.innerWidth - anchorRect.right;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />
      <div
        ref={ref}
        className="dropdown-enter absolute rounded-xl bg-popover shadow-lg ring-1 ring-border/20"
        style={{ top, right, minWidth: 180 }}
        role="menu"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      >
        {actions.map((action, i) => {
          const Icon = action.icon;
          return (
            <button
              key={action.to}
              role="menuitem"
              onClick={() => {
                onClose();
                navigate(action.to);
              }}
              className={`flex w-full items-center gap-3 px-4 py-3 text-sm font-medium transition-colors hover:bg-muted/50 ${
                i === 0 ? "rounded-t-xl" : ""
              } ${i === actions.length - 1 ? "rounded-b-xl" : "border-b border-border/10"}`}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              {t(action.label)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
