import { Component, OnInit } from '@angular/core';

import { switchMap, take } from 'rxjs/operators';

import TileLayer from 'ol/layer/Tile';
import { fromLonLat, transformExtent } from 'ol/proj';
import { OSM } from 'ol/source';
import XYZ from 'ol/source/XYZ';
import View from 'ol/View';
import { defaults as defaultControls } from 'ol/control.js';

import { PlantaService } from '@core/services/planta.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ClustersService } from '@core/services/clusters.service';

import { PlantaInterface } from '@core/models/planta';
import { Feature, Map } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { Vector } from 'ol/layer';
import VectorSource from 'ol/source/Vector';
import LineString from 'ol/geom/LineString';

@Component({
  selector: 'app-map-clusters',
  templateUrl: './map-clusters.component.html',
  styleUrls: ['./map-clusters.component.css'],
})
export class MapClustersComponent implements OnInit {
  private plantaId: string;
  private planta: PlantaInterface;
  private aerialLayer: TileLayer;
  private satelliteLayer: TileLayer;
  private map: Map;
  private coordsPuntosTrayectoria: Coordinate[] = [];

  constructor(
    private plantaService: PlantaService,
    private olMapService: OlMapService,
    private clustersService: ClustersService
  ) {}

  ngOnInit(): void {
    this.plantaId = '1J6YwrECCGrXcEzrkjau';

    this.plantaService
      .getPlanta(this.plantaId)
      .pipe(
        take(1),
        switchMap((planta) => {
          this.planta = planta;

          this.initMap();

          return this.clustersService.getPuntosTrayectoria(this.plantaId);
        })
      )
      .subscribe((puntos) => {
        puntos.forEach((punto: any, index) => this.coordsPuntosTrayectoria.push(fromLonLat([punto.long, punto.lat])));
        if (puntos !== undefined) {
          this.addTrayectoria();
        }
      });
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    this.satelliteLayer = new TileLayer({
      source: satellite,
    });

    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
    });

    const layers = [this.satelliteLayer];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      // zoom: 18,
      zoom: this.planta.zoom,
      minZoom: this.planta.zoom,
      maxZoom: 20,
      // extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
    });

    this.olMapService.createMap('map', layers, view, defaultControls({ attribution: false })).subscribe((map) => {
      this.map = map;
    });
  }

  private transform(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }

  private addTrayectoria() {
    const trayectoria = new Vector({
      source: new VectorSource({
        features: [
          new Feature({
            geometry: new LineString(this.coordsPuntosTrayectoria),
            name: 'trayectoria',
          }),
        ],
      }),
    });

    this.map.addLayer(trayectoria);
  }
}
