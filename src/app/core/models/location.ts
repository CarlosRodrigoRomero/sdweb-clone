import { ModuloInterface } from './modulo';
import { AreaInterface } from './area';

export interface LocationAreaInterface extends AreaInterface {
  globalX: any;
  globalY: string;
  potenciaModulo: number;
  nombreModulo: string;
  moduloId?: string;
  modulo?: ModuloInterface;
  globalCoords?: any[];
}
