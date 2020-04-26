import { NgModule } from '@angular/core';

import { InformeEditRoutingModule } from './informe-edit-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InformeEditComponent } from './informe-edit.component';
import { EditMapComponent } from './edit-map/edit-map.component';
import { EditListComponent } from './edit-list/edit-list.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ValidateEstructuraPipe } from '../pipes/validate-estructura.pipe';
import { AgmCoreModule } from '@agm/core';

@NgModule({
  declarations: [ValidateEstructuraPipe, InformeEditComponent, EditMapComponent, EditListComponent, CanvasComponent],
  imports: [
    SharedModule,
    InformeEditRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
  providers: [ValidateEstructuraPipe],
})
export class InformeEditModule {}
