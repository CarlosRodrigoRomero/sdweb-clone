import { FilterInterface } from './filter';
import { FiltrableInterface } from './filtrableInterface';
import { Coordinate } from 'ol/coordinate';
import Polygon from 'ol/geom/Polygon';
import { Anomalia } from './anomalia';

export class AreaFilter implements FilterInterface {
  id: string;
  type: string;
  coords: Coordinate[][];
  polygon: Polygon;

  constructor(id: string, type: string, coords: Coordinate[][]) {
    this.id = id;
    this.type = type;
    this.coords = coords;
    this.polygon = new Polygon(coords);
  }

  applyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return pcs.filter((pc) => this.polygon.intersectsCoordinate((pc as Anomalia).featureCoords[0]));
  }
  unapplyFilter(pcs: FiltrableInterface[]): FiltrableInterface[] {
    return null;
  }
}
