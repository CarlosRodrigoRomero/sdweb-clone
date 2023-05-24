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
import { Fill, Stroke, Style, Text } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { MapDivisionsService } from '@data/services/map-divisions.service';
import { MapDivision } from '@core/models/mapDivision';
import GeometryType from 'ol/geom/GeometryType';
import VectorLayer from 'ol/layer/Vector';
import { Coordinate } from 'ol/coordinate';
import { never } from 'ol/events/condition';

import { CreateMapService } from '@data/services/create-map.service';
import { OlMapService } from '@data/services/ol-map.service';
import { MapImagesService } from '@data/services/map-images.service';

import { PlantaInterface } from '@core/models/planta';
import { MapImage } from '@core/models/mapImages';
import Circle from 'ol/geom/Circle';

@Component({
  selector: 'app-map-create-map',
  templateUrl: './map-create-map.component.html',
  styleUrls: ['./map-create-map.component.css'],
})
export class MapCreateMapComponent implements OnInit {
  private planta: PlantaInterface;
  private divisionLayer: VectorLayer;
  private divisionSource: VectorSource;
  private imagePointLayer: VectorLayer;
  private imagePointSource: VectorSource;
  map: Map;
  private draw: Draw;
  private divisions: MapDivision[] = [];
  private images: MapImage[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private createMapService: CreateMapService,
    private olMapService: OlMapService,
    private mapDivisionsService: MapDivisionsService,
    private mapImagesService: MapImagesService
  ) {}

  ngOnInit(): void {
    this.planta = this.createMapService.planta;

    this.initMap();
    this.createImagePointsLayer();
    this.addImagePoints();
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
        style: this.getDivisionStyle(),
      });

      this.divisionLayer.setProperties({
        id: 'divisionLayer',
      });

      this.map.addLayer(this.divisionLayer);
    }
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
        coords: Object.values(coords[0]),
        status: 0,
        precise: false,
      };

      // añadimos la división a la DB
      this.mapDivisionsService.addMapDivision(division);

      // añadimos el nuevo modulo como feature
      this.addDivision(division);
    });
  }

  private addDivisions() {
    this.subscriptions.add(
      this.mapDivisionsService.getMapDivisions().subscribe((divisions) => {
        this.divisionSource.clear();

        this.divisions = divisions;

        this.divisions.forEach((division) => {
          this.addDivision(division);
        });
      })
    );
  }

  private addDivision(division: MapDivision) {
    // calculamos el numero de imagenes que hay dentro de la division
    division = this.getImagesInsideDivision(division);

    const feature = new Feature({
      geometry: new Polygon([division.coords]),
      properties: {
        id: division.id,
        numImages: division.imagesIds.length.toString(),
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

  private createImagePointsLayer() {
    // si no existe previamente la creamos
    if (this.imagePointLayer === undefined) {
      this.imagePointSource = new VectorSource({ wrapX: false });

      this.imagePointLayer = new VectorLayer({
        source: this.imagePointSource,
        style: new Style({
          fill: new Fill({
            color: 'black',
          }),
        }),
      });

      this.imagePointLayer.setProperties({
        id: 'imagePointLayer',
      });

      this.map.addLayer(this.imagePointLayer);
    }
  }

  private addImagePoints() {
    // this.subscriptions.add(
    //   this.mapImagesService.getMapImages().subscribe((images) => {
    //     this.imagePointSource.clear();

    //     this.images = images;

    //     this.images.forEach((image) => this.addImagePoint(image));
    //   })
    // );

    // TEMPORAL, HASTA QUE ESTÉN LAS IMAGENES EN LA DB
    this.images = this.mapImagesService.mapImages;

    this.images.forEach((image) => this.addImagePoint(image));
  }

  private addImagePoint(image: MapImage) {
    const feature = new Feature({
      geometry: new Circle(fromLonLat(image.coords), 2),
      properties: {
        id: image.id,
      },
    });

    this.imagePointSource.addFeature(feature);
  }

  private getImagesInsideDivision(division: MapDivision): MapDivision {
    const imagesIds: string[] = [];
    this.mapImagesService.mapImages.forEach((image) => {
      if (this.isInsideDivision(image.coords, division.coords)) {
        imagesIds.push(image.id);
      }
    });
    division.imagesIds = imagesIds;

    return division;
  }

  private isInsideDivision(imageCoords: Coordinate, divisionCoords: Coordinate[]): boolean {
    const divisionPolygon = new Polygon([divisionCoords]);

    // comprobamos si esta dentro de la zone
    return divisionPolygon.intersectsCoordinate(fromLonLat(imageCoords));
  }

  private getDivisionStyle() {
    return (feature: Feature) => {
      return new Style({
        stroke: new Stroke({
          width: 2,
          color: 'white',
        }),
        text: new Text({
          text: feature.getProperties().properties.numImages,
          font: 'bold 16px Roboto',
          fill: new Fill({
            color: 'black',
          }),
          stroke: new Stroke({
            color: 'white',
            width: 4,
          }),
        }),
      });
    };
  }

  switchCreateMode() {
    this.createMapService.createMode = !this.createMapService.createMode;
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