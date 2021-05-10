import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import Map from 'ol/Map';
import { fromLonLat } from 'ol/proj.js';
import View from 'ol/View';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import Select from 'ol/interaction/Select';
import { Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Feature, Overlay } from 'ol';
import Polygon from 'ol/geom/Polygon';
import { defaults as defaultControls } from 'ol/control.js';
import OverlayPositioning from 'ol/OverlayPositioning';
import XYZ from 'ol/source/XYZ';

import { PlantaService } from '@core/services/planta.service';
import { MapSeguidoresService } from '../../services/map-seguidores.service';
import { IncrementosService } from '../../services/incrementos.service';
import { GLOBAL } from '@core/services/global';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ShareReportService } from '@core/services/share-report.service';
import { ReportControlService } from '@core/services/report-control.service';

import { PlantaInterface } from '@core/models/planta';
import { Seguidor } from '@core/models/seguidor';
import { LatLngLiteral } from '@agm/core';
import { Coordinate } from 'ol/coordinate';

@Component({
  selector: 'app-map-seguidores',
  templateUrl: './map-seguidores.component.html',
  styleUrls: ['./map-seguidores.component.scss'],
})
export class MapSeguidoresComponent implements OnInit {
  public plantaId: string;
  public planta: PlantaInterface;
  public map: Map;
  public rangeMin: number;
  public rangeMax: number;
  public palleteJSON: string;
  public selectedInformeId: string;
  public locAreasVectorSource: VectorSource;
  public seguidorSeleccionado: Seguidor;
  public listaSeguidores: Seguidor[];
  public sliderYear: number;
  public aerialLayer: TileLayer;
  public thermalSource;
  private seguidorLayers: VectorLayer[];
  private incrementoLayers: VectorLayer[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public informeIdList: string[] = [];
  public sharedReport = false;
  private vistaSeleccionada = 0;

  constructor(
    public mapSeguidoresService: MapSeguidoresService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    private olMapService: OlMapService,
    private shareReportService: ShareReportService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private incrementosService: IncrementosService,
    private reportControlService: ReportControlService
  ) {
    if (this.router.url.includes('shared')) {
      this.sharedReport = true;
    }
    this.mapSeguidoresService.toggleView$.subscribe((sel) => (this.vistaSeleccionada = Number(sel)));
  }

  ngOnInit(): void {
    this.mousePosition = null;
    this.plantaId = this.activatedRoute.snapshot.paramMap.get('id');

    // Obtenemos todas las capas para esta planta
    combineLatest([this.informeService.getInformesDePlanta(this.plantaId), this.plantaService.getPlanta(this.plantaId)])
      .pipe(take(1))
      .subscribe(([informes, planta]) => {
        this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers));
        this.olMapService.getIncrementoLayers().subscribe((layers) => (this.incrementoLayers = layers));

        this.incrementosService.initService();

        this.informeIdList = informes.sort((a, b) => a.fecha - b.fecha).map((informe) => informe.id);
        this.incrementosService.informeIdList = informes.sort((a, b) => a.fecha - b.fecha).map((informe) => informe.id);

        informes
          .sort((a, b) => a.fecha - b.fecha)
          .forEach((informe) => {
            // creamos las capas de los seguidores para los diferentes informes
            this._createSeguidorLayers(informe.id).forEach((layer) => this.olMapService.addSeguidorLayer(layer));

            // creamos las capas de los incrementos para los diferentes informes
            this.incrementosService
              .createIncrementoLayers(informe.id)
              .forEach((layer) => this.olMapService.addIncrementoLayer(layer));
          });

        // los subscribimos al toggle de vitas
        this.mapSeguidoresService.toggleView$.subscribe((v) => {
          // ocultamos las 3 capas de las vistas
          this.seguidorLayers.forEach((layer) => layer.setOpacity(0));
          this.incrementoLayers.forEach((layer) => layer.setOpacity(0));
          // mostramos la capa seleccionada
          this.seguidorLayers[v].setOpacity(1);
          this.incrementoLayers[v].setOpacity(1);
        });

        this.planta = planta;

        // seleccionamos el informe mas reciente de la planta
        this.selectedInformeId = this.informeIdList[this.informeIdList.length - 1];

        // asignamos el informe para compartir
        // this.shareReportService.setInformeID(this.informesList[this.informesList.length - 1]);

        this.mapSeguidoresService.selectedInformeId = this.informeIdList[this.informeIdList.length - 1];

        this.initMap();
      });
  }

  initMap() {
    const satellite = new XYZ({
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      crossOrigin: '',
    });

    /* const aerial = new XYZ({
      // url: 'https://solardrontech.es/demo_rgb/{z}/{x}/{y}.png',
      url: this.planta.ortofoto.url,
      crossOrigin: '',
    });

    this.aerialLayer = new TileLayer({
      source: aerial,
    }); */

    const osmLayer = new TileLayer({
      source: satellite,
      // source: new OSM(),
    });

    const layers = [osmLayer /* this.aerialLayer */];

    // MAPA
    const view = new View({
      center: fromLonLat([this.planta.longitud, this.planta.latitud]),
      zoom: this.planta.zoom,
      maxZoom: 20,
      minZoom: 14,
    });

    // creamos el mapa a traves del servicio y nos subscribimos a el
    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .subscribe((map) => (this.map = map));

    this.seguidorLayers.forEach((l) => this.map.addLayer(l));
    this.addCursorOnHover();
    this.addOverlayInfoAnomalia();
    /* if (!this.sharedReport) {
      this.addLocationAreas();
    } */

    this.incrementoLayers.forEach((l) => this.map.addLayer(l));

    // los subscribimos al slider temporal
    this.reportControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;
      this.mostrarSeguidores();
      // this.incrementosService.mostrarIncrementos();
    });
  }

  private _createSeguidorLayers(informeId: string): VectorLayer[] {
    const maeLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleSeguidoresMae(false),
    });
    maeLayer.setProperties({
      informeId,
      id: '0',
    });
    const celsCalientesLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleSeguidoresCelsCalientes(false),
    });
    celsCalientesLayer.setProperties({
      informeId,
      id: '1',
    });
    const gradNormMaxLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleSeguidoresGradienteNormMax(false),
    });
    gradNormMaxLayer.setProperties({
      informeId,
      id: '2',
    });

    return [maeLayer, celsCalientesLayer, gradNormMaxLayer];
  }

  private addCursorOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);
        if (feature.length > 0) {
          this.map.getViewport().style.cursor = 'pointer';
        } else {
          this.map.getViewport().style.cursor = 'inherit';
        }
      } else {
        this.map.getViewport().style.cursor = 'inherit';
      }
    });
  }

  private addOverlayInfoAnomalia() {
    // Overlay para los detalles de cada seguidor
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
        popup.setPosition(undefined);
        popup.setPosition(clickedCoord);
      } else {
        popup.setPosition(undefined);
      }
    });
  }

  // ESTILOS MAE
  private getStyleSeguidoresMae(selected: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: this.getColorSeguidorMae(feature),
            width: selected ? 8 : 4,
          }),
          fill: new Fill({
            color: this.hexToRgb(this.getColorSeguidorMae(feature), 0.5),
          }),
        });
      }
    };
  }

  private getColorSeguidorMae(feature: Feature) {
    const mae = feature.getProperties().properties.mae as number;

    if (mae <= 0.01) {
      return GLOBAL.colores_mae[0];
    } else if (mae <= 0.02) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  // ESTILOS CELS CALIENTES
  private getStyleSeguidoresCelsCalientes(selected) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: this.getColorSeguidorCelsCalientes(feature),
            width: selected ? 8 : 4,
          }),
          fill: new Fill({
            color: this.hexToRgb(this.getColorSeguidorCelsCalientes(feature), 0.5),
          }),
        });
      }
    };
  }

  private getColorSeguidorCelsCalientes(feature: Feature) {
    const numModulos = feature.getProperties().properties.filas * feature.getProperties().properties.columnas;
    const celsCalientes = feature
      .getProperties()
      .properties.anomalias.filter((anomalia) => anomalia.tipo == 8 || anomalia.tipo == 9).length;
    const porcentCelsCalientes = celsCalientes / numModulos;

    if (porcentCelsCalientes <= 0.1) {
      return GLOBAL.colores_mae[0];
    } else if (porcentCelsCalientes <= 0.2) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  // ESTILOS GRADIENTE NORMALIZADO MAX
  private getStyleSeguidoresGradienteNormMax(selected) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: this.getColorSeguidorGradienteNormMax(feature),
            width: selected ? 8 : 4,
          }),
          fill: new Fill({
            color: this.hexToRgb(this.getColorSeguidorGradienteNormMax(feature), 0.5),
          }),
        });
      }
    };
  }

  private getColorSeguidorGradienteNormMax(feature: Feature) {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    if (gradNormMax <= 10) {
      return GLOBAL.colores_mae[0];
    } else if (gradNormMax <= 20) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  private hexToRgb(hex: string, opacity: number): string {
    return (
      'rgba(' +
      hex
        .replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1)
        .match(/.{2}/g)
        .map((x) => parseInt(x, 16))
        .toString() +
      ',' +
      opacity.toString() +
      ')'
    );
  }

  mostrarSeguidores() {
    this.filterService.filteredElements$.subscribe((seguidores) => {
      // Dibujar seguidores
      this.dibujarSeguidores(seguidores as Seguidor[]);
      this.listaSeguidores = seguidores as Seguidor[];
    });
  }

  dibujarSeguidores(seguidores: Seguidor[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.seguidorLayers.forEach((l) => {
      // filtra los seguidores correspondientes al informe
      const filtered = seguidores.filter((seguidor) => seguidor.informeId === l.getProperties().informeId);
      const source = l.getSource();
      source.clear();
      filtered.forEach((seguidor) => {
        // crea poligono seguidor
        const feature = new Feature({
          geometry: new Polygon(this.latLonLiteralToLonLat(seguidor.path)),
          properties: {
            seguidorId: seguidor.id,
            informeId: seguidor.informeId,
            mae: seguidor.mae,
            /* temperaturaMax: seguidor.temperaturaMax, */
            gradienteNormalizado: seguidor.gradienteNormalizado,
            anomalias: seguidor.anomalias,
            filas: seguidor.filas,
            columnas: seguidor.columnas,
          },
        });
        source.addFeature(feature);
      });
    });

    this._addSelectInteraction();
  }

  private latLonLiteralToLonLat(path: LatLngLiteral[]) {
    const coordsList: Coordinate[] = [];
    path.forEach((coords) => {
      coordsList.push(fromLonLat([coords.lng, coords.lat]));
    });

    return [coordsList];
  }

  private _addSelectInteraction() {
    // array con los estilos de las 3 vistas
    const estilosView = [
      this.getStyleSeguidoresMae(true),
      this.getStyleSeguidoresCelsCalientes(true),
      this.getStyleSeguidoresGradienteNormMax(true),
    ];

    const select = new Select({
      // condition: click,
      layers: (l) => {
        if (l.getProperties().informeId === this.selectedInformeId && l.getProperties().id == this.vistaSeleccionada) {
          return true;
        }
        return false;
      },
    });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      this.seguidorSeleccionado = undefined;

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const seguidorId = e.selected[0].getProperties().properties.seguidorId;

          const seguidor = this.listaSeguidores.filter((seg) => {
            return seg.id === seguidorId;
          })[0];

          if (this.selectedInformeId === seguidor.informeId) {
            this.seguidorSeleccionado = seguidor;

            // resaltamos el seguidor seleccionado
            e.selected[0].setStyle(estilosView[this.vistaSeleccionada]);
          }
        }
      }
    });
  }
}
