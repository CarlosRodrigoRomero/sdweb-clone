import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClassificationRoutingModule } from './classification-routing.module';
import { SharedModule } from '@shared/shared.module';

import { ClassificationComponent } from './components/classification.component';
import { MapClassificationComponent } from './components/map-classification/map-classification.component';
import { AnomTipoLegendComponent } from './components/anom-tipo-control/anom-tipo-control.component';
import { HotkeysClassificationComponent } from './components/hotkeys-classification/hotkeys-classification.component';

@NgModule({
  declarations: [
    ClassificationComponent,
    MapClassificationComponent,
    AnomTipoLegendComponent,
    HotkeysClassificationComponent,
  ],
  imports: [CommonModule, ClassificationRoutingModule, SharedModule],
})
export class ClassificationModule {}
