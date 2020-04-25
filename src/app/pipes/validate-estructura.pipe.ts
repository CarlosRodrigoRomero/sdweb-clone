import { Pipe, PipeTransform } from '@angular/core';
import { Estructura } from '../models/estructura';
import { ElementoPlantaInterface } from '../models/elementoPlanta';
import { PcInterface } from '../models/pc';

@Pipe({
  name: 'validateEstructura',
})
export class ValidateEstructuraPipe implements PipeTransform {
  transform(elem: Estructura & PcInterface, args?: any): boolean {
    if (elem.constructor.name === Estructura.name) {
      if (elem.globalCoords[0] === null || elem.globalCoords[1] == null) {
        return true;
      }
      if (elem.globalCoords[0].toString().length === 0 || elem.globalCoords[1].toString().length === 0) {
        return true;
      }
      if (elem.columnaInicio < 1 || elem.filaInicio < 1) {
        return true;
      }
      if (elem.columnas < 1 || elem.filas < 1) {
        return true;
      }
      return false;
    }

    return false;
  }
}
