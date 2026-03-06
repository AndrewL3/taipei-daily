import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import BusStopDetailContent from "./BusStopDetailContent";
import type { BusStation } from "../api/types";

interface BusStopDetailProps {
  station: BusStation | null;
  onClose: () => void;
}

export default function BusStopDetail({
  station,
  onClose,
}: BusStopDetailProps) {
  return (
    <Drawer
      open={station !== null}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <DrawerContent>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/20" />
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg font-bold">
            {station?.name}
          </DrawerTitle>
          {station?.nameEn && (
            <p className="text-sm text-muted-foreground">{station.nameEn}</p>
          )}
        </DrawerHeader>
        <div className="px-5 pb-8">
          {station && <BusStopDetailContent station={station} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
