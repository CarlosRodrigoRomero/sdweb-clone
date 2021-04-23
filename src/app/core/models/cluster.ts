import { Coordinate } from 'ol/coordinate';

export interface Cluster {
  id?: string;
  color?: string;
  clusterJoinId?: string;
  puntoAId: string;
  puntoBId: string;
}
