import { CritCoA } from './critCoA';
import { CritCriticidad } from './critCriticidad';

export interface CriteriosClasificacion {
  id?: string;
  nombre?: string;
  critCoA?: CritCoA;
  critCriticidad?: CritCriticidad;
}
