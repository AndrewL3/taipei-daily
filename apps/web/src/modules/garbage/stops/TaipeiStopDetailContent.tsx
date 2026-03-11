import { useTranslation } from "react-i18next";
import { Clock, MapPin, CalendarClock } from "lucide-react";
import FavoriteButton from "@/core/favorites/FavoriteButton";
import DirectionsButton from "@/components/DirectionsButton";
import type { TaipeiGarbageStop } from "../api/taipei-client";

interface TaipeiStopDetailContentProps {
  stop: TaipeiGarbageStop;
}

export default function TaipeiStopDetailContent({
  stop,
}: TaipeiStopDetailContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Schedule badge */}
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          <CalendarClock className="mr-1 inline h-3 w-3" />
          {t("stop.scheduleOnly")}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <FavoriteButton
          moduleKey="garbage"
          id={stop.routeId}
          label={`${stop.routeName} ${stop.trip}`}
          lat={stop.lat}
          lon={stop.lon}
          data={stop}
        />
        <DirectionsButton lat={stop.lat} lon={stop.lon} />
      </div>

      {/* Time window */}
      <div className="rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">
              {t("stop.arrivalDeparture")}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {stop.arrivalTime} – {stop.departureTime}
            </p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p>{stop.address}</p>
          <p>
            {stop.district} · {stop.village}
          </p>
        </div>
      </div>
    </div>
  );
}
