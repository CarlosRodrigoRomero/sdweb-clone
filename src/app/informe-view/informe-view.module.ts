import { NgModule } from '@angular/core';

import { InformeViewRoutingModule } from './informe-view-routing.module';
import { InformeOverviewComponent } from './overview/informe-overview.component';
import { ExplicacionCoaComponent } from './explicacion-coa/explicacion-coa.component';
import { GetNumeroModulosPipe } from '../pipes/get-numero-modulos.pipe';
import { GetNombreSeguidorPipe } from '../pipes/get-nombre-seguidor.pipe';
import { PcFilterComponent } from './pc-filter/pc-filter.component';
import { ChartModule } from 'primeng/chart';
import { InformeViewComponent } from './informe-view.component';
import { RouteReuseStrategy } from '@angular/router';
import { CustomReuseStrategy } from './routeReuse';
import { PcDetailsDialogComponent } from './pc-details-dialog/pc-details-dialog.component';
import { SharedModule } from '../shared/shared.module';
import { InformeMapComponent } from '../informe-map/informe-map.component';
import { PcListComponent } from './list/pc-list/pc-list.component';
import { PcDetailsComponent } from './list/pc-details/pc-details.component';
import { ExportComponent } from '../informe-export/export/export.component';

@NgModule({
  declarations: [
    InformeOverviewComponent,
    InformeViewComponent,
    PcFilterComponent,
    ExplicacionCoaComponent,
    PcDetailsDialogComponent,
    GetNumeroModulosPipe,
    GetNombreSeguidorPipe,
    InformeMapComponent,
    PcListComponent,
    PcDetailsComponent,
    ExportComponent,
    PcFilterComponent,
  ],
  entryComponents: [ExplicacionCoaComponent, PcDetailsDialogComponent],
  providers: [],
  // providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
  imports: [SharedModule, InformeViewRoutingModule, ChartModule],
})
export class InformeViewModule {}
