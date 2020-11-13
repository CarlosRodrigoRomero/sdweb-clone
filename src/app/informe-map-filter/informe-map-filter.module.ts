import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgmCoreModule } from '@agm/core';
import { MatButtonModule } from '@angular/material/button';

import { InformeMapFilterRoutingModule } from './informe-map-filter-routing.module';
import { InformeMapFilterComponent } from './components/informe-map-filter/informe-map-filter.component';
import { InformeMapAreaComponent } from './components/informe-map-area/informe-map-area.component';

@NgModule({
  declarations: [InformeMapFilterComponent, InformeMapAreaComponent],
  imports: [
    CommonModule,
    InformeMapFilterRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['places', 'drawing', 'geometry'],
    }),
    MatButtonModule,
  ],
})
export class InformeMapFilterModule {}
