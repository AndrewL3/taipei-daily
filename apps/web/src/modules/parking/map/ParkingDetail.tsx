import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import ParkingDetailContent from "./ParkingDetailContent";
import type { ParkingRoadSegment } from "../api/types";

interface ParkingDetailProps {
  segment: ParkingRoadSegment | null;
  onClose: () => void;
}

export default function ParkingDetail({
  segment,
  onClose,
}: ParkingDetailProps) {
  return (
    <Drawer
      open={segment !== null}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <DrawerContent>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/20" />
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg font-bold">
            {segment?.roadName}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-5 pb-8">
          {segment && <ParkingDetailContent segment={segment} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
