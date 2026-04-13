import type { ModuleDefinition } from "../core/types";
import { registerModules } from "../core/module-registry";
import { garbageModule } from "./garbage";
import { youbikeModule } from "./youbike";
import { transitModule } from "./transit";
import { parkingModule } from "./parking";
import { weatherModule } from "./weather";
import { alertsModule } from "./alerts";

export const appModules: readonly ModuleDefinition[] = [
  garbageModule,
  youbikeModule,
  transitModule,
  parkingModule,
  weatherModule,
  alertsModule,
];

export function registerAppModules() {
  registerModules([...appModules]);
}
