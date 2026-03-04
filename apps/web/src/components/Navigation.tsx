import { NavLink } from "react-router";
import { Sun, Moon, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
import { useTheme } from "@/lib/theme";

const themeOptions = [
  { value: "light" as const, icon: Sun },
  { value: "dark" as const, icon: Moon },
  { value: "system" as const, icon: Monitor },
];

export default function Navigation() {
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const cycleTheme = () => {
    const order = ["light", "dark", "system"] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const toggleLang = () => {
    const next = i18n.language === "zh-TW" ? "en" : "zh-TW";
    i18n.changeLanguage(next);
  };

  const ThemeIcon = themeOptions.find((t) => t.value === theme)!.icon;
  const langLabel = i18n.language === "zh-TW" ? "中" : "EN";

  return (
    <>
      {/* Desktop: floating glass pill — absolutely positioned over content */}
      <div className="hidden md:flex flex-col items-start absolute top-4 left-4 z-20 gap-2">
        <div className="glass rounded-full p-1 shadow-lg flex">
          <NavLink to="/" end>
            {({ isActive }) => (
              <span
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("nav.map")}
              </span>
            )}
          </NavLink>
          <NavLink to="/schedules">
            {({ isActive }) => (
              <span
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("nav.routes")}
              </span>
            )}
          </NavLink>
        </div>
        <div className="ml-1 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={cycleTheme}
            aria-label={t("nav.toggleTheme")}
          >
            <ThemeIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={toggleLang}
            aria-label={t("nav.toggleLang")}
          >
            <span className="text-xs font-semibold text-muted-foreground">{langLabel}</span>
          </Button>
        </div>
      </div>

      {/* Mobile: clean bottom tab bar */}
      <nav className="flex md:hidden bg-background border-t border-border/50">
        <NavLink to="/" end className="flex-1">
          {({ isActive }) => (
            <div
              className={`flex items-center justify-center py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary border-t-2 border-primary -mt-px"
                  : "text-muted-foreground"
              }`}
            >
              {t("nav.map")}
            </div>
          )}
        </NavLink>
        <NavLink to="/schedules" className="flex-1">
          {({ isActive }) => (
            <div
              className={`flex items-center justify-center py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "text-primary border-t-2 border-primary -mt-px"
                  : "text-muted-foreground"
              }`}
            >
              {t("nav.routes")}
            </div>
          )}
        </NavLink>
        <button
          className="flex items-center justify-center px-3 py-3"
          onClick={cycleTheme}
          aria-label={t("nav.toggleTheme")}
        >
          <ThemeIcon className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          className="flex items-center justify-center px-3 py-3"
          onClick={toggleLang}
          aria-label={t("nav.toggleLang")}
        >
          <span className="text-xs font-semibold text-muted-foreground">{langLabel}</span>
        </button>
      </nav>
    </>
  );
}
