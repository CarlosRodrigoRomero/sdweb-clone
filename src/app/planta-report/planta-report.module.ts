import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgModule } from '@angular/core';
import { SharedModule } from '@shared/shared.module';
import { MapViewComponent } from './map-view/map-view.component';
import { PlantaReportRoutingModule } from './planta-repot-routing.module';
import { MapControlComponent } from './map-control/map-control.component';
import { AnomaliaInfoComponent } from './anomalia-info/anomalia-info.component';
import { PlantaStatsComponent } from './planta-stats/planta-stats.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartAlturaComponent } from './planta-stats/chart-altura/chart-altura.component';
import { ChartNumsyperdComponent } from './planta-stats/chart-numsyperd/chart-numsyperd.component';
import { InformeFiltersModule } from '../informe-filters/informe-filters.module';
import { FilterPcsListComponent } from './filter-pcs-list/filter-pcs-list.component';
import { ShareMapComponent } from './share-map/share-map.component';

@NgModule({
  declarations: [
    MapViewComponent,
    MapControlComponent,
    AnomaliaInfoComponent,
    PlantaStatsComponent,
    ChartAlturaComponent,
    ChartNumsyperdComponent,
    FilterPcsListComponent,
    ShareMapComponent,
  ],
  imports: [SharedModule, NgxSliderModule, PlantaReportRoutingModule, NgApexchartsModule, InformeFiltersModule],
})
export class PlantaReportModule {}
