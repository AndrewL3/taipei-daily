import { registerModules } from "../core/module-registry";
import { garbageModule } from "./garbage";
import { youbikeModule } from "./youbike";
import { transitModule } from "./transit";
import { parkingModule } from "./parking";

registerModules([garbageModule, youbikeModule, transitModule, parkingModule]);
