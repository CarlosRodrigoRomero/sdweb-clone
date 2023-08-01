import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { StatsPlantRoutingModule } from './stats-plant-routing.module';
import { SharedModule } from '@shared/shared.module';

import { PlantaStatsComponent } from './components/planta-stats.component';
import { ChartAlturaComponent } from './components/chart-altura/chart-altura.component';
import { ChartMaeZonasComponent } from './components/chart-mae-zonas/chart-mae-zonas.component';
import { ChartCelsPorZonasComponent } from './components/chart-cels-por-zonas/chart-cels-por-zonas.component';
import { ChartCelsGradComponent } from './components/chart-cels-grad/chart-cels-grad.component';
import { ChartMaeGlobalComponent } from './components/chart-mae-global/chart-mae-global.component';
import { ChartTipoAnomsComponent } from './components/chart-tipo-anoms/chart-tipo-anoms.component';
import { ChartPctCelsComponent } from './components/chart-pct-cels/chart-pct-cels.component';
import { ChartSankeyComponent } from './components/chart-sankey/chart-sankey.component';
import { ChartSankeyPotenciaComponent } from './components/chart-sankey-potencia/chart-sankey-potencia.component';

import { DynamicStatsDirective } from './directives/dynamic-stats.directive';

@NgModule({
    declarations: [
        PlantaStatsComponent,
        ChartAlturaComponent,
        ChartMaeZonasComponent,
        ChartCelsPorZonasComponent,
        ChartCelsGradComponent,
        ChartMaeGlobalComponent,
        ChartTipoAnomsComponent,
        ChartPctCelsComponent,
        ChartSankeyComponent,
        ChartSankeyPotenciaComponent,
        DynamicStatsDirective,
    ],
    imports: [CommonModule, StatsPlantRoutingModule, SharedModule, NgApexchartsModule],
    exports: [PlantaStatsComponent, DynamicStatsDirective]
})
export class StatsPlantModule {}
