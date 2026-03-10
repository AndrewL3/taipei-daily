import { Footprints } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DirectionsButtonProps {
  lat: number;
  lon: number;
}

function getDirectionsUrl(lat: number, lon: number): string {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Macintosh") && navigator.maxTouchPoints > 1);

  if (isIOS) {
    return `maps://maps.apple.com/?daddr=${lat},${lon}&dirflg=w`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=walking`;
}

export default function DirectionsButton({
  lat,
  lon,
}: DirectionsButtonProps) {
  const { t } = useTranslation();

  return (
    <a
      href={getDirectionsUrl(lat, lon)}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
    >
      <Footprints className="h-4 w-4" />
      <span>{t("directions.walk")}</span>
    </a>
  );
}
