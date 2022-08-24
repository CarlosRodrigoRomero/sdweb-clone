import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlantaStatsComponent } from './components/planta-stats.component';

const routes: Routes = [
  {
    path: 'stats',
    component: PlantaStatsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StatsPlantRoutingModule {}
