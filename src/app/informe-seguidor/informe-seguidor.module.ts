import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AgmCoreModule } from '@agm/core';

import { InformeSeguidorRoutingModule } from './informe-seguidor-routing.module';
import { MapComponent } from './components/map/map.component';

@NgModule({
  declarations: [MapComponent],
  imports: [
    CommonModule,
    InformeSeguidorRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['places', 'drawing', 'geometry'],
    }),
  ],
})
export class InformeSeguidorModule {}
