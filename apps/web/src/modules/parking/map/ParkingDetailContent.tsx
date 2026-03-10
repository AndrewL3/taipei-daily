import { useTranslation } from "react-i18next";
import { ParkingMeter, MapPin, Clock, DollarSign } from "lucide-react";
import FavoriteButton from "@/core/favorites/FavoriteButton";
import DirectionsButton from "@/components/DirectionsButton";
import { getAvailabilityColor } from "../utils/availability";
import type { ParkingRoadSegment } from "../api/types";

interface ParkingDetailContentProps {
  segment: ParkingRoadSegment;
}

export default function ParkingDetailContent({
  segment,
}: ParkingDetailContentProps) {
  const { t } = useTranslation();
  const color = getAvailabilityColor(segment);

  return (
    <div className="space-y-4">
      {/* Availability hero */}
      <div className="rounded-xl bg-card px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <ParkingMeter className="h-6 w-6 shrink-0" style={{ color }} />
          <div>
            <p className="text-sm text-muted-foreground">
              {t("parking.available")}
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color }}>
              {segment.availableSpaces}
              <span className="text-base font-normal text-muted-foreground">
                {" "}
                / {segment.totalSpaces} {t("parking.spaces")}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <FavoriteButton
          moduleKey="parking"
          id={segment.roadId}
          label={segment.roadName}
          lat={segment.latitude}
          lon={segment.longitude}
          data={segment}
        />
        <DirectionsButton lat={segment.latitude} lon={segment.longitude} />
      </div>

      {/* Pricing */}
      <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4 shrink-0" />
        <span>{segment.pricing}</span>
      </div>

      {/* Hours */}
      <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0" />
        <span>
          {segment.days} · {segment.hours}
        </span>
      </div>

      {/* Address / Road */}
      <div className="flex items-start gap-2 px-1 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{segment.roadName}</span>
      </div>

      {/* Memo (restrictions) */}
      {segment.memo && (
        <p className="px-1 text-xs text-muted-foreground">{segment.memo}</p>
      )}
    </div>
  );
}
