import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import StopDetailContent from "./StopDetailContent";
import type { NearbyStop } from "@/api/client";

interface StopDetailProps {
  stop: NearbyStop | null;
  onClose: () => void;
}

export default function StopDetail({ stop, onClose }: StopDetailProps) {
  return (
    <Drawer open={stop !== null} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        <div className="h-1 w-10 mx-auto mt-2 rounded-full bg-primary/30" />
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">{stop?.name}</DrawerTitle>
          <p className="text-muted-foreground text-sm">
            {stop?.routeLineName}
          </p>
        </DrawerHeader>

        <div className="px-4 pb-6">
          {stop && <StopDetailContent stop={stop} onClose={onClose} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
