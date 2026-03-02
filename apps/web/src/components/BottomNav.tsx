import { NavLink } from "react-router";
import { MapPin, List } from "lucide-react";

const tabs = [
  { to: "/", icon: MapPin, label: "Map" },
  { to: "/schedules", icon: List, label: "Schedules" },
] as const;

export default function BottomNav() {
  return (
    <nav className="border-border bg-background flex border-t">
      {tabs.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          className={({ isActive }) =>
            `flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors ${
              isActive
                ? "text-yellow-500"
                : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Icon className="h-5 w-5" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
