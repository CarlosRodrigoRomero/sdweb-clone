import { Component, OnInit } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import Polygon from 'ol/geom/Polygon';

import { StructuresService } from '@core/services/structures.service';
import { OlMapService } from '@core/services/ol-map.service';
import { FilterService } from '@core/services/filter.service';

import { RawModule } from '@core/models/moduloBruto';

import { MatDialogConfirmComponent } from '@shared/components/mat-dialog-confirm/mat-dialog-confirm.component';

@Component({
  selector: 'app-raw-modules',
  templateUrl: './raw-modules.component.html',
  styleUrls: ['./raw-modules.component.css'],
})
export class RawModulesComponent implements OnInit {
  private map: Map;
  private vectorRawModule: VectorLayer;
  private draw: Draw;
  deleteMode = false;
  drawActive = false;

  constructor(
    private structuresService: StructuresService,
    private olMapService: OlMapService,
    public dialog: MatDialog,
    private filterService: FilterService
  ) {}

  ngOnInit(): void {
    this.olMapService.map$.subscribe((map) => (this.map = map));

    this.structuresService.deleteRawModMode$.subscribe((mode) => (this.deleteMode = mode));

    this.structuresService.loadRawModules$.subscribe((load) => this.setRawModulesVisibility(load));
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

  drawRawModule() {
    this.drawActive = true;

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
      sourceRawModule.clear();

      const polygon = evt.feature.getGeometry() as Polygon;
      const coords = polygon.getCoordinates();
      coords[0].pop(); // quitamos el ultimo punto que es igual al primero

      const rawModule: RawModule = {
        coords: coords[0],
        area: this.structuresService.areaAverage,
        aspectRatio: this.structuresService.aspectRatioAverage,
        confianza: this.structuresService.confianzaAverage,
      };

      // añadimos el nuevo modulo a la DB
      this.structuresService.addRawModule(rawModule);

      // terminamos el modo draw
      this.map.removeInteraction(this.draw);

      this.drawActive = false;
    });
  }

  cancelDraw() {
    this.drawActive = false;

    this.map.removeInteraction(this.draw);
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

    this.filterService.applyFilters();
  }

  restoreDeletedModules() {
    // eliminamos el array aliminados de la DB
    this.structuresService.deleteFilter('eliminados');

    // vaciamos el array local con los eliminados
    this.structuresService.deletedRawModIds = [];

    this.filterService.applyFilters();
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
}