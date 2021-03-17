import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';

import { Anomalia } from './anomalia';
import { Seguidor } from './seguidor';
import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';

export class AreaFilter implements FilterInterface {
  type: string;
  coords: Coordinate[][];
  polygon: Polygon;

  constructor(type: string, coords: Coordinate[][]) {
    this.type = type;
    this.coords = coords;
    this.polygon = new Polygon(coords);
  }

  applyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return elems.filter((elem) => {
      return this.polygon.intersectsCoordinate((elem as Anomalia | Seguidor).featureCoords[0]);
    });
  }
  unapplyFilter(elems: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
