import { Coordinate } from 'ol/coordinate';

export interface MapDivision {
  id?: string;
  coords: Coordinate[];
  status: number;
  precise: boolean;
  notPreciseId?: string;
  mapId?: string;
}
