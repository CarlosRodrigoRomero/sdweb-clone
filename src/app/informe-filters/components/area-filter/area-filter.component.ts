import { Component, OnInit } from '@angular/core';

import { Observable } from 'rxjs';

import Map from 'ol/Map';
import { DoubleClickZoom, Draw, Modify, Snap } from 'ol/interaction';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import CircleStyle from 'ol/style/Circle';
import GeometryType from 'ol/geom/GeometryType';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import { Coordinate } from 'ol/coordinate';
import { DrawEvent } from 'ol/interaction/Draw';
import Polygon from 'ol/geom/Polygon';

import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';

import { AreaFilter } from '@core/models/areaFilter';
import { FilterInterface } from '@core/models/filter';

@Component({
  selector: 'app-area-filter',
  templateUrl: './area-filter.component.html',
  styleUrls: ['./area-filter.component.css'],
})
export class AreaFilterComponent implements OnInit {
  removable = true;
  public areaFilters$: Observable<FilterInterface[]>;
  public map: Map;
  public numAreas = 0;

  vectorArea: VectorLayer;
  deleteButton: VectorLayer;

  constructor(private filterService: FilterService, private olMapService: OlMapService) {}

  ngOnInit(): void {
    this.olMapService.getMap().subscribe((map) => (this.map = map));
    this.areaFilters$ = this.filterService.getAllFilters();
  }

  deleteFilter(filter: FilterInterface) {
    this.filterService.deleteFilter(filter);
  }

  deleteAllTypeFilters(type: string) {
    this.filterService.deleteAllTypeFilters(type);
  }

  drawArea() {
    const sourceArea = new VectorSource();
    this.vectorArea = new VectorLayer({
      source: sourceArea,
      style: new Style({
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0.2)',
        }),
        stroke: new Stroke({
          color: 'black',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({
            color: 'black',
          }),
        }),
      }),
    });
    (this.map as Map).addLayer(this.vectorArea);

    const draw = new Draw({
      source: sourceArea,
      type: GeometryType.POLYGON,
    });
    this.map.addInteraction(draw);

    draw.on('drawend', (evt) => {
      // desactivamos el dobleclick para que no interfiera al cerrar poligono
      this.map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          this.map.removeInteraction(interaction);
        }
      });
      // obtenemos coordenadas del poligono
      const coords = this.getCoords(evt);

      // añadimos botón delete
      this.createDeleteButton(coords[0][0]);

      // añadimos el filtro de area
      this.addAreaFilter(coords);

      // terminamos el modo draw
      this.map.removeInteraction(draw);
    });
  }

  createDeleteButton(coords: number[]) {
    const styleDelete = new Style({
      image: new Icon({
        src: 'assets/icons/delete-36x36.png',
      }),
    });
    const feature = Array(1);
    feature[0] = new Feature(new Point(coords));
    feature[0].setStyle(styleDelete);
    const sourceDelete = new VectorSource({
      features: feature,
    });
    this.deleteButton = new VectorLayer({
      source: sourceDelete,
    });
    this.map.addLayer(this.deleteButton);
  }

  addAreaFilter(coords: Coordinate[][]) {
    const areaFilter = new AreaFilter('Área', 'area', coords);
    this.filterService.addFilter(areaFilter);
  }

  deleteAreaFilter() {
    this.map.removeLayer(this.vectorArea);
    this.map.removeLayer(this.deleteButton);
  }

  getCoords(event: DrawEvent): Coordinate[][] {
    const polygon = event.feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates();

    return coords;
  }
}
