import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { Feature, Map, View } from 'ol';
import XYZ from 'ol/source/XYZ';
import TileLayer from 'ol/layer/Tile';
import { defaults as defaultControls } from 'ol/control.js';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import { DoubleClickZoom, Draw, Select } from 'ol/interaction';

import { OlMapService } from '@core/services/ol-map.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { AutogeoService, Mesa } from '@core/services/autogeo.service';

import { PlantaInterface } from '@core/models/planta';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Polygon from 'ol/geom/Polygon';
import GeometryType from 'ol/geom/GeometryType';
import { DrawEvent } from 'ol/interaction/Draw';
import { Coordinate } from 'ol/coordinate';
import { FeatureLike } from 'ol/Feature';
import { Fill } from 'ol/style';
import { click } from 'ol/events/condition';

@Component({
  selector: 'app-map-autogeo',
  templateUrl: './map-autogeo.component.html',
  styleUrls: ['./map-autogeo.component.css'],
})
export class MapAutogeoComponent implements OnInit {
  private map: Map;
  private aerialLayers: TileLayer[];
  private informeId: string;
  private planta: PlantaInterface;
  private mesasLayer: VectorLayer;
  private mesasSource: VectorSource;
  private mesas: Mesa[] = [];
  private draw: Draw;
  private mesaSelected: Mesa;
  deleteMode = false;
  createMode = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private router: Router,
    private informeService: InformeService,
    private plantaService: PlantaService,
    private autogeoService: AutogeoService
  ) {}

  ngOnInit(): void {
    this.informeId = this.router.url.split('/')[this.router.url.split('/').length - 1];

    this.addAerialLayer(this.informeId);

    this.informeService
      .getInforme(this.informeId)
      .pipe(
        take(1),
        switchMap((informe) => this.plantaService.getPlanta(informe.plantaId))
      )
      .subscribe((planta) => {
        this.planta = planta;

        if (this.map === undefined) {
          this.initMap();

          this.createMesasLayer();
          this.addMesas();

          this.addPointerOnHover();
          this.addOnHoverMesaAction();
          this.addSelectMesasInteraction();
        }
      });

    this.olMapService.getAerialLayers().subscribe((layers) => (this.aerialLayers = layers));
  }

  private initMap(): void {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
    });

    const layers = [satelliteLayer, ...this.aerialLayers];

    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom - 2,
      maxZoom: this.planta.zoom + 8,
    });

    this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
      this.map = map;
    });
  }

  private addAerialLayer(informeId: string) {
    const aerial = new XYZ({
      url: 'http://solardrontech.es/tileserver.php?/index.json?/' + informeId + '_visual/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    const aerialLayer = new TileLayer({
      source: aerial,
      preload: Infinity,
    });

    this.olMapService.addAerialLayer(aerialLayer);
  }

  private createMesasLayer() {
    this.mesasSource = new VectorSource({ wrapX: false });

    this.mesasLayer = new VectorLayer({
      source: this.mesasSource,
      style: this.getStyleMesa(false),
    });

    this.mesasLayer.setProperties({
      id: 'mesasLayer',
    });

    this.map.addLayer(this.mesasLayer);
  }

  private addMesas() {
    this.autogeoService.getMesas(this.informeId).subscribe((mesas) => {
      this.mesasSource.clear();

      this.mesas = mesas;

      this.mesas.forEach((mesa) => this.addMesa(mesa));
    });
  }

  private addMesa(mesa: Mesa) {
    const feature = new Feature({
      geometry: new Polygon([mesa.coords]),
      properties: {
        id: mesa.id,
        name: 'mesa',
      },
    });

    this.mesasSource.addFeature(feature);
  }

  drawMesa() {
    this.draw = new Draw({
      source: this.mesasSource,
      type: GeometryType.POLYGON,
      maxPoints: 4,
      stopClick: true,
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
      const coords = this.olMapService.fourSidePolygonCoordToObject(this.getCoords(evt));

      if (coords !== null) {
        const mesa: Mesa = { coords };

        this.autogeoService.addMesa(this.informeId, mesa);
      }
    });
  }

  changeCreateMode() {
    this.createMode = !this.createMode;

    if (this.createMode) {
      // comenzamos el modo crear mesas
      this.drawMesa();
    } else {
      // terminamos el modo crear mesas
      this.map.removeInteraction(this.draw);
    }
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

  private addOnHoverMesaAction() {
    let currentFeatureHover: Feature;
    this.map.on('pointermove', (event) => {
      if (currentFeatureHover !== undefined) {
        currentFeatureHover.setStyle(this.getStyleMesa(false));
        currentFeatureHover = undefined;
      }

      this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
        const f = feature as Feature;
        if (f.getProperties().name === 'mesa') {
          currentFeatureHover = f;
          currentFeatureHover.setStyle(this.getStyleMesa(true));
        }
      });
    });
  }

  private addSelectMesasInteraction() {
    const select = new Select({
      style: this.getStyleMesa(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().id === 'mesasLayer') {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);

    select.on('select', (e) => {
      if (this.deleteMode) {
        if (e.selected.length > 0) {
          const feature = e.selected[0];
          if (feature.getProperties().properties.name === 'mesa') {
            const mesaId = feature.getProperties().properties.id;

            this.autogeoService.deleteMesa(this.informeId, mesaId);
          }
        }
      }
    });
  }

  getCoords(event: DrawEvent): Coordinate[] {
    const polygon = event.feature.getGeometry() as Polygon;
    const coords = polygon.getCoordinates()[0];

    // quitamos el ultimo punto que es el mismo que el primero
    coords.pop();

    return coords;
  }

  private getStyleMesa(hovered: boolean) {
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
}
