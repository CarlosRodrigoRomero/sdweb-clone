import { Component, OnDestroy, OnInit, Input } from '@angular/core';

import { take, map } from 'rxjs/operators';
import { combineLatest, Observable, Subscription } from 'rxjs';

import { AngularFirestore, AngularFirestoreDocument, AngularFirestoreCollection } from '@angular/fire/firestore';

import Map from 'ol/Map';
import { fromLonLat, transform, transformExtent, transformWithProjections } from 'ol/proj.js';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import { defaults as defaultControls } from 'ol/control.js';
import XYZ from 'ol/source/XYZ';
import VectorImageLayer from 'ol/layer/VectorImage';

import { PlantaService } from '@data/services/planta.service';
import { MapControlService } from '../../services/map-control.service';
import { OlMapAnomaliaInfoService } from '@data/services/ol-map-anomalia-info.service';
import { ShareReportService } from '@data/services/share-report.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';

import { PlantaInterface } from '@core/models/planta';
import { Anomalia } from '@core/models/anomalia';
import { ThermalLayerInterface } from '@core/models/thermalLayer';
import { InformeInterface } from '@core/models/informe';

@Component({
  selector: 'app-anomalia-map',
  templateUrl: './anomalia-map.component.html',
  styleUrls: ['./anomalia-map.component.css']
})
export class AnomaliaMapComponent implements OnInit, OnDestroy {

  @Input() rowAnomalia: Anomalia;

  public planta: PlantaInterface;
  private informes: InformeInterface[];
  public map: Map;
  public mapThermal: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public selectedInformeId: string;
  public anomaliaSelect: Anomalia;
  public anomaliaHover: Anomalia;
  public sliderYear: number;
  public aerialLayers: TileLayer<any>[];
  private extent: any;
  private extentDemo: any;
  public thermalSource;
  private thermalLayersDB: ThermalLayerInterface[];
  private thermalLayers: TileLayer<any>[];
  private anomaliaLayers: VectorImageLayer<any>[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public sharedReport = false;
  noAnomsReport = false;
  public coordsPointer;
  idMap: string;
  idMapThermal: string
  mapLoaded = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private afs: AngularFirestore,
    public mapControlService: MapControlService,
    private plantaService: PlantaService,
    private olMapService: OlMapAnomaliaInfoService,
    private shareReportService: ShareReportService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
  ) {}

  ngOnInit(): void {
    this.idMap = `mapAnom_${this.rowAnomalia.numAnom}`;
    this.idMapThermal = this.idMap + '_thermal';
    this.mousePosition = null;

    this.anomaliasControlService.coordsPointer$.subscribe((coords) => (this.coordsPointer = coords));

    this.planta = this.reportControlService.planta;
    this.informes = this.reportControlService.informes;

    // Para la demo, agregamos un extent a todas las capas:
    this.extentDemo = this.transformMyExtent([-7.0608, 38.523619, -7.056351, 38.522765]);

    this.plantaService
      .getThermalLayers$(this.planta.id)
      .pipe(take(1))
      .subscribe((layers) => {
        console.log('layers', layers);
        this.thermalLayersDB = layers;

        // Para cada informe, hay que crear 2 capas: térmica y vectorial
        this.informes.forEach(async (informe, index) => {
          const thermalLayerDB = this.thermalLayersDB.find((item) => item.informeId === informe.id);

          if (thermalLayerDB !== undefined) {
            const thermalLayer = this.olMapService.createThermalLayer(thermalLayerDB, informe, index, this.extent);

            thermalLayer.setProperties({
              informeId: informe.id,
            });

            // solo lo aplicamos a la planta DEMO
            if (this.planta.id === 'egF0cbpXnnBnjcrusoeR') {
              thermalLayer.setExtent(this.extentDemo);
            }

            this.olMapService.addThermalLayer(thermalLayer);
          }

          // creamos las capas de anomalías para los diferentes informes o zonas
          this.anomaliasControlService
            .createAnomaliaLayers(informe.id)
            .forEach((layer) => this.olMapService.addAnomaliaLayer(layer));


          // añadimos las ortofotos aereas de cada informe
          await this.olMapService.addAerialLayer(informe);

          if (index === this.informes.length - 1) {
            this.initMap();
            console.log(this.map.getLayers().getArray());
          }
        });
      });

    // asignamos los IDs necesarios para compartir
    this.shareReportService.setPlantaId(this.planta.id);

    this.subscriptions.add(this.olMapService.getThermalLayers().subscribe((layers) => (this.thermalLayers = layers)));

    this.subscriptions.add(this.olMapService.aerialLayers$.subscribe((layers) => (this.aerialLayers = layers)));

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );

    this.subscriptions.add(this.olMapService.getAnomaliaLayers().subscribe((layers) => (this.anomaliaLayers = layers)));

    this.subscriptions.add(this.reportControlService.noAnomsReport$.subscribe((value) => (this.noAnomsReport = value)));
  }

  initMap() {
    let center = this.olMapService.getCentroid(this.rowAnomalia.featureCoords)
    let coordsCenter = transform(center, 'EPSG:3857', 'EPSG:4326');
    let deltaExtent = 1.5;
    let extent = [
      center[0] - deltaExtent,
      center[1] - deltaExtent,
      center[0] + deltaExtent,
      center[1] + deltaExtent
    ]
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });
    const satelliteLayer = new TileLayer({
      source: satellite,
      preload: Infinity,
    });

    const satelliteLayerThermal = new TileLayer({
      source: satellite,
      preload: Infinity,
      extent: extent
    })

    let aerial;
    // solo lo aplicamos a la planta DEMO
    if (this.planta.id === 'egF0cbpXnnBnjcrusoeR') {
      aerial = new XYZ({
        url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
        crossOrigin: '',
      });

      const aerialLayer = new TileLayer({
        source: aerial,
        preload: Infinity,
      });

      aerialLayer.setExtent(this.extentDemo);

      this.aerialLayers = [aerialLayer];
    }
    this.aerialLayers.forEach((layer) => {
      layer.setExtent(extent);
    });
    // this.thermalLayers.forEach((layer) => {
    //   layer.setExtent(extent);
    // });

    const layers = [
      satelliteLayer,
      ...this.aerialLayers,
      // ...this.thermalLayers,
      // new TileLayer({
      //   source: new TileDebug(),
      // }),
    ];
    const layersThermal = [
      satelliteLayerThermal,
      // ...this.aerialLayers,
      ...this.thermalLayers,
    ];

    // MAPA
    let view: View;
    let viewThermal: View;
    if (this.planta.id === 'egF0cbpXnnBnjcrusoeR') {
      // solo lo aplicamos a la planta DEMO
      view = new View({
        center: fromLonLat([this.planta.longitud, this.planta.latitud]),
        zoom: 18,
        minZoom: 16,
        maxZoom: 24,
        extent: this.transformMyExtent([-7.060903, 38.523993, -7.0556, 38.522264]),
      });
    } else {
      view = new View({
        center: fromLonLat(coordsCenter),
        zoom: 0,
        minZoom: 0,
        maxZoom: 1,
        extent: extent
      });
      viewThermal = new View({
        center: fromLonLat(coordsCenter),
        zoom: 0,
        minZoom: 0,
        maxZoom: 1,
        extent: extent
      });
    }

    this.subscriptions.add(
      this.olMapService.createMap(this.idMap, layers, view, defaultControls({ attribution: false, zoom: false })).subscribe((map) => {
        this.map = map;
      })
    );
    this.subscriptions.add(
      this.olMapService.createMap(this.idMapThermal, layersThermal, viewThermal, defaultControls({ attribution: false, zoom: false })).subscribe((map) => {
        this.mapThermal = map;
        if (this.mapThermal !== undefined) {
          this.mapThermal.once('postrender', () => (this.mapLoaded = true));
        }
      })
    );

    // añadimos las capas de anomalías al mapa
    // this.anomaliaLayers.forEach((l) => this.map.addLayer(l));
    this.map.addLayer(this.anomaliaLayers[3]);
  }


  private transformMyExtent(extent) {
    return transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
  }


  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    if (this.map) {
      while (this.map.getLayers().getLength() > 0) {
        this.map.removeLayer(this.map.getLayers().item(0));
      }
      this.olMapService.aerialLayers = []
      this.map.setTarget(undefined);
    }
    if (this.mapThermal) {
      this.olMapService.deleteAllThermalLayers()
      this.mapThermal.setTarget(undefined);
    }
  }

}
