import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox, DrawEvent } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';
import { getArea } from 'ol/sphere';

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
    this.structuresService.deleteMode$.subscribe((mode) => (this.deleteMode = mode));
    this.olMapService.map$.subscribe((map) => (this.map = map));
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

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      sourceRawModule.clear();

      const polygon = evt.feature.getGeometry() as Polygon;
      const coords = polygon.getCoordinates();
      coords[0].pop(); // quitamos el ultimo punto que es igual al primero
      const area = Math.round(this.structuresService.getArea(coords) * 1000);
      const aspectRatio = parseFloat(this.structuresService.getAspectRatio(coords).toFixed(4));

      const rawModule: RawModule = {
        coords: coords[0],
        area,
        aspectRatio,
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
}
