import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';

import Map from 'ol/Map';
import { Fill, Stroke, Style } from 'ol/style';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
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
import { ViewReportService } from '@data/services/view-report.service';

import { Anomalia } from '@core/models/anomalia';

import { Colors } from '@core/classes/colors';

import { COLOR } from '@data/constants/color';

@Injectable({
  providedIn: 'root',
})
export class AnomaliasControlService {
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
  private currentZoom: number;
  private _coordsPointer: Coordinate = undefined;
  public coordsPointer$ = new BehaviorSubject<Coordinate>(this._coordsPointer);
  zoomChangeView = 22;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private anomaliaService: AnomaliaService,
    private viewReportService: ViewReportService
  ) {}

  initService(): Promise<boolean> {
    const getMap = this.olMapService.getMap();
    const getAnomLayers = this.olMapService.getAnomaliaLayers();
    const getIfSharedWithFilters = this.reportControlService.sharedReportWithFilters$;

    return new Promise((initService) => {
      this.subscriptions.add(
        combineLatest([getMap, getAnomLayers, getIfSharedWithFilters]).subscribe(([map, anomL, isSharedWithFil]) => {
          this.map = map;
          this.anomaliaLayers = anomL;
          this.sharedReportNoFilters = !isSharedWithFil;

          if (this.map !== undefined) {
            // añadimos acciones sobre las anomalias
            this.addPointerOnHover();
            this.addOnHoverAction();
            this.addClickOutFeatures();
            this.addZoomEvent();
          }
        })
      );

      this.subscriptions.add(
        this.reportControlService.selectedInformeId$.subscribe((informeId) => {
          this.selectedInformeId = informeId;
          this.prevAnomaliaSelect = undefined;
          this.prevFeatureHover = undefined;
          this.anomaliaSelect = undefined;
        })
      );

      this.subscriptions.add(
        this.viewReportService.reportViewSelected$.subscribe((viewSel) => {
          this.toggleViewSelected = viewSel;

          // filtramos las ccs para la vista CelsCalientes
          this.filterService.filterCCs(this.toggleViewSelected);
        })
      );

      this.subscriptions.add(this.olMapService.currentZoom$.subscribe((zoom) => (this.currentZoom = zoom)));

      initService(true);
    });
  }

  createAnomaliaLayers(informeId: string): VectorLayer[] {
    const anomaliasLayers: VectorLayer[] = [];

    const perdidasLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStylePerdidas(false),
      visible: false,
    });
    perdidasLayer.setProperties({
      informeId,
      type: 'anomalias',
      view: 0,
    });
    anomaliasLayers.push(perdidasLayer);

    const celsCalientesLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleCelsCalientes(false),
      visible: false,
    });
    celsCalientesLayer.setProperties({
      informeId,
      type: 'anomalias',
      view: 1,
    });
    anomaliasLayers.push(celsCalientesLayer);

    const gradNormMaxLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleGradienteNormMax(false),
      visible: false,
    });
    gradNormMaxLayer.setProperties({
      informeId,
      type: 'anomalias',
      view: 2,
    });
    anomaliasLayers.push(gradNormMaxLayer);

    return anomaliasLayers;
  }

  createCommentsAnomaliaLayers(informeId: string): VectorLayer {
    const perdidasLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStylePerdidas(false),
      visible: true,
    });
    perdidasLayer.setProperties({
      informeId,
      type: 'anomalias',
    });

    return perdidasLayer;
  }

  mostrarAnomalias(comentarios?: boolean): void {
    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((anomalias) => {
        if (comentarios) {
          // dibujamos las anomalias del informe de comentarios
          const anomFil = anomalias.filter((anom) => (anom as Anomalia).informeId === this.selectedInformeId);
          this.dibujarAnomsComentarios(anomFil as Anomalia[]);
          this.listaAnomalias = anomalias as Anomalia[];
        } else {
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
        }
      })
    );
  }

  private dibujarAnomalias(anomalias: Anomalia[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.anomaliaLayers.forEach((l) => {
      // filtra las anomalías correspondientes al informe
      const anomaliasInforme = anomalias.filter((item) => item.informeId === l.getProperties().informeId);

      const source = l.getSource();
      source.clear();
      anomaliasInforme.forEach((anom) => {
        const feature = new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            view: l.getProperties().view,
            anomaliaId: anom.id,
            tipo: anom.tipo,
            informeId: anom.informeId,
            perdidas: anom.perdidas,
            gradienteNormalizado: anom.gradienteNormalizado,
            type: 'anomalia',
          },
        });

        source.addFeature(feature);
      });
    });
    // eliminamos la interacciones anteriores si las huviese
    this.removeSelectAnomaliaInteractions();

    // añadimos la nueva interaccion
    this.addSelectInteraction();
  }

  private dibujarAnomsComentarios(anomalias: Anomalia[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.anomaliaLayers.forEach((l) => {
      // filtra las anomalías correspondientes al informe
      const anomaliasInforme = anomalias.filter((item) => item.informeId === l.getProperties().informeId);

      const source = l.getSource();
      source.clear();
      anomaliasInforme.forEach((anom) => {
        const feature = new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            anomaliaId: anom.id,
            informeId: anom.informeId,
            perdidas: anom.perdidas,
            type: 'anomalia',
          },
        });

        source.addFeature(feature);
      });
    });
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
    this.map.on('pointermove', (event) => {
      if (this.anomaliaSelect === undefined) {
        if (this.map.hasFeatureAtPixel(event.pixel)) {
          const feature = this.map
            .getFeaturesAtPixel(event.pixel)
            .filter((item) => item.getProperties().properties !== undefined)
            .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId)
            .filter((item) => item.getProperties().properties.view === this.toggleViewSelected)
            .filter((item) => item.getProperties().properties.type === 'anomalia')[0] as Feature;

          if (feature !== undefined) {
            // cuando pasamos de una anomalia a otra directamente sin pasar por vacio
            if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
              this.prevFeatureHover.setStyle(this.getStyleAnomalias(false));
            }

            const anomaliaId = feature.getProperties().properties.anomaliaId;
            const anomalia = this.listaAnomalias.filter((anom) => anom.id === anomaliaId)[0];

            feature.setStyle(this.getStyleAnomalias(true));

            this.anomaliaHover = anomalia;

            this.prevFeatureHover = feature;
          } else {
            if (this.anomaliaHover !== undefined) {
              this.setExternalStyle(this.anomaliaHover.id, false);

              this.anomaliaHover = undefined;
            }
          }
        } else {
          if (this.anomaliaHover !== undefined) {
            this.setExternalStyle(this.anomaliaHover.id, false);

            this.anomaliaHover = undefined;
          }
        }
      } else {
        this.anomaliaHover = undefined;
      }
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      condition: click,
      layers: (l) => {
        if (
          l.getProperties().informeId === this.selectedInformeId &&
          l.getProperties().view === this.toggleViewSelected &&
          l.getProperties().hasOwnProperty('type') &&
          l.getProperties().type === 'anomalias'
        ) {
          return true;
        } else {
          return false;
        }
      },
    });

    select.setProperties({ id: 'selectAnomalia' });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      this.anomaliaHover = undefined;

      if (this.anomaliaSelect !== undefined) {
        this.setExternalStyle(this.anomaliaSelect.id, false);
        this.anomaliaSelect = undefined;
      }

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;
          const anomalia = this.listaAnomalias.find((anom) => anom.id === anomaliaId);

          this.anomaliaSelect = anomalia;

          // aplicamos estilos
          this.setExternalStyle(anomaliaId, true);

          if (this.prevAnomaliaSelect !== undefined && this.prevAnomaliaSelect.id !== anomaliaId) {
            this.setExternalStyle(this.prevAnomaliaSelect.id, false);
          }

          this.prevAnomaliaSelect = anomalia;
        }
      }
    });

    // hacemos el poligono editable
    // this.canModifyPolygon(select);
  }

  private addClickOutFeatures() {
    this.map.on('click', async (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined)
        .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);
      if (feature.length === 0) {
        if (this.anomaliaSelect !== undefined) {
          await this.setExternalStyle(this.anomaliaSelect.id, false);

          this.anomaliaSelect = undefined;
        }
      }
    });
  }

  private addZoomEvent() {
    this.map.on('moveend', (event) => {
      this.olMapService.currentZoom = this.map.getView().getZoom();
      this.map
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (
            layer.getProperties().informeId === this.selectedInformeId &&
            layer.getProperties().view === this.toggleViewSelected
          ) {
            (layer as VectorLayer).getSource().changed();
          }
        });
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

  private getStyleAnomalias(focus: boolean) {
    const estilosView = [
      this.getStylePerdidas(focus),
      this.getStyleCelsCalientes(focus),
      this.getStyleGradienteNormMax(focus),
    ];

    return estilosView[this.toggleViewSelected];
  }

  // ESTILOS PERDIDAS
  getStylePerdidas(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color:
              this.currentZoom >= this.zoomChangeView
                ? focused
                  ? 'white'
                  : this.getColorMae(feature, 1)
                : focused
                ? 'white'
                : 'black',
            width: this.currentZoom >= this.zoomChangeView ? 4 : focused ? 2 : 1,
          }),
          fill: new Fill({
            color: this.currentZoom >= this.zoomChangeView ? 'rgba(255,255,255, 0)' : this.getColorMae(feature, 0.9),
          }),
        });
      }
    };
  }

  private getColorMae(feature: Feature, opacity: number): string {
    const perdidas = feature.getProperties().properties.perdidas as number;

    return Colors.getColor(perdidas, [0.3, 0.5], opacity);
  }

  // ESTILOS CELS CALIENTES
  private getStyleCelsCalientes(focused) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color:
              this.currentZoom >= this.zoomChangeView
                ? focused
                  ? 'white'
                  : this.getColorCelsCalientes(feature, 1)
                : focused
                ? 'white'
                : 'black',
            width: this.currentZoom >= this.zoomChangeView ? 4 : focused ? 2 : 1,
          }),
          fill: new Fill({
            color:
              this.currentZoom >= this.zoomChangeView
                ? 'rgba(255,255,255, 0)'
                : this.getColorCelsCalientes(feature, 0.9),
          }),
        });
      }
    };
  }

  private getColorCelsCalientes(feature: Feature, opacity: number): string {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    return Colors.getColor(gradNormMax, [10, 40], opacity);
  }

  // ESTILOS GRADIENTE NORMALIZADO MAX
  private getStyleGradienteNormMax(focused) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color:
              this.currentZoom >= this.zoomChangeView
                ? focused
                  ? 'white'
                  : this.getColorGradienteNormMax(feature, 1)
                : focused
                ? 'white'
                : 'black',
            width: this.currentZoom >= this.zoomChangeView ? 4 : focused ? 2 : 1,
          }),
          fill: new Fill({
            color:
              this.currentZoom >= this.zoomChangeView
                ? 'rgba(255,255,255, 0)'
                : this.getColorGradienteNormMax(feature, 0.9),
          }),
        });
      }
    };
  }

  private getColorGradienteNormMax(feature: Feature, opacity: number) {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    return Colors.getColor(gradNormMax, [10, 40], opacity);
  }

  // ESTILO POR TIPOS
  getStyleAnomaliasMapa(selected = false) {
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

      return COLOR.colores_tipos[tipo];
    }
  }

  getLayerViewAnomalias(anomaliaId: string) {
    const layersInforme = this.anomaliaLayers.filter(
      (layer) => layer.getProperties().informeId === this.selectedInformeId
    );

    const layersView = layersInforme.filter((layer) => layer.getProperties().view === this.toggleViewSelected);

    let layerViewAnomalia: VectorLayer;
    layersView.forEach((layer) => {
      const featuresLayer = layer.getSource().getFeatures();
      featuresLayer.forEach((f) => {
        if (f.getProperties().properties.anomaliaId === anomaliaId) {
          layerViewAnomalia = layer;
        }
      });
    });

    return layerViewAnomalia;
  }

  setExternalStyle(anomaliaId: string, focused: boolean) {
    const layersInforme = this.anomaliaLayers.filter(
      (layer) => layer.getProperties().informeId === this.selectedInformeId
    );

    const layersView = layersInforme.filter((layer) => layer.getProperties().view === this.toggleViewSelected);

    const features: Feature[] = [];
    layersView.forEach((layer) => features.push(...layer.getSource().getFeatures()));

    const feature = features.find((f) => f.getProperties().properties.anomaliaId === anomaliaId);

    if (focused) {
      feature.setStyle(this.getStyleAnomalias(true));
    } else {
      feature.setStyle(this.getStyleAnomalias(false));
    }
  }

  resetService() {
    this.selectedInformeId = undefined;
    this.anomaliaSelect = undefined;
    this.anomaliaHover = undefined;
    this.prevFeatureHover = undefined;
    this.prevAnomaliaSelect = undefined;
    this.listaAnomalias = [];
    this.anomaliaLayers = [];
    this.sharedReportNoFilters = false;
    this.toggleViewSelected = undefined;
    this.currentZoom = undefined;
    this.coordsPointer = undefined;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  ///////////////////////////////////////////////////////////

  get coordsPointer() {
    return this._coordsPointer;
  }

  set coordsPointer(value: Coordinate) {
    this._coordsPointer = value;
    this.coordsPointer$.next(value);
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
}
