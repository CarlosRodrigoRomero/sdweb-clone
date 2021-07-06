import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgmCoreModule } from '@agm/core';

import { SharedModule } from '@shared/shared.module';
import { InformeMapFilterRoutingModule } from './informe-map-filter-routing.module';

import { MapFilterComponent } from './components/map-filter/map-filter.component';
import { ActiveFilterListComponent } from './components/active-filter-list/active-filter-list.component';
import { FilterPcsListComponent } from './components/filter-pcs-list/filter-pcs-list.component';

@NgModule({
  declarations: [MapFilterComponent, ActiveFilterListComponent, FilterPcsListComponent],
  imports: [
    CommonModule,
    InformeMapFilterRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['places', 'drawing', 'geometry'],
    }),
    SharedModule,
  ],
})
export class InformeMapFilterModule {}
