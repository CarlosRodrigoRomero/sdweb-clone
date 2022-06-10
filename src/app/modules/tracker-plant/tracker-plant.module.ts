import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlantaSeguidoresRoutingModule } from './tracker-plant-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '@modules/filters/filters.module';
import { StatsPlantModule } from '@modules/stats-plant/stats-plant.module';
import { SharedPlantsModule } from '@modules/shared-plants/shared-plants.module';

import { MapViewComponent } from './components/map-view/map-view.component';
import { SeguidoresListComponent } from './components/seguidores-list/seguidores-list.component';
import { MapSeguidoresComponent } from './components/map-seguidores/map-seguidores.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { ViewToggleComponent } from './components/view-toggle/view-toggle.component';
import { SeguidorInfoComponent } from './components/seguidor-info/seguidor-info.component';
import { SeguidorViewComponent } from './components/seguidor-view/seguidor-view.component';
import { SeguidorImagesComponent } from './components/seguidor-images/seguidor-images.component';
import { OldPcDetailsDialogComponent } from './components/old-pc-details-dialog/old-pc-details-dialog.component';
import { SeguidorViewToggleComponent } from './components/seguidor-view-toggle/seguidor-view-toggle.component';
import { SeguidorImageToggleComponent } from './components/seguidor-image-toggle/seguidor-image-toggle.component';
import { SeguidorSliderTemporalComponent } from './components/seguidor-slider-temporal/seguidor-slider-temporal.component';
import { SeguidorAnomaliaInfoComponent } from './components/seguidor-anomalia-info/seguidor-anomalia-info.component';
import { SeguidorAnomaliasListComponent } from './components/seguidor-anomalias-list/seguidor-anomalias-list.component';
import { SeguidorImageDownloadComponent } from './components/seguidor-image-download/seguidor-image-download.component';
import { LeyendaComponent } from './components/leyenda/leyenda.component';
import { SeguidorViewNavbarComponent } from './components/seguidor-view-navbar/seguidor-view-navbar.component';
import { SeguidorViewLeyendaComponent } from './components/seguidor-view-leyenda/seguidor-view-leyenda.component';
import { SeguidorImagesAreaComponent } from './components/seguidor-images-area/seguidor-images-area.component';
import { ViewControlComponent } from './components/view-control/view-control.component';

@NgModule({
  declarations: [
    MapViewComponent,
    SeguidoresListComponent,
    MapSeguidoresComponent,
    SliderTemporalComponent,
    ViewToggleComponent,
    SeguidorInfoComponent,
    SeguidorViewComponent,
    SeguidorImagesComponent,
    OldPcDetailsDialogComponent,
    SeguidorViewToggleComponent,
    SeguidorImageToggleComponent,
    SeguidorSliderTemporalComponent,
    SeguidorAnomaliaInfoComponent,
    SeguidorAnomaliasListComponent,
    SeguidorImageDownloadComponent,
    LeyendaComponent,
    SeguidorViewNavbarComponent,
    SeguidorViewLeyendaComponent,
    SeguidorImagesAreaComponent,
    ViewControlComponent,
  ],
  imports: [
    CommonModule,
    PlantaSeguidoresRoutingModule,
    FiltersModule,
    StatsPlantModule,
    SharedPlantsModule,
    SharedModule,
  ],
})
export class TrackerPlantModule {}
