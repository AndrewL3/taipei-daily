import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div className="flex h-dvh">
      <Sidebar />
      <div className="flex-1 isolate overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
