import { Polygon } from '@agm/core/services/google-maps-types';
import { AreaInterface } from './area';

declare const google: any;

export interface FilterAreaInterface extends AreaInterface {
    userId?: string;
    polygon: Polygon;
}