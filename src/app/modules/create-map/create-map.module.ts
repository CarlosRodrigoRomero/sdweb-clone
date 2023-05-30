import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CreateMapRoutingModule } from './create-map-routing.module';
import { SharedModule } from '@shared/shared.module';

import { CreateMapComponent } from './components/create-map.component';
import { MapCreateMapComponent } from './components/map-create-map/map-create-map.component';
import { ListCreateMapComponent } from './components/list-create-map/list-create-map.component';
import { ListCreateMapContainerComponent } from './containers/list-create-map-container/list-create-map-container.component';
import { ThermalSliderCogComponent } from './components/thermal-slider-cog/thermal-slider-cog.component';

@NgModule({
  declarations: [CreateMapComponent, MapCreateMapComponent, ListCreateMapComponent, ListCreateMapContainerComponent, ThermalSliderCogComponent],
  imports: [CommonModule, CreateMapRoutingModule, SharedModule],
})
export class CreateMapModule {}
