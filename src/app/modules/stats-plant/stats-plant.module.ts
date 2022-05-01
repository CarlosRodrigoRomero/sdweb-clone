import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { SharedModule } from '@shared/shared.module';

import { PlantaStatsComponent } from './components/planta-stats.component';
import { ChartAlturaComponent } from './components/chart-altura/chart-altura.component';
import { ChartAnomaliasZonasComponent } from './components/chart-anomalias-zonas/chart-anomalias-zonas.component';
import { ChartCelsPorZonasComponent } from './components/chart-cels-por-zonas/chart-cels-por-zonas.component';
import { ChartCelsTempsComponent } from './components/chart-cels-temps/chart-cels-temps.component';
import { ChartMaeGlobalComponent } from './components/chart-mae-global/chart-mae-global.component';
import { ChartNumsyperdComponent } from './components/chart-numsyperd/chart-numsyperd.component';
import { ChartPctCelsComponent } from './components/chart-pct-cels/chart-pct-cels.component';
import { ChartSankeyComponent } from './components/chart-sankey/chart-sankey.component';
import { ChartSankeyPotenciaComponent } from './components/chart-sankey-potencia/chart-sankey-potencia.component';

@NgModule({
  declarations: [
    PlantaStatsComponent,
    ChartAlturaComponent,
    ChartAnomaliasZonasComponent,
    ChartCelsPorZonasComponent,
    ChartCelsTempsComponent,
    ChartMaeGlobalComponent,
    ChartNumsyperdComponent,
    ChartPctCelsComponent,
    ChartSankeyComponent,
    ChartSankeyPotenciaComponent,
  ],
  imports: [CommonModule, SharedModule, NgApexchartsModule],
  exports: [PlantaStatsComponent],
})
export class StatsPlantModule {}
