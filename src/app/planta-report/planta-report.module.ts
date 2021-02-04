import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { SpinnerModule } from '@shared/spinner/spinner.module';
import { ChartModule } from 'primeng/chart';
import { MapViewComponent } from './map-view/map-view.component';
import { PlantaReportRoutingModule } from './planta-repot-routing.module';
import { MapControlComponent } from './map-control/map-control.component';
import { AnomaliaInfoComponent } from './anomalia-info/anomalia-info.component';
import { PlantaStatsComponent } from './planta-stats/planta-stats.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartAlturaComponent } from './planta-stats/chart-altura/chart-altura.component';
import { ChartNumsyperdComponent } from './planta-stats/chart-numsyperd/chart-numsyperd.component';

@NgModule({
  declarations: [
    MapViewComponent,
    MapControlComponent,
    AnomaliaInfoComponent,
    PlantaStatsComponent,
    ChartAlturaComponent,
    ChartNumsyperdComponent,
  ],
  imports: [
    SharedModule,
    NgxSliderModule,
    SpinnerModule,
    PlantaReportRoutingModule,
    ChartModule,
    FormsModule,
    ReactiveFormsModule,
    NgApexchartsModule,
  ],
})
export class PlantaReportModule {}
