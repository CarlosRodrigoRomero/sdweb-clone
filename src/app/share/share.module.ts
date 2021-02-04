import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ShareRoutingModule } from './share-routing.module';
import { MapSharedComponent } from './components/map-shared/map-shared.component';


@NgModule({
  declarations: [MapSharedComponent],
  imports: [
    CommonModule,
    ShareRoutingModule
  ]
})
export class ShareModule { }
