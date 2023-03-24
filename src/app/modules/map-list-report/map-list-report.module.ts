import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MapListReportRoutingModule } from './map-list-report-routing.module';
import { SharedModule } from '@shared/shared.module';

import { LeyendaContainerComponent } from './containers/leyenda-container/leyenda-container.component';

import { MapListContentComponent } from './components/map-list-content/map-list-content.component';
import { MapComponent } from './components/map/map.component';
import { ListComponent } from './components/list/list.component';
import { LeyendaComponent } from './components/leyenda/leyenda.component';
import { ZonesComponent } from './components/zones/zones.component';
import { ViewControlComponent } from './components/view-control/view-control.component';
import { ThermalLayersComponent } from './components/thermal-layers/thermal-layers.component';

@NgModule({
  declarations: [
    MapListContentComponent,
    MapComponent,
    ListComponent,
    LeyendaComponent,
    ZonesComponent,
    ViewControlComponent,
    LeyendaContainerComponent,
    ThermalLayersComponent,
  ],
  imports: [CommonModule, MapListReportRoutingModule, SharedModule],
})
export class MapListReportModule {}
