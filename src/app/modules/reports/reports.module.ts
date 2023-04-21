import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportsRoutingModule } from './reports-routing.module';
import { SharedModule } from '@shared/shared.module';

import { ReportsContentComponent } from './components/reports-content.component';

@NgModule({
  declarations: [ReportsContentComponent],
  imports: [CommonModule, ReportsRoutingModule, SharedModule],
})
export class ReportsModule {}
