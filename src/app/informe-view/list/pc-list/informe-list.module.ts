import { NgModule } from '@angular/core';

import { PcListComponent } from './pc-list.component';
import { PcDetailsComponent } from '../pc-details/pc-details.component';

import { SharedModule } from '../../../shared/shared.module';

@NgModule({
  declarations: [PcListComponent, PcDetailsComponent],
  exports: [PcListComponent, PcDetailsComponent],
  imports: [SharedModule],
})
export class InformeListModule {}
