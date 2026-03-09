import { useTranslation } from "react-i18next";
import { CloudSun, Droplets } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeatherForecast } from "../api/hooks";
import WeatherIcon from "../views/WeatherIcon";

export default function WeatherDashboardCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();

  const {
    data: forecast,
    isLoading,
    isError,
  } = useWeatherForecast(
    located ? position.lat : null,
    located ? position.lon : null,
  );

  const current = forecast?.forecast[0];

  return (
    <div className="rounded-xl bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          <h3 className="text-sm font-semibold">
            {t("dashboard.weather.title")}
          </h3>
        </div>
        <button
          onClick={() => navigate("/weather")}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {t("weather.forecast")}
        </button>
      </div>

      {isLoading && <div className="h-12 animate-pulse rounded-lg bg-muted" />}

      {!isLoading && current && (
        <div className="flex items-center gap-3">
          <WeatherIcon
            wx={current.wx}
            className="h-10 w-10 shrink-0 text-foreground"
          />
          <div className="min-w-0 flex-1">
            <p className="text-2xl font-bold tabular-nums">
              {current.temperature}°
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {current.wx}
              </span>
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="tabular-nums">
                {current.minT}°–{current.maxT}°
              </span>
              <span className="flex items-center gap-0.5">
                <Droplets className="h-3 w-3" />
                {current.pop}%
              </span>
              {forecast && (
                <span className="truncate">{forecast.township}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {!isLoading && (!current || isError) && (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.weather.noData")}
        </p>
      )}
    </div>
  );
}
