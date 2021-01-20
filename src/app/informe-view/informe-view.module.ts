import { NgModule } from '@angular/core';

import { InformeViewRoutingModule } from './informe-view-routing.module';
import { InformeOverviewComponent } from './components/overview/informe-overview.component';
import { ExplicacionCoaComponent } from './components/explicacion-coa/explicacion-coa.component';
import { PcFilterComponent } from './components/pc-filter/pc-filter.component';
import { ChartModule } from 'primeng/chart';
import { InformeViewComponent } from './components/informe-view/informe-view.component';
import { PcDetailsDialogComponent } from './components/pc-details-dialog/pc-details-dialog.component';
import { SharedModule } from '../shared/shared.module';
import { PcListComponent } from './components/pc-list/pc-list.component';
import { PcDetailsComponent } from './components/pc-details/pc-details.component';
import { ExportComponent } from '../informe-export/components/export/export.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SpinnerModule } from '../shared/spinner/spinner.module';
import { FiltersComponent } from './components/filters/filters.component';

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
    FiltersComponent,
  ],
  entryComponents: [ExplicacionCoaComponent, PcDetailsDialogComponent],
  providers: [],
  // providers: [{ provide: RouteReuseStrategy, useClass: CustomReuseStrategy }],
  imports: [SharedModule, SpinnerModule, InformeViewRoutingModule, ChartModule, FormsModule, ReactiveFormsModule],
})
export class InformeViewModule {}
