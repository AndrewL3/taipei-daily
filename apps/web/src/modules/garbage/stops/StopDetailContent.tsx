import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  Trash2,
  Recycle,
  Apple,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import FavoriteButton from "@/core/favorites/FavoriteButton";
import DirectionsButton from "@/components/DirectionsButton";
import { useRouteDetail } from "../api/hooks";
import type { NearbyStop } from "../api/client";

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

interface StopDetailContentProps {
  stop: NearbyStop;
  onClose?: () => void;
}

export default function StopDetailContent({
  stop,
  onClose,
}: StopDetailContentProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, isError } = useRouteDetail(stop.routeLineId);
  const annotated = data?.stops.find((s) => s.rank === stop.rank);

  const COLLECTION_ICONS: Record<
    string,
    { icon: typeof Trash2; title: string }
  > = {
    garbage: { icon: Trash2, title: t("collection.garbage") },
    recycling: { icon: Recycle, title: t("collection.recycling") },
    foodScraps: { icon: Apple, title: t("collection.foodScraps") },
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-48" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span>{t("stop.unableToLoad")}</span>
      </div>
    );
  }

  if (!annotated) {
    return (
      <p className="text-muted-foreground text-sm">{t("stop.notAvailable")}</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero ETA / Status */}
      <div className="rounded-xl bg-card px-4 py-3 shadow-sm">
        {annotated.passedAt ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-green-500" />
            <div className="flex flex-1 items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stop.passedAt")}
                </p>
                <p className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">
                  {formatTime(annotated.passedAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {t("stop.scheduledTime")}
                </p>
                <p className="text-base tabular-nums text-muted-foreground">
                  {annotated.scheduledTime}
                </p>
              </div>
            </div>
          </div>
        ) : annotated.eta ? (
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
            <div className="flex flex-1 items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("stop.arrivingAround")}
                </p>
                <p className="text-2xl font-bold tabular-nums text-primary">
                  ~{formatTime(annotated.eta)}
                  {data?.progress.deltaMinutes != null && (
                    <span className="text-muted-foreground ml-2 text-sm font-normal">
                      ({data.progress.deltaMinutes > 0 ? "+" : ""}
                      {data.progress.deltaMinutes} {t("unit.min")})
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {t("stop.scheduledTime")}
                </p>
                <p className="text-base tabular-nums text-muted-foreground">
                  {annotated.scheduledTime}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Clock className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">
                {t("stop.scheduled")}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                {annotated.scheduledTime}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <FavoriteButton
          moduleKey="garbage"
          id={stop.routeLineId}
          label={stop.routeLineName}
          lat={stop.latitude}
          lon={stop.longitude}
          data={stop}
        />
        <DirectionsButton lat={stop.latitude} lon={stop.longitude} />
      </div>

      {/* Collection type icons */}
      {annotated.collectsToday.length > 0 && (
        <div className="flex gap-2 px-1">
          {annotated.collectsToday.map((type) => {
            const info = COLLECTION_ICONS[type];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <Icon
                key={type}
                className="h-4 w-4 text-muted-foreground"
                aria-label={info.title}
              />
            );
          })}
        </div>
      )}

      {/* Show route button — primary filled */}
      <Button
        className="w-full"
        onClick={() => {
          onClose?.();
          navigate(`/route/${stop.routeLineId}`);
        }}
      >
        {t("stop.showFullRoute")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
