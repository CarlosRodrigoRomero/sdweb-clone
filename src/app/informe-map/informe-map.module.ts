import { NgModule } from '@angular/core';
import { MapComponent } from './map/map.component';
import { AgmCoreModule } from '@agm/core';
import { PcDetailsDialogComponent } from 'src/app/informe-view/pc-details-dialog/pc-details-dialog.component';
import { FormsModule } from '@angular/forms';

import { InformeMapComponent } from './informe-map.component';
// import { AgmJsMarkerClustererModule } from "@agm/js-marker-clusterer";
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [MapComponent, InformeMapComponent],
  entryComponents: [PcDetailsDialogComponent],

  imports: [
    SharedModule,
    FormsModule
    AgmCoreModule.forRoot({
      apiKey: 'AIzaSyAD8uljEDpNHrLWi2e7HYzAE207Q4uyHIM',
      libraries: ['drawing'],
    }),
    // AgmJsMarkerClustererModule
  ],
})
export class InformeMapModule {}
