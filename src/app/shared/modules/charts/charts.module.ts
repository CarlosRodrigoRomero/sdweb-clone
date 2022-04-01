import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { MaterialModule } from '../material/material.module';

import { BarExpandableChartComponent } from './components/bar-expandable-chart/bar-expandable-chart.component';

@NgModule({
  declarations: [BarExpandableChartComponent],
  imports: [CommonModule, NgApexchartsModule, MaterialModule],
  exports: [BarExpandableChartComponent],
})
export class ChartsModule {}
