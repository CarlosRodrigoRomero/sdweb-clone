import { Pipe, PipeTransform } from '@angular/core';
import { PcInterface } from '@core/models/pc';

@Pipe({
  name: 'getNombreSeguidor',
})
export class GetNombreSeguidorPipe implements PipeTransform {
  transform(pc: PcInterface, args?: any): any {
    let nombreSeguidor = '';
    if (pc.hasOwnProperty('global_x')) {
      if (!Number.isNaN(pc.global_x)) {
        nombreSeguidor = nombreSeguidor.concat(pc.global_x.toString());
      }
    }
    if (pc.hasOwnProperty('global_y')) {
      if (!Number.isNaN(pc.global_y)) {
        nombreSeguidor = nombreSeguidor.concat(pc.global_y.toString());
      }
    }
    return nombreSeguidor;
  }
}
