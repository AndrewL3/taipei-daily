import { Routes, Route } from "react-router";
import AppLayout from "./components/AppLayout";
import MapView from "./features/map/MapView";
import RouteProgressView from "./features/stops/RouteProgressView";
import SchedulesView from "./features/schedules/SchedulesView";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<MapView />} />
        <Route path="schedules" element={<SchedulesView />} />
      </Route>
      <Route path="route/:lineId" element={<RouteProgressView />} />
    </Routes>
  );
}
