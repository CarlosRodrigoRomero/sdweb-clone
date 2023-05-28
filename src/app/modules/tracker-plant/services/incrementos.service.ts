import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Fill, Icon, Stroke, Style } from 'ol/style';
import { Feature } from 'ol';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';

import { OlMapService } from '@data/services/ol-map.service';
import { MapSeguidoresService } from './map-seguidores.service';
import { FilterService } from '@data/services/filter.service';

import { Seguidor } from '@core/models/seguidor';

@Injectable({
  providedIn: 'root',
})
export class IncrementosService {
  private incrementoLayers: VectorLayer<any>[];
  public informeIdList: string[] = [];
  private listaSeguidores: Seguidor[];
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);

  constructor(
    private olMapService: OlMapService,
    public mapSeguidoresService: MapSeguidoresService,
    public filterService: FilterService
  ) {}

  initService() {
    this.olMapService.getIncrementoLayers().subscribe((layers) => (this.incrementoLayers = layers));
  }

  createIncrementoLayers(informeId: string): VectorLayer<any>[] {
    const incMaeLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleIncrementos('mae'),
    });
    incMaeLayer.setProperties({
      informeId,
      id: 'inc_0',
    });
    const incCCLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleIncrementos('cc'),
    });
    incCCLayer.setProperties({
      informeId,
      id: 'inc_1',
    });
    const incGradNormMaxLayer = new VectorLayer({
      source: new VectorSource({ wrapX: false }),
      style: this.getStyleIncrementos('gradiente'),
    });
    incGradNormMaxLayer.setProperties({
      informeId,
      id: 'inc_2',
    });

    return [incMaeLayer, incCCLayer, incGradNormMaxLayer];
  }

  mostrarIncrementos() {
    this.filterService.filteredElements$.subscribe((seguidores) => {
      this.listaSeguidores = seguidores as Seguidor[];

      // Dibujar labels incremento
      this.dibujarIncrementos(seguidores as Seguidor[]);
    });
  }

  private dibujarIncrementos(seguidores: Seguidor[]) {
    // Para cada vector layer (que corresponde a un informe)
    this.incrementoLayers.forEach((l) => {
      // filtra los seguidores correspondientes al informe
      const filtered = seguidores.filter((seguidor) => seguidor.informeId === l.getProperties().informeId);
      const labelsSource = l.getSource();
      labelsSource.clear();
      filtered.forEach((seguidor) => {
        // crea label incremento
        const feature = new Feature({
          geometry: new Point(fromLonLat([seguidor.path[3].lng, seguidor.path[3].lat])),
          properties: {
            seguidorId: seguidor.id,
            informeId: seguidor.informeId,
            globalCoords: seguidor.globalCoords,
            incrementoMae: seguidor.incrementoMae,
          },
        });
        labelsSource.addFeature(feature);
      });
    });
  }

  // ESTILOS
  private getStyleIncrementos(view: string) {
    const badIconStyle = new Style({
      image: new Icon({
        crossOrigin: 'anonymous',
        src: 'assets/icons/caret-up-2.png',
      }),
    });
    const goodIconStyle = new Style({
      image: new Icon({
        crossOrigin: 'anonymous',
        src: 'assets/icons/caret-down-2.png',
      }),
    });

    return (feature: Feature<any>) => {
      if (feature !== undefined && feature.getProperties().hasOwnProperty('properties')) {
        switch (view) {
          case 'mae': {
            if (this.getIncrementoMae(feature) > 0) {
              return badIconStyle;
            } else if (this.getIncrementoMae(feature) < 0) {
              return goodIconStyle;
            }
            return null;
          }
          case 'cc': {
            if (this.getIncrementoCC(feature) > 0) {
              return badIconStyle;
            } else if (this.getIncrementoCC(feature) < 0) {
              return goodIconStyle;
            }
            return null;
          }
          case 'gradiente': {
            if (this.getIncrementoGradiente(feature) > 0) {
              return badIconStyle;
            } else if (this.getIncrementoGradiente(feature) < 0) {
              return goodIconStyle;
            }
            return null;
          }
        }
      }
    };
  }

  private getIncrementoMae(feature: Feature<any>): number {
    let informeIdActual: string;
    let informeIdPrevio: string;

    this.informeIdList.forEach((informeId, index) => {
      if (informeId === feature.getProperties().properties.informeId) {
        informeIdActual = informeId;
        if (index > 0) {
          informeIdPrevio = this.informeIdList[index - 1];
        }
      }
    });

    const globalCoordsFeature = feature.getProperties().properties.globalCoords;

    const seguidorVariosInformes = this.listaSeguidores.filter(
      (seguidor) => seguidor.globalCoords/* [0] */ === globalCoordsFeature/* [0] */
    );

    const maeActual = seguidorVariosInformes.find((seguidor) => seguidor.informeId === informeIdActual).mae;

    // comprobamos que existen mas de un informe realizados
    // if (informeIdPrevio !== undefined) {
    if (seguidorVariosInformes.length > 1) {
      const seguidorInformePrevio = seguidorVariosInformes.find((seguidor) => seguidor.informeId === informeIdPrevio);

      const maePrevio = seguidorInformePrevio.mae;

      return maeActual - maePrevio;
    }

    // return 0;
    return maeActual;
  }

  private getIncrementoCC(feature: Feature<any>): number {
    let informeIdActual: string;
    let informeIdPrevio: string;

    this.informeIdList.forEach((informeId, index) => {
      if (informeId === feature.getProperties().properties.informeId) {
        informeIdActual = informeId;
        informeIdPrevio = this.informeIdList[index - 1];
      }
    });

    const globalCoordsFeature = feature.getProperties().properties.globalCoords;

    const seguidorVariosInformes = this.listaSeguidores.filter(
      (seguidor) => seguidor.globalCoords === globalCoordsFeature
    );

    const seguidorActual: Seguidor = seguidorVariosInformes.find((seguidor) => seguidor.informeId === informeIdActual);
    const numModulos = seguidorActual.filas * seguidorActual.columnas;
    const ccActual = seguidorVariosInformes
      .find((seguidor) => seguidor.informeId === informeIdActual)
      .anomalias.filter((anomalia) => anomalia.tipo == 8 || anomalia.tipo == 9).length;
    const porcentajeCCActual = ccActual / numModulos;

    // comprovamos que existen mas de un informe realizados
    if (seguidorVariosInformes.length > 1) {
      const ccPrevio = seguidorVariosInformes
        .find((seguidor) => seguidor.informeId === informeIdPrevio)
        .anomalias.filter((anomalia) => anomalia.tipo == 8 || anomalia.tipo == 9).length;

      const porcentajeCCPrevio = ccPrevio / numModulos;

      return porcentajeCCActual - porcentajeCCPrevio;
    }
    return porcentajeCCActual;
  }

  private getIncrementoGradiente(feature: Feature<any>): number {
    let informeIdActual: string;
    let informeIdPrevio: string;

    this.informeIdList.forEach((informeId, index) => {
      if (informeId === feature.getProperties().properties.informeId) {
        informeIdActual = informeId;
        informeIdPrevio = this.informeIdList[index - 1];
      }
    });

    const globalCoordsFeature = feature.getProperties().properties.globalCoords;

    const seguidorVariosInformes = this.listaSeguidores.filter(
      (seguidor) => seguidor.globalCoords === globalCoordsFeature
    );

    const gradienteActual = seguidorVariosInformes.find((seguidor) => seguidor.informeId === informeIdActual)
      .gradienteNormalizado;

    // comprovamos que existen mas de un informe realizados
    if (seguidorVariosInformes.length > 1) {
      const gradientePrevio = seguidorVariosInformes.find((seguidor) => seguidor.informeId === informeIdPrevio)
        .gradienteNormalizado;

      return gradienteActual - gradientePrevio;
    }
    return gradienteActual;
  }
}
