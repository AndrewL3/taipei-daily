import { Droplets } from "lucide-react";
import WeatherIcon from "./WeatherIcon";
import type { ForecastPeriod } from "../api/types";

interface ForecastCardProps {
  period: ForecastPeriod;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    hour12: true,
    timeZone: "Asia/Taipei",
  });
}

export default function ForecastCard({ period }: ForecastCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-card px-4 py-3 shadow-sm">
      {/* Time */}
      <div className="w-16 shrink-0 text-sm text-muted-foreground">
        {formatTime(period.startTime)}
      </div>

      {/* Weather icon */}
      <WeatherIcon
        wx={period.wx}
        className="h-8 w-8 shrink-0 text-foreground"
      />

      {/* Description + comfort */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{period.wx}</p>
        <p className="text-xs text-muted-foreground">{period.ci}</p>
      </div>

      {/* Temperature */}
      <div className="shrink-0 text-right">
        <p className="text-lg font-bold tabular-nums">{period.temperature}°</p>
        <p className="text-xs text-muted-foreground tabular-nums">
          {period.minT}°–{period.maxT}°
        </p>
      </div>

      {/* Rain probability */}
      <div className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
        <Droplets className="h-3.5 w-3.5" />
        <span className="tabular-nums">{period.pop}%</span>
      </div>
    </div>
  );
}
