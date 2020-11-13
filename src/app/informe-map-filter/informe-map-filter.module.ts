import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgmCoreModule } from '@agm/core';

import { InformeMapFilterRoutingModule } from './informe-map-filter-routing.module';
import { InformeMapFilterComponent } from './components/informe-map-filter.component';

@NgModule({
  declarations: [InformeMapFilterComponent],
  imports: [
    CommonModule,
    InformeMapFilterRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
})
export class InformeMapFilterModule {}
