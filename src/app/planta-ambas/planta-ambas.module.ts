import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';

@NgModule({
  declarations: [GlobalCoordAreasComponent],
  imports: [CommonModule, SharedModule],
  exports: [GlobalCoordAreasComponent],
})
export class PlantaAmbasModule {}
