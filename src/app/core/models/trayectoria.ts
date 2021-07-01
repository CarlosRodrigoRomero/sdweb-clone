import { Coordinate } from 'ol/coordinate';

export interface TrayectoriaInterface {
  id?: string;
  nombre?: string;
  plantaId?: string;
  puntosTrayectoria?: Coordinate[];
}
