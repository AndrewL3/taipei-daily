import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
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
import { useRouteDetail } from "@/api/hooks";
import type { NearbyStop } from "@/api/client";

const COLLECTION_ICONS: Record<
  string,
  { icon: typeof Trash2; label: string; classes: string }
> = {
  garbage: {
    icon: Trash2,
    label: "Garbage",
    classes:
      "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  },
  recycling: {
    icon: Recycle,
    label: "Recycling",
    classes: "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300",
  },
  foodScraps: {
    icon: Apple,
    label: "Food Scraps",
    classes:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300",
  },
};

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

interface StopDetailContentProps {
  stop: NearbyStop;
  onClose?: () => void;
}

export default function StopDetailContent({ stop, onClose }: StopDetailContentProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError } = useRouteDetail(stop.routeLineId);
  const annotated = data?.stops.find((s) => s.rank === stop.rank);

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
        <span>Unable to load schedule</span>
      </div>
    );
  }

  if (!annotated) {
    return (
      <p className="text-muted-foreground text-sm">
        Stop details not available
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hero ETA / Status */}
      <div className="rounded-lg bg-muted/50 px-3 py-2.5">
        {annotated.passedAt ? (
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-muted-foreground">Passed at</p>
              <p className="text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">
                {formatTime(annotated.passedAt)}
              </p>
            </div>
          </div>
        ) : annotated.eta ? (
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Arriving around</p>
              <p className="text-lg font-semibold tabular-nums text-primary">
                ~{formatTime(annotated.eta)}
                {data?.progress.deltaMinutes != null && (
                  <span className="text-muted-foreground ml-2 text-xs font-normal">
                    ({data.progress.deltaMinutes > 0 ? "+" : ""}
                    {data.progress.deltaMinutes} min)
                  </span>
                )}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Scheduled</p>
              <p className="text-lg font-semibold tabular-nums">
                {annotated.scheduledTime}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Collection types */}
      {annotated.collectsToday.length > 0 && (
        <>
          <div className="border-t border-border" />
          <div className="flex flex-wrap gap-2">
            {annotated.collectsToday.map((type) => {
              const info = COLLECTION_ICONS[type];
              if (!info) return null;
              const Icon = info.icon;
              return (
                <Badge
                  key={type}
                  variant="secondary"
                  className={`gap-1 border-0 ${info.classes}`}
                >
                  <Icon className="h-3 w-3" />
                  {info.label}
                </Badge>
              );
            })}
          </div>
        </>
      )}

      {/* Show route button */}
      <div className="border-t border-border pt-1">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            onClose?.();
            navigate(`/route/${stop.routeLineId}`);
          }}
        >
          Show full route
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
