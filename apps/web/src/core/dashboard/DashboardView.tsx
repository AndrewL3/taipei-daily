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
  HelpCircle,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useGeolocation, retryGeolocation } from "@/hooks/useGeolocation";
import { useActiveAlerts } from "@/modules/alerts/api/hooks";
import { getRegisteredModules } from "../module-registry";
import { usePullToRefresh } from "./usePullToRefresh";
import { useDashboardOrder } from "./useDashboardOrder";
import { useLongPress } from "./useLongPress";
import { useDismissedTooltips } from "./useDismissedTooltips";
import QuickActionsPopover from "./QuickActionsPopover";
import TooltipCallout from "./TooltipCallout";
import SettingsDropdown from "./SettingsDropdown";
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
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative ${isDragging ? "z-10 rounded-2xl shadow-lg" : ""}`}
    >
      <div ref={cardRef} {...longPress}>
        {children}
      </div>
      <button
        {...attributes}
        {...listeners}
        className="absolute right-3 top-1/2 -translate-y-1/2 touch-none p-1.5 text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
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
  const handleRefresh = useCallback(() => {
    return queryClient.invalidateQueries();
  }, [queryClient]);
  const { offset: pullOffset, isRefreshing } = usePullToRefresh(scrollRef, handleRefresh);

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
    [setQuickAction],
  );

  // Contextual tooltips
  const { dismiss, resetAll, getActiveTooltip } = useDismissedTooltips();
  const activeTooltip = getActiveTooltip(TOOLTIP_PRIORITY);
  const allFavorites = useAllFavorites();
  const totalFavorites = Object.values(allFavorites).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );

  // Alert-aware safety icon color
  const { data: alertsData } = useActiveAlerts();
  const activeAlertsList = alertsData ?? [];
  const severityOrder = ["Extreme", "Severe", "Moderate", "Minor", "Unknown"];
  const highestAlert =
    activeAlertsList.length > 0
      ? activeAlertsList.reduce((a, b) =>
          severityOrder.indexOf(a.severity) < severityOrder.indexOf(b.severity)
            ? a
            : b,
        )
      : null;
  const safetyIconColor = !highestAlert
    ? "text-muted-foreground"
    : highestAlert.severity === "Extreme" || highestAlert.severity === "Severe"
      ? "text-red-500"
      : highestAlert.severity === "Moderate"
        ? "text-amber-500"
        : "text-blue-500";

  const allCards = modules
    .filter((m) => m.dashboardCard)
    .sort(
      (a, b) => (a.dashboardCardOrder ?? 0) - (b.dashboardCardOrder ?? 0),
    )
    .map((m) => ({ id: m.id, Card: m.dashboardCard!, mod: m }));

  const heroCards = allCards.filter(
    (c) => c.mod.dashboardCardPlacement === "hero",
  );
  const priorityCards = allCards.filter(
    (c) => c.mod.dashboardCardPlacement === "priority",
  );
  const reorderableCards = allCards.filter(
    (c) => (c.mod.dashboardCardPlacement ?? "nearby") === "nearby",
  );

  // Dashboard card reorder
  const [cardOrder, setCardOrder] = useDashboardOrder(
    reorderableCards.map((card) => card.id),
  );
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

  // Order the reorderable module cards
  const reorderableIds = cardOrder.filter((id) =>
    reorderableCards.some((c) => c.id === id),
  );
  const orderedCards = reorderableIds
    .map((id) => reorderableCards.find((c) => c.id === id)!)
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
            <RefreshCw
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
              style={
                !isRefreshing
                  ? {
                      transform: `rotate(${(pullOffset / 60) * 360}deg)${pullOffset >= 50 ? " scale(1.2)" : ""}`,
                      opacity: Math.min(pullOffset / 30, 1),
                    }
                  : undefined
              }
            />
          </div>
        )}
        <div className="stagger mx-auto max-w-lg px-4 pb-8 pt-6">
          {/* Header group — tight spacing within */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-2xl">{t(getGreetingKey())}</h1>
              <div className="flex items-center gap-0.5">
                <SettingsDropdown />
                <button
                  onClick={resetAll}
                  className="-m-1 rounded-full p-2.5 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
                  aria-label={t("dashboard.showTips")}
                >
                  <HelpCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
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

          {/* Alerts — promoted above nearby when active */}
          {activeAlertsList.length > 0 && priorityCards.length > 0 && (
            <div className="mt-4">
              {priorityCards.map(({ id, Card }) => (
                <Card key={id} />
              ))}
            </div>
          )}

          {/* Discovery card — shown when location is off */}
          {!located && hasNearby && (
            <div className="card-lift mt-6 rounded-2xl bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="font-display text-base">
                {t("dashboard.discovery.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("dashboard.discovery.description")}
              </p>
              <div className="mt-3 grid grid-cols-4 gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10">
                    <Trash2 className="h-5 w-5 text-teal-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("dashboard.garbage.title")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                    <Bus className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("dashboard.transit.title")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-600/10">
                    <Bike className="h-5 w-5 text-lime-600" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("dashboard.youbike.title")}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/10">
                    <ParkingSquare className="h-5 w-5 text-violet-500" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("dashboard.parking.title")}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={() =>
                    navigator.geolocation?.getCurrentPosition(
                      () => retryGeolocation(),
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
                  className="text-sm font-medium text-primary/80 transition-colors hover:text-primary"
                >
                  {t("dashboard.discovery.browseSchedules")} &rarr;
                </Link>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground/60">
                {t("dashboard.discovery.locationHint")}
              </p>
            </div>
          )}

          {/* Module cards — reorderable vertical list (only when located) */}
          {located && hasNearby && (
            <div className="mt-5">
              <h2 className="mb-2 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("dashboard.nearby")}
              </h2>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={reorderableIds}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid gap-2.5 sm:grid-cols-2">
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
                      <div className="sm:col-span-2">
                        <TooltipCallout
                          message={t("dashboard.tooltip.longPressHint")}
                          onDismiss={() => dismiss("long-press-hint")}
                        />
                      </div>
                    )}
                </div>
              </SortableContext>
            </DndContext>
            </div>
          )}

          {/* Alerts — below nearby when no active alerts (shows "all clear") */}
          {activeAlertsList.length === 0 && priorityCards.length > 0 && (
            <div className="mt-4">
              {priorityCards.map(({ id, Card }) => (
                <Card key={id} />
              ))}
            </div>
          )}

          {/* Emergency info */}
          <div className="mt-5">
            <Link
              to="/safety"
              className="card-lift flex items-center gap-4 rounded-2xl bg-card p-4 shadow-[var(--shadow-card)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                <ShieldAlert className={`h-5 w-5 ${safetyIconColor}`} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {t("safety.dashboardTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("safety.dashboardSubtitle")}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
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
