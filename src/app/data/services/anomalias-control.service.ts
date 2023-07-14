import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Subscription } from 'rxjs';

import { AngularFireStorage } from '@angular/fire/storage';

import Map from 'ol/Map';
import { Fill, Stroke, Style, Icon } from 'ol/style';
import { Feature } from 'ol';
import VectorLayer from 'ol/layer/Vector';
import Polygon from 'ol/geom/Polygon';
import Point from 'ol/geom/Point';
import { Draw, Modify, Select } from 'ol/interaction';
import { click } from 'ol/events/condition';
import SimpleGeometry from 'ol/geom/SimpleGeometry';
import GeometryType from 'ol/geom/GeometryType';
import { createBox } from 'ol/interaction/Draw';
import { Coordinate } from 'ol/coordinate';
import VectorSource from 'ol/source/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';

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
  private _selectionMethod: string = undefined;
  public selectionMethod$ = new BehaviorSubject<string>(this._selectionMethod);
  private _anomaliaHover: Anomalia = undefined;
  public anomaliaHover$ = new BehaviorSubject<Anomalia>(this._anomaliaHover);
  private prevFeatureHover: any;
  public prevAnomaliaSelect: Anomalia;
  public listaAnomalias: Anomalia[];
  private anomaliaLayers: VectorImageLayer<any>[];
  private sharedReportNoFilters = false;
  private toggleViewSelected: string;
  private _coordsPointer: Coordinate = undefined;
  public coordsPointer$ = new BehaviorSubject<Coordinate>(this._coordsPointer);
  private _urlVisualImageAnomalia: string = undefined;
  public urlVisualImageAnomalia$ = new BehaviorSubject<string>(this._urlVisualImageAnomalia);
  private _urlThermalImageAnomalia: string = undefined;
  public urlThermalImageAnomalia$ = new BehaviorSubject<string>(this._urlThermalImageAnomalia);
  private _thermalImageExist = true;
  thermalImageExist$ = new BehaviorSubject<boolean>(this._thermalImageExist);
  private _visualImageExist = true;
  visualImageExist$ = new BehaviorSubject<boolean>(this._visualImageExist);
  zoomChangeView = 22;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private olMapService: OlMapService,
    private filterService: FilterService,
    private reportControlService: ReportControlService,
    private anomaliaService: AnomaliaService,
    private viewReportService: ViewReportService,
    private storage: AngularFireStorage,
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
            this.addMoveEndEvent();
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

          // refrescamos la capa para que la vista se muestre correctamente
          this.olMapService.refreshLayersView(this.selectedInformeId, this.toggleViewSelected);
        })
      );

      initService(true);
    });
  }

  createAnomaliaLayers(informeId: string): VectorImageLayer<any>[] {
    const anomaliasLayers: VectorImageLayer<any>[] = [];

    const perdidasLayer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnomalias(false, undefined, 'mae'),
      visible: false,
    });
    perdidasLayer.setProperties({
      informeId,
      type: 'anomalias',
      view: 'mae',
    });
    anomaliasLayers.push(perdidasLayer);

    const celsCalientesLayer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnomalias(false, undefined, 'cc'),
      visible: false,
    });
    celsCalientesLayer.setProperties({
      informeId,
      type: 'anomalias',
      view: 'cc',
    });
    anomaliasLayers.push(celsCalientesLayer);

    const gradNormMaxLayer = new VectorImageLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnomalias(false, undefined, 'grad'),
      visible: false,
    });
    gradNormMaxLayer.setProperties({
      informeId,
      type: 'anomalias',
      view: 'grad',
    });
    anomaliasLayers.push(gradNormMaxLayer);

    const tiposLayer = new VectorImageLayer({
      // declutter: true,
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleAnomalias(false, undefined, 'tipo'),
      visible: false,
    });
    tiposLayer.setProperties({
      informeId,
      type: 'anomalias',
      view: 'tipo',
    });
    anomaliasLayers.push(tiposLayer);

    return anomaliasLayers;
  }

  mostrarAnomalias(): void {
    this.subscriptions.add(
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
      })
    );
  }

  private dibujarAnomalias(anomalias: Anomalia[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.anomaliaLayers.forEach((l) => {
      // filtra las anomalías correspondientes al informe
      let anomaliasInforme = anomalias.filter((anom) => anom.informeId === l.getProperties().informeId);

      // filtramos solo las cels calientes para la vista de cels calientes
      if (l.getProperties().view === 'cc') {
        anomaliasInforme = anomaliasInforme.filter((anom) => anom.tipo == 8 || anom.tipo == 9);
      }

      const source = l.getSource() as VectorSource<any>;
      source.clear();
      anomaliasInforme.forEach((anom) => {
        if (anom.featureType === 'Polygon') {
        var feature = new Feature({
          geometry: new Polygon([anom.featureCoords]),
          properties: {
            view: l.getProperties().view,
            anomaliaId: anom.id,
            tipo: anom.tipo,
            informeId: anom.informeId,
            perdidas: anom.perdidas,
            gradienteNormalizado: anom.gradienteNormalizado,
            type: 'anomalia',
            featureType: 'Polygon',
          },
        });
        source.addFeature(feature);
      } else if (anom.featureType === 'Point') {
        var featurePoint = new Feature({
          geometry: new Point(anom.featureCoords[0]),
          properties: {
            view: l.getProperties().view,
            anomaliaId: anom.id,
            tipo: anom.tipo,
            informeId: anom.informeId,
            perdidas: anom.perdidas,
            gradienteNormalizado: anom.gradienteNormalizado,
            type: 'anomalia',
            featureType: 'Point',
          },
        });
        featurePoint.setStyle(this.getStyleAnomalias(false));
        source.addFeature(featurePoint);
      }
        // source.addFeature(feature);
      });
    });
    // eliminamos la interacciones anteriores si las huviese
    this.removeSelectAnomaliaInteractions();

    // añadimos la nueva interaccion
    this.addSelectInteraction();
  }

  private removeSelectAnomaliaInteractions() {
    if (this.map !== undefined) {
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
  }

  private addPointerOnHover() {
    this.map.on('pointermove', (event) => {
      if (!this.olMapService.mapMoving) {
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
      }
    });
  }

  private addOnHoverAction() {
    this.map.on('pointermove', (event) => {
      if (!this.olMapService.mapMoving) {
        if (this.anomaliaSelect === undefined || this.anomaliaSelect !== undefined) {
          if (this.map.hasFeatureAtPixel(event.pixel)) {
            const feature = this.map
              .getFeaturesAtPixel(event.pixel)
              .filter((item) => item.getProperties().properties !== undefined)
              .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId)
              .filter((item) => item.getProperties().properties.view === this.toggleViewSelected)
              .filter((item) => item.getProperties().properties.type === 'anomalia')[0] as Feature<any>;

            if (feature !== undefined) {
              // cuando pasamos de una anomalia a otra directamente sin pasar por vacio
              if (this.anomaliaSelect !== undefined){
                if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
                  if (this.prevFeatureHover.getProperties().properties.anomaliaId !== this.anomaliaSelect.id) {
                    this.prevFeatureHover.setStyle(this.getStyleAnomalias(false, this.prevFeatureHover.featureType));
                  }
                }
              } else {
                if (this.prevFeatureHover !== undefined && this.prevFeatureHover !== feature) {
                  this.prevFeatureHover.setStyle(this.getStyleAnomalias(false, this.prevFeatureHover.featureType));  
                }
              }
              

              const anomaliaId = feature.getProperties().properties.anomaliaId;
              const anomalia = this.listaAnomalias.filter((anom) => anom.id === anomaliaId)[0];

              const coords = anomalia.featureCoords[0];
              this.setPopupPosition(coords);
              
              feature.setStyle(this.getStyleAnomalias(true, feature.getProperties().properties.featureType));

              this.anomaliaHover = anomalia;

              this.prevFeatureHover = feature;
            } else {
              if (this.anomaliaHover !== undefined) {
                this.setExternalStyle(this.anomaliaHover.id, false, this.anomaliaHover.featureType);

                this.anomaliaHover = undefined;
              }
            }
          } else {
            if (this.anomaliaHover !== undefined  && this.anomaliaSelect !== undefined) {
              if (this.anomaliaHover.id !== this.anomaliaSelect.id) {
                this.setExternalStyle(this.anomaliaHover.id, false, this.anomaliaHover.featureType);
              }
              this.anomaliaHover = undefined;
            } else {
              if (this.anomaliaHover !== undefined) {
                this.setExternalStyle(this.anomaliaHover.id, false, this.anomaliaHover.featureType);
              }
              this.anomaliaHover = undefined;
            }
          }
        } else {
          this.anomaliaHover = undefined;
        }
      }
    });
  }

  setPopupPosition(coords: Coordinate) {
    const popupCoords = [coords[0] + 20, coords[1] + 20] as Coordinate;
    this.map.getOverlayById('popup-anomalia-info').setPosition(popupCoords);
  }

  getImageAnomalia(folder: string) {
    if (this.anomaliaSelect !== undefined && this.anomaliaSelect !== null) {
      // const imageName = this.seguidorSelected.imageName;
      let imageName = this.anomaliaSelect.archivoPublico;

      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');
      let a = '9Z8X571Ae64QoEQSvuAp';
      let b = '9Z8X571Ae64QoEQSvuAp_10.341.jpg';

      const imageRef = storageRef.child('informes/' + a + '/' + folder + '/' + b);
      // const imageRef = storageRef.child('informes/' + this.anomaliaSelect.informeId + '/' + folder + '/' + imageName);

      // Obtenemos la URL y descargamos el archivo capturando los posibles errores
      imageRef
        .getDownloadURL()
        .toPromise()
        .then((url) => {
          if (folder === 'jpg') {
            // indicamos  que la imagen existe
            this.thermalImageExist = true;

            this.urlThermalImageAnomalia = url;
          } else {
            // indicamos  que la imagen existe
            this.visualImageExist = true;

            this.urlVisualImageAnomalia = url;
          }
        })
        .catch((error) => {
          switch (error.code) {
            case 'storage/object-not-found':
              if (folder === 'jpg') {
                // indicamos  que la imagen no existe
                this.thermalImageExist = false;
              } else {
                // indicamos  que la imagen no existe
                this.visualImageExist = false;
              }

              console.log("File doesn't exist");
              break;

            case 'storage/unauthorized':
              console.log("User doesn't have permission to access the object");
              break;

            case 'storage/canceled':
              console.log('User canceled the upload');
              break;

            case 'storage/unknown':
              console.log('Unknown error occurred, inspect the server response');
              break;
          }
        });
    }
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

    if (this.map) {
      this.map.addInteraction(select);
      select.on('select', (e) => {
        this.anomaliaHover = undefined;

        if (this.anomaliaSelect !== undefined) {
          this.setExternalStyle(this.anomaliaSelect.id, false, this.anomaliaSelect.featureType);
          this.anomaliaSelect = undefined;
          this.selectionMethod = undefined;
        }

        if (e.selected.length > 0) {
          if (e.selected[0].getProperties().hasOwnProperty('properties')) {
            const anomaliaId = e.selected[0].getProperties().properties.anomaliaId;
            const anomalia = this.listaAnomalias.find((anom) => anom.id === anomaliaId);

            this.anomaliaSelect = anomalia;
            this.selectionMethod = 'map';

            // aplicamos estilos
            this.setExternalStyle(anomaliaId, true, this.anomaliaSelect.featureType);

            if (this.prevAnomaliaSelect !== undefined && this.prevAnomaliaSelect.id !== anomaliaId) {
              this.setExternalStyle(this.prevAnomaliaSelect.id, false, this.prevAnomaliaSelect.featureType);
            }

            this.prevAnomaliaSelect = anomalia;
          }
        }
      });
    }

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
          this.setExternalStyle(this.anomaliaSelect.id, false, this.anomaliaSelect.featureType);

          this.anomaliaSelect = undefined;
          this.selectionMethod = undefined;
        }
      }
    });
  }

  private addMoveEndEvent() {
    this.map.on('moveend', (event) => {
      // marcamos el movimiento del mapa como terminado
      this.olMapService.mapMoving = false;

      // añadimos las acciones por cambio de zoom
      this.olMapService.currentZoom = this.map.getView().getZoom();
      this.olMapService.refreshLayersView(this.selectedInformeId, this.toggleViewSelected);
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
      source: this.anomaliaLayers[0].getSource() as VectorSource<any>,
      type: GeometryType.CIRCLE,
      geometryFunction: createBox(),
    });

    this.map.addInteraction(draw);
    draw.on('drawend', (event) => {
      this.addAnomaliaToDb(event.feature, plantaId);
    });
  }

  private addAnomaliaToDb(feature: Feature<any>, plantaId: string) {
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

  private getStyleAnomalias(focus: boolean, featureType?: string, selection?: string) {
    selection = selection ? selection : this.toggleViewSelected;
    return (feature) => {
      const colorsView = {
        mae: this.getColorMae(feature, 1),
        cc: this.getColorCelsCalientes(feature, 1),
        grad: this.getColorGradienteNormMax(feature, 1),
        tipo: this.getColorTipo(feature),
      };
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        featureType = feature.getProperties().properties.featureType;
        let color = colorsView[this.toggleViewSelected];
        switch (featureType){
          case 'Point':
            return this.getStylePoint(focus, color);
            break;
          case 'Polygon':
            return this.getStylePolygon(focus, color);
            break;
        }
      }
    };
  }

  private getStylePoint(focused: boolean, color: string) {
    return new Style({
      image: new Icon({
        src: "assets/icons/location-pin-hovered.png",
        anchor: [0.5, 0.5],
        scale: 0.8,
        color: focused ? 'white' : color,
      }),
    });
  }

  private getStylePolygon(focused: boolean, color: string) {
    return new Style({
      stroke: new Stroke({
        color: focused ? 'white' : color,
        width: 4,
      }),
      fill: new Fill({
        color: 'rgba(255,255,255, 0)',
      }),
    });
  }

  // ESTILOS PERDIDAS
  private getColorMae(feature: Feature<any>, opacity: number): string {
    const perdidas = feature.getProperties().properties.perdidas as number;

    return Colors.getColor(perdidas, [0.3, 0.5], opacity);
  }

  // ESTILOS CELS CALIENTES
  private getColorCelsCalientes(feature: Feature<any>, opacity: number): string {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    return Colors.getColor(gradNormMax, [10, 40], opacity);
  }

  // ESTILOS GRADIENTE NORMALIZADO MAX
  private getColorGradienteNormMax(feature: Feature<any>, opacity: number) {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    return Colors.getColor(gradNormMax, [10, 40], opacity);
  }

  // ESTILO POR TIPOS
  private getColorTipo(feature: Feature<any>) {
    if (feature !== undefined) {
      const tipo = Number(feature.getProperties().properties.tipo);

      return COLOR.colores_tipos[tipo];
    }
  }

  setExternalStyle(anomaliaId: string, focused: boolean, featureType: string) {
    const layersInforme = this.anomaliaLayers.filter(
      (layer) => layer.getProperties().informeId === this.selectedInformeId
    );

    const layersView = layersInforme.filter((layer) => layer.getProperties().view === this.toggleViewSelected);

    const features: Feature<any>[] = [];
    layersView.forEach((layer) => features.push(...(layer.getSource() as VectorSource<any>).getFeatures()));
    const feature = features.find((f) => f.getProperties().properties.anomaliaId === anomaliaId);
    if (focused) {
      feature.setStyle(this.getStyleAnomalias(true, featureType));
    } else {
      feature.setStyle(this.getStyleAnomalias(false, featureType));
    }
  }

  resetService() {
    this.selectedInformeId = undefined;
    this.anomaliaSelect = undefined;
    this.anomaliaHover = undefined;
    this.prevFeatureHover = undefined;
    this.prevAnomaliaSelect = undefined;
    this.selectionMethod = undefined;
    this.listaAnomalias = [];
    this.anomaliaLayers = [];
    this.sharedReportNoFilters = false;
    this.toggleViewSelected = undefined;
    this.coordsPointer = undefined;
    this.urlVisualImageAnomalia = undefined;
    this.urlThermalImageAnomalia = undefined;
    this.thermalImageExist = true;
    this.visualImageExist = true;

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

  get selectionMethod() {
    return this._selectionMethod;
  }

  set selectionMethod(value: string) {
    this._selectionMethod = value;
    this.selectionMethod$.next(value);
  }

  get anomaliaHover() {
    return this._anomaliaHover;
  }

  set anomaliaHover(value: Anomalia) {
    this._anomaliaHover = value;
    this.anomaliaHover$.next(value);
  }

  get urlVisualImageAnomalia() {
    return this._urlVisualImageAnomalia;
  }

  set urlVisualImageAnomalia(value: string) {
    this._urlVisualImageAnomalia = value;
    this.urlVisualImageAnomalia$.next(value);
  }

  get urlThermalImageAnomalia() {
    return this._urlThermalImageAnomalia;
  }

  set urlThermalImageAnomalia(value: string) {
    this._urlThermalImageAnomalia = value;
    this.urlThermalImageAnomalia$.next(value);
  }

  get thermalImageExist() {
    return this._thermalImageExist;
  }

  set thermalImageExist(value: boolean) {
    this._thermalImageExist = value;
    this.thermalImageExist$.next(value);
  }

  get visualImageExist() {
    return this._visualImageExist;
  }

  set visualImageExist(value: boolean) {
    this._visualImageExist = value;
    this.visualImageExist$.next(value);
  }
}
