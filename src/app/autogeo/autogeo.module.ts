import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AutogeoRoutingModule } from './autogeo-routing.module';
import { SharedModule } from '@shared/shared.module';

import { AutogeoComponent } from './components/autogeo.component';
import { MapAutogeoComponent } from './components/map-autogeo/map-autogeo.component';

@NgModule({
  declarations: [AutogeoComponent, MapAutogeoComponent],
  imports: [CommonModule, AutogeoRoutingModule, SharedModule],
})
export class AutogeoModule {}
