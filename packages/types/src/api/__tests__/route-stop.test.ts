import { describe, it, expect } from "@jest/globals";
import { RouteStopRawSchema, transformRouteStop } from "../route-stop.js";

describe("RouteStopRawSchema", () => {
  const raw = {
    city: "萬里區",
    lineid: "207001",
    linename: "A路線下午",
    rank: "3",
    name: "瑪鋉路216號(托兒所)",
    village: "萬里里",
    longitude: "121.689041",
    latitude: "25.180643",
    time: "12:48",
    memo: "",
    garbagesunday: "",
    garbagemonday: "Y",
    garbagetuesday: "Y",
    garbagewednesday: "",
    garbagethursday: "Y",
    garbagefriday: "Y",
    garbagesaturday: "Y",
    recyclingsunday: "",
    recyclingmonday: "Y",
    recyclingtuesday: "",
    recyclingwednesday: "",
    recyclingthursday: "Y",
    recyclingfriday: "",
    recyclingsaturday: "",
    foodscrapssunday: "",
    foodscrapsmonday: "Y",
    foodscrapstuesday: "Y",
    foodscrapswednesday: "",
    foodscrapsthursday: "Y",
    foodscrapsfriday: "Y",
    foodscrapssaturday: "Y",
  };

  it("parses raw fields with coercion", () => {
    const parsed = RouteStopRawSchema.parse(raw);
    expect(parsed.rank).toBe(3);
    expect(typeof parsed.rank).toBe("number");
    expect(parsed.longitude).toBe(121.689041);
    expect(parsed.latitude).toBe(25.180643);
    expect(parsed.lineid).toBe("207001");
  });

  it("transforms day-of-week flags into boolean arrays", () => {
    const parsed = RouteStopRawSchema.parse(raw);
    const transformed = transformRouteStop(parsed);

    // index: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    expect(transformed.garbageDays).toEqual([
      false, true, true, false, true, true, true,
    ]);
    expect(transformed.recyclingDays).toEqual([
      false, true, false, false, true, false, false,
    ]);
    expect(transformed.foodscrapsDays).toEqual([
      false, true, true, false, true, true, true,
    ]);
  });

  it("includes route and stop metadata in transformed output", () => {
    const parsed = RouteStopRawSchema.parse(raw);
    const transformed = transformRouteStop(parsed);

    expect(transformed.city).toBe("萬里區");
    expect(transformed.lineid).toBe("207001");
    expect(transformed.linename).toBe("A路線下午");
    expect(transformed.rank).toBe(3);
    expect(transformed.scheduledTime).toBe("12:48");
    expect(transformed.longitude).toBe(121.689041);
    expect(transformed.latitude).toBe(25.180643);
  });
});
