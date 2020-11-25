import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

const apiToken = environment.MAPBOX_API_KEY;


const defaultCoords: number[] = [37.772199, -122.408602];
const defaultZoom = 17;

@Injectable()
export class MapService {

  constructor() { }


  plotActivity() {}

}
