import { Coordinate } from 'ol/coordinate';

export interface MapDivision {
  id?: string;
  numDivision?: number;
  coords: Coordinate[];
  status: number;
  precise: boolean;
  notPreciseId?: string;
  mapId?: string;
  imagesIds?: string[];
  numImages?: number;
}
