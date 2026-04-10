import { Outlet, NavLink } from "react-router";
import { House, Map } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ComponentType } from "react";
import type { ModuleDefinition } from "../types";

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
  const { t } = useTranslation();
  const tabs = buildNavTabs(modules);

  return (
    <div className="relative flex h-dvh flex-col">
      <div className="flex-1 isolate overflow-auto">
        <Outlet />
      </div>

      {/* Desktop: floating glass pill */}
      <div className="hidden md:flex items-start absolute top-4 left-4 z-20">
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
      </nav>
    </div>
  );
}
