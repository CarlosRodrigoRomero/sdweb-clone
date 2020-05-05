import { NgModule } from '@angular/core';

import { InformeEditRoutingModule } from './informe-edit-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InformeEditComponent } from './informe-edit.component';
import { EditMapComponent } from './edit-map/edit-map.component';
import { EditListComponent } from './edit-list/edit-list.component';
import { CanvasComponent } from './canvas/canvas.component';
import { ValidateElementoPlantaPipe } from '../pipes/validate-elemento-planta.pipe';
import { AgmCoreModule } from '@agm/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@NgModule({
  declarations: [
    ValidateElementoPlantaPipe,
    InformeEditComponent,
    EditMapComponent,
    EditListComponent,
    CanvasComponent,
  ],
  imports: [
    SharedModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatSliderModule,
    InformeEditRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
  providers: [ValidateElementoPlantaPipe],
})
export class InformeEditModule {}
