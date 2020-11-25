import { NgModule } from '@angular/core';

import { InformeEditRoutingModule } from './informe-edit-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InformeEditComponent } from './components/informe-edit/informe-edit.component';
import { EditMapComponent } from './components/edit-map/edit-map.component';
import { EditListComponent } from './components/edit-list/edit-list.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { ValidateElementoPlantaPipe } from '../pipes/validate-elemento-planta.pipe';
import { AgmCoreModule } from '@agm/core';
import { EditPcDetailComponent } from './components/edit-pc-detail/edit-pc-detail.component';
import { HotkeyModule } from 'angular2-hotkeys';

import { MaterialModule } from '@material/material.module';

@NgModule({
  declarations: [
    ValidateElementoPlantaPipe,
    InformeEditComponent,
    EditMapComponent,
    EditListComponent,
    CanvasComponent,
    EditPcDetailComponent,
  ],
  imports: [
    SharedModule,
    MaterialModule,
    InformeEditRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HotkeyModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
  providers: [ValidateElementoPlantaPipe],
})
export class InformeEditModule {}
