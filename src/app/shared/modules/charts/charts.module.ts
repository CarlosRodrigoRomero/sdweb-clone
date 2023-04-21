import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';
import { TranslateModule } from '@ngx-translate/core';

import { MaterialModule } from '../material/material.module';

import { BarExpandableChartComponent } from './components/bar-expandable-chart/bar-expandable-chart.component';

@NgModule({
  declarations: [BarExpandableChartComponent],
  imports: [CommonModule, NgApexchartsModule, MaterialModule, TranslateModule.forChild({ isolate: false })],
  exports: [BarExpandableChartComponent],
})
export class ChartsModule {}
