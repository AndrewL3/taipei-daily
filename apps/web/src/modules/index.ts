import { registerModules } from "../core/module-registry";
import { garbageModule } from "./garbage";
import { youbikeModule } from "./youbike";
import { transitModule } from "./transit";
import { parkingModule } from "./parking";
import { weatherModule } from "./weather";
import { alertsModule } from "./alerts";
import { facilitiesModule } from "./facilities";

registerModules([
  garbageModule,
  youbikeModule,
  transitModule,
  parkingModule,
  weatherModule,
  alertsModule,
  facilitiesModule,
]);
