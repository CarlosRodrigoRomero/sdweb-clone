import { ModuloInterface } from './modulo';
import { AreaInterface } from './area';
import { TipoSeguidor } from './tipoSeguidor';

export interface LocationAreaInterface extends AreaInterface {
  globalX?: any;
  globalY?: string;
  globalZ?: string;
  potenciaModulo?: number;
  nombreModulo?: string;
  moduloId?: string;
  modulo?: ModuloInterface;
  globalCoords?: string[];
  tipoSeguidor?: TipoSeguidor;
}
