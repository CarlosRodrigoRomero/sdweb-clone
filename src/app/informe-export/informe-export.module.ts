import { NgModule } from '@angular/core';

import { SharedModule } from '../shared/shared.module';

import { ExportComponent } from './components/export/export.component';

@NgModule({
  declarations: [ExportComponent],
  imports: [SharedModule],
  exports: [ExportComponent],
})
export class InformeExportModule {}
