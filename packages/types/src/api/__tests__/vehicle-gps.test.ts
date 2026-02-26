import { describe, it, expect } from "@jest/globals";
import { VehicleGpsSchema } from "../vehicle-gps.js";

describe("VehicleGpsSchema", () => {
  it("parses a raw NTC API vehicle record", () => {
    const raw = {
      lineid: "234005",
      car: "KED-0605",
      time: "2026/02/26 15:49:03",
      location: "新北市永和區福和路1號",
      longitude: "121.526681666667",
      latitude: "25.010095",
      cityid: "6500400",
      cityname: "永和區",
    };

    const parsed = VehicleGpsSchema.parse(raw);

    expect(parsed.lineid).toBe("234005");
    expect(parsed.car).toBe("KED-0605");
    expect(parsed.time).toBe("2026/02/26 15:49:03");
    expect(parsed.longitude).toBe(121.526681666667);
    expect(parsed.latitude).toBe(25.010095);
    expect(typeof parsed.longitude).toBe("number");
    expect(typeof parsed.latitude).toBe("number");
  });

  it("rejects record with missing car field", () => {
    const raw = {
      lineid: "234005",
      time: "2026/02/26 15:49:03",
      location: "somewhere",
      longitude: "121.5",
      latitude: "25.0",
      cityid: "6500400",
      cityname: "永和區",
    };

    expect(() => VehicleGpsSchema.parse(raw)).toThrow();
  });
});
