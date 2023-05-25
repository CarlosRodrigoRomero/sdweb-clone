import { Coordinate } from 'ol/coordinate';

export interface MapDivision {
  id?: string;
  numDivision?: number;
  coords: Coordinate[];
  imagesIds?: string[];
  numImages?: number;
  // mapId?: string;
}
