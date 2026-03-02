import { Outlet } from "react-router";
import BottomNav from "./BottomNav";

export default function AppLayout() {
  return (
    <div className="flex h-dvh flex-col">
      <div className="flex-1 isolate overflow-hidden">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
