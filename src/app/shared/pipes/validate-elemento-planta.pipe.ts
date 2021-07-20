import { Pipe, PipeTransform } from '@angular/core';
import { Estructura } from '@core/models/estructura';
import { PcInterface, Pc } from '@core/models/pc';
import { PlantaInterface } from '@core/models/planta';

@Pipe({
  name: 'validateElem',
})
export class ValidateElementoPlantaPipe implements PipeTransform {
  transform(elem: Estructura & PcInterface, planta?: PlantaInterface): boolean {
    let numeroGlobalCoords = 2;
    let globalCoords = [];
    if (elem.hasOwnProperty('globalCoords')) {
      globalCoords = elem.globalCoords.map((element) => {
        return element === null ? '' : element;
      });
    } else {
      globalCoords = [elem.global_x, elem.global_y];
    }
    if (planta !== undefined) {
      if (planta.hasOwnProperty('numeroGlobalCoords')) {
        if (planta.numeroGlobalCoords !== null) {
          numeroGlobalCoords = planta.numeroGlobalCoords;
        }
      }
    }
    if (elem.constructor.name === Estructura.name) {
      if (elem.columnaInicio < 1 || elem.filaInicio < 1) {
        return false;
      } else if (elem.columnas < 1 || elem.filas < 1) {
        return false;
      }
      if (numeroGlobalCoords === 1) {
        if (globalCoords[0].toString().length === 0 && globalCoords[1].toString().length === 0) {
          return false;
        }
        return true;
      } else if (numeroGlobalCoords === 2) {
        if (globalCoords[0].toString().length === 0 || globalCoords[1].toString().length === 0) {
          return false;
        }
        return true;
      } else {
        if (
          globalCoords[0].toString().length === 0 ||
          globalCoords[1].toString().length === 0 ||
          globalCoords[2].toString().length === 0
        ) {
          return false;
        }
        return true;
      }
    } else if (elem.constructor.name === Pc.name) {
      if (elem.tipo !== 0 && elem.tipo !== 4 && elem.tipo !== 17 && (elem.local_x === 0 || elem.local_y === 0)) {
        return false;
      } else if (globalCoords[0].length === 0 && globalCoords[1].length === 0) {
        return false;
      }
      //   else if (planta.tipo === 'fija' && elem.local_x === 1
      // pc_error_local_x: planta.tipo === 'fija' && elem.local_x === 1
      //   return true;
    }

    return true;
  }
}
