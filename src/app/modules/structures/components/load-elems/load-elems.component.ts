import { Component, OnDestroy, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import Polygon from 'ol/geom/Polygon';
import { Coordinate } from 'ol/coordinate';

import { StructuresService } from '@data/services/structures.service';
import { ZonesService } from '@data/services/zones.service';
import { OlMapService } from '@data/services/ol-map.service';
import { FilterService } from '@data/services/filter.service';

import { RawModule } from '@core/models/moduloBruto';
import { ModuleGroup } from '@core/models/moduleGroup';
import { NormalizedModule } from '@core/models/normalizedModule';
import { LocationAreaInterface } from '@core/models/location';

export interface ZoneTask {
  id: string;
  completed: boolean;
  name: string;
}

@Component({
  selector: 'app-load-elems',
  templateUrl: './load-elems.component.html',
  styleUrls: ['./load-elems.component.css'],
})
export class LoadElemsComponent implements OnInit, OnDestroy {
  zones: ZoneTask[] = [];
  private largestZones: LocationAreaInterface[] = [];
  thereAreZones = false;
  modulesLoaded = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private structuresService: StructuresService,
    private zonesService: ZonesService,
    private olMapService: OlMapService,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.zonesService.initService(this.structuresService.planta).then((init) => {
      if (init) {
        if (this.zonesService.zonesBySize.length > 0) {
          this.thereAreZones = true;

          this.largestZones = this.zonesService.zonesBySize[0];

          // las ordenamos por su global mayor
          this.largestZones = this.largestZones.sort((a, b) => a.globalCoords[0].localeCompare(b.globalCoords[0]));

          this.largestZones.forEach((zone) => {
            this.zones.push({
              id: zone.id,
              completed: false,
              name: this.zoneTaskName(zone),
            });
          });
        } else {
          this.loadElems();
        }
      }
    });

    this.subscriptions.add(this.structuresService.modulesLoaded$.subscribe((load) => (this.modulesLoaded = load)));
  }

  loadElems() {
    if (this.thereAreZones) {
      const selectedTaskZones = this.zones.filter((zone) => zone.completed);
      if (selectedTaskZones.length < this.zones.length) {
        const selectedZones = this.largestZones.filter((zone) => selectedTaskZones.find((t) => t.id === zone.id));
        this.loadRawModules(selectedZones).then(() => this.loadNormModules(selectedZones));
      } else {
        // cargamos todos los modulos cuando seleccionamos todas las zonas
        this.loadRawModules().then(() => this.loadNormModules());
      }
    } else {
      // cargamos todos los modulos cuando no hay zonas
      this.loadRawModules().then(() => this.loadNormModules());
    }
    // cargamos todos los grupos siempre
    this.loadModuleGroups();
  }

  private loadRawModules(zones?: LocationAreaInterface[]): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const modulos = await this.structuresService.getModulosBrutos();
        console.log('Todos los ' + modulos.length + ' modulos en bruto cargados');
        this.structuresService.allRawModules = modulos;

        let selectedModules: RawModule[] = [];

        if (zones) {
          // Calcular las polígonas de las zonas una sola vez antes del bucle
          const polygons = zones.map((zone) => new Polygon([this.olMapService.pathToCoordinate(zone.path)]));

          for (let modulo of modulos) {
            let centroid;
            if (modulo.hasOwnProperty('centroid_gps_long')) {
              centroid = [modulo.centroid_gps_long, modulo.centroid_gps_lat] as Coordinate;
            } else {
              centroid = this.olMapService.getCentroid(modulo.coords);
            }

            // Verificar si el módulo se encuentra dentro de alguna de las polígonas
            if (polygons.some((polygon) => polygon.intersectsCoordinate(centroid))) {
              selectedModules.push(modulo);
            }
          }
        } else {
          selectedModules = modulos;
        }

        this.structuresService.loadedRawModules = selectedModules;

        if (selectedModules.length > 0) {
          // calculamos las medias y desviaciones
          this.structuresService.setInitialAveragesAndStandardDeviations();
        }

        this.filterService.initService(selectedModules);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private loadModuleGroups(zones?: LocationAreaInterface[]) {
    this.structuresService
      .getModuleGroups()
      .pipe(take(1))
      .subscribe(async (modGroups) => {
        console.log('Todas las ' + modGroups.length + ' agrupaciones cargadas');

        let selectedModGroups: ModuleGroup[] = [];

        if (zones) {
          // Calcular las polígonas de las zonas una sola vez antes del bucle
          const polygons = zones.map((zone) => new Polygon([this.olMapService.pathToCoordinate(zone.path)]));

          for (let modGroup of modGroups) {
            const centroid = this.olMapService.getCentroid(modGroup.coords);

            // Verificar si el grupo de módulos se encuentra dentro de alguna de las polígonas
            if (polygons.some((polygon) => polygon.intersectsCoordinate(centroid))) {
              selectedModGroups.push(modGroup);
            }
          }
        } else {
          selectedModGroups = modGroups;
        }

        this.structuresService.allModGroups = selectedModGroups;
      });
  }

  private async loadNormModules(zones?: LocationAreaInterface[]) {
    const normModules = await this.structuresService.getNormModules();
    console.log('Todos los ' + normModules.length + ' modulos normalizados cargados');

    let selectedNormModules: NormalizedModule[] = [];

    if (zones) {
      // Calcular las polígonas de las zonas una sola vez antes del bucle
      const polygons = zones.map((zone) => new Polygon([this.olMapService.pathToCoordinate(zone.path)]));

      for (let normMod of normModules) {
        const centroid = [normMod.centroid_gps.long, normMod.centroid_gps.lat] as Coordinate;

        // Verificar si el módulo normalizado se encuentra dentro de alguna de las polígonas
        if (polygons.some((polygon) => polygon.intersectsCoordinate(centroid))) {
          selectedNormModules.push(normMod);
        }
      }
    } else {
      selectedNormModules = normModules;
    }

    this.structuresService.allNormModules = selectedNormModules;
  }

  private zoneTaskName(zone: LocationAreaInterface): string {
    const planta = this.structuresService.planta;

    let nombreGlobalCoord = '';
    if (planta.hasOwnProperty('nombreGlobalCoords')) {
      nombreGlobalCoord = planta.nombreGlobalCoords[0] + ' ';
    }

    return nombreGlobalCoord + zone.globalCoords[0];
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
