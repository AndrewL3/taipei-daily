import { describe, it, expect } from "@jest/globals";
import {
  TdxBusStopRawSchema,
  TdxBusEtaRawSchema,
  TdxBusPositionRawSchema,
  TdxBusRouteRawSchema,
  buildBusStationId,
  groupStopsIntoStations,
  transformArrivals,
} from "../tdx-bus";

const sampleStop = {
  StopUID: "TPE15001",
  StopName: { Zh_tw: "中山站", En: "Zhongshan Sta." },
  StopPosition: { PositionLat: 25.052, PositionLon: 121.52 },
  StationID: "1000",
  RouteUID: "TPE10307",
  RouteName: { Zh_tw: "307", En: "307" },
  Direction: 0,
  StopSequence: 5,
  City: "Taipei",
  CityCode: "TPE",
};

const sampleEta = {
  StopUID: "TPE15001",
  StopName: { Zh_tw: "中山站", En: "Zhongshan Sta." },
  RouteUID: "TPE10307",
  RouteName: { Zh_tw: "307", En: "307" },
  Direction: 0,
  EstimateTime: 180,
  StopStatus: 0,
  NextBusTime: "2026-03-06T18:30:00+08:00",
};

describe("TdxBusStopRawSchema", () => {
  it("parses a valid stop entry", () => {
    const parsed = TdxBusStopRawSchema.parse(sampleStop);
    expect(parsed.StopUID).toBe("TPE15001");
    expect(parsed.StopPosition.PositionLat).toBe(25.052);
    expect(parsed.StopName.Zh_tw).toBe("中山站");
  });

  it("handles missing optional fields", () => {
    const minimal = {
      StopUID: "TPE15001",
      StopName: { Zh_tw: "中山站" },
      StopPosition: { PositionLat: 25.052, PositionLon: 121.52 },
      RouteUID: "TPE10307",
      RouteName: { Zh_tw: "307" },
      Direction: 0,
      StopSequence: 5,
    };
    const parsed = TdxBusStopRawSchema.parse(minimal);
    expect(parsed.StopName.En).toBe("");
    expect(parsed.StationID).toBeUndefined();
  });

  it("rejects entry missing required StopUID", () => {
    const { StopUID: _, ...noUid } = sampleStop;
    expect(() => TdxBusStopRawSchema.parse(noUid)).toThrow();
  });
});

describe("TdxBusEtaRawSchema", () => {
  it("parses a valid ETA entry", () => {
    const parsed = TdxBusEtaRawSchema.parse(sampleEta);
    expect(parsed.EstimateTime).toBe(180);
    expect(parsed.StopStatus).toBe(0);
  });

  it("handles missing EstimateTime", () => {
    const { EstimateTime: _, ...noEta } = sampleEta;
    const parsed = TdxBusEtaRawSchema.parse(noEta);
    expect(parsed.EstimateTime).toBeUndefined();
  });
});

describe("TdxBusPositionRawSchema", () => {
  it("parses a valid position entry", () => {
    const raw = {
      PlateNumb: "ABC-1234",
      RouteUID: "TPE10307",
      RouteName: { Zh_tw: "307", En: "307" },
      Direction: 0,
      BusPosition: { PositionLat: 25.05, PositionLon: 121.52 },
      Speed: 25,
      DutyStatus: 0,
      BusStatus: 0,
    };
    const parsed = TdxBusPositionRawSchema.parse(raw);
    expect(parsed.PlateNumb).toBe("ABC-1234");
    expect(parsed.BusPosition.PositionLat).toBe(25.05);
  });
});

describe("TdxBusRouteRawSchema", () => {
  it("parses a valid route entry", () => {
    const raw = {
      RouteUID: "TPE10307",
      RouteID: "10307",
      RouteName: { Zh_tw: "307", En: "307" },
      DepartureStopNameZh: "板橋",
      DestinationStopNameZh: "撫遠街",
      City: "Taipei",
      CityCode: "TPE",
    };
    const parsed = TdxBusRouteRawSchema.parse(raw);
    expect(parsed.RouteUID).toBe("TPE10307");
    expect(parsed.DepartureStopNameZh).toBe("板橋");
  });
});

describe("groupStopsIntoStations", () => {
  it("groups stops from different routes at the same station", () => {
    const stops = [
      {
        ...sampleStop,
        RouteUID: "TPE10307",
        RouteName: { Zh_tw: "307", En: "307" },
      },
      {
        ...sampleStop,
        RouteUID: "TPE10604",
        RouteName: { Zh_tw: "604", En: "604" },
      },
    ];
    const stations = groupStopsIntoStations(stops, "TPE");
    expect(stations).toHaveLength(1);
    expect(stations[0].routes).toHaveLength(2);
    expect(stations[0].stationId).toBe("1000");
  });

  it("creates separate stations for different StationIDs", () => {
    const stops = [
      { ...sampleStop, StationID: "1000" },
      {
        ...sampleStop,
        StationID: "2000",
        StopUID: "TPE15002",
        StopName: { Zh_tw: "台北車站", En: "Taipei Main Sta." },
      },
    ];
    const stations = groupStopsIntoStations(stops, "TPE");
    expect(stations).toHaveLength(2);
  });

  it("falls back to name+coords when StationID is missing", () => {
    const stops = [
      { ...sampleStop, StationID: undefined, RouteUID: "TPE10307" },
      {
        ...sampleStop,
        StationID: undefined,
        RouteUID: "TPE10604",
        RouteName: { Zh_tw: "604", En: "604" },
      },
    ];
    const stations = groupStopsIntoStations(stops, "TPE");
    expect(stations).toHaveLength(1);
    expect(stations[0].routes).toHaveLength(2);
    expect(stations[0].stationId).toBe(buildBusStationId(stops[0]));
    expect(stations[0].stationId).toMatch(/^station_[A-Za-z0-9_-]+$/);
  });
});

describe("transformArrivals", () => {
  it("filters by StopUID set and converts seconds to minutes", () => {
    const etas = [
      { ...sampleEta, StopUID: "TPE15001", EstimateTime: 180 },
      { ...sampleEta, StopUID: "TPE99999", EstimateTime: 60 },
    ];
    const result = transformArrivals(etas, new Set(["TPE15001"]));
    expect(result).toHaveLength(1);
    expect(result[0].estimateMinutes).toBe(3);
  });

  it("sorts by estimateMinutes ascending, nulls last", () => {
    const etas = [
      { ...sampleEta, StopUID: "TPE15001", RouteUID: "A", EstimateTime: 300 },
      { ...sampleEta, StopUID: "TPE15001", RouteUID: "B", EstimateTime: 60 },
      {
        ...sampleEta,
        StopUID: "TPE15001",
        RouteUID: "C",
        EstimateTime: undefined,
      },
    ];
    const result = transformArrivals(etas, new Set(["TPE15001"]));
    expect(result.map((r) => r.routeId)).toEqual(["B", "A", "C"]);
  });

  it("returns null estimateMinutes when EstimateTime is absent", () => {
    const etas = [{ ...sampleEta, EstimateTime: undefined }];
    const result = transformArrivals(etas, new Set(["TPE15001"]));
    expect(result[0].estimateMinutes).toBeNull();
  });
});
