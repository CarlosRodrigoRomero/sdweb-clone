import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest } from 'rxjs';

import { AngularFireStorage } from '@angular/fire/storage';

import { LatLngLiteral } from '@agm/core';

import Map from 'ol/Map';
import Polygon from 'ol/geom/Polygon';
import VectorLayer from 'ol/layer/Vector';
import Feature from 'ol/Feature';
import { Coordinate } from 'ol/coordinate';
import { fromLonLat } from 'ol/proj';
import { Fill, Stroke, Style } from 'ol/style';
import { Select } from 'ol/interaction';
import VectorSource from 'ol/source/Vector';

import { OlMapService } from '@data/services/ol-map.service';
import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';
import { ZonesControlService } from '@data/services/zones-control.service';
import { ViewReportService } from '@data/services/view-report.service';

import { Seguidor } from '@core/models/seguidor';
import { MathOperations } from '@core/classes/math-operations';
import { LocationAreaInterface } from '@core/models/location';

import { GLOBAL } from '@data/constants/global';

@Injectable({
  providedIn: 'root',
})
export class SeguidoresControlService {
  public map: Map;
  public selectedInformeId: string;
  private _seguidorHovered: Seguidor = undefined;
  public seguidorHovered$ = new BehaviorSubject<Seguidor>(this._seguidorHovered);
  private _seguidorSelected: Seguidor = undefined;
  public seguidorSelected$ = new BehaviorSubject<Seguidor>(this._seguidorSelected);
  public listaSeguidores: Seguidor[];
  private listaAllSeguidores: Seguidor[];
  public prevSeguidorSelected: Seguidor;
  private sharedReportNoFilters = false;
  private seguidorLayers: VectorLayer[];
  private prevSeguidorLayer: VectorLayer;
  private zonasLayers: VectorLayer[];
  private prevFeatureHover: Feature;
  private toggleViewSelected: number;
  private _seguidorViewOpened = false;
  public seguidorViewOpened$ = new BehaviorSubject<boolean>(this._seguidorViewOpened);
  private _urlVisualImageSeguidor: string = undefined;
  public urlVisualImageSeguidor$ = new BehaviorSubject<string>(this._urlVisualImageSeguidor);
  private _urlThermalImageSeguidor: string = undefined;
  public urlThermalImageSeguidor$ = new BehaviorSubject<string>(this._urlThermalImageSeguidor);
  private _thermalImageExist = true;
  thermalImageExist$ = new BehaviorSubject<boolean>(this._thermalImageExist);
  private _visualImageExist = true;
  visualImageExist$ = new BehaviorSubject<boolean>(this._visualImageExist);

  private maesMedio: number[] = [];
  private maesSigma: number[] = [];
  private ccsMedio: number[] = [];
  private ccsSigma: number[] = [];

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private storage: AngularFireStorage,
    private zonesControlService: ZonesControlService,
    private viewReportService: ViewReportService
  ) {}

  initService(): Promise<boolean> {
    this.listaAllSeguidores = this.reportControlService.allFilterableElements as Seguidor[];

    const getMap = this.olMapService.getMap();
    const getSegLayers = this.olMapService.getSeguidorLayers();
    const getIfSharedWithFilters = this.reportControlService.sharedReportWithFilters$;
    const getZonasLayers = this.olMapService.zonasLayers$;

    return new Promise((initService) => {
      combineLatest([getMap, getSegLayers, getIfSharedWithFilters, getZonasLayers])
        // .pipe(take(1))
        .subscribe(([map, segL, isSharedWithFil, zonasL]) => {
          this.map = map;
          this.seguidorLayers = segL;
          this.sharedReportNoFilters = !isSharedWithFil;
          this.zonasLayers = zonasL;
        });

      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));

      this.getMaesMedioSigma();
      this.getCCsMedioSigma();

      this.viewReportService.toggleViewSelected$.subscribe((viewSel) => {
        this.toggleViewSelected = viewSel;

        // reseteamos la interaccion con cada vista para obtener el estilo correcto
        this.resetSelectInteraction();
      });

      initService(true);
    });
  }

  createSeguidorLayers(informeId: string, zones?: LocationAreaInterface[]): VectorLayer[] {
    let seguidoresLayers: VectorLayer[] = [];
    if (zones !== undefined) {
      zones.forEach((zone) => {
        const zoneId = this.zonesControlService.getGlobalsLabel(zone.globalCoords);
        const maeLayer = new VectorLayer({
          source: new VectorSource({ wrapX: false }),
          style: this.getStyleSeguidoresMae(false),
          visible: false,
        });
        maeLayer.setProperties({
          informeId,
          view: 0,
          type: 'seguidores',
          zoneId,
          zone,
        });
        seguidoresLayers.push(maeLayer);
        const celsCalientesLayer = new VectorLayer({
          source: new VectorSource({ wrapX: false }),
          style: this.getStyleSeguidoresCelsCalientes(false),
          visible: false,
        });
        celsCalientesLayer.setProperties({
          informeId,
          view: 1,
          type: 'seguidores',
          zoneId,
          zone,
        });
        seguidoresLayers.push(celsCalientesLayer);
        const gradNormMaxLayer = new VectorLayer({
          source: new VectorSource({ wrapX: false }),
          style: this.getStyleSeguidoresGradienteNormMax(false),
          visible: false,
        });
        gradNormMaxLayer.setProperties({
          informeId,
          view: 2,
          type: 'seguidores',
          zoneId,
          zone,
        });
        seguidoresLayers.push(gradNormMaxLayer);
      });
    } else {
      const maeLayer = new VectorLayer({
        source: new VectorSource({ wrapX: false }),
        style: this.getStyleSeguidoresMae(false),
        visible: true,
      });
      maeLayer.setProperties({
        informeId,
        view: 0,
        type: 'seguidores',
      });
      seguidoresLayers.push(maeLayer);
      const celsCalientesLayer = new VectorLayer({
        source: new VectorSource({ wrapX: false }),
        style: this.getStyleSeguidoresCelsCalientes(false),
        visible: true,
      });
      celsCalientesLayer.setProperties({
        informeId,
        view: 1,
        type: 'seguidores',
      });
      seguidoresLayers.push(celsCalientesLayer);
      const gradNormMaxLayer = new VectorLayer({
        source: new VectorSource({ wrapX: false }),
        style: this.getStyleSeguidoresGradienteNormMax(false),
        visible: true,
      });
      gradNormMaxLayer.setProperties({
        informeId,
        view: 2,
        type: 'seguidores',
      });

      seguidoresLayers = [maeLayer, celsCalientesLayer, gradNormMaxLayer];
    }

    return seguidoresLayers;
  }

  mostrarSeguidores() {
    this.filterService.filteredElements$.subscribe((seguidores) => {
      if (this.sharedReportNoFilters) {
        // Dibujamos seguidores solo del informe seleccionado
        const segsFiltered = seguidores.filter((seg) => (seg as Seguidor).informeId === this.selectedInformeId);
        this.dibujarSeguidores(segsFiltered as Seguidor[]);
        this.listaSeguidores = seguidores as Seguidor[];
      } else {
        // Dibujar seguidores
        this.dibujarSeguidores(seguidores as Seguidor[]);
        this.listaSeguidores = seguidores as Seguidor[];

        // reiniciamos los seguidores seleccionados cada vez que se aplica un filtro
        this.prevSeguidorSelected = undefined;
        this.seguidorSelected = undefined;
      }
    });
  }

  private dibujarSeguidores(seguidores: Seguidor[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.seguidorLayers.forEach((l) => {
      // filtra los seguidores correspondientes al informe
      const seguidoresInforme = seguidores.filter((seguidor) => seguidor.informeId === l.getProperties().informeId);
      let seguidoresLayer = seguidoresInforme;
      // si hay zonas divimos los seguidores tb por zonas
      if (this.reportControlService.thereAreZones) {
        seguidoresLayer = this.zonesControlService.getElemsZona(
          l.getProperties().zone,
          seguidoresInforme
        ) as Seguidor[];
      }

      const source = l.getSource();
      source.clear();
      seguidoresLayer.forEach((seguidor) => {
        // crea poligono seguidor
        const feature = new Feature({
          geometry: new Polygon(this.latLonLiteralToLonLat(seguidor.path)),
          properties: {
            view: l.getProperties().view,
            seguidorId: seguidor.id,
            informeId: seguidor.informeId,
            mae: seguidor.mae,
            gradienteNormalizado: seguidor.gradienteNormalizado,
            celsCalientes: seguidor.celsCalientes,
            anomalias: seguidor.anomalias,
            filas: seguidor.filas,
            columnas: seguidor.columnas,
          },
        });

        if (this.reportControlService.thereAreZones) {
          const properties = feature.getProperties().properties;
          properties.zone = l.getProperties().zone;
          feature.setProperties({
            properties,
          });
        }

        source.addFeature(feature);
      });
    });
    // añadimos acciones sobre los seguidores
    this.addCursorOnHover();
    this.addOnHoverAction();
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

  private addOnHoverAction() {
    let currentFeatureHover;
    const estilosViewFocused = [
      this.getStyleSeguidoresMae(true),
      this.getStyleSeguidoresCelsCalientes(true),
      this.getStyleSeguidoresGradienteNormMax(true),
    ];
    const estilosViewUnfocused = [
      this.getStyleSeguidoresMae(false),
      this.getStyleSeguidoresCelsCalientes(false),
      this.getStyleSeguidoresGradienteNormMax(false),
    ];

    this.map.on('pointermove', (event) => {
      if (this.map.hasFeatureAtPixel(event.pixel)) {
        const feature = this.map
          .getFeaturesAtPixel(event.pixel)
          .filter((item) => item.getProperties().properties !== undefined)
          .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId)
          // tslint:disable-next-line: triple-equals
          .filter((item) => item.getProperties().properties.view == this.toggleViewSelected)[0] as Feature;

        if (feature !== undefined) {
          // cuando pasamos de un seguidor a otro directamente sin pasar por vacio
          if (this.prevFeatureHover !== undefined) {
            this.prevFeatureHover.setStyle(estilosViewUnfocused[this.toggleViewSelected]);
          }
          currentFeatureHover = feature;

          const seguidorId = feature.getProperties().properties.seguidorId;
          const seguidor = this.listaSeguidores.filter((seg) => seg.id === seguidorId)[0];

          const coords = seguidor.featureCoords[0];

          this.setPopupPosition(coords);

          feature.setStyle(estilosViewFocused[this.toggleViewSelected]);

          if (this.selectedInformeId === seguidor.informeId) {
            this.seguidorHovered = seguidor;
          }
          this.prevFeatureHover = feature;
        }
      } else {
        this.seguidorHovered = undefined;

        if (currentFeatureHover !== undefined) {
          currentFeatureHover.setStyle(estilosViewUnfocused[this.toggleViewSelected]);
          currentFeatureHover = undefined;
        }
      }
    });
  }

  private addSelectInteraction() {
    const select = new Select({
      style: this.getStyleSeguidores(),
      // condition: click,
      layers: (l) => {
        if (
          l.getProperties().informeId === this.selectedInformeId &&
          // tslint:disable-next-line: triple-equals
          l.getProperties().view == this.toggleViewSelected &&
          l.getProperties().hasOwnProperty('type') &&
          l.getProperties().type === 'seguidores'
        ) {
          return true;
        } else {
          return false;
        }
      },
    });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const seguidorId = e.selected[0].getProperties().properties.seguidorId;

          const seguidor = this.listaSeguidores.filter((seg) => seg.id === seguidorId)[0];

          if (this.selectedInformeId === seguidor.informeId) {
            this.seguidorSelected = seguidor;

            this.seguidorViewOpened = true;
          }
        }
      }
    });
  }

  clearSelectFeature() {
    this.map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Select) {
        interaction.getFeatures().clear();
      }
    });
  }

  private resetSelectInteraction() {
    // eliminamos la anterior interacción para que la actual obtenga el estilo correcto
    this.map.getInteractions().forEach((interaction) => {
      if (interaction instanceof Select) {
        this.map.removeInteraction(interaction);
      }
    });

    // la añadimos de nuevo
    this.addSelectInteraction();
  }

  private getStyleSeguidores() {
    const estilosView = [
      this.getStyleSeguidoresMae(false),
      this.getStyleSeguidoresCelsCalientes(false),
      this.getStyleSeguidoresGradienteNormMax(false),
    ];

    return estilosView[this.toggleViewSelected];
  }

  setPopupPosition(coords: Coordinate) {
    this.map.getOverlayById('popup').setPosition(coords);
  }

  private getMaesMedioSigma() {
    // reseteamos su valor al calcularlos de nuevo
    this.maesMedio = [];
    this.maesSigma = [];

    this.reportControlService.informesIdList.forEach((informeId) => {
      const maes = this.reportControlService.allFilterableElements
        .filter((seg) => (seg as Seguidor).informeId === informeId)
        .map((seg) => (seg as Seguidor).mae);

      this.maesMedio.push(MathOperations.average(maes));
      this.maesSigma.push(MathOperations.standardDeviation(maes));
    });
  }

  private getCCsMedioSigma() {
    this.reportControlService.informesIdList.forEach((informeId) => {
      const celsCalientes = this.reportControlService.allFilterableElements
        .filter((seg) => (seg as Seguidor).informeId === informeId)
        .map((seg) => (seg as Seguidor).celsCalientes)
        .filter((cc) => !isNaN(cc) && cc !== Infinity && cc !== -Infinity);

      this.ccsMedio.push(MathOperations.average(celsCalientes));
      this.ccsSigma.push(MathOperations.standardDeviation(celsCalientes));
    });
  }

  private latLonLiteralToLonLat(path: LatLngLiteral[]) {
    const coordsList: Coordinate[] = [];
    path.forEach((coords) => {
      coordsList.push(fromLonLat([coords.lng, coords.lat]));
    });

    return [coordsList];
  }

  public getImageSeguidor(folder: string) {
    if (this.seguidorSelected !== undefined && this.seguidorSelected !== null) {
      // const imageName = this.seguidorSelected.imageName;
      let imageName = this.seguidorSelected.anomalias[0].archivoPublico;
      if (this.seguidorSelected.anomaliasCliente.length > 0) {
        imageName = this.seguidorSelected.anomaliasCliente[0].archivoPublico;
      }

      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');
      const imageRef = storageRef.child('informes/' + this.seguidorSelected.informeId + '/' + folder + '/' + imageName);

      // Obtenemos la URL y descargamos el archivo capturando los posibles errores
      imageRef
        .getDownloadURL()
        .toPromise()
        .then((url) => {
          if (folder === 'jpg') {
            // indicamos  que la imagen existe
            this.thermalImageExist = true;

            this.urlThermalImageSeguidor = url;
          } else {
            // indicamos  que la imagen existe
            this.visualImageExist = true;

            this.urlVisualImageSeguidor = url;
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

  changeInformeSeguidorSelected(informeId: string) {
    let seguidor;
    if (this.seguidorSelected === null) {
      seguidor = this.listaAllSeguidores.find((seg) => {
        // cambiamos al seguidor correspondiente al informe actual
        return seg.informeId === informeId && seg.nombre === this.prevSeguidorSelected.nombre;
      });
    } else {
      seguidor = this.listaAllSeguidores.find((seg) => {
        // cambiamos al seguidor correspondiente al informe actual
        return seg.informeId === informeId && seg.nombre === this.seguidorSelected.nombre;
      });
    }

    // asignamos el actual al previo
    this.prevSeguidorSelected = this.seguidorSelected;

    // asignamos el nuevo si existe
    if (seguidor !== undefined) {
      this.seguidorSelected = seguidor;
    } else {
      this.seguidorSelected = null;
    }

    // indicamos que las imagenes existen por defecto
    this.thermalImageExist = true;
    this.visualImageExist = true;
  }

  // ESTILOS MAE
  private getStyleSeguidoresMae(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focused ? 'white' : this.getColorSeguidorMae(feature),
            width: focused ? 6 : 4,
          }),
          fill: new Fill({
            color: 'rgba(255,255,255, 0)',
          }),
        });
      }
    };
  }

  private getColorSeguidorMae(feature: Feature) {
    const mae = feature.getProperties().properties.mae as number;

    if (mae < 0.01) {
      return GLOBAL.colores_mae[0];
    } else if (mae < 0.05) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  getColorSeguidorMaeExternal(mae: number) {
    if (mae < 0.01) {
      return GLOBAL.colores_mae[0];
    } else if (mae < 0.05) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  // ESTILOS CELS CALIENTES
  private getStyleSeguidoresCelsCalientes(focused) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focused ? 'white' : this.getColorSeguidorCelsCalientes(feature),
            width: focused ? 6 : 4,
          }),
          fill: new Fill({
            color: 'rgba(255,255,255, 0)',
          }),
        });
      }
    };
  }

  private getColorSeguidorCelsCalientes(feature: Feature) {
    const celsCalientes = feature.getProperties().properties.celsCalientes;

    if (celsCalientes < 0.02) {
      return GLOBAL.colores_mae[0];
    } else if (celsCalientes < 0.1) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  // ESTILOS GRADIENTE NORMALIZADO MAX
  private getStyleSeguidoresGradienteNormMax(focused) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        return new Style({
          stroke: new Stroke({
            color: focused ? 'white' : this.getColorSeguidorGradienteNormMax(feature),
            width: focused ? 6 : 4,
          }),
          fill: new Fill({
            color: 'rgba(255,255,255, 0)',
          }),
        });
      }
    };
  }

  private getColorSeguidorGradienteNormMax(feature: Feature) {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    if (gradNormMax < 10) {
      return GLOBAL.colores_grad[0];
    } else if (gradNormMax < 40) {
      return GLOBAL.colores_grad[1];
    } else {
      return GLOBAL.colores_grad[2];
    }
  }

  getColorSeguidorGradienteNormMaxExternal(gradNormMax: number) {
    if (gradNormMax < 10) {
      return GLOBAL.colores_grad[0];
    } else if (gradNormMax < 40) {
      return GLOBAL.colores_grad[1];
    } else {
      return GLOBAL.colores_grad[2];
    }
  }

  setExternalStyle(seguidorId: string, focus: boolean) {
    const estilosViewFocused = [
      this.getStyleSeguidoresMae(true),
      this.getStyleSeguidoresCelsCalientes(true),
      this.getStyleSeguidoresGradienteNormMax(true),
    ];
    const estilosViewUnfocused = [
      this.getStyleSeguidoresMae(false),
      this.getStyleSeguidoresCelsCalientes(false),
      this.getStyleSeguidoresGradienteNormMax(false),
    ];

    const layersInforme = this.seguidorLayers.filter(
      (layer) => layer.getProperties().informeId === this.selectedInformeId
    );

    const layersView = layersInforme.filter((layer) => layer.getProperties().view === this.toggleViewSelected);

    const features: Feature[] = [];
    layersView.forEach((layer) => features.push(...layer.getSource().getFeatures()));

    const feature = features.find((f) => f.getProperties().properties.seguidorId === seguidorId);

    if (focus) {
      feature.setStyle(estilosViewFocused[this.toggleViewSelected]);
    } else {
      feature.setStyle(estilosViewUnfocused[this.toggleViewSelected]);
    }

    // mostramos u ocultamos las zona de los seguidores si la hubiera
    if (feature.getProperties().properties.hasOwnProperty('zone')) {
      const zoneSeguidor = feature.getProperties().properties.zone;
      const layerZoneSeguidor = layersView.find(
        (layer) => layer.getProperties().zoneId === this.zonesControlService.getGlobalsLabel(zoneSeguidor.globalCoords)
      );
      layerZoneSeguidor.setVisible(focus);

      this.prevSeguidorLayer = layerZoneSeguidor;
    }
  }

  get seguidorHovered() {
    return this._seguidorHovered;
  }

  set seguidorHovered(value: Seguidor) {
    this._seguidorHovered = value;
    this.seguidorHovered$.next(value);
  }

  get seguidorSelected() {
    return this._seguidorSelected;
  }

  set seguidorSelected(value: Seguidor) {
    this._seguidorSelected = value;
    this.seguidorSelected$.next(value);
  }

  get seguidorViewOpened() {
    return this._seguidorViewOpened;
  }

  set seguidorViewOpened(value: boolean) {
    this._seguidorViewOpened = value;
    this.seguidorViewOpened$.next(value);
  }

  get urlVisualImageSeguidor() {
    return this._urlVisualImageSeguidor;
  }

  set urlVisualImageSeguidor(value: string) {
    this._urlVisualImageSeguidor = value;
    this.urlVisualImageSeguidor$.next(value);
  }

  get urlThermalImageSeguidor() {
    return this._urlThermalImageSeguidor;
  }

  set urlThermalImageSeguidor(value: string) {
    this._urlThermalImageSeguidor = value;
    this.urlThermalImageSeguidor$.next(value);
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
