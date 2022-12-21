import { Injectable } from '@angular/core';

import { InformeInterface } from '@core/models/informe';

import { GEO } from '@data/constants/geo';
import { TileCoord } from 'ol/tilecoord';

@Injectable({
  providedIn: 'root',
})
export class GeoserverService {
  constructor() {}

  getGeoserverUrl(informe: InformeInterface, type: string, checkType?: boolean, tileCoord?: TileCoord): string {
    let url: string;
    let tileCoords = '{z}/{x}/{y}';
    if (checkType || tileCoord) {
      tileCoords = this.getTileCoords(checkType, tileCoord);
    }
    if (informe.hasOwnProperty('servidorCapas')) {
      switch (informe.servidorCapas) {
        case 'geoserver': {
          url =
            GEO.urlGeoserver + informe.id + '_' + type + '@WebMercatorQuad@png/' + tileCoords + '.png?flipY=true';
          break;
        }
        case 'old': {
          if (checkType) {
            url = GEO.urlServidorAntiguo + informe.id + '_' + type + '/' + tileCoords + '.png';
          } else {
            url = GEO.urlServidorAntiguo + informe.id + '_' + type + '/' + tileCoords + '.png';
          }
          break;
        }
      }
    } else {
      if (checkType) {
        url = GEO.urlServidorAntiguo + informe.id + '_' + type + '/' + tileCoords + '.png';
      } else {
        url = GEO.urlServidorAntiguo + informe.id + '_' + type + '/' + tileCoords + '.png';
      }
    }

    return url;
  }

  getTileCoords(checkType: boolean, tileCoord: TileCoord): string {
    if (checkType) {
      return '1/1/1';
    } else {
      return `${tileCoord[0]}/${tileCoord[1]}/${tileCoord[2]}`;
    }
  }
}
