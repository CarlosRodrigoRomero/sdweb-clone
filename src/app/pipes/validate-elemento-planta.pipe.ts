import { Pipe, PipeTransform } from '@angular/core';
import { Estructura } from '../models/estructura';
import { PcInterface, Pc } from '../models/pc';

@Pipe({
  name: 'validateElem',
})
export class ValidateElementoPlantaPipe implements PipeTransform {
  transform(elem: Estructura & PcInterface, args?: any): boolean {
    if (elem.constructor.name === Estructura.name) {
      if (elem.globalCoords[0] === null || elem.globalCoords[1] == null) {
        return true;
      } else if (elem.globalCoords[0].toString().length === 0 || elem.globalCoords[1].toString().length === 0) {
        return true;
      } else if (elem.columnaInicio < 1 || elem.filaInicio < 1) {
        return true;
      } else if (elem.columnas < 1 || elem.filas < 1) {
        return true;
      }
      return false;
    } else if (elem.constructor.name === Pc.name) {
      if (elem.tipo !== 0 && elem.tipo !== 4 && elem.tipo !== 17 && (elem.local_x === 0 || elem.local_y === 0)) {
        return true;
      } else if (elem.global_x.length === 0 && elem.global_y.length === 0) {
        return true;
      }
      //   else if (planta.tipo === 'fija' && elem.local_x === 1
      // pc_error_local_x: planta.tipo === 'fija' && elem.local_x === 1
      //   return true;
    }

    return false;
  }
}
