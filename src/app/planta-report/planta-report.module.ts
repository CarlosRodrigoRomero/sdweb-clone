import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgModule } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { PlantaReportRoutingModule } from './planta-report-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';

import { FilterPcsListComponent } from './components/filter-pcs-list/filter-pcs-list.component';
import { ChartSankeyComponent } from './planta-stats/chart-sankey/chart-sankey.component';
import { ShareMapComponent } from './components/share-map/share-map.component';
import { BarraResumenPlantaComponent } from './components/barra-resumen-planta/barra-resumen-planta.component';
import { ChartAnomaliasZonasComponent } from './planta-stats/chart-anomalias-zonas/chart-anomalias-zonas.component';
import { ChartPctCelsComponent } from './planta-stats/chart-pct-cels/chart-pct-cels.component';
import { ChartCelsTempsComponent } from './planta-stats/chart-cels-temps/chart-cels-temps.component';
import { ChartCelsPorZonasComponent } from './planta-stats/chart-cels-por-zonas/chart-cels-por-zonas.component';
import { DownloadReportComponent } from './components/download-report/download-report.component';
import { MapComponent } from './components/map/map.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { PlantaStatsComponent } from './planta-stats/planta-stats.component';
import { ChartAlturaComponent } from './planta-stats/chart-altura/chart-altura.component';
import { ChartNumsyperdComponent } from './planta-stats/chart-numsyperd/chart-numsyperd.component';
import { SliderTermicoComponent } from './components/slider-termico/slider-termico.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { ChartSankeyPotenciaComponent } from './planta-stats/chart-sankey-potencia/chart-sankey-potencia.component';
import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';

@NgModule({
  declarations: [
    MapViewComponent,
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
    DownloadReportComponent,
    MapComponent,
    SliderTermicoComponent,
    SliderTemporalComponent,
    ChartSankeyPotenciaComponent,
    GlobalCoordAreasComponent,
  ],
  imports: [SharedModule, NgxSliderModule, PlantaReportRoutingModule, NgApexchartsModule, FiltersModule],
  exports: [MapViewComponent],
})
export class PlantaReportModule {}
