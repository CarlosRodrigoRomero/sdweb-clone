import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { InformeViewRoutingModule } from './informe-view-routing.module';
import { ChartModule } from 'primeng/chart';
import { SharedModule } from '../shared/shared.module';
import { SpinnerModule } from '../shared/spinner/spinner.module';
import { InformeFiltersModule } from '../informe-filters/informe-filters.module';

import { InformeOverviewComponent } from './components/overview/informe-overview.component';
import { ExplicacionCoaComponent } from './components/explicacion-coa/explicacion-coa.component';
import { PcFilterComponent } from './components/pc-filter/pc-filter.component';
import { InformeViewComponent } from './components/informe-view/informe-view.component';
import { PcDetailsDialogComponent } from './components/pc-details-dialog/pc-details-dialog.component';
import { PcListComponent } from './components/pc-list/pc-list.component';
import { PcDetailsComponent } from './components/pc-details/pc-details.component';
import { ExportComponent } from '../informe-export/components/export/export.component';

@NgModule({
  declarations: [
    InformeOverviewComponent,
    InformeViewComponent,
    PcFilterComponent,
    ExplicacionCoaComponent,
    PcDetailsDialogComponent,
    PcListComponent,
    PcDetailsComponent,
    ExportComponent,
    PcFilterComponent,
  ],
  entryComponents: [ExplicacionCoaComponent, PcDetailsDialogComponent],
  providers: [],
  // providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
  imports: [
    SharedModule,
    SpinnerModule,
    InformeViewRoutingModule,
    ChartModule,
    FormsModule,
    ReactiveFormsModule,
    InformeFiltersModule,
  ],
})
export class InformeViewModule {}
