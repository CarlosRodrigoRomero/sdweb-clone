import { NgModule } from '@angular/core';

import { HotkeyModule } from 'angular2-hotkeys';

import { AgmCoreModule } from '@agm/core';

import { InformeEditRoutingModule } from './informe-edit-routing.module';
import { SharedModule } from '@shared/shared.module';

import { InformeEditComponent } from './components/informe-edit/informe-edit.component';
import { EditMapComponent } from './components/edit-map/edit-map.component';
import { EditListComponent } from './components/edit-list/edit-list.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { EditPcDetailComponent } from './components/edit-pc-detail/edit-pc-detail.component';

import { ValidateElementoPlantaPipe } from '@shared/pipes/validate-elemento-planta.pipe';
import { CheckWarningsComponent } from './components/check-warnings/check-warnings.component';

@NgModule({
  declarations: [InformeEditComponent, EditMapComponent, EditListComponent, CanvasComponent, EditPcDetailComponent, CheckWarningsComponent],
  imports: [
    SharedModule,
    InformeEditRoutingModule,
    HotkeyModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
  providers: [ValidateElementoPlantaPipe],
})
export class InformeEditModule {}
