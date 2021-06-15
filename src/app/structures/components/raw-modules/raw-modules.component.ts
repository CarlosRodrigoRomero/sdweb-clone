import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import Polygon from 'ol/geom/Polygon';

import { StructuresService } from '@core/services/structures.service';
import { OlMapService } from '@core/services/ol-map.service';

import { RawModule } from '@core/models/moduloBruto';

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

  constructor(private structuresService: StructuresService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.olMapService.map$.subscribe((map) => (this.map = map));

    this.structuresService.deleteMode$.subscribe((mode) => (this.deleteMode = mode));

    this.structuresService.loadRawModules$.subscribe((load) => this.setRawModulesVisibility(load));
  }

  switchDeleteMode() {
    this.structuresService.deleteMode = !this.structuresService.deleteMode;
  }

  restoreDeletedModules() {
    this.structuresService.deleteFilter('eliminados');
  }

  drawRawModule() {
    const sourceRawModule = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'rgba(0,0,0,0)',
        width: 1,
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
        confianza: 1,
      };

      this.structuresService.addRawModule(rawModule);

      // terminamos el modo draw
      this.map.removeInteraction(this.draw);
    });
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
  }

  private setRawModulesVisibility(visible: boolean) {
    if (this.map !== undefined) {
      this.map
        .getLayers()
        .getArray()
        .filter((layer) => layer.getProperties().id !== undefined && layer.getProperties().id === 'mBLayer')
        .forEach((layer) => layer.setVisible(visible));
    }
  }
}
