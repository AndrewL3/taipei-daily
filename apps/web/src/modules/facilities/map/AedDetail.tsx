import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import AedDetailContent from "../components/AedDetailContent";
import type { AedVenue } from "../api/types";

interface AedDetailProps {
  venue: AedVenue | null;
  onClose: () => void;
}

export default function AedDetail({ venue, onClose }: AedDetailProps) {
  return (
    <Drawer
      open={venue !== null}
      onOpenChange={(open) => !open && onClose()}
      modal={false}
    >
      <DrawerContent>
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-muted-foreground/20" />
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg font-bold">{venue?.name}</DrawerTitle>
        </DrawerHeader>
        <div className="px-5 pb-8">
          {venue && <AedDetailContent venue={venue} />}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
