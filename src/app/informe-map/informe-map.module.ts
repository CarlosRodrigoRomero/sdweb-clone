import { NgModule } from '@angular/core';
import { PcDetailsDialogComponent } from 'src/app/informe-view/pc-details-dialog/pc-details-dialog.component';
import { FormsModule } from '@angular/forms';

import { InformeMapComponent } from './informe-map.component';
import { SharedModule } from '../shared/shared.module';
import { AgmCoreModule } from '@agm/core';
import { InformeMapRoutingModule } from './informe-map-routing.component';

@NgModule({
  declarations: [InformeMapComponent],
  entryComponents: [PcDetailsDialogComponent],

  imports: [
    InformeMapRoutingModule,
    SharedModule,
    FormsModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
})
export class InformeMapModule {}
