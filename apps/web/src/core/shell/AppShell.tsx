import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { getRegisteredModules } from "../module-registry";
import ShellLayout from "./ShellLayout";
import ReloadPrompt from "@/components/ReloadPrompt";
import InstallPrompt from "@/components/InstallPrompt";
import SharedMapView from "../map/SharedMapView";

const DashboardView = lazy(() => import("../dashboard/DashboardView"));

const RouteProgressView = lazy(
  () => import("@/modules/garbage/stops/RouteProgressView"),
);
const TransitRouteView = lazy(
  () => import("@/modules/transit/routes/RouteView"),
);
const AdminView = lazy(() => import("@/features/admin/AdminView"));
const SafetyView = lazy(() => import("@/features/safety/SafetyView"));

function PageSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export default function AppShell() {
  const modules = getRegisteredModules();

  return (
    <>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route element={<ShellLayout modules={modules} />}>
            <Route index element={<DashboardView />} />
            <Route path="map" element={<SharedMapView />} />
            {/* Explicit props instead of {...route} spread — RouteObject.lazy
                and <Route lazy> have incompatible types in React Router v7 */}
            {modules.flatMap((mod) =>
              mod.routes.map((route) => (
                <Route
                  key={`${mod.id}-${route.path}`}
                  path={route.path}
                  element={route.element}
                  Component={route.Component}
                />
              )),
            )}
            <Route path="safety" element={<SafetyView />} />
          </Route>
          <Route path="route/:lineId" element={<RouteProgressView />} />
          <Route path="transit/route/:routeId" element={<TransitRouteView />} />
          <Route path="admin" element={<AdminView />} />
        </Routes>
      </Suspense>
      <ReloadPrompt />
      <InstallPrompt />
    </>
  );
}
