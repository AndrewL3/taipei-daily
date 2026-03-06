import { registerModules } from "../core/module-registry";
import { garbageModule } from "./garbage";
import { youbikeModule } from "./youbike";
import { transitModule } from "./transit";

registerModules([garbageModule, youbikeModule, transitModule]);
