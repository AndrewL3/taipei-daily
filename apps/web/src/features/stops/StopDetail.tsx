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
    <Drawer open={stop !== null} onOpenChange={(open) => !open && onClose()} modal={false}>
      <DrawerContent>
        <div className="h-1 w-10 mx-auto mt-2 rounded-full bg-muted-foreground/20" />
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg font-bold">{stop?.name}</DrawerTitle>
          <p className="text-muted-foreground text-sm">
            {stop?.routeLineName}
          </p>
        </DrawerHeader>

        <div className="px-5 pb-8">
          {stop && <StopDetailContent stop={stop} onClose={onClose} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
