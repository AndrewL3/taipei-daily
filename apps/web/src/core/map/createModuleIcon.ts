import L from "leaflet";

// --- Lucide SVG inner paths (viewBox 0 0 24 24) ---

const ICON_PATHS = {
  garbage: [
    '<path d="M10 11v6"/>',
    '<path d="M14 11v6"/>',
    '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
    '<path d="M3 6h18"/>',
    '<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  ],
  youbike: [
    '<circle cx="18.5" cy="17.5" r="3.5"/>',
    '<circle cx="5.5" cy="17.5" r="3.5"/>',
    '<circle cx="15" cy="5" r="1"/>',
    '<path d="M12 17.5V14l-3-3 4-3 2 3h2"/>',
  ],
  transit: [
    '<path d="M8 6v6"/>',
    '<path d="M15 6v6"/>',
    '<path d="M2 12h19.6"/>',
    '<path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>',
    '<circle cx="7" cy="18" r="2"/>',
    '<path d="M9 18h5"/>',
    '<circle cx="16" cy="18" r="2"/>',
  ],
  parking: [
    '<rect width="18" height="18" x="3" y="3" rx="2"/>',
    '<path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>',
  ],
} as const;

const MODULE_COLORS = {
  garbage: "#0d9488",
  youbike: "#65a30d",
  transit: "#3b82f6",
  parking: "#8b5cf6",
} as const;

export type ModuleId = keyof typeof MODULE_COLORS;
export type MarkerState = "default" | "selected" | "faded";

export function createModuleIcon(
  module: ModuleId,
  state: MarkerState,
): L.DivIcon {
  const color = MODULE_COLORS[module];
  const paths = ICON_PATHS[module].join("");

  const isSelected = state === "selected";
  const isFaded = state === "faded";

  const bg = isSelected ? color : "white";
  const border = color;
  const stroke = isSelected ? "white" : color;
  const shadow = isSelected
    ? `0 2px 8px ${color}66`
    : "0 1px 4px rgba(0,0,0,0.15)";
  const opacity = isFaded ? "0.3" : "1";

  const html = `
    <div style="
      width:22px;height:22px;border-radius:50%;
      background:${bg};border:2px solid ${border};
      box-shadow:${shadow};opacity:${opacity};
      display:flex;align-items:center;justify-content:center;
    ">
      <svg width="11" height="11" viewBox="0 0 24 24"
        fill="none" stroke="${stroke}" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        ${paths}
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    tooltipAnchor: [0, -14],
  });
}
