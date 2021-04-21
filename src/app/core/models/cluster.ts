import { Coordinate } from 'ol/coordinate';

export interface Cluster {
  id: string;
  extremoA: number[];
  extremoB: Coordinate;
  color?: string;
}
