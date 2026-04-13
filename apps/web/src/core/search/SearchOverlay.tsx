import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { useSearch, type SearchResult } from "./useSearch";
import { buildMapNavigationTarget } from "../map/navigation";
import { getRegisteredModule } from "../module-registry";

interface SearchOverlayProps {
  query: string;
  onClose: () => void;
}

export default function SearchOverlay({ query, onClose }: SearchOverlayProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: results, isLoading } = useSearch(query);

  // Group results by module
  const grouped = (results ?? []).reduce<Record<string, SearchResult[]>>(
    (acc, r) => {
      (acc[r.moduleId] ??= []).push(r);
      return acc;
    },
    {},
  );

  const handleSelect = (result: SearchResult) => {
    navigate(buildMapNavigationTarget(result.moduleId, result.lat, result.lon));
    onClose();
  };

  return (
    <div className="overlay-enter absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border/12 bg-card shadow-lg">
      {isLoading && (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      )}

      {!isLoading && results && results.length === 0 && (
        <p className="p-4 text-center text-sm text-muted-foreground">
          {t("search.noResults")}
        </p>
      )}

      {!isLoading &&
        Object.entries(grouped).map(([moduleId, items]) => {
          const module = getRegisteredModule(moduleId);
          const Icon = module?.icon ?? MapPin;
          const color = module?.accentClassName ?? "text-foreground";

          return (
            <div key={moduleId}>
              <div className="sticky top-0 flex items-center gap-2 bg-card px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                {t(`search.module.${moduleId}`)}
              </div>
              {items.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {result.title}
                    </p>
                    {result.subtitle && (
                      <p className="truncate text-xs text-muted-foreground">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          );
        })}
    </div>
  );
}
