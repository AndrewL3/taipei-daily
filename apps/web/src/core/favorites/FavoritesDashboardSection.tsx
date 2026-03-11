import { useTranslation } from "react-i18next";
import { Heart } from "lucide-react";
import { useAllFavorites } from "./useFavorites";
import { getRegisteredModules } from "../module-registry";
import { useNavigate } from "react-router";

export default function FavoritesDashboardSection() {
  const { t } = useTranslation();
  const modules = getRegisteredModules();
  const navigate = useNavigate();
  const allFavorites = useAllFavorites();

  const entries = modules
    .filter((m) => m.favoritesConfig)
    .flatMap((mod) => {
      const key = mod.favoritesConfig!.storageKey;
      return (allFavorites[key] ?? []).map((fav) => ({
        moduleKey: key,
        moduleName: mod.name,
        fav,
      }));
    });

  if (entries.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Heart className="h-4 w-4" />
        {t("favorites.title")}
      </h2>
      <div className="space-y-2">
        {entries.map(({ moduleKey, moduleName, fav }) => (
          <button
            key={`${moduleKey}-${fav.id}`}
            onClick={() =>
              navigate(`/map?lat=${fav.lat}&lon=${fav.lon}&zoom=17`)
            }
            className="card-lift flex w-full items-center gap-3 rounded-2xl border border-border/12 bg-card px-4 py-3 text-left shadow-[var(--shadow-card)]"
          >
            <Heart className="h-4 w-4 shrink-0 fill-red-500 text-red-500" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{fav.label}</p>
              <p className="text-xs text-muted-foreground">{t(moduleName)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
