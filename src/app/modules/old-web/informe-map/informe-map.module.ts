import { NgModule } from '@angular/core';
import { PcDetailsDialogComponent } from '../informe-view/components/pc-details-dialog/pc-details-dialog.component';

import { InformeMapComponent } from './components/informe-map/informe-map.component';

import { AgmCoreModule } from '@agm/core';
import { InformeMapRoutingModule } from './informe-map-routing.component';

@NgModule({
  declarations: [InformeMapComponent],
  entryComponents: [PcDetailsDialogComponent],

  imports: [
    InformeMapRoutingModule,
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
  ],
})
export class InformeMapModule {}
