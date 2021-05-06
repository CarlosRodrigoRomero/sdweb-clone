import { Component, OnInit } from '@angular/core';

import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import Draw, { createBox, DrawEvent } from 'ol/interaction/Draw';
import GeometryType from 'ol/geom/GeometryType';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';

import { OlMapService } from '@core/services/ol-map.service';
import { StructuresService } from '@core/services/structures.service';

@Component({
  selector: 'app-module-groups',
  templateUrl: './module-groups.component.html',
  styleUrls: ['./module-groups.component.css'],
})
export class ModuleGroupsComponent implements OnInit {
  private vectorGroup: VectorLayer;
  private map: Map;
  private draw: Draw;

  constructor(private olMapService: OlMapService, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.olMapService.map$.subscribe((map) => (this.map = map));
  }

  drawGroup() {
    const sourceGroup = new VectorSource();
    const style = new Style({
      stroke: new Stroke({
        color: 'darkblue',
        width: 2,
      }),
    });

    this.vectorGroup = this.olMapService.createVectorLayer(sourceGroup);
    this.vectorGroup.setStyle(style);

    this.map.addLayer(this.vectorGroup);

    this.draw = new Draw({
      source: sourceGroup,
      // type: GeometryType.POLYGON,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });
    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      const coords = this.getCoordsRectangle(evt);

      console.log(coords);

      this.structuresService.addModuleGroup(coords);

      // terminamos el modo draw
      this.map.removeInteraction(this.draw);
    });
  }

  getCoordsRectangle(event: DrawEvent): Coordinate[] {
    const polygon = event.feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates();

    return [coords[0][0], coords[0][2]];
  }
}
