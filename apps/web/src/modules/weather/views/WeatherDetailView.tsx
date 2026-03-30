import { useTranslation } from "react-i18next";
import { ArrowLeft, Droplets } from "lucide-react";
import { useNavigate } from "react-router";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useWeatherForecast } from "../api/hooks";
import WeatherIcon from "./WeatherIcon";
import ForecastCard from "./ForecastCard";

export default function WeatherDetailView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position } = useGeolocation();

  const {
    data: forecast,
    isLoading,
    isError,
  } = useWeatherForecast(position.lat, position.lon);

  const current = forecast?.forecast[0];

  return (
    <div className="view-enter min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate("/")}
            className="rounded-full p-1 hover:bg-muted"
            aria-label={t("route.back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{t("weather.forecast")}</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            <div className="h-32 animate-pulse rounded-xl bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
            <div className="h-16 animate-pulse rounded-xl bg-muted" />
          </div>
        )}

        {/* Error */}
        {isError && (
          <p className="text-center text-sm text-muted-foreground">
            {t("weather.error")}
          </p>
        )}

        {/* Current conditions hero */}
        {current && forecast && (
          <>
            <div className="mb-6 rounded-2xl bg-card p-6 shadow-[var(--shadow-card)]">
              <p className="mb-1 text-sm text-muted-foreground">
                {forecast.township} · {forecast.city}
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-5xl font-bold tabular-nums">
                    {current.temperature}°
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {current.minT}°–{current.maxT}° · {current.ci}
                  </p>
                </div>
                <div className="text-right">
                  <WeatherIcon
                    wx={current.wx}
                    className="mb-1 h-12 w-12 text-foreground"
                  />
                  <p className="text-sm font-medium">{current.wx}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                <Droplets className="h-4 w-4" />
                <span>
                  {t("weather.rainProb")}: {current.pop}%
                </span>
              </div>
            </div>

            {/* Forecast timeline */}
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              {t("weather.upcoming")}
            </h2>
            <div className="space-y-2">
              {forecast.forecast.slice(1).map((period) => (
                <ForecastCard key={period.startTime} period={period} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
