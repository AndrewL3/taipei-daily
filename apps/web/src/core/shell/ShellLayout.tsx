import { Outlet, NavLink } from "react-router";
import { House, Map, Sun, Moon, Monitor } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/theme";
import type { ComponentType } from "react";
import type { ModuleDefinition } from "../types";

const themeOptions = [
  { value: "light" as const, icon: Sun },
  { value: "dark" as const, icon: Moon },
  { value: "system" as const, icon: Monitor },
];

interface NavTab {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  end?: boolean;
}

function buildNavTabs(modules: readonly ModuleDefinition[]): NavTab[] {
  const tabs: NavTab[] = [
    { to: "/", label: "nav.home", icon: House, end: true },
    { to: "/map", label: "nav.map", icon: Map },
  ];

  for (const mod of modules) {
    if (mod.routes.length === 0) continue;
    const firstRoute = mod.routes[0];
    if (typeof firstRoute.path !== "string" || firstRoute.path === "") continue;
    const path = firstRoute.path.startsWith("/")
      ? firstRoute.path
      : `/${firstRoute.path}`;
    tabs.push({
      to: path,
      label: mod.name,
      // Lucide icons accept className but ModuleDefinition.icon is ComponentType<{}>
      icon: mod.icon as ComponentType<{ className?: string }>,
    });
  }

  return tabs;
}

export default function ShellLayout({
  modules,
}: {
  modules: readonly ModuleDefinition[];
}) {
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

  const ThemeIcon = themeOptions.find((o) => o.value === theme)!.icon;
  const langLabel = i18n.language === "zh-TW" ? "中" : "EN";
  const tabs = buildNavTabs(modules);

  return (
    <div className="relative flex h-dvh flex-col">
      <div className="flex-1 isolate overflow-auto">
        <Outlet />
      </div>

      {/* Desktop: floating glass pill */}
      <div className="hidden md:flex flex-col items-start absolute top-4 left-4 z-20 gap-2">
        <div className="glass rounded-full p-1 shadow-lg flex">
          {tabs.map((tab) => (
            <NavLink key={tab.to} to={tab.to} end={tab.end}>
              {({ isActive }) => (
                <span
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t(tab.label)}
                </span>
              )}
            </NavLink>
          ))}
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
            <span className="text-xs font-semibold text-muted-foreground">
              {langLabel}
            </span>
          </Button>
        </div>
      </div>

      {/* Mobile: bottom tab bar */}
      <nav className="flex md:hidden bg-background border-t border-border/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink key={tab.to} to={tab.to} end={tab.end} className="flex-1">
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? "text-primary border-t-2 border-primary -mt-px"
                      : "text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 mb-0.5" />
                  {t(tab.label)}
                </div>
              )}
            </NavLink>
          );
        })}
        <button
          className="flex items-center justify-center px-3 py-2"
          onClick={cycleTheme}
          aria-label={t("nav.toggleTheme")}
        >
          <ThemeIcon className="h-4 w-4 text-muted-foreground" />
        </button>
        <button
          className="flex items-center justify-center px-3 py-2"
          onClick={toggleLang}
          aria-label={t("nav.toggleLang")}
        >
          <span className="text-xs font-semibold text-muted-foreground">
            {langLabel}
          </span>
        </button>
      </nav>
    </div>
  );
}
