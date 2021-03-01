import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { take } from 'rxjs/operators';
import { combineLatest } from 'rxjs';

import Map from 'ol/Map';
import { fromLonLat, transformExtent } from 'ol/proj.js';
import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON';
import { Fill, Stroke, Style, Text } from 'ol/style';
import Select from 'ol/interaction/Select';
import { Vector as VectorSource } from 'ol/source';
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer';
import { Feature, Overlay } from 'ol';
import Polygon from 'ol/geom/Polygon';
import { defaults as defaultControls } from 'ol/control.js';
import OverlayPositioning from 'ol/OverlayPositioning';
import { click } from 'ol/events/condition';
import XYZ from 'ol/source/XYZ';

import { PlantaService } from '@core/services/planta.service';
import { MapControlService } from '../../services/map-control.service';
import { GLOBAL } from '@core/services/global';
import { InformeService } from '@core/services/informe.service';
import { FilterService } from '@core/services/filter.service';
import { OlMapService } from '@core/services/ol-map.service';
import { ShareReportService } from '@core/services/share-report.service';

import { PlantaInterface } from '@core/models/planta';
import { LocationAreaInterface } from '@core/models/location';
import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

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
  public anomaliasVectorSource: VectorSource;
  public locAreasVectorSource: VectorSource;
  public anomaliaSeleccionada: Anomalia;
  public listaAnomalias: Anomalia[];
  public listaSeguidores: Seguidor[];
  public sliderYear: number;
  public aerialLayer: TileLayer;
  public thermalSource;
  private anomaliaLayers: VectorLayer[];
  private seguidorLayers: VectorLayer[];
  public leftOpened: boolean;
  public rightOpened: boolean;
  public statsOpened: boolean;
  public anomaliasLoaded = false;
  public mousePosition;
  public informesList: string[] = [];
  public sharedReport = false;

  constructor(
    public mapControlService: MapControlService,
    private plantaService: PlantaService,
    private informeService: InformeService,
    public filterService: FilterService,
    private olMapService: OlMapService,
    private shareReportService: ShareReportService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    if (this.router.url.includes('shared')) {
      this.sharedReport = true;
    }
  }

  ngOnInit(): void {
    this.mousePosition = null;
    this.plantaId = this.activatedRoute.snapshot.paramMap.get('id');

    // Obtenemos todas las capas para esta planta
    combineLatest([this.informeService.getInformesDePlanta(this.plantaId), this.plantaService.getPlanta(this.plantaId)])
      .pipe(take(1))
      .subscribe(([informes, planta]) => {
        this.olMapService.getSeguidorLayers().subscribe((layers) => (this.seguidorLayers = layers));

        informes
          .sort((a, b) => a.fecha - b.fecha)
          .forEach((informe) => {
            this.informesList.push(informe.id);

            // crear capa de los seguidores
            this.olMapService.addSeguidorLayer(this._createSeguidorLayer(informe.id));
          });

        this.planta = planta;

        // seleccionamos el informe mas reciente de la planta
        this.selectedInformeId = this.informesList[this.informesList.length];

        // asignamos el informe para compartir
        // this.shareReportService.setInformeID(this.informesList[this.informesList.length]);

        this.mapControlService.selectedInformeId = this.informesList[this.informesList.length];

        this.initMap();
      });
  }

  private _createSeguidorLayer(informeId: string): VectorLayer {
    const vl = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      /* style: this.getStyleAnomaliasMapa(false), */
    });

    vl.setProperties({
      informeId,
    });

    return vl;
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
    });

    this.olMapService
      .createMap('map', layers, view, defaultControls({ attribution: false }))
      .subscribe((map) => (this.map = map));

    this.seguidorLayers.forEach((l) => this.map.addLayer(l));
    this.addCursorOnHover();
    // this.addOverlayInfoAnomalia();
    /* if (!this.sharedReport) {
      this.addLocationAreas();
    } */

    this.mapControlService.selectedInformeId$.subscribe((informeId) => {
      this.selectedInformeId = informeId;
      this.mostrarSeguidores();
    });
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
        popup.setPosition(undefined);
        popup.setPosition(clickedCoord);
        // element.innerHTML = 'hola probando';

        // $(element).popover('show');
      } else {
        popup.setPosition(undefined);
      }
    });
  }

  private addCursorOnHover() {
    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.informeId == this.selectedInformeId);
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

  addLocationAreas() {
    const styles = {
      LineString: new Style({
        stroke: new Stroke({
          // color: '#dbdbdb',
          color: 'red',
          // lineDash: [4],
          width: 2,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0)',
        }),
        text: new Text({
          font: '16px "Open Sans", "Arial Unicode MS", "sans-serif"',
          placement: 'line',
          fill: new Fill({
            color: 'white',
          }),
          text: '',
        }),
      }),
    };

    const styleFunction = (feature) => {
      if (feature !== undefined) {
        const style = styles[feature.getGeometry().getType()];
        style.getText().setText(feature.get('globalCoords'));
        // style.getText().setText(feature.get('globalCoords')[1]);
        return style;
      }
    };

    this.plantaService.getLocationsArea(this.plantaId).subscribe((locAreas) => {
      this.locAreasVectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(this.locAreasToGeoJSON(locAreas)),
      });

      this.map.addLayer(
        new VectorLayer({
          source: this.locAreasVectorSource,
          visible: true,
          style: styleFunction,
        })
      );
    });
  }

  private locAreasToGeoJSON(locAreas: LocationAreaInterface[]) {
    const listOfFeatures = [];
    locAreas.forEach((locArea) => {
      const coordsList = [];
      locArea.path.forEach((coords) => {
        coordsList.push(fromLonLat([coords.lng, coords.lat]));
      });
      // Al ser un poligono, la 1era y utlima coord deben ser iguales:
      coordsList.push(coordsList[0]);

      listOfFeatures.push({
        type: 'Feature',
        properties: {
          // globalCoords: locArea.globalCoords,
          globalCoords: locArea.globalX,
        },
        geometry: {
          type: 'LineString',
          coordinates: coordsList,
        },
      });
    });
    const geojsonObject = {
      type: 'FeatureCollection',
      // crs: {
      //   type: 'name',
      //   properties: {
      //     name: 'EPSG:3857',
      //   },
      // },
      features: listOfFeatures,
    };

    return geojsonObject;
  }

  private getColorAnomalia(feature: Feature) {
    const tipo = parseInt(feature.getProperties().properties.tipo);

    return GLOBAL.colores_tipos[tipo];
  }

  private getStyleAnomaliasMapa(selected = false) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: this.getColorAnomalia(feature),

            width: selected ? 6 : 4,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0)',
          }),
          text: new Text({
            font: '16px "Open Sans", "Arial Unicode MS", "sans-serif"',
            placement: 'line',
            fill: new Fill({
              color: 'white',
            }),
            text: '',
          }),
        });
      }
    };
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
        const feature = new Feature({
          geometry: {
            type: 'LineString',
            coordinates: this.locAreaToLonLat(seguidor.locArea),
          },
          properties: {
            seguidorId: seguidor.id,
            informeId: seguidor.informeId,
          },
        });
        source.addFeature(feature);
      });
    });

    // this._addSelectInteraction();
  }

  private locAreaToLonLat(locArea: LocationAreaInterface) {
    const coordsList = [];
    locArea.path.forEach((coords) => {
      coordsList.push(fromLonLat([coords.lng, coords.lat]));
    });

    // Al ser un poligono, la 1era y ultima coord deben ser iguales:
    coordsList.push(coordsList[0]);

    return coordsList;
  }

  private _addSelectInteraction() {
    const select = new Select({
      style: this.getStyleAnomaliasMapa(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().informeId == this.selectedInformeId) {
          return true;
        }
        return false;
      },
    });
    this.map.addInteraction(select);
    select.on('select', (e) => {
      this.anomaliaSeleccionada = undefined;

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;

          const anomalia = this.listaAnomalias.filter((anom) => {
            return anom.id == anomaliaId;
          })[0];
          if (this.selectedInformeId == anomalia.informeId) {
            this.anomaliaSeleccionada = anomalia;
          }
        }
      }
    });
  }
}
