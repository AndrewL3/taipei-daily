import { Link } from "react-router";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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

interface StopDetailProps {
  stop: NearbyStop | null;
  onClose: () => void;
}

export default function StopDetail({ stop, onClose }: StopDetailProps) {
  const { data, isLoading } = useRouteDetail(stop?.routeLineId);

  // Find the matching annotated stop by rank
  const annotated = data?.stops.find((s) => s.rank === stop?.rank);

  function formatEta(eta: string): string {
    // eta is ISO 8601 like "2026-03-01T14:52:20+08:00"
    return eta.slice(11, 16); // "14:52"
  }

  function formatPassedAt(passedAt: string): string {
    return passedAt.slice(11, 16);
  }

  return (
    <Drawer open={stop !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">{stop?.name}</DrawerTitle>
          <p className="text-muted-foreground text-sm">{stop?.routeLineName}</p>
        </DrawerHeader>

        <div className="px-4 pb-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-48" />
            </div>
          ) : annotated ? (
            <div className="space-y-4">
              {/* Collection types */}
              {annotated.collectsToday.length > 0 && (
                <div className="flex gap-2">
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
                      {formatPassedAt(annotated.passedAt)}
                    </span>
                  </p>
                ) : annotated.eta ? (
                  <p className="text-amber-600 dark:text-amber-400">
                    ETA:{" "}
                    <span className="tabular-nums font-medium">
                      ~{formatEta(annotated.eta)}
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
                <Link to={`/route/${stop?.routeLineId}`}>
                  Show full route
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Stop details not available
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
