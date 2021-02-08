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
import { ChartSankeyComponent } from './planta-stats/chart-sankey/chart-sankey.component';
import { ShareMapComponent } from './share-map/share-map.component';
import { BarraResumenPlantaComponent } from './barra-resumen-planta/barra-resumen-planta.component';
import { ChartAnomaliasZonasComponent } from './planta-stats/chart-anomalias-zonas/chart-anomalias-zonas.component';
import { ChartPctCelsComponent } from './planta-stats/chart-pct-cels/chart-pct-cels.component';
import { ChartCelsTempsComponent } from './planta-stats/chart-cels-temps/chart-cels-temps.component';
import { ChartCelsPorZonasComponent } from './planta-stats/chart-cels-por-zonas/chart-cels-por-zonas.component';

@NgModule({
  declarations: [
    MapViewComponent,
    MapControlComponent,
    AnomaliaInfoComponent,
    PlantaStatsComponent,
    ChartAlturaComponent,
    ChartNumsyperdComponent,
    FilterPcsListComponent,
    ChartSankeyComponent,
    ShareMapComponent,
    BarraResumenPlantaComponent,
    ChartAnomaliasZonasComponent,
    ChartPctCelsComponent,
    ChartCelsTempsComponent,
    ChartCelsPorZonasComponent,
  ],
  imports: [SharedModule, NgxSliderModule, PlantaReportRoutingModule, NgApexchartsModule, InformeFiltersModule],
})
export class PlantaReportModule {}
