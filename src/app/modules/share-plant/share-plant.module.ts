import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharePlantComponent } from './components/share-plant/share-plant.component';
import { SharePlantContainerComponent } from './containers/share-plant-container/share-plant-container.component';

import { SharedModule } from '@shared/shared.module';


@NgModule({
  declarations: [
    SharePlantComponent,
    SharePlantContainerComponent
  ],
  imports: [
    CommonModule, SharedModule
  ],
  exports: [SharePlantContainerComponent],
})
export class SharePlantModule { }
