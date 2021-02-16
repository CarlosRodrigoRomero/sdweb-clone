import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OlControlComponent } from './components/ol-control/ol-control.component';
import { OlMapMarkerComponent } from './components/ol-map-marker/ol-map-marker.component';
import { OlMapComponent } from './components/ol-map/ol-map.component';

const COMPONENTS = [OlMapComponent, OlMapMarkerComponent, OlControlComponent];

@NgModule({
  declarations: COMPONENTS,
  exports: COMPONENTS,
  imports: [CommonModule],
})
export class OlMapsModule {}
