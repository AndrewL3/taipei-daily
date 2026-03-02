import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Trash2, Recycle, Apple } from "lucide-react";
import { useRouteDetail } from "@/api/hooks";
import type { NearbyStop } from "@/api/client";

const COLLECTION_ICONS: Record<string, { icon: typeof Trash2; label: string }> =
  {
    garbage: { icon: Trash2, label: "Garbage" },
    recycling: { icon: Recycle, label: "Recycling" },
    foodScraps: { icon: Apple, label: "Food Scraps" },
  };

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

interface StopDetailContentProps {
  stop: NearbyStop;
}

export default function StopDetailContent({ stop }: StopDetailContentProps) {
  const { data, isLoading } = useRouteDetail(stop.routeLineId);
  const annotated = data?.stops.find((s) => s.rank === stop.rank);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-48" />
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
    <div className="space-y-4">
      {/* Collection types */}
      {annotated.collectsToday.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {annotated.collectsToday.map((type) => {
            const info = COLLECTION_ICONS[type];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <Badge key={type} variant="secondary" className="gap-1">
                <Icon className="h-3 w-3" />
                {info.label}
              </Badge>
            );
          })}
        </div>
      )}

      {/* Schedule and status */}
      <div className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Scheduled:</span>{" "}
          <span className="tabular-nums font-medium">
            {annotated.scheduledTime}
          </span>
        </p>
        {annotated.passedAt ? (
          <p className="text-green-600 dark:text-green-400">
            Passed at{" "}
            <span className="tabular-nums font-medium">
              {formatTime(annotated.passedAt)}
            </span>
          </p>
        ) : annotated.eta ? (
          <p className="text-amber-600 dark:text-amber-400">
            ETA:{" "}
            <span className="tabular-nums font-medium">
              ~{formatTime(annotated.eta)}
            </span>
            {data?.progress.deltaMinutes != null && (
              <span className="text-muted-foreground ml-2 text-xs">
                ({data.progress.deltaMinutes > 0 ? "+" : ""}
                {data.progress.deltaMinutes} min)
              </span>
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">No ETA available</p>
        )}
      </div>

      {/* Show route button */}
      <Button variant="outline" className="w-full" asChild>
        <Link to={`/route/${stop.routeLineId}`}>
          Show full route
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
