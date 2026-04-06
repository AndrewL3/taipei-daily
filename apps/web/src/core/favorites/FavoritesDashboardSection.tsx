import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Heart, GripVertical, X } from "lucide-react";
import { toast } from "sonner";
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
import {
  useAllFavorites,
  addFavorite,
  removeFavorite,
  loadDisplayOrder,
  saveDisplayOrder,
} from "./useFavorites";
import { getRegisteredModules } from "../module-registry";
import { useNavigate } from "react-router";
import type { FavoriteItem } from "./storage";

interface FavEntry {
  key: string;
  moduleKey: string;
  moduleName: string;
  fav: FavoriteItem;
}

function SortableFavorite({
  entry,
  editMode,
  onRemove,
  onNavigate,
}: {
  entry: FavEntry;
  editMode: boolean;
  onRemove: (entry: FavEntry) => void;
  onNavigate: (entry: FavEntry) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: entry.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  if (editMode) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex items-center gap-3 rounded-2xl border border-dashed border-border/30 bg-card px-4 py-3"
      >
        <button
          {...attributes}
          {...listeners}
          className="touch-none p-1 text-muted-foreground/40 hover:text-muted-foreground/70"
          aria-label="Reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{entry.fav.label}</p>
          <p className="text-xs text-muted-foreground">{t(entry.moduleName)}</p>
        </div>
        <button
          onClick={() => onRemove(entry)}
          className="p-1 text-muted-foreground/50 hover:text-destructive"
          aria-label="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => onNavigate(entry)}
      className="card-lift flex w-full items-center gap-3 rounded-2xl border border-border/12 bg-card px-4 py-3 text-left shadow-[var(--shadow-card)]"
    >
      <Heart className="h-4 w-4 shrink-0 fill-red-500 text-red-500" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.fav.label}</p>
        <p className="text-xs text-muted-foreground">{t(entry.moduleName)}</p>
      </div>
    </button>
  );
}

export default function FavoritesDashboardSection() {
  const { t } = useTranslation();
  const modules = getRegisteredModules();
  const navigate = useNavigate();
  const allFavorites = useAllFavorites();
  const [editMode, setEditMode] = useState(false);
  const [displayOrder, setDisplayOrder] = useState(loadDisplayOrder);

  const rawEntries: FavEntry[] = modules
    .filter((m) => m.favoritesConfig)
    .flatMap((mod) => {
      const key = mod.favoritesConfig!.storageKey;
      return (allFavorites[key] ?? []).map((fav) => ({
        key: `${key}:${fav.id}`,
        moduleKey: key,
        moduleName: mod.name,
        fav,
      }));
    });

  // Apply saved display order (state-driven for immediate re-render)
  const entries = [...rawEntries].sort((a, b) => {
    const ai = displayOrder.indexOf(a.key);
    const bi = displayOrder.indexOf(b.key);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const keys = entries.map((e) => e.key);
      const oldIndex = keys.indexOf(active.id as string);
      const newIndex = keys.indexOf(over.id as string);
      const newOrder = arrayMove(keys, oldIndex, newIndex);
      setDisplayOrder(newOrder);
      saveDisplayOrder(newOrder);
    },
    [entries],
  );

  const handleRemove = useCallback(
    async (entry: FavEntry) => {
      const removed = await removeFavorite(entry.moduleKey, entry.fav.id);
      const newOrder = displayOrder.filter((k) => k !== entry.key);
      setDisplayOrder(newOrder);
      saveDisplayOrder(newOrder);
      if (removed) {
        toast(t("favorites.removed"), {
          action: {
            label: t("favorites.undo"),
            onClick: () => addFavorite(entry.moduleKey, removed),
          },
        });
      }
    },
    [t, displayOrder],
  );

  const handleNavigate = useCallback(
    (entry: FavEntry) => {
      navigate(`/map?lat=${entry.fav.lat}&lon=${entry.fav.lon}&zoom=17`);
    },
    [navigate],
  );

  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 py-1 text-[13px] text-muted-foreground">
        <Heart className="h-4 w-4" />
        <span>{t("favorites.emptyHint")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h2 className="flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <Heart className="h-4 w-4" />
          {t("favorites.title")}
        </h2>
        <button
          onClick={() => setEditMode(!editMode)}
          className="ml-auto text-xs font-medium text-primary/80 transition-colors hover:text-primary"
        >
          {editMode ? t("favorites.done") : t("favorites.edit")}
        </button>
      </div>
      {editMode ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={entries.map((e) => e.key)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {entries.map((entry) => (
                <SortableFavorite
                  key={entry.key}
                  entry={entry}
                  editMode
                  onRemove={handleRemove}
                  onNavigate={handleNavigate}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <SortableFavorite
              key={entry.key}
              entry={entry}
              editMode={false}
              onRemove={handleRemove}
              onNavigate={handleNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
