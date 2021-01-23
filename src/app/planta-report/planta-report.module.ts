import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '@shared/shared.module';
import { SpinnerModule } from '@shared/spinner/spinner.module';
import { ChartModule } from 'primeng/chart';
import { MapViewComponent } from './map-view/map-view.component';
import { PlantaReportRoutingModule } from './planta-repot-routing.module';

@NgModule({
  declarations: [MapViewComponent],
  imports: [SharedModule, SpinnerModule, PlantaReportRoutingModule, ChartModule, FormsModule, ReactiveFormsModule],
})
export class PlantaReportModule {}
