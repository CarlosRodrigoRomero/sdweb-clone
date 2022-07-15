import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SharedModule } from '@shared/shared.module';

import { TipoSeguidorSelectComponent } from './components/tipo-seguidor-select/tipo-seguidor-select.component';

@NgModule({
  declarations: [TipoSeguidorSelectComponent],
  imports: [CommonModule, SharedModule],
  exports: [TipoSeguidorSelectComponent],
})
export class LocationModule {}
