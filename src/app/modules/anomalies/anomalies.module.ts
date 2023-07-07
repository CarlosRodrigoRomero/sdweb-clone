import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { AnomaliaListComponent } from './components/anomalia-list/anomalia-list.component';
import { AnomaliaListContainer } from './containers/anomalia-list-container/anomalia-list-container.component';
import { FiltersModule } from '@modules/filters/filters.module';
import { CommentsModule } from '@modules/comments/comments.module';

@NgModule({
  declarations: [
    AnomaliaInfoComponent,
    AnomaliaListComponent,
    AnomaliaListContainer
  ],
  imports: [
    CommonModule,
    SharedModule,
    FiltersModule,
    CommentsModule
  ],
  exports: [
    AnomaliaInfoComponent,
    AnomaliaListComponent,
    AnomaliaListContainer,
  ]
})
export class AnomaliesModule { }
