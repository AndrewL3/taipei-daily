import { useRef, useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  MapPin,
  ShieldAlert,
  Trash2,
  Bus,
  Bike,
  ParkingSquare,
  GripVertical,
} from "lucide-react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useGeolocation } from "@/hooks/useGeolocation";
import { getRegisteredModules } from "../module-registry";
import { usePullToRefresh } from "./usePullToRefresh";
import { useDashboardOrder } from "./useDashboardOrder";
import { useLongPress } from "./useLongPress";
import { useDismissedTooltips } from "./useDismissedTooltips";
import QuickActionsPopover from "./QuickActionsPopover";
import TooltipCallout from "./TooltipCallout";
import SearchBar from "../search/SearchBar";
import AlertBanner from "@/modules/alerts/components/AlertBanner";
import FavoritesDashboardSection from "../favorites/FavoritesDashboardSection";
import { useAllFavorites } from "../favorites/useFavorites";
import type { ModuleDefinition } from "../types";

const TOOLTIP_PRIORITY = [
  "search-hint",
  "long-press-hint",
  "favorites-reorder",
];

function getGreetingKey(): string {
  const hour = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Taipei",
    }).format(new Date()),
    10,
  );
  if (hour >= 5 && hour < 12) return "dashboard.greeting.morning";
  if (hour >= 12 && hour < 18) return "dashboard.greeting.afternoon";
  return "dashboard.greeting.evening";
}

function SortableCard({
  id,
  mod,
  children,
  onLongPress,
}: {
  id: string;
  mod: ModuleDefinition;
  children: React.ReactNode;
  onLongPress: (mod: ModuleDefinition, rect: DOMRect) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const cardRef = useRef<HTMLDivElement>(null);

  const longPress = useLongPress(() => {
    if (cardRef.current) {
      onLongPress(mod, cardRef.current.getBoundingClientRect());
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div ref={cardRef} {...longPress}>
        {children}
      </div>
      <button
        {...attributes}
        {...listeners}
        className="absolute right-3 top-1/2 -translate-y-1/2 touch-none p-1 text-muted-foreground/30 hover:text-muted-foreground/60"
        aria-label="Reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DashboardView() {
  const { t } = useTranslation();
  const { located } = useGeolocation();
  const modules = getRegisteredModules();

  // Pull-to-refresh
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries();
  }, [queryClient]);
  const { offset: pullOffset, isRefreshing } = usePullToRefresh(
    scrollRef,
    handleRefresh,
    isFetching === 0,
  );

  // Dashboard card reorder
  const [cardOrder, setCardOrder] = useDashboardOrder();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = cardOrder.indexOf(active.id as string);
        const newIndex = cardOrder.indexOf(over.id as string);
        setCardOrder(arrayMove(cardOrder, oldIndex, newIndex));
      }
    },
    [cardOrder, setCardOrder],
  );

  // Long-press quick actions
  const [quickAction, setQuickAction] = useState<{
    mod: ModuleDefinition;
    rect: DOMRect;
  } | null>(null);
  const handleLongPress = useCallback(
    (mod: ModuleDefinition, rect: DOMRect) => {
      if (mod.quickActions && mod.quickActions.length > 0) {
        setQuickAction({ mod, rect });
      }
    },
    [],
  );

  // Contextual tooltips
  const { dismiss, getActiveTooltip } = useDismissedTooltips();
  const activeTooltip = getActiveTooltip(TOOLTIP_PRIORITY);
  const allFavorites = useAllFavorites();
  const totalFavorites = Object.values(allFavorites).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  const allCards = modules
    .filter((m) => m.dashboardCard)
    .map((m) => ({ id: m.id, Card: m.dashboardCard!, mod: m }));

  const heroCards = allCards.filter((c) => c.id === "weather");
  const alertCards = allCards.filter((c) => c.id === "alerts");

  // Order the 4 reorderable module cards
  const reorderableIds = cardOrder.filter((id) =>
    allCards.some((c) => c.id === id),
  );
  const orderedCards = reorderableIds
    .map((id) => allCards.find((c) => c.id === id)!)
    .filter(Boolean);
  const hasNearby = orderedCards.length > 0;

  return (
    <div className="view-enter flex h-full flex-col bg-background">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {/* Pull-to-refresh indicator */}
        {(pullOffset > 0 || isRefreshing) && (
          <div
            className="flex items-center justify-center text-primary"
            style={{
              height: `${pullOffset}px`,
              ...(isRefreshing ? {} : { transition: "none" }),
            }}
          >
            <svg
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}
        <div className="stagger mx-auto max-w-lg px-4 pb-8 pt-6">
          {/* Header group — tight spacing within */}
          <div className="space-y-3">
            <h1 className="font-display text-2xl">{t(getGreetingKey())}</h1>
            <SearchBar />
            {activeTooltip === "search-hint" && (
              <TooltipCallout
                message={t("dashboard.tooltip.searchHint")}
                onDismiss={() => dismiss("search-hint")}
              />
            )}
            <AlertBanner />
            <FavoritesDashboardSection />
            {activeTooltip === "favorites-reorder" && totalFavorites >= 2 && (
              <TooltipCallout
                message={t("dashboard.tooltip.favoritesReorder")}
                onDismiss={() => dismiss("favorites-reorder")}
              />
            )}
          </div>

          {/* Weather — hero position, generous separation */}
          {heroCards.length > 0 && (
            <div className="mt-6">
              {heroCards.map(({ id, Card }) => (
                <Card key={id} />
              ))}
            </div>
          )}

          {/* Discovery card — shown when location is off */}
          {!located && hasNearby && (
            <div className="card-lift mt-6 rounded-2xl border-t-2 border-teal-500 bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="flex gap-2.5">
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-teal-500 to-sky-500 shadow-[0_2px_8px_rgba(13,148,136,0.3)]">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 shadow-[0_2px_8px_rgba(59,130,246,0.3)]">
                  <Bus className="h-5 w-5 text-white" />
                </div>
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-emerald-500 to-green-400 shadow-[0_2px_8px_rgba(16,185,129,0.3)]">
                  <Bike className="h-5 w-5 text-white" />
                </div>
                <div className="gradient-icon h-10 w-10 bg-gradient-to-br from-violet-500 to-purple-500 shadow-[0_2px_8px_rgba(139,92,246,0.3)]">
                  <ParkingSquare className="h-5 w-5 text-white" />
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold">
                {t("dashboard.discovery.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.discovery.description")}
              </p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      () => window.location.reload(),
                      () => {},
                      { enableHighAccuracy: true, timeout: 10_000 },
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform active:scale-[0.98]"
                >
                  <MapPin className="h-4 w-4" />
                  {t("dashboard.discovery.enableLocation")}
                </button>
                <Link
                  to="/schedules"
                  className="text-sm font-medium text-primary/70 hover:text-primary"
                >
                  {t("dashboard.discovery.browseSchedules")} &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Module cards — reorderable vertical list (only when located) */}
          {located && hasNearby && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={reorderableIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="mt-6 space-y-3">
                  {orderedCards.map(({ id, Card, mod }) => (
                    <SortableCard
                      key={id}
                      id={id}
                      mod={mod}
                      onLongPress={handleLongPress}
                    >
                      <Card />
                    </SortableCard>
                  ))}
                  {orderedCards.length > 0 &&
                    activeTooltip === "long-press-hint" && (
                      <TooltipCallout
                        message={t("dashboard.tooltip.longPressHint")}
                        onDismiss={() => dismiss("long-press-hint")}
                      />
                    )}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Alerts — separate from location-based cards */}
          {alertCards.length > 0 && (
            <div className="mt-4">
              {alertCards.map(({ id, Card }) => (
                <Card key={id} />
              ))}
            </div>
          )}

          {/* Emergency info — footer with generous separation */}
          <div className="mt-8">
            <Link
              to="/safety"
              className="flex items-center gap-3 rounded-xl border border-border/12 bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50"
            >
              <ShieldAlert className="h-5 w-5 shrink-0 text-orange-500" />
              <div>
                <p className="text-sm font-medium">
                  {t("safety.dashboardTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("safety.dashboardSubtitle")}
                </p>
              </div>
            </Link>
          </div>

          {allCards.length === 0 && located && (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t("dashboard.noCards")}
            </p>
          )}
        </div>
      </div>

      {/* Long-press quick actions popover */}
      {quickAction && (
        <QuickActionsPopover
          module={quickAction.mod}
          anchorRect={quickAction.rect}
          onClose={() => setQuickAction(null)}
        />
      )}
    </div>
  );
}
