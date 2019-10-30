import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'getNumeroModulos'
})
export class GetNumeroModulosPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return null;
  }

}
