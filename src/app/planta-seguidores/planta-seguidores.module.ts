import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlantaSeguidoresRoutingModule } from './planta-seguidores-routing.module';
import { MapViewComponent } from './map-view/map-view.component';


@NgModule({
  declarations: [MapViewComponent],
  imports: [
    CommonModule,
    PlantaSeguidoresRoutingModule
  ]
})
export class PlantaSeguidoresModule { }
