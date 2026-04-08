import { describe, expect, it, jest } from "@jest/globals";

// Mock the handler modules
jest.unstable_mockModule("../src/transit/stops.js", () => ({
  handleStops: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.unstable_mockModule("../src/transit/arrivals.js", () => ({
  handleArrivals: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.unstable_mockModule("../src/transit/route.js", () => ({
  handleRoute: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));
jest.unstable_mockModule("../src/transit/routes.js", () => ({
  handleRoutes: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

const { default: handler } = await import("../api/transit/[[...path]].js");
const { handleStops } = await import("../src/transit/stops.js");
const { handleArrivals } = await import("../src/transit/arrivals.js");
const { handleRoute } = await import("../src/transit/route.js");
const { handleRoutes } = await import("../src/transit/routes.js");

function mockReqRes(path: string | string[]) {
  const segments = Array.isArray(path) ? path : [path];
  const suffix = segments.filter(Boolean).join("/");
  const req = {
    query: { path },
    url: suffix ? `/api/transit/${suffix}` : "/api/transit",
  } as any;
  const res = {
    setHeader: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
  return { req, res };
}

describe("transit catch-all router", () => {
  it("routes /transit/stops to handleStops", async () => {
    const { req, res } = mockReqRes(["stops"]);
    await handler(req, res);
    expect(handleStops).toHaveBeenCalledWith(req, res);
  });

  it("routes /transit/arrivals to handleArrivals", async () => {
    const { req, res } = mockReqRes(["arrivals"]);
    await handler(req, res);
    expect(handleArrivals).toHaveBeenCalledWith(req, res);
  });

  it("routes /transit/route to handleRoute", async () => {
    const { req, res } = mockReqRes(["route"]);
    await handler(req, res);
    expect(handleRoute).toHaveBeenCalledWith(req, res);
  });

  it("routes /transit/routes to handleRoutes", async () => {
    const { req, res } = mockReqRes(["routes"]);
    await handler(req, res);
    expect(handleRoutes).toHaveBeenCalledWith(req, res);
  });

  it("returns 404 for unknown path", async () => {
    const { req, res } = mockReqRes(["unknown"]);
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 404 for empty path", async () => {
    const { req, res } = mockReqRes([]);
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
