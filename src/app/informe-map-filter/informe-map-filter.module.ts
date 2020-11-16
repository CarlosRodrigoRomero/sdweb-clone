import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgmCoreModule } from '@agm/core';

import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { InformeMapFilterRoutingModule } from './informe-map-filter-routing.module';
import { InformeMapFilterComponent } from './components/informe-map-filter/informe-map-filter.component';
import { ActiveFilterListComponent } from './components/active-filter-list/active-filter-list.component';

@NgModule({
  declarations: [InformeMapFilterComponent, ActiveFilterListComponent],
  imports: [
    CommonModule,
    InformeMapFilterRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['places', 'drawing', 'geometry'],
    }),
    MatButtonModule,
    MatChipsModule,
    MatCardModule,
    MatIconModule,
  ],
})
export class InformeMapFilterModule {}
