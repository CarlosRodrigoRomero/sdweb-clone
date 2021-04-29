import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StructuresRoutingModule } from './structures-routing.module';
import { SharedModule } from '@shared/shared.module';

import { StructuresComponent } from './components/structures.component';
import { MapStructuresComponent } from './components/map-structures/map-structures.component';

@NgModule({
  declarations: [StructuresComponent, MapStructuresComponent],
  imports: [CommonModule, StructuresRoutingModule, SharedModule],
})
export class StructuresModule {}
