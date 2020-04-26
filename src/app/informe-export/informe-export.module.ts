import { NgModule } from '@angular/core';
import { ExportComponent } from './export/export.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ExportComponent],
  imports: [SharedModule],
})
export class InformeExportModule {}
