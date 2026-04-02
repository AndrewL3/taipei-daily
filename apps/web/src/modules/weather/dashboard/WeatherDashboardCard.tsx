import { useTranslation } from "react-i18next";
import { CloudSun, Droplets } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeatherForecast } from "../api/hooks";
import WeatherIcon from "../views/WeatherIcon";
import DataAge from "@/components/DataAge";

export default function WeatherDashboardCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position } = useGeolocation();

  const {
    data: forecast,
    isLoading,
    isError,
    refetch,
    dataUpdatedAt,
  } = useWeatherForecast(position.lat, position.lon);

  const current = forecast?.forecast[0];

  return (
    <div className="card-lift rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="gradient-icon h-6 w-6 bg-gradient-to-br from-amber-400 to-orange-500 shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
            <CloudSun className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold">
            {t("dashboard.weather.title")}
          </h3>
          <DataAge updatedAt={dataUpdatedAt} />
        </div>
        <button
          onClick={() => navigate("/weather")}
          className="text-xs font-medium text-primary/80 transition-colors hover:text-primary"
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

      {!isLoading && isError && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{t("error.generic")}</p>
          <button
            onClick={() => refetch()}
            className="text-xs font-medium text-primary"
          >
            {t("error.retry")}
          </button>
        </div>
      )}

      {!isLoading && !isError && !current && (
        <p className="text-sm text-muted-foreground">
          {t("dashboard.weather.noData")}
        </p>
      )}
    </div>
  );
}
