import type { ModuleDefinition } from "./types";

const modules = new Map<string, ModuleDefinition>();

export function registerModules(defs: ModuleDefinition[]) {
  for (const def of defs) {
    modules.set(def.id, def);
  }
}

export function getRegisteredModule(id: string): ModuleDefinition | undefined {
  return modules.get(id);
}

export function getRegisteredModules(): readonly ModuleDefinition[] {
  return Array.from(modules.values());
}
