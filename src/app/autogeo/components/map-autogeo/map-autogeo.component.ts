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

import { OlMapService } from '@core/services/ol-map.service';
import { InformeService } from '@core/services/informe.service';
import { PlantaService } from '@core/services/planta.service';
import { AutogeoService, Mesa } from '@core/services/autogeo.service';

import { PlantaInterface } from '@core/models/planta';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Polygon from 'ol/geom/Polygon';

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
  private mesas: Mesa[];

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
        }
      });

    this.olMapService.getAerialLayers().subscribe((layers) => (this.aerialLayers = layers));

    this.autogeoService.getMesas(this.informeId).subscribe((mesas) => {
      console.log(mesas);
      this.mesas = mesas;

      this.mesas.forEach((mesa) => this.addMesa(mesa));
    });
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
    this.mesasLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: new Style({
        stroke: new Stroke({
          width: 2,
          color: 'white',
        }),
      }),
    });

    this.mesasLayer.setProperties({
      id: 'mesasLayer',
    });

    this.map.addLayer(this.mesasLayer);
  }

  private addMesa(mesa: Mesa) {
    const mBSource = this.mesasLayer.getSource();
    const feature = new Feature({
      geometry: new Polygon([mesa.coords]),
      properties: {
        id: mesa.id,
        name: 'mesa',
      },
    });

    mBSource.addFeature(feature);
  }
}
