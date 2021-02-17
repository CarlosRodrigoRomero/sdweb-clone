import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import { InformeService } from '@core/services/informe.service';
import { ShareReportService } from '@core/services/share-report.service';
import { PlantaService } from '@core/services/planta.service';
import { MapControlService } from '../../../planta-report/services/map-control.service';

import XYZ_mod from '../../../planta-report/xyz_mod.js';
import ImageTileMod from '../../../planta-report/ImageTileMod.js';
import { PlantaInterface } from '@core/models/planta';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { GLOBAL } from '@core/services/global.js';
import { OSM, XYZ } from 'ol/source';

@Component({
  selector: 'app-shared-report',
  templateUrl: './shared-report.component.html',
  styleUrls: ['./shared-report.component.css'],
})
export class SharedReportComponent implements OnInit {
  private informeId: string;
  private plantaId: string;
  public planta: PlantaInterface;
  private thermalLayers: TileLayer[];
  private anomaliaLayers: VectorLayer[];

  constructor(
    private informeService: InformeService,
    private shareReportService: ShareReportService,
    private plantaService: PlantaService,
    private mapControlService: MapControlService
  ) {}

  ngOnInit(): void {
    this.shareReportService.getParams().subscribe((params) => (this.informeId = params.informeID));
    this.informeService.getInforme(this.informeId).subscribe((informe) => (this.plantaId = informe.plantaId));

    // Obtenemos todas las capas termicas para esta planta y las almacenamos en this.thermalLayers
    combineLatest([
      this.plantaService.getThermalLayers$(this.plantaId),
      this.informeService.getInformesDePlanta(this.plantaId),
      this.plantaService.getPlanta(this.plantaId),
    ])
      .pipe(take(1))
      .subscribe(([thermalLayers, informes, planta]) => {
        this.thermalLayers = Array<TileLayer>();
        this.anomaliaLayers = Array<VectorLayer>();
        // Para cada informe, hay que crear 2 capas: térmica y vectorial
        informes.forEach((informe) => {
          // Crear capa térmica
          const tl = thermalLayers.filter((item) => item.informeId == informe.id);

          // crear capa de las anomalias
          // const al = this.anomaliaLayers.push(al);
          // TODO: Comprobar que existe...
          if (tl.length > 0) {
            this.thermalLayers.push(this._createThermalLayer(tl[0], informe.id));
          }
          this.anomaliaLayers.push(this._createAnomaliaLayer(informe.id));

          // Crear capa vectorial
        });

        this.planta = planta;

        // this.initMap();
      });

    // this.mapControlService.selectedInformeId = this.informesList[1];
  }

  private _createThermalLayer(thermalLayer: ThermalLayerInterface, informeId: string): TileLayer {
    // Iniciar mapa térmico
    const tl = new TileLayer({
      source: new XYZ_mod({
        url: GLOBAL.GIS + thermalLayer.gisName + '/{z}/{x}/{y}.png',
        crossOrigin: '',
        tileClass: ImageTileMod,
        transition: 255,
        tileLoadFunction: (imageTile, src) => {
          imageTile.rangeTempMax = thermalLayer.rangeTempMax;
          imageTile.rangeTempMin = thermalLayer.rangeTempMin;
          imageTile.mapControlService = this.mapControlService;
          imageTile.getImage().src = src;
        },
      }),

      // extent: this.extent1,
    });
    tl.setProperties({
      informeId,
    });

    return tl;
  }

  private _createAnomaliaLayer(informeId: string): VectorLayer {
    const vl = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      // style: this.getStyleAnomaliasMapa(false),
    });

    vl.setProperties({
      informeId,
    });

    return vl;
  }

  /* initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
      extent: this.extent1,
    });
    const osmLayer = new TileLayer({
      // source: satellite,
      source: new OSM(),
      // extent: this.extent1,
    });

    const layers = [osmLayer, this.aerialLayer, ...this.thermalLayers];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: 18,
      maxZoom: 24,
      extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .subscribe((map) => (this.map = map));

    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));
    this.addCursorOnHover();
    this.addLocationAreas();
    this.addOverlayInfoAnomalia();
    // this.permitirCrearAnomalias();

    // Slider para la capa termica
    this.mapControlService.sliderMaxSource.subscribe((v) => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
    this.mapControlService.sliderMinSource.subscribe((v) => {
      this.thermalLayers.forEach((tl) => {
        tl.getSource().changed();
      });
    });
    // this.thermalLayers.forEach((layer) => {
    //   layer.setOpacity(0);
    // });
    // this.anomaliaLayers.forEach((layer) => {
    //   layer.setOpacity(0);
    // });
    this.mapControlService.sliderThermalOpacitySource.subscribe((v) => {
      this.thermalLayers.forEach((layer) => {
        if (layer.getProperties().informeId == this.selectedInformeId) {
          layer.setOpacity(v / 100);
        } else {
          layer.setOpacity(0);
        }
        // TODO
        // const val = v/100;

        // const dif = layer.getOpacity()-v/100
      });
      this.anomaliaLayers.forEach((layer) => {
        if (layer.getProperties().informeId == this.selectedInformeId) {
          layer.setOpacity(v / 100);
        } else {
          layer.setOpacity(0);
        }
      });
    });

    this.mapControlService.sliderTemporalSource.subscribe((v) => {
      this.thermalLayers[1].setOpacity(v / 100); // 2020
      this.anomaliaLayers[1].setOpacity(v / 100);
      this.anomaliaLayers[0].setOpacity(1 - v / 100);
      this.thermalLayers[0].setOpacity(1 - v / 100); // 2019
      // this.thermalLayers.forEach(layer => {
      //   layer.setOpacity(v / 100);
      // })
      if (v >= 50) {
        this.selectedInformeId = this.informesList[1];
      } else {
        this.selectedInformeId = this.informesList[0];
      }
    });
    this.mapControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;
      this.mostrarTodasAnomalias(this.selectedInformeId);

      // reiniciamos filter service
      this.filterService.initFilterService(informeId, 'informe');
    });
  }

  initSharedMap() {
    const aerial = new XYZ({
      url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
      extent: this.extent1,
    });
    const osmLayer = new TileLayer({
      source: new OSM(),
    });

    const layers = [osmLayer, this.aerialLayer];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: 18,
      maxZoom: 24,
      extent: this.transform([-7.060903, 38.523993, -7.0556, 38.522264]),
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .subscribe((map) => (this.map = map));

    this.anomaliaLayers.forEach((l) => this.map.addLayer(l));
    this.addCursorOnHover();
    this.addOverlayInfoAnomalia();
    // this.permitirCrearAnomalias();

    this.mostrarTodasAnomalias(this.selectedInformeId);
  }

  getRandomArbitrary(min, max) {
    return Math.round(10 * (Math.random() * (max - min) + min)) / 10;
  }

  private addOverlayInfoAnomalia() {
    // Overlay para los detalles de cada anomalia
    const element = document.getElementById('popup');

    const popup = new Overlay({
      element,
      positioning: OverlayPositioning.BOTTOM_CENTER,
      stopEvent: false,
      offset: [0, -50],
    });
    this.map.addOverlay(popup);

    this.map.on('click', (event) => {
      const clickedCoord = event.coordinate;
      const feature = this.map.getFeaturesAtPixel(event.pixel);
      if (feature.length > 0) {
        const geometry = feature[0].getGeometry() as Polygon;
        const coordinate = geometry.getCoordinates();
        popup.setPosition(undefined);
        popup.setPosition(clickedCoord);
        // element.innerHTML = 'hola probando';

        // $(element).popover('show');
      } else {
        popup.setPosition(undefined);
      }
    });
  } */
}
