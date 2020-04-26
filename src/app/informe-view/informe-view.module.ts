import { NgModule } from '@angular/core';

import { InformeViewRoutingModule } from './informe-view-routing.module';
import { InformeOverviewComponent } from './overview/informe-overview.component';
import { ExplicacionCoaComponent } from './explicacion-coa/explicacion-coa.component';
import { GetNumeroModulosPipe } from '../pipes/get-numero-modulos.pipe';
import { GetNombreSeguidorPipe } from '../pipes/get-nombre-seguidor.pipe';
import { PcFilterComponent } from './pc-filter/pc-filter.component';
import { ChartModule } from 'primeng/chart';
import { InformeViewComponent } from './informe-view.component';
import { PcDetailsDialogComponent } from './pc-details-dialog/pc-details-dialog.component';
import { SharedModule } from '../shared/shared.module';
import { PcListComponent } from './list/pc-list/pc-list.component';
import { PcDetailsComponent } from './list/pc-details/pc-details.component';
import { ExportComponent } from '../informe-export/export/export.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SpinnerModule } from '../shared/spinner/spinner.module';

@NgModule({
  declarations: [
    InformeOverviewComponent,
    InformeViewComponent,
    PcFilterComponent,
    ExplicacionCoaComponent,
    PcDetailsDialogComponent,
    GetNumeroModulosPipe,
    GetNombreSeguidorPipe,
    PcListComponent,
    PcDetailsComponent,
    ExportComponent,
    PcFilterComponent,
  ],
  entryComponents: [ExplicacionCoaComponent, PcDetailsDialogComponent],
  providers: [],
  // providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
  imports: [SharedModule, SpinnerModule, InformeViewRoutingModule, ChartModule, FormsModule, ReactiveFormsModule],
})
export class InformeViewModule {}
