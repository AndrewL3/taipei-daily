import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function DataAge({ updatedAt }: { updatedAt?: number }) {
  const { t } = useTranslation();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!updatedAt) return;
    const frame = requestAnimationFrame(() => setNow(Date.now()));
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(id);
    };
  }, [updatedAt]);

  if (!updatedAt) return null;

  const seconds = Math.floor((now - updatedAt) / 1000);
  if (seconds < 10) return null;

  let text: string;
  if (seconds < 60) {
    text = t("dashboard.age.seconds", { count: seconds });
  } else if (seconds < 3600) {
    text = t("dashboard.age.minutes", { count: Math.floor(seconds / 60) });
  } else {
    text = t("dashboard.age.hours", { count: Math.floor(seconds / 3600) });
  }

  return (
    <span className="text-xs tabular-nums text-muted-foreground/50">
      · {text}
    </span>
  );
}
