import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';

import Map from 'ol/Map';
import { Fill, Stroke, Style } from 'ol/style';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';
import Polygon from 'ol/geom/Polygon';
import { Draw, Modify, Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import GeometryType from 'ol/geom/GeometryType';
import { createBox } from 'ol/interaction/Draw';
import { Coordinate } from 'ol/coordinate';
import VectorSource from 'ol/source/Vector';

import { OlMapService } from '@data/services/ol-map.service';
import { FilterService } from '@data/services/filter.service';
import { ReportControlService } from '@data/services/report-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { ZonesControlService } from '@data/services/zones-control.service';
import { ZonesService } from '@data/services/zones.service';
import { ViewReportService } from '@data/services/view-report.service';

import { Anomalia } from '@core/models/anomalia';
import { LocationAreaInterface } from '@core/models/location';

import { GLOBAL } from '@data/constants/global';

@Injectable({
  providedIn: 'root',
})
export class AnomaliasControlService {
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  public map: Map;
  public selectedInformeId: string;
  private _anomaliaSelect: Anomalia = undefined;
  public anomaliaSelect$ = new BehaviorSubject<Anomalia>(this._anomaliaSelect);
  private _anomaliaHover: Anomalia = undefined;
  public anomaliaHover$ = new BehaviorSubject<Anomalia>(this._anomaliaHover);
  private prevFeatureHover: any;
  public prevAnomaliaSelect: Anomalia;
  public listaAnomalias: Anomalia[];
  private anomaliaLayers: VectorLayer[];
  private sharedReportNoFilters = false;
  private toggleViewSelected: number;

  private _coordsPointer: Coordinate = undefined;
  public coordsPointer$ = new BehaviorSubject<Coordinate>(this._coordsPointer);

  constructor(
    private olMapService: OlMapService,
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private anomaliaService: AnomaliaService,
    private zonesControlService: ZonesControlService,
    private zonesService: ZonesService,
    private viewReportService: ViewReportService
  ) {}

  initService(): Promise<boolean> {
    const getMap = this.olMapService.getMap();
    const getAnomLayers = this.olMapService.getAnomaliaLayers();
    const getIfSharedWithFilters = this.reportControlService.sharedReportWithFilters$;

    return new Promise((initService) => {
      combineLatest([getMap, getAnomLayers, getIfSharedWithFilters])
        // .pipe(take(1))
        .subscribe(([map, anomL, isSharedWithFil]) => {
          this.map = map;
          this.anomaliaLayers = anomL;
          this.sharedReportNoFilters = !isSharedWithFil;

          if (this.map !== undefined) {
            initService(true);
          }
        });

      this.reportControlService.selectedInformeId$.subscribe((informeId) => {
        this.selectedInformeId = informeId;
        this.prevAnomaliaSelect = undefined;
        this.prevFeatureHover = undefined;
        this.anomaliaSelect = undefined;
      });

      this.viewReportService.reportViewSelected$.subscribe((viewSel) => (this.toggleViewSelected = viewSel));
    });
  }

  createAnomaliaLayers(informeId: string, zones?: LocationAreaInterface[]): VectorLayer[] {
    const anomaliasLayers: VectorLayer[] = [];
    if (zones !== undefined) {
      zones.forEach((zone) => {
        const zoneId = this.zonesControlService.getGlobalsLabel(zone.globalCoords);
        const perdidasLayer = new VectorLayer({
          source: new VectorSource({ wrapX: false }),
          style: this.getStyleAnomaliasMapa(false),
          visible: false,
        });
        perdidasLayer.setProperties({
          informeId,
          type: 'anomalias',
          zoneId,
          view: 0,
          zone,
        });
        anomaliasLayers.push(perdidasLayer);
      });
    }

    return anomaliasLayers;
  }

  public mostrarAnomalias() {
    this.filterService.filteredElements$.subscribe((anomalias) => {
      if (!this.sharedReportNoFilters) {
        // Dibujar anomalias
        this.dibujarAnomalias(anomalias as Anomalia[]);
        this.listaAnomalias = anomalias as Anomalia[];

        // reiniciamos las anomalias seleccionadas cada vez que se aplica un filtro
        this.prevAnomaliaSelect = undefined;
        this.anomaliaSelect = undefined;
      } else {
        // dibujamos solo anomalias del informe compartido
        const anomFil = anomalias.filter((anom) => (anom as Anomalia).informeId === this.selectedInformeId);
        this.dibujarAnomalias(anomFil as Anomalia[]);
        this.listaAnomalias = anomalias as Anomalia[];
      }
    });
  }

  private dibujarAnomalias(anomalias: Anomalia[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.anomaliaLayers.forEach((l) => {
      // filtra las anomalías correspondientes al informe
      const anomaliasInforme = anomalias.filter((item) => item.informeId === l.getProperties().informeId);
      let anomaliasLayer = anomaliasInforme;
      // si hay zonas divimos las anomalias tb por zonas
      if (this.zonesService.thereAreZones) {
        anomaliasLayer = this.zonesControlService.getElemsZona(l.getProperties().zone, anomaliasInforme) as Anomalia[];
      }

      const source = l.getSource();
      source.clear();
      anomaliasLayer.forEach((anom) => {
        const feature = new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            view: l.getProperties().view,
            anomaliaId: anom.id,
            tipo: anom.tipo,
            informeId: anom.informeId,
          },
        });

        if (this.zonesService.thereAreZones) {
          const properties = feature.getProperties().properties;
          properties.zone = l.getProperties().zone;
          feature.setProperties({
            properties,
          });
        }

        source.addFeature(feature);
      });
    });

    // eliminamos la interacciones anteriores si las huviese
    this.removeSelectAnomaliaInteractions();

    // añadimos acciones sobre las anomalias
    this.addPointerOnHover();
    this.addOnHoverAction();
    this.addSelectInteraction();
    this.addClickOutFeatures();
  }

  private removeSelectAnomaliaInteractions() {
    // eliminamos solo las interacciones 'select'
    this.map
      .getInteractions()
      .getArray()
      .forEach((interaction) => {
        if (interaction.getListeners('select') !== undefined) {
          if (interaction.getProperties().id === 'selectAnomalia') {
            this.map.removeInteraction(interaction);
          }
        }
      });
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      this.coordsPointer = event.coordinate;

      if (this.map.hasFeatureAtPixel(event.pixel)) {
        let feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined);
        feature = feature.filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);

        if (feature.length > 0) {
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

  private addOnHoverAction() {
    let currentFeatureHover;
    this.map.on('pointermove', (event) => {
      if (this.anomaliaSelect === undefined) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId)
            .filter((item) => item.getProperties().properties.view === this.toggleViewSelected)[0] as Feature;

          if (feature !== undefined) {
            // cuando pasamos de una anomalia a otra directamente sin pasar por vacio
            if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
              this.prevFeatureHover.setStyle(this.getStyleAnomaliasMapa(false));
            }
            currentFeatureHover = feature;

            const anomaliaId = feature.getProperties().properties.anomaliaId;
            const anomalia = this.listaAnomalias.filter((anom) => anom.id === anomaliaId)[0];

            feature.setStyle(this.getStyleAnomaliasMapa(true));

            if (this.selectedInformeId === anomalia.informeId) {
              this.anomaliaHover = anomalia;
            }
            this.prevFeatureHover = feature;
          }
        } else {
          this.anomaliaHover = undefined;

          if (currentFeatureHover !== undefined) {
            currentFeatureHover.setStyle(this.getStyleAnomaliasMapa(false));
            currentFeatureHover = undefined;
          }
        }
      }
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      style: this.getStyleAnomaliasMapa(true),
      condition: click,
      layers: (l) => {
        if (l.getProperties().informeId === this.selectedInformeId) {
          return true;
        } else {
          return false;
        }
      },
    });

    select.setProperties({ id: 'selectAnomalia' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (this.anomaliaSelect !== undefined) {
        this.setExternalStyle(this.anomaliaSelect.id, false);
        this.anomaliaSelect = undefined;
      }

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;
          const anomalia = this.listaAnomalias.filter((anom) => anom.id === anomaliaId)[0];

          if (this.prevAnomaliaSelect !== undefined) {
            this.setExternalStyle(this.prevAnomaliaSelect.id, false);
          }
          this.prevAnomaliaSelect = anomalia;
          this.anomaliaSelect = anomalia;
          this.setExternalStyle(anomalia.id, true);
          this.anomaliaHover = undefined;
        }
      }
    });

    // hacemos el poligono editable
    // this.canModifyPolygon(select);
  }

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined)
        .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);
      if (feature.length === 0) {
        if (this.anomaliaSelect !== undefined) {
          this.setExternalStyle(this.anomaliaSelect.id, false);
        }
        this.anomaliaSelect = undefined;
      }
    });
  }

  private canModifyPolygon(select: Select) {
    const modify = new Modify({
      features: select.getFeatures(),
    });
    this.map.addInteraction(modify);

    modify.on('modifyend', (e) => {
      const newCoords = (e.features.getArray()[0].getGeometry() as Polygon).getCoordinates()[0];
      this.anomaliaSelect.featureCoords = newCoords;
      // actualizamos el poligono en la DB con las nuevas coordenadas
      this.anomaliaService.updateAnomalia(this.anomaliaSelect);
    });
  }

  public permitirCrearAnomalias(plantaId: string) {
    const draw = new Draw({
      source: this.anomaliaLayers[0].getSource(),
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });

    this.map.addInteraction(draw);
    draw.on('drawend', (event) => {
      this.addAnomaliaToDb(event.feature, plantaId);
    });
  }

  private addAnomaliaToDb(feature: Feature, plantaId: string) {
    const geometry = feature.getGeometry() as SimpleGeometry;

    const anomalia = new Anomalia(
      0,
      ['', '', ''],
      0,
      0,
      0,
      0,
      null,
      0,
      geometry.getCoordinates()[0],
      geometry.getType(),
      plantaId,
      this.selectedInformeId
    );
    // Guardar en la base de datos
    this.anomaliaService.addAnomalia(anomalia);
  }

  get anomaliaSelect() {
    return this._anomaliaSelect;
  }

  set anomaliaSelect(value: Anomalia) {
    this._anomaliaSelect = value;
    this.anomaliaSelect$.next(value);
  }

  get anomaliaHover() {
    return this._anomaliaHover;
  }

  set anomaliaHover(value: Anomalia) {
    this._anomaliaHover = value;
    this.anomaliaHover$.next(value);
  }

  public getStyleAnomaliasMapa(selected = false) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        if (selected) {
          return new Style({
            stroke: new Stroke({
              color: 'white',
              width: 8,
            }),
            fill: new Fill({
              color: 'rgba(0, 0, 255, 0)',
            }),
          });
        }
        return new Style({
          stroke: new Stroke({
            color: this.getColorAnomalia(feature),
            width: 4,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0)',
          }),
        });
      }
    };
  }

  private getColorAnomalia(feature: Feature) {
    if (feature !== undefined) {
      const tipo = parseInt(feature.getProperties().properties.tipo);

      return GLOBAL.colores_tipos[tipo];
    }
  }

  setExternalStyle(anomaliaId: string, focus: boolean) {
    this.listaAnomalias.find((anomalia) => anomalia.id === anomaliaId);

    const features = this.anomaliaLayers
      .find((layer) => layer.getProperties().informeId === this.selectedInformeId)
      .getSource()
      .getFeatures();

    const feature = features.find((f) => f.getProperties().properties.anomaliaId === anomaliaId);

    const focusedStyle = new Style({
      stroke: new Stroke({
        color: 'white',
        width: 8,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0)',
      }),
    });

    const unfocusedStyle = new Style({
      stroke: new Stroke({
        color: this.getColorAnomalia(feature),
        width: 4,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0)',
      }),
    });

    if (focus) {
      feature.setStyle(focusedStyle);
    } else {
      feature.setStyle(unfocusedStyle);
    }
  }

  ///////////////////////////////////////////////////////////

  get coordsPointer() {
    return this._coordsPointer;
  }

  set coordsPointer(value: Coordinate) {
    this._coordsPointer = value;
    this.coordsPointer$.next(value);
  }
}
