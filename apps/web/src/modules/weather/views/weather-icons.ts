import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  CloudLightning,
  CloudFog,
  CloudSnow,
  type LucideIcon,
} from "lucide-react";

const WX_ICON_MAP: [RegExp, LucideIcon][] = [
  [/雷/, CloudLightning],
  [/雪/, CloudSnow],
  [/雨/, CloudRain],
  [/陰/, CloudFog],
  [/多雲/, CloudSun],
  [/晴/, Sun],
  [/霧/, CloudFog],
];

export function getWeatherIcon(wx: string): LucideIcon {
  for (const [pattern, icon] of WX_ICON_MAP) {
    if (pattern.test(wx)) return icon;
  }
  return Cloud; // fallback
}
