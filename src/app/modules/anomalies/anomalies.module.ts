import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { AnomaliaListComponent } from './components/anomalia-list/anomalia-list.component';
import { AnomaliaListContainer } from './containers/anomalia-list-container/anomalia-list-container.component';
import { FiltersModule } from '@modules/filters/filters.module';

@NgModule({
  declarations: [
    AnomaliaInfoComponent,
    AnomaliaListComponent,
    AnomaliaListContainer
  ],
  imports: [
    CommonModule,
    SharedModule,
    FiltersModule
  ],
  exports: [
    AnomaliaInfoComponent,
    AnomaliaListComponent,
    AnomaliaListContainer,
  ]
})
export class AnomaliesModule { }
