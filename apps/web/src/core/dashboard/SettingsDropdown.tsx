import { useState, useRef, useEffect } from "react";
import { Settings, Sun, Moon, Monitor, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/lib/theme";

const themeOptions = [
  { value: "light" as const, icon: Sun, labelKey: "settings.light" },
  { value: "dark" as const, icon: Moon, labelKey: "settings.dark" },
  { value: "system" as const, icon: Monitor, labelKey: "settings.system" },
] as const;

export default function SettingsDropdown() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language === "zh-TW" ? "en" : "zh-TW");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="-m-1 rounded-full p-2.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
        aria-label={t("settings.title")}
      >
        <Settings className="h-5 w-5" />
      </button>
      {open && (
        <div className="dropdown-enter absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border/12 bg-card p-3 shadow-lg">
          <p className="mb-1.5 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("settings.theme")}
          </p>
          <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
            {themeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTheme(opt.value)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                  theme === opt.value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                <opt.icon className="h-3.5 w-3.5" />
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
          <p className="mb-1.5 mt-3 font-mono text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("settings.language")}
          </p>
          <button
            onClick={toggleLang}
            className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-muted/50"
          >
            <Globe className="h-4 w-4 text-muted-foreground" />
            {i18n.language === "zh-TW" ? "Switch to English" : "切換至中文"}
          </button>
        </div>
      )}
    </div>
  );
}
