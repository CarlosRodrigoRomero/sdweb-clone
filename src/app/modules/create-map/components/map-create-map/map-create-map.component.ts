import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { Feature, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import { XYZ } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import { defaults } from 'ol/control.js';
import Map from 'ol/Map';
import { DoubleClickZoom, Draw, Modify, Select } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { MapDivisionsService } from '@data/services/map-divisions.service';
import { MapDivision } from '@core/models/mapDivision';
import GeometryType from 'ol/geom/GeometryType';
import VectorLayer from 'ol/layer/Vector';
import { Coordinate } from 'ol/coordinate';
import { click, never } from 'ol/events/condition';
import Circle from 'ol/geom/Circle';

import { CreateMapService } from '@data/services/create-map.service';
import { OlMapService } from '@data/services/ol-map.service';
import { MapImagesService } from '@data/services/map-images.service';
import { MapDivisionControlService } from '@data/services/map-division-control.service';

import { PlantaInterface } from '@core/models/planta';
import { MapImage } from '@core/models/mapImages';

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
    private mapImagesService: MapImagesService,
    private mapDivisionControlService: MapDivisionControlService
  ) {}

  ngOnInit(): void {
    this.planta = this.createMapService.planta;

    this.initMap();
    this.createImagePointsLayer();
    this.addImagePoints();
    this.createDivisionLayer();
    this.addDivisions();
    this.addModifyDivisionsInteraction();
    this.addSelectDivisionsInteraction();

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
      // desactivamos el dobleclick para que no interfiera al cerrar poligono
      this.map.getInteractions().forEach((interaction) => {
        if (interaction instanceof DoubleClickZoom) {
          this.map.removeInteraction(interaction);
        }
      });

      const polygon = evt.feature.getGeometry() as Polygon;
      const coords = polygon.getCoordinates();
      coords[0].pop(); // quitamos el ultimo punto que es igual al primero

      let division: MapDivision = {
        coords: Object.values(coords[0]),
        status: 0,
        precise: false,
      };

      // calculamos el numero de imagenes que hay dentro de la division
      const imagesIds = this.getImagesInsideDivision(coords[0]);
      division.imagesIds = imagesIds;
      division.numImages = imagesIds.length;

      // añadimos la división a la DB
      this.mapDivisionsService.addMapDivision(division);
    });
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
    let numImages = '0';
    if (division.numImages !== undefined) {
      numImages = division.numImages.toString();
    }

    const feature = new Feature({
      geometry: new Polygon([division.coords]),
      properties: {
        id: division.id,
        name: 'division',
        numImages,
      },
    });

    this.divisionSource.addFeature(feature);
  }

  private addModifyDivisionsInteraction() {
    const modify = new Modify({ source: this.divisionSource, insertVertexCondition: never });

    modify.on('modifyend', (e) => {
      if (e.features.getArray().length > 0) {
        const divisionId = e.features.getArray()[0].getProperties().properties.id;
        let division = this.divisions.find((d) => d.id === divisionId);
        const coords = this.getCoords(e.features.getArray()[0]);

        if (coords !== null) {
          // calculamos el numero de imagenes que hay dentro de la division
          division.imagesIds = this.getImagesInsideDivision(division.coords);

          // adaptamos las coords a la DB
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

  private getImagesInsideDivision(divisionCoords: Coordinate[]): string[] {
    const imagesIds: string[] = [];
    this.mapImagesService.mapImages.forEach((image) => {
      if (this.isInsideDivision(image.coords, divisionCoords)) {
        imagesIds.push(image.id);
      }
    });

    return imagesIds;
  }

  private isInsideDivision(imageCoords: Coordinate, divisionCoords: Coordinate[]): boolean {
    const divisionPolygon = new Polygon([divisionCoords]);

    // comprobamos si esta dentro de la zone
    return divisionPolygon.intersectsCoordinate(fromLonLat(imageCoords));
  }

  private getDivisionStyle() {
    return (feature: Feature) => {
      let text = '0';
      if (feature.getProperties().properties !== undefined) {
        text = feature.getProperties().properties.numImages;
      }
      return new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
        stroke: new Stroke({
          width: 2,
          color: 'white',
        }),
        text: new Text({
          text,
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

  private addSelectDivisionsInteraction() {
    const select = new Select({
      style: this.getDivisionStyle(),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'divisionLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);

    select.on('select', (e) => {
      if (e.selected.length > 0) {
        const feature = e.selected[0];
        if (feature.getProperties().properties.name === 'division') {
          const divisionId = feature.getProperties().properties.id;
          const division = this.divisions.find((d) => d.id === divisionId);

          this.mapDivisionControlService.mapDivisionSelected = division;
        }
      }
    });
  }

  switchCreateMode() {
    this.createMapService.createMode = !this.createMapService.createMode;
  }

  getCoords(feature: Feature): Coordinate[] {
    const polygon = feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates()[0];

    return coords;
  }

  private getStyleDivision(hovered: boolean) {
    if (hovered) {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              width: 4,
              color: 'white',
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0.2)',
            }),
          });
        }
      };
    } else {
      return (feature: Feature) => {
        if (feature !== undefined) {
          return new Style({
            stroke: new Stroke({
              width: 2,
              color: 'white',
            }),
            fill: new Fill({
              color: 'rgba(255, 255, 255, 0)',
            }),
          });
        }
      };
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
