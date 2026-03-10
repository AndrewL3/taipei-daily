import { useTranslation } from "react-i18next";
import { Heart, MapPin, Clock, Phone } from "lucide-react";
import type { AedVenue } from "../api/types";

interface AedDetailContentProps {
  venue: AedVenue;
}

export default function AedDetailContent({ venue }: AedDetailContentProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* AED count hero */}
      <div className="rounded-xl bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Heart className="h-6 w-6 shrink-0 text-red-500" />
          <div>
            <p className="text-sm text-muted-foreground">
              {t("facilities.category")}: {venue.category}
            </p>
            <p className="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">
              {venue.aedCount}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                AED
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{venue.address}</span>
      </div>

      {/* Individual AEDs */}
      {venue.aeds.map((aed) => (
        <div key={aed.aedId} className="rounded-lg border px-3 py-2 text-sm">
          <p className="font-medium">{aed.placement}</p>
          {aed.description && (
            <p className="text-muted-foreground">{aed.description}</p>
          )}

          {/* Hours */}
          <div className="mt-2 flex items-start gap-2 text-muted-foreground">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="space-y-0.5 text-xs">
              <p>
                {t("facilities.weekdays")}:{" "}
                {aed.weekdayHours ?? t("facilities.closed")}
              </p>
              <p>
                {t("facilities.saturday")}:{" "}
                {aed.saturdayHours ?? t("facilities.closed")}
              </p>
              <p>
                {t("facilities.sunday")}:{" "}
                {aed.sundayHours ?? t("facilities.closed")}
              </p>
              {aed.hoursNote && <p className="italic">{aed.hoursNote}</p>}
            </div>
          </div>

          {/* Phone */}
          {aed.phone && (
            <div className="mt-1.5 flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <a href={`tel:${aed.phone}`} className="text-xs underline">
                {aed.phone}
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
