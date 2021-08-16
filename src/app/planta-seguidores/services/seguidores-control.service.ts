import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

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

import { OlMapService } from '@core/services/ol-map.service';
import { ReportControlService } from '@core/services/report-control.service';
import { FilterService } from '@core/services/filter.service';
import { GLOBAL } from '@core/services/global';
import { MapSeguidoresService } from './map-seguidores.service';
import { InformeService } from '@core/services/informe.service';

import { Seguidor } from '@core/models/seguidor';
import { InformeInterface } from '@core/models/informe';
import { Overlay } from 'ol';

@Injectable({
  providedIn: 'root',
})
export class SeguidoresControlService {
  public map: Map;
  public selectedInformeId: string;
  private selectedInforme: InformeInterface;
  private imgSeguidoresUrls: string[] = [];
  private _seguidorHovered: Seguidor = undefined;
  public seguidorHovered$ = new BehaviorSubject<Seguidor>(this._seguidorHovered);
  private _seguidorSelected: Seguidor = undefined;
  public seguidorSelected$ = new BehaviorSubject<Seguidor>(this._seguidorSelected);
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);
  public listaSeguidores: Seguidor[];
  public prevSeguidorSelected: Seguidor;
  private sharedReportNoFilters = false;
  private seguidorLayers: VectorLayer[];
  private prevFeatureHover: Feature;
  private toggleViewSelected: number = undefined;
  private _seguidorViewOpened = false;
  public seguidorViewOpened$ = new BehaviorSubject<boolean>(this._seguidorViewOpened);
  private _urlVisualImageSeguidor: string = undefined;
  public urlVisualImageSeguidor$ = new BehaviorSubject<string>(this._urlVisualImageSeguidor);
  private _urlThermalImageSeguidor: string = undefined;
  public urlThermalImageSeguidor$ = new BehaviorSubject<string>(this._urlThermalImageSeguidor);
  private _imageExist = true;
  imageExist$ = new BehaviorSubject<boolean>(this._imageExist);

  private maeMin: number;
  private maeMax: number;
  public maeLevels: number[] = [];
  private ccMin: number;
  private ccMax: number;
  public ccLevels: number[] = [];
  private gradMin: number;
  private gradMax: number;
  public gradLevels: number[] = [];

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private mapSeguidoresService: MapSeguidoresService,
    private storage: AngularFireStorage,
    private informeService: InformeService
  ) {}

  initService(): Observable<boolean> {
    const getMap = this.olMapService.getMap();
    const getSegLayers = this.olMapService.getSeguidorLayers();
    const getIfSharedWithFilters = this.reportControlService.sharedReportWithFilters$;

    combineLatest([getMap, getSegLayers, getIfSharedWithFilters])
      .pipe(take(1))
      .subscribe(([map, segL, isSharedWithFil]) => {
        this.map = map;
        this.seguidorLayers = segL;
        this.sharedReportNoFilters = !isSharedWithFil;

        this.initialized$.next(true);
      });

    this.reportControlService.selectedInformeId$
      .pipe(
        switchMap((informeId) => {
          this.selectedInformeId = informeId;

          // recalculamos los MIN y MAX de cada vista
          this.getMinMaxViews();

          // obtenemos los niveles para la escala de colores
          this.getViewsLevels();

          return this.informeService.getInforme(informeId);
        })
      )
      .subscribe((informe) => (this.selectedInforme = informe));

    this.mapSeguidoresService.toggleViewSelected$.subscribe((viewSel) => (this.toggleViewSelected = viewSel));

    return this.initialized$;
  }

  public createSeguidorLayers(informeId: string): VectorLayer[] {
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

  public mostrarSeguidores() {
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
      const filtered = seguidores.filter((seguidor) => seguidor.informeId === l.getProperties().informeId);
      const source = l.getSource();
      source.clear();
      filtered.forEach((seguidor) => {
        // crea poligono seguidor
        const feature = new Feature({
          geometry: new Polygon(this.latLonLiteralToLonLat(seguidor.path)),
          properties: {
            layer: l.getProperties().id,
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
    // añadimos acciones sobre los seguidores
    this.addCursorOnHover();
    this.addOnHoverAction();

    this.addSelectInteraction();
    // this.addClickOutFeatures();
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
          .filter((item) => item.getProperties().properties.layer == this.toggleViewSelected)[0] as Feature;

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
    const estilosView = [
      this.getStyleSeguidoresMae(false),
      this.getStyleSeguidoresCelsCalientes(false),
      this.getStyleSeguidoresGradienteNormMax(false),
    ];

    const select = new Select({
      style: estilosView[this.toggleViewSelected],
      // condition: click,
      layers: (l) => {
        if (
          l.getProperties().informeId === this.selectedInformeId &&
          // tslint:disable-next-line: triple-equals
          l.getProperties().id == this.toggleViewSelected
        ) {
          return true;
        }
        return false;
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

  private addClickOutFeatures() {
    this.map.on('click', (event) => {
      const feature = this.map
        .getFeaturesAtPixel(event.pixel)
        .filter((item) => item.getProperties().properties !== undefined)
        .filter((item) => item.getProperties().properties.informeId === this.selectedInformeId);
      if (feature.length === 0) {
        if (this.seguidorSelected !== undefined) {
          this.setExternalStyle(this.seguidorSelected.id, false);
        }
        this.seguidorSelected = undefined;
      }
    });
  }

  setPopupPosition(coords: Coordinate) {
    this.map.getOverlayById('popup').setPosition(coords);
  }

  private getMinMaxViews() {
    this.getMinMaxMae();
    this.getMinMaxCC();
    this.getMinMaxGradNormMax();
  }

  private getViewsLevels() {
    if (this.maeMax !== undefined) {
      this.getMaeLevels();
    }

    this.getCCLevels();
    this.getGradNormLevels();
  }

  private getMinMaxMae() {
    const maes = this.reportControlService.allFilterableElements
      .filter((seg) => (seg as Seguidor).informeId === this.selectedInformeId)
      .map((seg) => (seg as Seguidor).mae);

    this.maeMin = Math.min(...maes);
    this.maeMax = Math.max(...maes);
  }

  private getMaeLevels() {
    const numLevels = 3;

    for (let index = 0; index < numLevels - 1; index++) {
      this.maeLevels[index] = Number((((index + 1) * this.maeMax) / numLevels).toFixed(2));
    }
  }

  private getMinMaxCC() {
    const allCelsCalientes = this.reportControlService.allFilterableElements
      .filter((seg) => (seg as Seguidor).informeId === this.selectedInformeId)
      .map((seg) => (seg as Seguidor).celsCalientes)
      .filter((cc) => !isNaN(cc) && cc !== Infinity && cc !== -Infinity);

    this.ccMin = Math.min(...allCelsCalientes);
    this.ccMax = Math.max(...allCelsCalientes);
  }

  private getCCLevels() {
    const numLevels = 3;

    for (let index = 0; index < numLevels - 1; index++) {
      this.ccLevels[index] = Number((((index + 1) * this.ccMax) / numLevels).toFixed(2));
    }
  }

  private getMinMaxGradNormMax() {
    const gradientes = this.reportControlService.allFilterableElements
      .filter((seg) => (seg as Seguidor).informeId === this.selectedInformeId)
      .map((seg) => (seg as Seguidor).gradienteNormalizado)
      .filter((grad) => !isNaN(grad) && grad !== Infinity && grad !== -Infinity);

    this.gradMin = Math.min(...gradientes);
    this.gradMax = Math.max(...gradientes);
  }

  private getGradNormLevels() {
    const numLevels = 3;

    for (let index = 0; index < numLevels - 1; index++) {
      this.gradLevels[index] = Number((((index + 1) * this.gradMax) / numLevels).toFixed(2));
    }
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
            color: focused ? 'rgba(255,255,255,0.5)' : this.hexToRgb(this.getColorSeguidorMae(feature), 0.5),
          }),
        });
      }
    };
  }

  private getColorSeguidorMae(feature: Feature) {
    const mae = feature.getProperties().properties.mae as number;

    if (mae <= (this.maeMax - this.maeMin) / 3) {
      return GLOBAL.colores_mae[0];
    } else if (mae <= (2 * (this.maeMax - this.maeMin)) / 3) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  getColorSeguidorMaeExternal(mae: number) {
    if (mae <= (this.maeMax - this.maeMin) / 3) {
      return GLOBAL.colores_mae[0];
    } else if (mae <= (2 * (this.maeMax - this.maeMin)) / 3) {
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
            color: focused ? 'rgba(255,255,255,0.5)' : this.hexToRgb(this.getColorSeguidorCelsCalientes(feature), 0.5),
          }),
        });
      }
    };
  }

  private getColorSeguidorCelsCalientes(feature: Feature) {
    const numModulos = feature.getProperties().properties.filas * feature.getProperties().properties.columnas;
    const celsCalientes = feature
      .getProperties()
      // tslint:disable-next-line: triple-equals
      .properties.anomalias.filter((anomalia) => anomalia.tipo == 8 || anomalia.tipo == 9).length;
    const porcentCelsCalientes = celsCalientes / numModulos;

    if (porcentCelsCalientes <= (this.ccMax - this.ccMin) / 3) {
      return GLOBAL.colores_mae[0];
    } else if (porcentCelsCalientes <= (2 * (this.ccMax - this.ccMin)) / 3) {
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
            color: focused
              ? 'rgba(255,255,255,0.5)'
              : this.hexToRgb(this.getColorSeguidorGradienteNormMax(feature), 0.5),
          }),
        });
      }
    };
  }

  private getColorSeguidorGradienteNormMax(feature: Feature) {
    const gradNormMax = feature.getProperties().properties.gradienteNormalizado as number;

    if (gradNormMax <= (this.gradMax - this.gradMin) / 3) {
      return GLOBAL.colores_mae[0];
    } else if (gradNormMax <= (2 * (this.gradMax - this.gradMin)) / 3) {
      return GLOBAL.colores_mae[1];
    } else {
      return GLOBAL.colores_mae[2];
    }
  }

  getColorSeguidorGradienteNormMaxExternal(gradNormMax: number) {
    if (gradNormMax <= (this.gradMax - this.gradMin) / 3) {
      return GLOBAL.colores_mae[0];
    } else if (gradNormMax <= (2 * (this.gradMax - this.gradMin)) / 3) {
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

  private latLonLiteralToLonLat(path: LatLngLiteral[]) {
    const coordsList: Coordinate[] = [];
    path.forEach((coords) => {
      coordsList.push(fromLonLat([coords.lng, coords.lat]));
    });

    return [coordsList];
  }

  public getImageSeguidor(folder: string) {
    if (this.seguidorSelected !== undefined && this.seguidorSelected !== null) {
      // const imageName = this.seguidorSelected.anomalias[0].archivoPublico;
      const imageName = this.seguidorSelected.imageName;

      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');
      const imageRef = storageRef.child('informes/' + this.selectedInformeId + '/' + folder + '/' + imageName);

      // Obtenemos la URL y descargamos el archivo capturando los posibles errores
      imageRef
        .getDownloadURL()
        .toPromise()
        .then((url) => {
          // indicamos  que la imagen existe
          this.imageExist = true;

          if (folder === 'jpg') {
            this.urlThermalImageSeguidor = url;
          } else {
            this.urlVisualImageSeguidor = url;
          }
        })
        .catch((error) => {
          switch (error.code) {
            case 'storage/object-not-found':
              // indicamos  que la imagen no existe
              this.imageExist = false;
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

  changeInformeSeguidorSelected() {
    let seguidor;
    if (this.seguidorSelected === null) {
      seguidor = this.listaSeguidores.find((seg) => {
        // cambiamos al seguidor correspondiente al informe actual
        return seg.informeId === this.selectedInformeId && seg.nombre === this.prevSeguidorSelected.nombre;
      });
    } else {
      seguidor = this.listaSeguidores.find((seg) => {
        // cambiamos al seguidor correspondiente al informe actual
        return seg.informeId === this.selectedInformeId && seg.nombre === this.seguidorSelected.nombre;
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

    // indicamos que la imagen existe por defecto
    this.imageExist = true;
  }

  selectNextSeguidor() {
    // nos movemos solo entre los seguidores del informe seleccionado
    const seguidoresInformeActual = this.listaSeguidores.filter(
      (seg) => seg.informeId === this.reportControlService.selectedInformeId
    );
    const index = seguidoresInformeActual.indexOf(this.seguidorSelected);
    if (index !== this.listaSeguidores.length - 1) {
      this.seguidorSelected = this.listaSeguidores[index + 1];

      // indicamos que la imagen existe por defecto
      this.imageExist = true;
    }
  }

  selectPrevSeguidor() {
    // nos movemos solo entre los seguidores del informe seleccionado
    const seguidoresInformeActual = this.listaSeguidores.filter(
      (seg) => seg.informeId === this.reportControlService.selectedInformeId
    );
    const index = seguidoresInformeActual.indexOf(this.seguidorSelected);
    if (index !== 0) {
      this.seguidorSelected = this.listaSeguidores[index - 1];

      // indicamos que la imagen existe por defecto
      this.imageExist = true;
    }
  }

  setExternalStyle(seguidorId: string, focus: boolean) {
    this.listaSeguidores.find((seg) => seg.id === seguidorId);

    const features = this.seguidorLayers
      .find((layer) => layer.getProperties().informeId === this.selectedInformeId)
      .getSource()
      .getFeatures();

    const feature = features.find((f) => f.getProperties().properties.seguidorId === seguidorId);

    const focusedStyle = new Style({
      stroke: new Stroke({
        color: 'white',
        width: 6,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0)',
      }),
    });

    let unfocusedStyle;
    if (this.toggleViewSelected === 0) {
      unfocusedStyle = new Style({
        stroke: new Stroke({
          color: this.getColorSeguidorMae(feature),
          width: 4,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0)',
        }),
      });
    } else if (this.toggleViewSelected === 1) {
      unfocusedStyle = new Style({
        stroke: new Stroke({
          color: this.getColorSeguidorCelsCalientes(feature),
          width: 4,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0)',
        }),
      });
    } else {
      unfocusedStyle = new Style({
        stroke: new Stroke({
          color: this.getColorSeguidorGradienteNormMax(feature),
          width: 4,
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 255, 0)',
        }),
      });
    }

    if (focus) {
      feature.setStyle(focusedStyle);
    } else {
      feature.setStyle(unfocusedStyle);
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

  get imageExist() {
    return this._imageExist;
  }

  set imageExist(value: boolean) {
    this._imageExist = value;
    this.imageExist$.next(value);
  }
}
