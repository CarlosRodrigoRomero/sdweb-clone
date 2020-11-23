import { Polygon } from '@agm/core/services/google-maps-types';
import { AreaInterface } from './area';
import { PcInterface } from './pc';

export interface FilterAreaInterface extends AreaInterface {
    userId?: string;
    polygon: Polygon;
    pcs?: PcInterface[];
}