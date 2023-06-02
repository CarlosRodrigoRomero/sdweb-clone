import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';
import { Subscription, combineLatest } from 'rxjs';

import { Feature, Overlay, View } from 'ol';
import { fromLonLat } from 'ol/proj';
import { XYZ, GeoTIFF } from 'ol/source';
import TileLayer from 'ol/layer/Tile';
import WebGLTileLayer from 'ol/layer/WebGLTile';
import { defaults } from 'ol/control.js';
import Map from 'ol/Map';
import { DoubleClickZoom, DragBox, Draw, Modify, Select } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Polygon from 'ol/geom/Polygon';
import { MapDivisionsService } from '@data/services/map-divisions.service';
import { MapDivision } from '@core/models/mapDivision';
import GeometryType from 'ol/geom/GeometryType';
import { Coordinate } from 'ol/coordinate';
import { click, never } from 'ol/events/condition';
import Circle from 'ol/geom/Circle';
import VectorImageLayer from 'ol/layer/VectorImage';
import { platformModifierKeyOnly } from 'ol/events/condition.js';

import { CreateMapService } from '@data/services/create-map.service';
import { OlMapService } from '@data/services/ol-map.service';
import { MapImagesService } from '@data/services/map-images.service';
import { MapDivisionControlService } from '@data/services/map-division-control.service';
import { MapClippingService } from '@data/services/map-clipping.service';
import { MapClippingControlService } from '@data/services/map-clipping-control.service';

import { PlantaInterface } from '@core/models/planta';
import { MapImage } from '@core/models/mapImages';
import { MapClipping } from '@core/models/mapClipping';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-map-create-map',
  templateUrl: './map-create-map.component.html',
  styleUrls: ['./map-create-map.component.css'],
})
export class MapCreateMapComponent implements OnInit {
  private planta: PlantaInterface;
  private informe: InformeInterface;
  private divisionLayer: VectorImageLayer<any>;
  private divisionSource: VectorSource<any>;
  private imagePointLayer: VectorImageLayer<any>;
  private imagePointSource: VectorSource<any>;
  private clippingLayer: VectorImageLayer<any>;
  private clippingSource: VectorSource<any>;
  private geoTiffLayers: WebGLTileLayer[] = [];
  map: Map;
  private draw: Draw;
  private divisions: MapDivision[] = [];
  private images: MapImage[] = [];
  private clippings: MapClipping[] = [];
  private popup: Overlay;
  urlImageThumbnail: string;
  private divisionHovered: MapDivision;
  private divisionSelected: MapDivision;
  clippingSelected: MapClipping;
  createDivisionMode: boolean;
  clippingsToMerge: MapClipping[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private createMapService: CreateMapService,
    private olMapService: OlMapService,
    private mapDivisionsService: MapDivisionsService,
    private mapImagesService: MapImagesService,
    private mapDivisionControlService: MapDivisionControlService,
    private mapClippingService: MapClippingService,
    private mapClippingControlService: MapClippingControlService
  ) {}

  ngOnInit(): void {
    this.planta = this.createMapService.planta;
    this.informe = this.createMapService.informe;

    this.initMap();

    this.addPointerOnHover();

    this.createImagePointsLayer();
    this.addImagePoints();
    this.addPopupOverlay();
    this.addOnHoverImageAction();

    this.createDivisionLayer();
    // this.addOnHoverDivisionsInteraction();
    this.addModifyDivisionsInteraction();
    this.addSelectDivisionsInteraction();

    this.createClippingLayer();
    this.addModifyClippingsInteraction();
    this.addSelectClippingsInteraction();
    this.addMultiSelectClippingsInteraction();

    // this.addDragboxInteraction();

    // this.addElems();

    this.addClickOutFeatures();

    this.subscriptions.add(
      combineLatest([this.mapDivisionsService.getMapDivisions(), this.mapClippingService.getMapClippings()])
        .pipe(
          switchMap(([divisions, clippings]) => {
            // solo mostramos las divisiones que no tienen recorte
            this.divisions = divisions.filter((division) => !clippings.map((c) => c.id).includes(division.id));
            this.clippings = clippings;

            this.addDivisions();
            this.addClippings();

            return combineLatest([this.createMapService.sliderMin$, this.createMapService.sliderMax$]);
          })
        )
        .subscribe(([min, max]) => {
          this.updateGeoTiffs(min, max);
        })
    );

    // this.subscriptions.add(
    //   this.createMapService.sliderMin$.subscribe((min) => {
    //     this.sliderMin = min;

    //     this.updateGeoTiffs(this.sliderMin, this.sliderMax);
    //   })
    // );

    // this.subscriptions.add(
    //   this.createMapService.sliderMax$.subscribe((max) => {
    //     this.sliderMax = max;

    //     this.updateGeoTiffs(this.sliderMin, this.sliderMax);
    //   })
    // );

    this.subscriptions.add(
      this.createMapService.createMode$.subscribe((mode) => {
        this.createDivisionMode = mode;

        if (mode) {
          this.drawDivisions();
        } else if (this.draw !== undefined) {
          // terminamos el modo draw
          this.map.removeInteraction(this.draw);
        }
      })
    );

    this.subscriptions.add(this.mapImagesService.urlImageThumbnail$.subscribe((url) => (this.urlImageThumbnail = url)));

    this.subscriptions.add(
      this.mapDivisionControlService.mapDivisionSelected$.subscribe((division) => {
        if (this.divisionSelected) {
          // quitamos el estilo a la subdivision anterior seleccionada
          this.setExternalDivisionStyle(this.divisionSelected.id, false);
        }

        if (division) {
          this.clippingSelected = undefined;

          this.setExternalDivisionStyle(division.id, true);
        }

        this.divisionSelected = division;
      })
    );

    this.subscriptions.add(
      this.mapDivisionControlService.mapDivisionHovered$.subscribe((division) => {
        if (this.divisionSelected) {
          if (this.divisionHovered) {
            // quitamos el estilo a la anterior hovered
            this.setExternalDivisionStyle(this.divisionHovered.id, false);
          }

          if (division) {
            this.setExternalDivisionStyle(division.id, true);
          }

          this.divisionHovered = division;
        }
      })
    );

    this.subscriptions.add(
      this.mapClippingControlService.mapClippingSelected$.subscribe((clipping) => {
        if (this.clippingSelected) {
          // quitamos el estilo al recorte anterior seleccionado
          this.setExternalClippingStyle(this.clippingSelected.id, false);
        }

        if (clipping) {
          this.divisionSelected = undefined;

          this.setExternalClippingStyle(clipping.id, true);
        }

        this.clippingSelected = clipping;
      })
    );

    this.subscriptions.add(
      this.mapClippingControlService.mapClippingToMerge$.subscribe((clippings) => {
        if (this.clippingSelected) {
          // quitamos el estilo al recorte anterior seleccionado
          this.setExternalClippingStyle(this.clippingSelected.id, false);
        }
        if (this.divisionSelected) {
          // quitamos el estilo a la subdivision anterior seleccionada
          this.setExternalDivisionStyle(this.divisionSelected.id, false);
        }

        if (clippings.length > 0) {
          this.divisionSelected = undefined;
          this.clippingSelected = undefined;

          this.setExternalClippingToMergeStyle(clippings, true);
        } else if (this.clippingsToMerge.length > 0) {
          this.setExternalClippingToMergeStyle(this.clippingsToMerge, false);
        }

        this.clippingsToMerge = clippings;
      })
    );
  }

  /* MAPA */

  initMap() {
    const baseSource = new XYZ({
      url: 'http://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}', // hidrido
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

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const features = this.map.getFeaturesAtPixel(event.pixel);

        if (features.length > 0) {
          // cambia el puntero por el de seleccionar
          this.map.getViewport().style.cursor = 'pointer';
        } else {
          // vuelve a poner el puntero normal
          this.map.getViewport().style.cursor = 'inherit';
        }
      } else {
        // vuelve a poner el puntero normal
        this.map.getViewport().style.cursor = 'inherit';
      }
    });
  }

  private async addGeoTiffs(clipping: MapClipping, min: number, max: number) {
    const url = `https://storage.googleapis.com/mapas-cog/${clipping.id}.tif`;

    const source = new GeoTIFF({
      sources: [
        {
          url,
          min,
          max,
        },
      ],
    });

    const layer = new WebGLTileLayer({ source });

    layer.setVisible(clipping.visible);

    this.geoTiffLayers.push(layer);

    this.map.addLayer(layer);
  }

  private updateGeoTiffs(min: number, max: number) {
    /// Eliminamos las capas antiguas
    if (this.geoTiffLayers.length > 0) {
      this.geoTiffLayers.forEach((layer, index) => {
        layer.setZIndex(index);

        this.map.removeLayer(layer);
      });
    }

    this.clippings.forEach((clipping) => {
      this.addGeoTiffs(clipping, min, max);
    });
  }

  /* DIVISIONES */

  private createDivisionLayer() {
    // si no existe previamente la creamos
    if (this.divisionLayer === undefined) {
      this.divisionSource = new VectorSource<any>({ wrapX: false });

      this.divisionLayer = new VectorImageLayer<any>({
        source: this.divisionSource,
        style: this.getStyleDivision(false),
      });

      this.divisionLayer.setProperties({
        id: 'divisionLayer',
      });

      // le asignamos un numero alto para que queda siempre por encima de los mapas
      this.divisionLayer.setZIndex(1000);

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
        type: 'division',
      };

      // calculamos el numero de imagenes que hay dentro de la division
      const [imagesRgbIds, imagesThermalIds] = this.getImagesInsideDivision(coords[0]);
      division.imagesRgbIds = imagesRgbIds;
      division.numImagesRgb = imagesRgbIds.length;
      division.imagesThermalIds = imagesThermalIds;
      division.numImagesThermal = imagesThermalIds.length;

      // añadimos la división a la DB
      this.mapDivisionsService.addMapDivision(division);
    });
  }

  private addElems() {
    this.subscriptions.add(
      combineLatest([this.mapDivisionsService.getMapDivisions(), this.mapClippingService.getMapClippings()]).subscribe(
        ([divisions, clippings]) => {
          // solo mostramos las divisiones que no tienen recorte
          this.divisions = divisions.filter((division) => !clippings.map((c) => c.id).includes(division.id));
          this.clippings = clippings;

          this.addDivisions();
          this.addClippings();
        }
      )
    );
  }

  private addDivisions() {
    this.divisionSource.clear();

    this.divisions.forEach((division) => this.addDivision(division));
  }

  private addDivision(division: MapDivision) {
    let numImagesRgb = '0';
    let numImagesThermal = '0';
    if (division.numImagesRgb !== undefined) {
      numImagesRgb = division.numImagesRgb.toString();
      numImagesThermal = division.numImagesThermal.toString();
    }

    const feature = new Feature({
      geometry: new Polygon([division.coords]),
      properties: {
        id: division.id,
        name: 'division',
        numImagesRgb,
        numImagesThermal,
      },
    });

    this.divisionSource.addFeature(feature);
  }

  private addOnHoverDivisionsInteraction() {
    let currentFeatureHover: Feature<any>;
    this.map.on('pointermove', (event) => {
      let featureExistsUnderCursor = false; // Controla si hay una feature debajo del cursor

      this.map.forEachFeatureAtPixel(event.pixel, (f) => {
        const feature = f as Feature<any>;
        if (
          feature.getProperties().hasOwnProperty('properties') &&
          feature.getProperties().properties.hasOwnProperty('name') &&
          feature.getProperties().properties.name === 'division'
        ) {
          featureExistsUnderCursor = true;

          if (currentFeatureHover !== undefined) {
            currentFeatureHover.setStyle(this.getStyleDivision(false));
          }

          currentFeatureHover = feature;
          currentFeatureHover.setStyle(this.getStyleDivision(true));

          const divisionId = feature.getProperties().properties.id;
          const division = this.divisions.find((img) => img.id === divisionId);

          this.mapDivisionControlService.mapDivisionHovered = division;
        }
      });

      // Si no hay ninguna feature debajo del cursor, reseteamos el estilo de la feature anterior
      if (!featureExistsUnderCursor && currentFeatureHover !== undefined) {
        currentFeatureHover.setStyle(this.getStyleDivision(false));
        currentFeatureHover = undefined;

        this.mapDivisionControlService.mapDivisionHovered = undefined;
      }
    });
  }

  private addModifyDivisionsInteraction() {
    const modify = new Modify({ source: this.divisionSource, insertVertexCondition: never });

    modify.on('modifyend', (e) => {
      if (e.features.getArray().length > 0) {
        const divisionId = e.features.getArray()[0].getProperties().properties.id;
        let division = this.divisions.find((d) => d.id === divisionId);
        const coords = this.getCoords(e.features.getArray()[0] as Feature<Polygon>);

        if (coords !== null) {
          // calculamos el numero de imagenes que hay dentro de la division
          const [imagesRgbIds, imagesThermalIds] = this.getImagesInsideDivision(coords);
          division.imagesRgbIds = imagesRgbIds;
          division.imagesThermalIds = imagesThermalIds;

          // adaptamos las coords a la DB
          division.coords = { ...coords };

          this.mapDivisionsService.updateMapDivision(division);
        }
      }
    });

    this.map.addInteraction(modify);
  }

  private addSelectDivisionsInteraction() {
    const select = new Select({
      style: this.getStyleDivision(false),
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

  private getStyleDivision(focused: boolean) {
    if (focused) {
      return (feature: Feature<any>) => {
        let textRgb = '0';
        let textThermal = '0';
        if (feature.getProperties().properties !== undefined) {
          textRgb = feature.getProperties().properties.numImagesRgb;
          textThermal = feature.getProperties().properties.numImagesThermal;
        }

        const label = `${textRgb} RGB\n${textThermal} THERMAL`;

        return new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
          stroke: new Stroke({
            width: 2,
            color: 'white',
          }),
          text: new Text({
            text: label,
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
    } else {
      return (feature: Feature<any>) => {
        let textRgb = '0';
        let textThermal = '0';
        if (feature.getProperties().properties !== undefined) {
          textRgb = feature.getProperties().properties.numImagesRgb;
          textThermal = feature.getProperties().properties.numImagesThermal;
        }

        const label = `${textRgb} RGB\n${textThermal} THERMAL`;

        return new Style({
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.2)',
          }),
          stroke: new Stroke({
            width: 2,
            color: 'blue',
          }),
          text: new Text({
            text: label,
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
  }

  private setExternalDivisionStyle(divisionId: string, focused: boolean) {
    const features: Feature<any>[] = this.divisionLayer.getSource().getFeatures();

    const feature = features.find((f) => f.getProperties().properties.id === divisionId);

    if (focused) {
      feature.setStyle(this.getStyleDivision(true));
    } else {
      feature.setStyle(this.getStyleDivision(false));
    }
  }

  private getImagesInsideDivision(divisionCoords: Coordinate[]): string[][] {
    const imagesRgb = this.images.filter((image) => image.tipo === 'RGB');
    const imagesRgbIds: string[] = [];
    imagesRgb.forEach((image) => {
      if (this.isInsideDivision(image.coords, divisionCoords)) {
        imagesRgbIds.push(image.id);
      }
    });

    const imagesThermal = this.images.filter((image) => image.tipo !== 'RGB');
    const imagesThermalIds: string[] = [];
    imagesThermal.forEach((image) => {
      if (this.isInsideDivision(image.coords, divisionCoords)) {
        imagesThermalIds.push(image.id);
      }
    });

    return [imagesRgbIds, imagesThermalIds];
  }

  private isInsideDivision(imageCoords: Coordinate, divisionCoords: Coordinate[]): boolean {
    const divisionPolygon = new Polygon([divisionCoords]);

    // comprobamos si esta dentro de la zone
    return divisionPolygon.intersectsCoordinate(fromLonLat(imageCoords));
  }

  /* IMÁGENES */

  private createImagePointsLayer() {
    // si no existe previamente la creamos
    if (this.imagePointLayer === undefined) {
      this.imagePointSource = new VectorSource<any>({ wrapX: false });

      this.imagePointLayer = new VectorImageLayer<any>({
        source: this.imagePointSource,
        style: this.getStyleImagePoint(false),
      });

      this.imagePointLayer.setProperties({
        id: 'imagePointLayer',
      });

      // le asignamos un numero alto para que queda siempre por encima de los mapas
      this.imagePointLayer.setZIndex(1001);

      this.map.addLayer(this.imagePointLayer);
    }
  }

  private addImagePoints() {
    this.subscriptions.add(
      this.mapImagesService
        .getMapImages()
        .pipe(take(1))
        .subscribe((images) => {
          this.imagePointSource.clear();

          this.images = images;

          const imagesRgb = this.images.filter((image) => image.tipo === 'RGB');

          imagesRgb.forEach((image) => this.addImagePoint(image));
        })
    );
  }

  private addImagePoint(image: MapImage) {
    const feature = new Feature({
      geometry: new Circle(fromLonLat(image.coords), 1),
      properties: {
        id: image.id,
        name: 'imagePoint',
      },
    });

    this.imagePointSource.addFeature(feature);
  }

  private addPopupOverlay() {
    const container = document.getElementById('popup');

    this.popup = new Overlay({
      id: 'popup',
      element: container,
      position: undefined,
    });

    this.map.addOverlay(this.popup);
  }

  private addOnHoverImageAction() {
    let currentFeatureHover: Feature<any>;
    this.map.on('pointermove', (event) => {
      let featureExistsUnderCursor = false; // Controla si hay una feature debajo del cursor

      this.map.forEachFeatureAtPixel(event.pixel, (f) => {
        const feature = f as Feature<any>;
        if (
          feature.getProperties().hasOwnProperty('properties') &&
          feature.getProperties().properties.hasOwnProperty('name') &&
          feature.getProperties().properties.name === 'imagePoint'
        ) {
          featureExistsUnderCursor = true;

          if (currentFeatureHover !== undefined) {
            currentFeatureHover.setStyle(this.getStyleImagePoint(false));
          }

          currentFeatureHover = feature;
          currentFeatureHover.setStyle(this.getStyleImagePoint(true));

          const imagePointId = feature.getProperties().properties.id;
          const image = this.images.find((img) => img.id === imagePointId);

          // cargamos la miniatura asociada a este punto
          this.mapImagesService.getImageThumbnail(image.path);

          // mostramos el popup
          this.map.getOverlayById('popup').setPosition(fromLonLat(image.coords));
        }
      });

      // Si no hay ninguna feature debajo del cursor, ocultamos el popup y reseteamos el estilo de la feature anterior
      if (!featureExistsUnderCursor && currentFeatureHover !== undefined) {
        currentFeatureHover.setStyle(this.getStyleImagePoint(false));
        currentFeatureHover = undefined;

        this.urlImageThumbnail = undefined;

        this.map.getOverlayById('popup').setPosition(undefined);
      }
    });
  }

  private getStyleImagePoint(focused: boolean) {
    if (focused) {
      return (feature: Feature<any>) => {
        return new Style({
          fill: new Fill({
            color: 'white',
          }),
          stroke: new Stroke({
            width: 2,
            color: 'white',
          }),
        });
      };
    } else {
      return (feature: Feature<any>) => {
        return new Style({
          fill: new Fill({
            color: 'black',
          }),
        });
      };
    }
  }

  /* RECORTES */

  private addClippings() {
    this.clippingSource.clear();

    this.clippings.forEach((clipping) => this.addClipping(clipping));
  }

  private addClipping(clipping: MapClipping) {
    const feature = new Feature({
      geometry: new Polygon([clipping.coords]),
      properties: {
        id: clipping.id,
        name: 'clipping',
      },
    });

    this.clippingSource.addFeature(feature);
  }

  private createClippingLayer() {
    // si no existe previamente la creamos
    if (this.clippingLayer === undefined) {
      this.clippingSource = new VectorSource<any>({ wrapX: false });

      this.clippingLayer = new VectorImageLayer<any>({
        source: this.clippingSource,
        style: this.getStyleClipping(false),
      });

      this.clippingLayer.setProperties({
        id: 'clippingLayer',
      });

      // le asignamos un numero alto para que queda siempre por encima de los mapas
      this.clippingLayer.setZIndex(1000);

      this.map.addLayer(this.clippingLayer);
    }
  }

  private addModifyClippingsInteraction() {
    const modify = new Modify({ source: this.clippingSource, insertVertexCondition: never });

    modify.on('modifyend', (e) => {
      if (e.features.getArray().length > 0) {
        const clippingId = e.features.getArray()[0].getProperties().properties.id;
        let clipping = this.clippings.find((d) => d.id === clippingId);
        const coords = this.getCoords(e.features.getArray()[0] as Feature<Polygon>);

        if (coords !== null) {
          this.mapClippingService.updateMapClipping(clipping);
        }
      }
    });

    this.map.addInteraction(modify);
  }

  private addSelectClippingsInteraction() {
    const select = new Select({
      style: this.getStyleClipping(false),
      condition: (mapBrowserEvent) => {
        return click(mapBrowserEvent) && !platformModifierKeyOnly(mapBrowserEvent);
      },
      layers: (l) => {
        if (l.getProperties().id === 'clippingLayer') {
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
        if (feature.getProperties().properties.name === 'clipping') {
          const clippingId = feature.getProperties().properties.id;
          const clipping = this.clippings.find((c) => c.id === clippingId);

          this.mapClippingControlService.mapClippingSelected = clipping;
        }
      }
    });
  }

  private addMultiSelectClippingsInteraction() {
    const select = new Select({
      style: this.getStyleClippingToMerge(false),
      condition: (mapBrowserEvent) => {
        return click(mapBrowserEvent) && platformModifierKeyOnly(mapBrowserEvent);
      },
      layers: (l) => {
        if (l.getProperties().id === 'clippingLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);

    select.on('select', (e) => {
      // Ajustado aquí para manejar la selección de múltiples features
      if (e.selected.length > 0) {
        e.selected.forEach((feature) => {
          if (feature.getProperties().properties.name === 'clipping') {
            const clippingId = feature.getProperties().properties.id;
            const clipping = this.clippings.find((c) => c.id === clippingId);

            // Agregar el nuevo clipping a la lista existente
            const clippingsToMerge = [...this.mapClippingControlService.mapClippingToMerge];
            clippingsToMerge.push(clipping);
            this.mapClippingControlService.mapClippingToMerge = clippingsToMerge;
          }
        });
      }
    });
  }

  private getStyleClipping(focused: boolean) {
    if (focused) {
      return (feature: Feature<any>) => {
        return new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 255, 0.2)',
          }),
          stroke: new Stroke({
            width: 2,
            color: 'white',
          }),
        });
      };
    } else {
      return (feature: Feature<any>) => {
        return new Style({
          fill: new Fill({
            color: 'rgba(0, 255, 0, 0.2)',
          }),
          stroke: new Stroke({
            width: 2,
            color: 'green',
          }),
        });
      };
    }
  }

  private getStyleClippingToMerge(focused: boolean) {
    if (focused) {
      return (feature: Feature<any>) => {
        return new Style({
          fill: new Fill({
            color: 'rgba(255, 240, 0, 0.2)',
          }),
          stroke: new Stroke({
            width: 2,
            color: 'yellow',
          }),
        });
      };
    } else {
      return (feature: Feature<any>) => {
        return new Style({
          fill: new Fill({
            color: 'rgba(0, 255, 0, 0.2)',
          }),
          stroke: new Stroke({
            width: 2,
            color: 'green',
          }),
        });
      };
    }
  }

  private setExternalClippingStyle(clippingId: string, focused: boolean) {
    const features: Feature<any>[] = this.clippingLayer.getSource().getFeatures();

    const feature = features.find((f) => f.getProperties().properties.id === clippingId);

    if (focused) {
      feature.setStyle(this.getStyleClipping(true));
    } else {
      feature.setStyle(this.getStyleClipping(false));
    }
  }

  private setExternalClippingToMergeStyle(clippings: MapClipping[], focused: boolean) {
    const features: Feature<any>[] = this.clippingLayer.getSource().getFeatures();

    clippings.forEach((clipping) => {
      const feature = features.find((f) => f.getProperties().properties.id === clipping.id);

      if (focused) {
        feature.setStyle(this.getStyleClippingToMerge(true));
      } else {
        feature.setStyle(this.getStyleClippingToMerge(false));
      }
    });
  }

  cutMap() {
    console.log('Mapa seleccionado: ', this.clippingSelected);
  }

  mergeMaps() {
    console.log('Mapas seleccionados: ', this.clippingsToMerge);
  }

  /* OTROS */

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined);
      if (feature.length === 0) {
        if (this.divisionSelected !== undefined) {
          this.mapDivisionControlService.mapDivisionSelected = undefined;
        }

        if (this.clippingSelected !== undefined) {
          this.mapClippingControlService.mapClippingSelected = undefined;
        }

        if (this.clippingsToMerge.length > 0) {
          this.mapClippingControlService.mapClippingToMerge = [];
        }
      }
    });
  }

  switchCreateMode() {
    this.createMapService.createMode = !this.createMapService.createMode;
  }

  getCoords(feature: Feature<any>): Coordinate[] {
    const polygon = feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates()[0];

    return coords;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
