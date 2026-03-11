import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Phone,
  Shield,
  MapPin,
  Mountain,
  CloudRain,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import shelters from "@/data/shelters.json";

interface Shelter {
  name: string;
  lat: number;
  lon: number;
  district: string;
  capacity: number;
  type: string;
  address?: string;
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function shelterTypeLabel(type: string, t: (k: string) => string): string {
  switch (type) {
    case "indoor":
      return t("safety.indoor");
    case "outdoor":
      return t("safety.outdoor");
    case "indoor_outdoor":
      return t("safety.indoorOutdoor");
    default:
      return type;
  }
}

const EMERGENCY_NUMBERS = [
  { key: "police", number: "110" },
  { key: "fireAmbulance", number: "119" },
  { key: "cityServices", number: "1999" },
  { key: "cdc", number: "1922" },
] as const;

export default function SafetyView() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { position, located } = useGeolocation();

  const nearbyShelters = located
    ? (shelters as Shelter[])
        .map((s) => ({
          ...s,
          distance: haversineKm(position.lat, position.lon, s.lat, s.lon),
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 20)
    : [];

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
          {/* Header — inverted section */}
          <div className="inverted-section -mx-4 -mt-6 mb-2 px-4 pb-6 pt-6">
            <div className="relative flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="rounded-lg p-1.5 transition-colors hover:bg-white/10"
                aria-label={t("route.back")}
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="space-y-1">
                <div className="section-label" style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)' }}>
                  <span className="dot" />
                  Safety
                </div>
                <h1 className="font-display text-2xl">{t("safety.title")}</h1>
              </div>
            </div>
          </div>

          {/* Emergency Numbers */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Phone className="h-4 w-4" />
              {t("safety.emergencyNumbers")}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {EMERGENCY_NUMBERS.map(({ key, number }) => (
                <a
                  key={number}
                  href={`tel:${number}`}
                  className="flex items-center gap-3 rounded-xl border border-border/12 bg-card px-4 py-3 shadow-sm transition-colors hover:bg-muted/50"
                >
                  <span className="text-xl font-bold tabular-nums text-primary">
                    {number}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t(`safety.${key}`)}
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* Safety Instructions */}
          <section className="space-y-3">
            <div className="rounded-xl border border-border/12 bg-card px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <Mountain className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-medium">
                  {t("safety.earthquake")}
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("safety.earthquakeGuide")}
              </p>
            </div>
            <div className="rounded-xl border border-border/12 bg-card px-4 py-3 shadow-sm">
              <div className="mb-2 flex items-center gap-2">
                <CloudRain className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-medium">{t("safety.typhoon")}</h3>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("safety.typhoonGuide")}
              </p>
            </div>
          </section>

          {/* Nearby Shelters */}
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Shield className="h-4 w-4" />
              {t("safety.shelters")}
            </h2>

            {!located && (
              <div className="rounded-xl border border-border/12 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MapPin className="h-5 w-5 shrink-0" />
                  <p className="text-sm">{t("safety.noLocation")}</p>
                </div>
              </div>
            )}

            {nearbyShelters.map((s) => (
              <div
                key={`${s.name}-${s.lat}`}
                className="rounded-xl border border-border/12 bg-card px-4 py-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.district}
                      {s.address ? ` · ${s.address}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-primary tabular-nums">
                    {t("safety.distance", { km: s.distance.toFixed(1) })}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    {t("safety.capacity")}: {s.capacity}
                  </span>
                  <span>
                    {t("safety.shelterType")}: {shelterTypeLabel(s.type, t)}
                  </span>
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
