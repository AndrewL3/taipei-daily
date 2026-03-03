import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router";
import AppLayout from "./components/AppLayout";
import { Skeleton } from "./components/ui/skeleton";

const MapView = lazy(() => import("./features/map/MapView"));
const SchedulesView = lazy(() => import("./features/schedules/SchedulesView"));
const RouteProgressView = lazy(
  () => import("./features/stops/RouteProgressView"),
);
const AdminView = lazy(() => import("./features/admin/AdminView"));

function PageSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<MapView />} />
          <Route path="schedules" element={<SchedulesView />} />
        </Route>
        <Route path="route/:lineId" element={<RouteProgressView />} />
        <Route path="admin" element={<AdminView />} />
      </Routes>
    </Suspense>
  );
}
