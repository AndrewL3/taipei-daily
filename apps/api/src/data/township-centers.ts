export interface TownshipCenter {
  name: string;
  city: "Taipei" | "NewTaipei";
  datasetId: string; // CWA dataset ID for this city
  lat: number;
  lon: number;
}

// CWA dataset IDs
const TAIPEI_DATASET = "F-D0047-061";
const NEW_TAIPEI_DATASET = "F-D0047-069";

export const TOWNSHIP_CENTERS: TownshipCenter[] = [
  // Taipei City (12 districts)
  { name: "中正區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0324, lon: 121.5183 },
  { name: "大同區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0633, lon: 121.5130 },
  { name: "中山區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0685, lon: 121.5376 },
  { name: "松山區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0497, lon: 121.5579 },
  { name: "大安區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0268, lon: 121.5435 },
  { name: "萬華區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0337, lon: 121.4998 },
  { name: "信義區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0306, lon: 121.5712 },
  { name: "士林區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0926, lon: 121.5249 },
  { name: "北投區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.1316, lon: 121.5019 },
  { name: "內湖區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0690, lon: 121.5886 },
  { name: "南港區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 25.0380, lon: 121.6069 },
  { name: "文山區", city: "Taipei", datasetId: TAIPEI_DATASET, lat: 24.9891, lon: 121.5703 },

  // New Taipei City (29 districts)
  { name: "板橋區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0093, lon: 121.4593 },
  { name: "三重區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0615, lon: 121.4873 },
  { name: "中和區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9994, lon: 121.4932 },
  { name: "永和區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0073, lon: 121.5147 },
  { name: "新莊區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0360, lon: 121.4503 },
  { name: "新店區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9675, lon: 121.5418 },
  { name: "土城區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9723, lon: 121.4437 },
  { name: "蘆洲區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0848, lon: 121.4735 },
  { name: "樹林區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9906, lon: 121.4206 },
  { name: "汐止區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0630, lon: 121.6480 },
  { name: "鶯歌區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9554, lon: 121.3548 },
  { name: "三峽區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9340, lon: 121.3688 },
  { name: "淡水區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.1694, lon: 121.4410 },
  { name: "瑞芳區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.1087, lon: 121.8103 },
  { name: "五股區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0830, lon: 121.4380 },
  { name: "泰山區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0593, lon: 121.4316 },
  { name: "林口區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0775, lon: 121.3918 },
  { name: "深坑區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0022, lon: 121.6155 },
  { name: "石碇區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9916, lon: 121.6585 },
  { name: "坪林區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.9374, lon: 121.7112 },
  { name: "三芝區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.2058, lon: 121.5003 },
  { name: "石門區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.2713, lon: 121.5685 },
  { name: "八里區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.1471, lon: 121.3986 },
  { name: "平溪區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0258, lon: 121.7383 },
  { name: "雙溪區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0333, lon: 121.8656 },
  { name: "貢寮區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.0222, lon: 121.9082 },
  { name: "金山區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.2215, lon: 121.6362 },
  { name: "萬里區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 25.1796, lon: 121.6388 },
  { name: "烏來區", city: "NewTaipei", datasetId: NEW_TAIPEI_DATASET, lat: 24.8654, lon: 121.5505 },
];

/** Find the nearest township to the given coordinates */
export function findNearestTownship(lat: number, lon: number): TownshipCenter {
  let nearest = TOWNSHIP_CENTERS[0];
  let minDist = Infinity;

  for (const t of TOWNSHIP_CENTERS) {
    const dlat = t.lat - lat;
    const dlon = t.lon - lon;
    const dist = dlat * dlat + dlon * dlon; // squared distance is fine for comparison
    if (dist < minDist) {
      minDist = dist;
      nearest = t;
    }
  }

  return nearest;
}
