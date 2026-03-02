import { NavLink } from "react-router";
import { MapPin, List, Sun, Moon, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "@/lib/theme";

const navItems = [
  { to: "/", icon: MapPin, label: "Map" },
  { to: "/schedules", icon: List, label: "Schedules" },
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
        "border-border bg-background flex items-center",
        // Mobile: bottom bar
        "flex-row border-t px-2 py-1",
        // Desktop: left sidebar
        "md:flex-col md:border-t-0 md:border-r md:px-1.5 md:py-3",
      ].join(" ")}
    >
      {/* Navigation */}
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink key={to} to={to} end={to === "/"}>
          {({ isActive }) => (
            <Button
              variant={isActive ? "secondary" : "ghost"}
              size="icon"
              className="h-10 w-10"
              aria-label={label}
              title={label}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-yellow-500" : ""}`}
              />
            </Button>
          )}
        </NavLink>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10"
        onClick={cycleTheme}
        aria-label={`Theme: ${currentThemeOption.label}`}
        title={`Theme: ${currentThemeOption.label}`}
      >
        <ThemeIcon className="h-5 w-5" />
      </Button>
    </aside>
  );
}
