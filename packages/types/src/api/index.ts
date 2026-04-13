export {
  VehicleGpsSchema,
  VehicleGpsArraySchema,
  type VehicleGps,
  type VehicleGpsArray,
} from "./vehicle-gps.js";

export {
  RouteStopRawSchema,
  RouteStopRawArraySchema,
  transformRouteStop,
  type RouteStopRaw,
  type RouteStop,
} from "./route-stop.js";

export {
  NtcYouBikeRawSchema,
  NtcYouBikeRawArraySchema,
  TpeYouBikeRawSchema,
  TpeYouBikeRawArraySchema,
  transformNtcStation,
  transformTpeStation,
  type NtcYouBikeRaw,
  type TpeYouBikeRaw,
  type YouBikeStation,
} from "./youbike.js";

export {
  TaipeiGarbageCsvRowSchema,
  parseTaipeiGarbageCsv,
  type TaipeiGarbageCsvRow,
  type TaipeiGarbageStop,
} from "./taipei-garbage.js";

export {
  TdxBusStopRawSchema,
  TdxBusStopRawArraySchema,
  TdxStopOfRouteRawSchema,
  TdxStopOfRouteRawArraySchema,
  flattenStopsOfRoute,
  TdxBusStopMinimalSchema,
  TdxBusStopMinimalArraySchema,
  TdxBusEtaRawSchema,
  TdxBusEtaRawArraySchema,
  TdxBusPositionRawSchema,
  TdxBusPositionRawArraySchema,
  TdxBusRouteRawSchema,
  TdxBusRouteRawArraySchema,
  buildBusStationId,
  groupStopsIntoStations,
  transformArrivals,
  type CityKey,
  type TdxBusStopRaw,
  type TdxStopOfRouteRaw,
  type TdxBusStopMinimal,
  type TdxBusEtaRaw,
  type TdxBusPositionRaw,
  type TdxBusRouteRaw,
  type BusStation,
  type BusArrival,
  type BusRouteDetail,
  type BusRouteStop,
  type BusVehicle,
} from "./tdx-bus.js";

export {
  NtcParkingSpaceRawSchema,
  NtcParkingSpaceRawArraySchema,
  groupSpacesIntoRoadSegments,
  type NtcParkingSpaceRaw,
  type ParkingRoadSegment,
} from "./parking.js";

export {
  CwaForecastResponseSchema,
  transformCwaForecast,
  type CwaForecastResponse,
  type ForecastPeriod,
  type WeatherForecast,
} from "./weather.js";

export {
  NcdrFeedEntrySchema,
  NcdrFeedEntryArraySchema,
  filterAlertsByArea,
  type NcdrFeedEntry,
  type ActiveAlert,
} from "./ncdr-alerts.js";
