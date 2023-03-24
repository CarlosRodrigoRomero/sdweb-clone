import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapListReportRoutingModule } from './map-list-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { MapListContentComponent } from './components/map-list-content/map-list-content.component';
import { MapComponent } from './components/map/map.component';
import { ListComponent } from './components/list/list.component';

@NgModule({
  declarations: [MapListContentComponent, MapComponent, ListComponent],
  imports: [CommonModule, MapListReportRoutingModule, SharedModule],
})
export class MapListReportModule {}
