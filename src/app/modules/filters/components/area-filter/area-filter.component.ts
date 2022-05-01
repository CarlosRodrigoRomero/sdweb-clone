import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import Map from 'ol/Map';
import { DoubleClickZoom, Draw, Select } from 'ol/interaction';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import GeometryType from 'ol/geom/GeometryType';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import { Coordinate } from 'ol/coordinate';
import { DrawEvent } from 'ol/interaction/Draw';
import Polygon from 'ol/geom/Polygon';
import { click } from 'ol/events/condition';

import { FilterService } from '@data/services/filter.service';
import { OlMapService } from '@data/services/ol-map.service';
import { FilterControlService } from '@data/services/filter-control.service';

import { AreaFilter } from '@core/models/areaFilter';

@Component({
  selector: 'app-area-filter',
  templateUrl: './area-filter.component.html',
  styleUrls: ['./area-filter.component.css'],
})
export class AreaFilterComponent implements OnInit, OnDestroy {
  public map: Map;
  public activeDraw = false;
  public activeDeleteButton = false;
  private draw: Draw;

  areaFilter: AreaFilter;
  vectorArea: VectorLayer;
  deleteButton: VectorLayer;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private olMapService: OlMapService,
    private filterControlService: FilterControlService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));
    this.subscriptions.add(this.filterControlService.activeDrawArea$.subscribe((value) => (this.activeDraw = value)));
    this.subscriptions.add(
      this.filterControlService.activeDeleteArea$.subscribe((value) => (this.activeDeleteButton = value))
    );
    this.subscriptions.add(this.olMapService.draw$.subscribe((draw) => (this.draw = draw)));
  }

  addAreaFilter(coords: Coordinate[][]) {
    this.activeDraw = true;
    this.areaFilter = new AreaFilter('area', coords);
    this.filterService.addFilter(this.areaFilter);
  }

  deleteAreaFilter() {
    this.activeDraw = false;

    // eliminamos el filtro
    this.filterService.deleteFilter(this.areaFilter);

    // eliminamos el poligono del mapa
    this.olMapService.deleteAllDrawLayers();

    // cambiamos el boton a dibujar area
    this.activeDeleteButton = false;
  }

  clickButtonDraw() {
    this.activeDraw = !this.activeDraw;

    // si hay un area dibujada la eliminamos...
    if (this.activeDeleteButton) {
      this.deleteAreaFilter();
    } else {
      // ... si no...
      if (this.activeDraw) {
        // comenzamos el modo draw
        this.drawArea();
      } else {
        // terminamos el modo draw
        this.map.removeInteraction(this.draw);
      }
    }
  }

  drawArea() {
    const sourceArea = new VectorSource();
    const style = new Style({
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0.2)',
      }),
      stroke: new Stroke({
        color: 'black',
        width: 2,
      }),
    });

    this.vectorArea = this.olMapService.createVectorLayer(sourceArea);
    this.vectorArea.setStyle(style);

    this.map.addLayer(this.vectorArea);

    this.draw = new Draw({
      source: sourceArea,
      type: GeometryType.POLYGON,
    });
    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
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
      this.map.removeInteraction(this.draw);

      // activamos el boton borrar area
      this.activeDeleteButton = true;
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
    feature[0].setId('deleteButton');
    feature[0].setStyle(styleDelete);
    const sourceDelete = new VectorSource({
      features: feature,
    });
    this.deleteButton = this.olMapService.createVectorLayer(sourceDelete);

    this.map.addLayer(this.deleteButton);

    const select = new Select({
      condition: click,
    });

    select.setProperties({ id: 'deleteButton' });

    this.map.addInteraction(select);
    select.on('select', (elem) => {
      if (elem.selected.length > 0) {
        if (elem.selected[0].getId() === 'deleteButton') {
          this.deleteAreaFilter();
        }
      }
    });

    // cambia cursor al pasar por encima del boton
    this.map.on(
      'pointermove',
      (evt) =>
        (this.map.getTargetElement().style.cursor = this.map.hasFeatureAtPixel(evt.pixel, {
          layerFilter: (layer) => layer === this.deleteButton,
        })
          ? 'pointer'
          : '')
    );
  }

  getCoords(event: DrawEvent): Coordinate[][] {
    const polygon = event.feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates();

    return coords;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
