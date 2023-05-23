import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { Feature, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import { XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { defaults } from 'ol/control.js';
import Map from 'ol/Map';
import { Draw, Modify } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { MapDivisionsService } from '@data/services/map-divisions.service';
import { MapDivision } from '@core/models/mapDivision';
import GeometryType from 'ol/geom/GeometryType';
import VectorLayer from 'ol/layer/Vector';

import { CreateMapService } from '@data/services/create-map.service';
import { OlMapService } from '@data/services/ol-map.service';

import { PlantaInterface } from '@core/models/planta';
import { Coordinate } from 'ol/coordinate';
import { never } from 'ol/events/condition';

@Component({
  selector: 'app-map-create-map',
  templateUrl: './map-create-map.component.html',
  styleUrls: ['./map-create-map.component.css'],
})
export class MapCreateMapComponent implements OnInit {
  private planta: PlantaInterface;
  private divisionLayer: VectorLayer;
  private divisionSource: VectorSource;
  map: Map;
  private draw: Draw;
  private divisions: MapDivision[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private createMapService: CreateMapService,
    private olMapService: OlMapService,
    private mapDivisionsService: MapDivisionsService
  ) {}

  ngOnInit(): void {
    this.planta = this.createMapService.planta;

    this.initMap();
    this.createDivisionLayer();
    this.addDivisions();
    this.addModifyDivisionsInteraction();

    this.subscriptions.add(
      this.createMapService.createMode$.subscribe((mode) => {
        // this.createMode = mode;

        if (mode) {
          this.drawDivisions();
        } else if (this.draw !== undefined) {
          // terminamos el modo draw
          this.map.removeInteraction(this.draw);
        }
      })
    );
  }

  initMap() {
    const baseSource = new XYZ({
      url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', // hidrido
      // url: 'http://mt0.google.com/vt/lyrs=s&hl=en&x={x}&y={y}&z={z}', // satelite
      crossOrigin: '',
    });
    const baseLayer = new TileLayer({
      source: baseSource,
    });

    const layers = [baseLayer];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: 24,
    });

    this.olMapService
      .createMap('map', layers, view, defaults({ attribution: false }))
      .pipe(take(1))
      .subscribe((map) => {
        this.map = map;
      });
  }

  private createDivisionLayer() {
    // si no existe previamente la creamos
    if (this.divisionLayer === undefined) {
      this.divisionSource = new VectorSource({ wrapX: false });

      this.divisionLayer = new VectorLayer({
        source: this.divisionSource,
        style: new Style({
          stroke: new Stroke({
            width: 2,
            color: 'white',
          }),
        }),
      });

      this.divisionLayer.setProperties({
        id: 'divisionLayer',
      });

      this.map.addLayer(this.divisionLayer);
    }
  }

  switchCreateMode() {
    this.createMapService.createMode = !this.createMapService.createMode;
  }

  drawDivisions() {
    this.draw = new Draw({
      source: this.divisionSource,
      type: GeometryType.POLYGON,
    });
    this.olMapService.draw = this.draw;

    this.map.addInteraction(this.draw);

    this.draw.on('drawend', (evt) => {
      const polygon = evt.feature.getGeometry() as Polygon;
      const coords = polygon.getCoordinates();
      coords[0].pop(); // quitamos el ultimo punto que es igual al primero
      // const centroid = this.olMapService.getCentroid(coords[0]);

      const division: MapDivision = {
        coords: coords[0],
        status: 0,
        precise: false,
      };

      // añadimos la división a la DB
      this.mapDivisionsService.addMapDivision(division);

      // añadimos el nuevo modulo como feature
      this.addDivisionFeature(division);
    });
  }

  private addDivisionFeature(division: MapDivision) {
    const coords = Object.values(division.coords); // lo convertimos en un array

    const feature = new Feature({
      geometry: new Polygon([coords]),
      properties: {
        id: division.id,
      },
    });

    this.divisionSource.addFeature(feature);
  }

  private addDivisions() {
    this.subscriptions.add(
      this.mapDivisionsService.getMapDivisions().subscribe((divisions) => {
        this.divisionSource.clear();

        this.divisions = divisions;

        this.divisions.forEach((division) => this.addDivision(division));
      })
    );
  }

  private addDivision(division: MapDivision) {
    const feature = new Feature({
      geometry: new Polygon([division.coords]),
      properties: {
        id: division.id,
      },
    });

    this.divisionSource.addFeature(feature);
  }

  private addModifyDivisionsInteraction() {
    const modify = new Modify({ source: this.divisionSource, insertVertexCondition: never });

    modify.on('modifyend', (e) => {
      if (e.features.getArray().length > 0) {
        const divisionId = e.features.getArray()[0].getProperties().properties.id;
        const division = this.divisions.find((d) => d.id === divisionId);
        const coords = this.getCoords(e.features.getArray()[0]);

        if (coords !== null) {
          division.coords = { ...coords };

          this.mapDivisionsService.updateMapDivision(division);
        }
      }
    });

    this.map.addInteraction(modify);
  }

  getCoords(feature: Feature): Coordinate[] {
    const polygon = feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates()[0];

    return coords;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
