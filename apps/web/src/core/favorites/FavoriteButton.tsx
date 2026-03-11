import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFavorites } from "./useFavorites";

interface FavoriteButtonProps {
  moduleKey: string;
  id: string;
  label: string;
  lat: number;
  lon: number;
  data?: unknown;
}

export default function FavoriteButton({
  moduleKey,
  id,
  label,
  lat,
  lon,
  data,
}: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { isFavorite, toggle } = useFavorites(moduleKey);
  const favorited = isFavorite(id);

  return (
    <button
      onClick={() => toggle(id, label, lat, lon, data)}
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors hover:bg-muted"
      aria-label={favorited ? t("favorites.remove") : t("favorites.add")}
    >
      <Heart
        className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
      />
      <span className="text-muted-foreground">
        {favorited ? t("favorites.saved") : t("favorites.add")}
      </span>
    </button>
  );
}
