import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CreateMapRoutingModule } from './create-map-routing.module';
import { SharedModule } from '@shared/shared.module';

import { CreateMapComponent } from './components/create-map.component';
import { MapCreateMapComponent } from './components/map-create-map/map-create-map.component';

@NgModule({
  declarations: [CreateMapComponent, MapCreateMapComponent],
  imports: [CommonModule, CreateMapRoutingModule, SharedModule],
})
export class CreateMapModule {}
