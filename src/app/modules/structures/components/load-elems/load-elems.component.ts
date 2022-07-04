import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { StructuresService } from '@data/services/structures.service';
import { ZonesService } from '@data/services/zones.service';
import { OlMapService } from '@data/services/ol-map.service';

import { LocationAreaInterface } from '@core/models/location';
import Polygon from 'ol/geom/Polygon';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from 'ol/coordinate';
import { RawModule } from '@core/models/moduloBruto';
import { ModuleGroup } from '@core/models/moduleGroup';
import { NormModulesComponent } from '../norm-modules/norm-modules.component';
import { NormalizedModule } from '@core/models/normalizedModule';

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
export class LoadElemsComponent implements OnInit {
  zones: ZoneTask[] = [];
  private largestZones: LocationAreaInterface[] = [];
  allComplete = false;

  constructor(
    private structuresService: StructuresService,
    private zonesService: ZonesService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.zonesService.initService(this.structuresService.planta).then((init) => {
      if (init) {
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
      }
    });
  }

  loadElems() {
    const selectedTaskZones = this.zones.filter((zone) => zone.completed);
    const selectedZones = this.largestZones.filter((zone) => selectedTaskZones.find((t) => t.id === zone.id));

    this.loadRawModules(selectedZones);
    this.loadModuleGroups(selectedZones);
    this.loadNormModules(selectedZones);
  }

  private loadRawModules(zones: LocationAreaInterface[]) {
    this.structuresService
      .getModulosBrutos()
      .pipe(take(1))
      .subscribe((modulos) => {
        const selectedModules: RawModule[] = [];

        zones.forEach((zone) => {
          const coordsZone = this.olMapService.pathToCoordinate(zone.path);
          const polygonZone = new Polygon([coordsZone]);

          const includedModules = modulos.filter((modulo) => {
            const centroid = [modulo.centroid_gps_long, modulo.centroid_gps_lat] as Coordinate;
            return polygonZone.intersectsCoordinate(centroid);
          });

          selectedModules.push(...includedModules);
        });

        this.structuresService.allRawModules = selectedModules;
      });
  }

  private loadModuleGroups(zones: LocationAreaInterface[]) {
    this.structuresService
      .getModuleGroups()
      .pipe(take(1))
      .subscribe((modGroups) => {
        const selectedModGroups: ModuleGroup[] = [];

        zones.forEach((zone) => {
          const coordsZone = this.olMapService.pathToCoordinate(zone.path);
          const polygonZone = new Polygon([coordsZone]);

          const includedModGroups = modGroups.filter((modGroup) => {
            const centroid = this.olMapService.getCentroid(modGroup.coords);
            return polygonZone.intersectsCoordinate(centroid);
          });

          selectedModGroups.push(...includedModGroups);
        });

        this.structuresService.allModGroups = selectedModGroups;
      });
  }

  private loadNormModules(zones: LocationAreaInterface[]) {
    this.structuresService
      .getNormModules()
      .pipe(take(1))
      .subscribe((normModules) => {
        const selectedNormModules: NormalizedModule[] = [];

        zones.forEach((zone) => {
          const coordsZone = this.olMapService.pathToCoordinate(zone.path);
          const polygonZone = new Polygon([coordsZone]);

          const includedNormMods = normModules.filter((normMod) => {
            const centroid = [normMod.centroid_gps.long, normMod.centroid_gps.lat] as Coordinate;
            return polygonZone.intersectsCoordinate(centroid);
          });

          selectedNormModules.push(...includedNormMods);
        });

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
}
