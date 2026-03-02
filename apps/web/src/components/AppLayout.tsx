import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="flex h-dvh flex-col md:flex-row">
      {/* Desktop: sidebar on left (order-first by default) */}
      {/* Mobile: bar at bottom (order-last) */}
      <div className="order-last md:order-first">
        <Sidebar />
      </div>
      <div className="flex-1 isolate overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
