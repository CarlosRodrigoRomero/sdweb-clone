import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlantaSeguidoresRoutingModule } from './planta-seguidores-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';

import { MapViewComponent } from './components/map-view/map-view.component';
import { SeguidoresListComponent } from './components/seguidores-list/seguidores-list.component';
import { MapSeguidoresComponent } from './components/map-seguidores/map-seguidores.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { ViewToggleComponent } from './components/view-toggle/view-toggle.component';

@NgModule({
  declarations: [MapViewComponent, SeguidoresListComponent, MapSeguidoresComponent, SliderTemporalComponent, ViewToggleComponent],
  imports: [CommonModule, PlantaSeguidoresRoutingModule, SharedModule, FiltersModule],
})
export class PlantaSeguidoresModule {}
