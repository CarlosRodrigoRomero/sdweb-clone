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

interface ZoneTask {
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
  allComplete = false;
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
          this.largestZones = this.largestZones.sort((a, b) => a.globalCoords[0] - b.globalCoords[0]);

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
      const selectedZones = this.largestZones.filter((zone) => selectedTaskZones.find((t) => t.id === zone.id));

      this.loadRawModules(selectedZones);
      this.loadModuleGroups();
      this.loadNormModules(selectedZones);
    } else {
      this.loadRawModules();
      this.loadModuleGroups();
      this.loadNormModules();
    }
  }

  private loadRawModules(zones?: LocationAreaInterface[]) {
    this.structuresService
      .getModulosBrutos()
      .pipe(take(1))
      .subscribe((modulos) => {
        let selectedModules: RawModule[] = [];

        if (zones) {
          zones.forEach((zone) => {
            const coordsZone = this.olMapService.pathToCoordinate(zone.path);
            const polygonZone = new Polygon([coordsZone]);

            const includedModules = modulos.filter((modulo) => {
              let centroid;
              if (modulo.hasOwnProperty('centroid_gps_long')) {
                centroid = [modulo.centroid_gps_long, modulo.centroid_gps_lat] as Coordinate;
              } else {
                centroid = this.olMapService.getCentroid(modulo.coords);
              }
              return polygonZone.intersectsCoordinate(centroid);
            });

            selectedModules.push(...includedModules);
          });
        } else {
          selectedModules = modulos;
        }

        this.structuresService.allRawModules = selectedModules;

        if (selectedModules.length > 0) {
          // calculamos las medias y desviaciones
          this.structuresService.setInitialAveragesAndStandardDeviations();
        }

        this.filterService.initService(selectedModules);
      });
  }

  private loadModuleGroups(zones?: LocationAreaInterface[]) {
    this.structuresService
      .getModuleGroups()
      .pipe(take(1))
      .subscribe((modGroups) => {
        let selectedModGroups: ModuleGroup[] = [];

        if (zones) {
          zones.forEach((zone) => {
            const coordsZone = this.olMapService.pathToCoordinate(zone.path);
            const polygonZone = new Polygon([coordsZone]);

            const includedModGroups = modGroups.filter((modGroup) => {
              const centroid = this.olMapService.getCentroid(modGroup.coords);
              return polygonZone.intersectsCoordinate(centroid);
            });

            selectedModGroups.push(...includedModGroups);
          });
        } else {
          selectedModGroups = modGroups;
        }

        this.structuresService.allModGroups = selectedModGroups;
      });
  }

  private loadNormModules(zones?: LocationAreaInterface[]) {
    this.structuresService
      .getNormModules()
      .pipe(take(1))
      .subscribe((normModules) => {
        let selectedNormModules: NormalizedModule[] = [];

        if (zones) {
          zones.forEach((zone) => {
            const coordsZone = this.olMapService.pathToCoordinate(zone.path);
            const polygonZone = new Polygon([coordsZone]);

            const includedNormMods = normModules.filter((normMod) => {
              const centroid = [normMod.centroid_gps.long, normMod.centroid_gps.lat] as Coordinate;
              return polygonZone.intersectsCoordinate(centroid);
            });

            selectedNormModules.push(...includedNormMods);
          });
        } else {
          selectedNormModules = normModules;
        }

        this.structuresService.allNormModules = selectedNormModules;
      });
  }

  private zoneTaskName(zone: LocationAreaInterface): string {
    const planta = this.structuresService.planta;

    let nombreGlobalCoord = '';
    if (planta.hasOwnProperty('nombreGlobalCoords')) {
      nombreGlobalCoord = planta.nombreGlobalCoords[0] + ' ';
    }

    return nombreGlobalCoord + zone.globalCoords[0];
  }

  someComplete(): boolean {
    if (this.zones === null) {
      return false;
    }
    return this.zones.filter((t) => t.completed).length > 0 && !this.allComplete;
  }

  setAll(completed: boolean) {
    this.allComplete = completed;
    if (this.zones == null) {
      return;
    }
    this.zones.forEach((t) => (t.completed = completed));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
