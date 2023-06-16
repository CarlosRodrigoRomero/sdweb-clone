import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AnomaliesPanelComponent } from './components/anomalies-panel/anomalies-panel.component';

import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [
    AnomaliesPanelComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ],
  exports: [AnomaliesPanelComponent]
})
export class AnomaliesModule { }
