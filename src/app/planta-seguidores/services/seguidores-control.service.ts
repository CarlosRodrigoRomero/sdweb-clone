import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

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

import { Seguidor } from '@core/models/seguidor';

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
  private _urlImageVisualSeguidor: string = undefined;
  urlImageVisualSeguidor$ = new BehaviorSubject<string>(this._urlImageVisualSeguidor);

  constructor(
    private olMapService: OlMapService,
    private reportControlService: ReportControlService,
    private filterService: FilterService,
    private mapSeguidoresService: MapSeguidoresService,
    private storage: AngularFireStorage
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

    this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));
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
      // condition: click,
      layers: (l) => {
        if (
          l.getProperties().informeId === this.selectedInformeId &&
          // tslint:disable-next-line: triple-equals
          l.getProperties().layer == this.toggleViewSelected[0]
        ) {
          return true;
        }
        return false;
      },
    });

    this.map.addInteraction(select);
    select.on('select', (e) => {
      this.seguidorSelected = undefined;

      if (e.selected.length > 0) {
        if (e.selected[0].getProperties().hasOwnProperty('properties')) {
          const seguidorId = e.selected[0].getProperties().properties.seguidorId;

          const seguidor = this.listaSeguidores.filter((seg) => {
            return seg.id === seguidorId;
          })[0];

          if (this.selectedInformeId === seguidor.informeId) {
            this.seguidorSelected = seguidor;

            this.seguidorViewOpened = true;
          }
        }
      }
    });
  }

  private getStyleSeguidor(focused: boolean) {
    return (feature) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        // array de colores para las 3 diferentes vistas
        const toggleViewColors = [
          this.getColorSeguidorMae(feature),
          this.getColorSeguidorCelsCalientes(feature),
          this.getColorSeguidorGradienteNormMax(feature),
        ];

        switch (this.toggleViewSelected) {
          case 0:
            return new Style({
              stroke: new Stroke({
                color: focused ? 'white' : toggleViewColors[0],
                width: 4,
              }),
              fill: new Fill({
                color: focused ? 'rgba(255,255,255,0.5)' : this.hexToRgb(toggleViewColors[0], 0.5),
              }),
            });
          case 1:
            return new Style({
              stroke: new Stroke({
                color: focused ? 'white' : toggleViewColors[1],
                width: 4,
              }),
              fill: new Fill({
                color: focused ? 'rgba(255,255,255,0.5)' : this.hexToRgb(toggleViewColors[1], 0.5),
              }),
            });
          case 2:
            return new Style({
              stroke: new Stroke({
                color: focused ? 'white' : toggleViewColors[2],
                width: 4,
              }),
              fill: new Fill({
                color: focused ? 'rgba(255,255,255,0.5)' : this.hexToRgb(toggleViewColors[2], 0.5),
              }),
            });
        }

        return new Style({
          stroke: new Stroke({
            color: focused ? 'white' : toggleViewColors[this.toggleViewSelected],
            width: 4,
          }),
          fill: new Fill({
            color: focused ? 'rgba(255,255,255,0.5)' : this.hexToRgb(toggleViewColors[this.toggleViewSelected], 0.5),
          }),
        });
      }
    };
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

    if (mae <= 0.01) {
      return GLOBAL.colores_mae[0];
    } else if (mae <= 0.02) {
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

  private latLonLiteralToLonLat(path: LatLngLiteral[]) {
    const coordsList: Coordinate[] = [];
    path.forEach((coords) => {
      coordsList.push(fromLonLat([coords.lng, coords.lat]));
    });

    return [coordsList];
  }

  getImageSeguidor(folder: string) {
    if (this.seguidorSelected !== undefined) {
      // const imageName = this.seguidorSelected.anomalias[0].archivo;
      const imageName = 'informes_qfqeerbHSTROqL8O2TVk_jpg_200803_Arguedas_1.1.jpg'; // DEMO

      // Creamos una referencia a la imagen
      const storageRef = this.storage.ref('');
      const imageRef = storageRef.child('informes/' + this.selectedInformeId + '/' + folder + '/' + imageName);

      // Obtenemos la URL y descargamos el archivo capturando los posibles errores
      imageRef
        .getDownloadURL()
        .toPromise()
        .then((url) => {
          console.log(url);
          this.urlImageVisualSeguidor = url;
        })
        .catch((error) => {
          switch (error.code) {
            case 'storage/object-not-found':
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

  get urlImageVisualSeguidor() {
    return this._urlImageVisualSeguidor;
  }

  set urlImageVisualSeguidor(value: string) {
    this._urlImageVisualSeguidor = value;
    this.urlImageVisualSeguidor$.next(value);
  }
}
