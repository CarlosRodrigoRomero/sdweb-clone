import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import { Subscription } from 'rxjs';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

import { StructuresService } from '@data/services/structures.service';
import { OlMapService } from '@data/services/ol-map.service';
import { FilterService } from '@data/services/filter.service';

import { RawModule } from '@core/models/moduloBruto';

import { MatDialogConfirmComponent } from '@shared/components/mat-dialog-confirm/mat-dialog-confirm.component';

@Component({
  selector: 'app-raw-modules',
  templateUrl: './raw-modules.component.html',
  styleUrls: ['./raw-modules.component.css'],
})
export class RawModulesComponent implements OnInit, OnDestroy {
  private map: Map;
  private vectorRawModule: VectorLayer;
  private draw: Draw;
  deleteMode = false;
  createMode = false;
  private rawModDeletedIds: string[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private structuresService: StructuresService,
    private olMapService: OlMapService,
    public dialog: MatDialog,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      this.structuresService.createRawModMode$.subscribe((mode) => {
        this.createMode = mode;

        if (this.createMode) {
          this.drawRawModules();
        } else if (this.draw !== undefined) {
          // terminamos el modo draw
          this.map.removeInteraction(this.draw);
        }
      })
    );

    this.subscriptions.add(this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteMode = mode)));

    this.subscriptions.add(this.structuresService.deletedRawModIds$.subscribe((ids) => (this.rawModDeletedIds = ids)));

    this.subscriptions.add(
      this.structuresService.loadRawModules$.subscribe((load) => this.setRawModulesVisibility(load))
    );
  }

  switchCreateMode() {
    this.structuresService.createRawModMode = !this.structuresService.createRawModMode;
  }

  switchDeleteMode() {
    this.structuresService.deleteRawModMode = !this.structuresService.deleteRawModMode;
  }

  confirmRestoreDeletedDialog() {
    const dialogRef = this.dialog.open(MatDialogConfirmComponent, {
      data: 'Se restaurarán todos los módulos eliminados manualmente. ¿Desea continuar?',
    });

    dialogRef.afterClosed().subscribe((response: boolean) => {
      if (response) {
        this.restoreDeletedModules();
      }
    });
  }

  drawRawModules() {
    const sourceRawModule = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'white',
        width: 2,
      }),
    });

    this.vectorRawModule = this.olMapService.createVectorLayer(sourceRawModule);
    this.vectorRawModule.setStyle(style);

    this.map.addLayer(this.vectorRawModule);

    this.draw = new Draw({
      source: sourceRawModule,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });
    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      const polygon = evt.feature.getGeometry() as Polygon;
      const coords = polygon.getCoordinates();
      coords[0].pop(); // quitamos el ultimo punto que es igual al primero
      const centroid = this.olMapService.getCentroid(coords[0]);

      const rawModule: RawModule = {
        coords: coords[0],
        area: this.structuresService.areaAverage,
        aspectRatio: this.structuresService.aspectRatioAverage,
        confianza: this.structuresService.confianzaAverage,
        centroid_gps_long: centroid[0],
        centroid_gps_lat: centroid[1],
      };

      // añadimos el nuevo modulo a la DB
      this.structuresService.addRawModule(rawModule);

      // this.filterService.filteredElements.push(rawModule);

      // añadimos el nuevo modulo como feature
      this.addRawModFeature(rawModule);
    });
  }

  cancelDraw() {
    this.createMode = false;

    this.map.removeInteraction(this.draw);
  }

  private addRawModFeature(rawModule: RawModule) {
    let rawModLayer;
    this.map.getLayers().forEach((layer) => {
      if (layer.getProperties().id === 'rawModLayer') {
        rawModLayer = layer;
      }
    });

    const coords = Object.values(rawModule.coords); // lo convertimos en un array

    const mBSource = rawModLayer.getSource();
    const feature = new Feature({
      geometry: new Polygon([coords]),
      properties: {
        id: rawModule.id,
        name: 'rawMod',
        visible: true,
      },
    });

    mBSource.addFeature(feature);
  }

  undoCreatedModule() {
    const lastModule = this.filterService.filteredElements.pop();

    if (this.rawModDeletedIds !== undefined) {
      this.structuresService.deletedRawModIds = this.rawModDeletedIds.concat(lastModule.id);
    } else {
      this.structuresService.deletedRawModIds = [lastModule.id];
    }

    // añadimos el id del modulo eliminado a la DB
    this.structuresService.addFilter('eliminados', this.rawModDeletedIds);
  }

  restoreLastDeletedModule() {
    let deletedIds: string[] = [];
    if (this.structuresService.deletedRawModIds !== undefined) {
      this.structuresService.deletedRawModIds.pop();
    }
    deletedIds = this.structuresService.deletedRawModIds;

    if (deletedIds !== undefined) {
      if (deletedIds.length > 0) {
        this.structuresService.addFilter('eliminados', deletedIds);
      } else {
        this.structuresService.deleteFilter('eliminados');
      }
    }

    this.filterService.processFilters();
  }

  restoreDeletedModules() {
    // eliminamos el array aliminados de la DB
    this.structuresService.deleteFilter('eliminados');

    // vaciamos el array local con los eliminados
    this.structuresService.deletedRawModIds = [];

    this.filterService.processFilters();
  }

  private setRawModulesVisibility(visible: boolean) {
    if (this.map !== undefined) {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getProperties().id !== undefined && layer.getProperties().id === 'rawModLayer')
        .forEach((layer) => layer.setVisible(visible));
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
