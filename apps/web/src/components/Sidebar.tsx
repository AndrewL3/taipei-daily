import { NavLink } from "react-router";
import { MapPin, List, Sun, Moon, Monitor, Truck } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/lib/theme";

const navItems = [
  { to: "/", icon: MapPin, label: "Map" },
  { to: "/schedules", icon: List, label: "Routes" },
] as const;

const themeOptions = [
  { value: "light" as const, icon: Sun, label: "Light" },
  { value: "dark" as const, icon: Moon, label: "Dark" },
  { value: "system" as const, icon: Monitor, label: "System" },
];

export default function Sidebar() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const order = ["light", "dark", "system"] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  const currentThemeOption = themeOptions.find((t) => t.value === theme)!;
  const ThemeIcon = currentThemeOption.icon;

  return (
    <aside
      className={[
        "flex items-center",
        // Mobile: glass bottom bar
        "backdrop-blur-xl bg-background/70 border-t border-white/20 flex-row px-2 py-1.5",
        // Desktop: solid left sidebar
        "md:backdrop-blur-none md:bg-sidebar md:border-border md:border-t-0 md:border-r md:flex-col md:px-2 md:py-3",
      ].join(" ")}
    >
      {/* Desktop branding */}
      <div className="hidden md:flex md:flex-col md:items-center md:gap-1 md:pb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Truck className="h-5 w-5 text-primary" />
        </div>
        <span className="text-[10px] font-semibold tracking-tight text-primary">
          NTPC
        </span>
      </div>

      {/* Navigation */}
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === "/"} className="flex-1 md:flex-initial">
          {({ isActive }) => (
            <div className="flex flex-col items-center gap-0.5 md:gap-0">
              <Button
                variant="ghost"
                size="icon"
                className={`h-10 w-10 ${isActive ? "bg-primary/10" : ""}`}
                aria-label={label}
                title={label}
              >
                <Icon
                  className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
              </Button>
              <span
                className={`text-[10px] leading-none md:hidden ${
                  isActive ? "font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </div>
          )}
        </NavLink>
      ))}

      {/* Spacer */}
      <div className="hidden md:flex md:flex-1" />

      {/* Theme toggle */}
      <div className="flex flex-col items-center gap-0.5 md:gap-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10"
          onClick={cycleTheme}
          aria-label={`Theme: ${currentThemeOption.label}`}
          title={`Theme: ${currentThemeOption.label}`}
        >
          <ThemeIcon className="h-5 w-5 text-muted-foreground" />
        </Button>
        <span className="text-[10px] leading-none text-muted-foreground md:hidden">
          {currentThemeOption.label}
        </span>
      </div>
    </aside>
  );
}
