import { FilterAreaInterface } from './filterArea';

export interface FilterInterface {
  id?: string;
  type: string;
  area?: FilterAreaInterface;
  CoA?: any;
  category?: any;
  gradient?: any;
}
