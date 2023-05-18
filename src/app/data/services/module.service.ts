import { Injectable } from '@angular/core';

import { LocationAreaInterface } from '@core/models/location';
import { ModuloInterface } from '@core/models/modulo';

import { MathOperations } from '@core/classes/math-operations';

@Injectable({
  providedIn: 'root',
})
export class ModuleService {
  constructor() {}

  getModuleBrandLabels(zones: LocationAreaInterface[]): string[] {
    const allModules: ModuloInterface[] = zones
      .filter((zone) => this.checkModule(zone.modulo))
      .map((zone) => zone.modulo);

    const brands = MathOperations.getUniqueElemsArray(allModules.map((module) => this.getModuleBrandLabel(module)));

    return brands;
  }

  getModuleBrandLabel(module: ModuloInterface): string {
    return module.marca.trimEnd();
  }

  checkModule(module: ModuloInterface) {
    return module !== null && module !== undefined && Object.values(module).length > 0;
  }
}
