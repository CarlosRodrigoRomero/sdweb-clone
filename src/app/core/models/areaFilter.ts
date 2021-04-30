import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';

import { Anomalia } from './anomalia';
import { Seguidor } from './seguidor';
import { FilterInterface } from './filter';
import { FilterableElement } from './filtrableInterface';

export class AreaFilter implements FilterInterface {
  type: string;
  coords: Coordinate[][];
  polygon: Polygon;

  constructor(type: string, coords: Coordinate[][]) {
    this.type = type;
    this.coords = coords;
    this.polygon = new Polygon(coords);
  }

  applyFilter(elems: FilterableElement[]): FilterableElement[] {
    return elems.filter((elem) => {
      return this.polygon.intersectsCoordinate((elem as Anomalia | Seguidor).featureCoords[0]);
    });
  }
  unapplyFilter(elems: FilterableElement[]): FilterableElement[] {
    return null;
  }
}
