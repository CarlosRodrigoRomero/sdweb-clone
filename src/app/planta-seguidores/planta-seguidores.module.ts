import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlantaSeguidoresRoutingModule } from './planta-seguidores-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';

import { MapViewComponent } from './components/map-view/map-view.component';
import { SeguidoresListComponent } from './components/seguidores-list/seguidores-list.component';
import { MapSeguidoresComponent } from './components/map-seguidores/map-seguidores.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { ViewToggleComponent } from './components/view-toggle/view-toggle.component';
import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';
import { SliderOpacityComponent } from './components/slider-opacity/slider-opacity.component';
import { SeguidorInfoComponent } from './components/seguidor-info/seguidor-info.component';
import { ShareReportComponent } from './components/share-report/share-report.component';
import { SeguidorViewComponent } from './components/seguidor-view/seguidor-view.component';
import { SeguidorImagesComponent } from './components/seguidor-images/seguidor-images.component';
import { OldPcDetailsDialogComponent } from './components/old-pc-details-dialog/old-pc-details-dialog.component';
import { SeguidorViewToggleComponent } from './components/seguidor-view-toggle/seguidor-view-toggle.component';

@NgModule({
  declarations: [
    MapViewComponent,
    SeguidoresListComponent,
    MapSeguidoresComponent,
    SliderTemporalComponent,
    ViewToggleComponent,
    GlobalCoordAreasComponent,
    SliderOpacityComponent,
    SeguidorInfoComponent,
    ShareReportComponent,
    SeguidorViewComponent,
    SeguidorImagesComponent,
    OldPcDetailsDialogComponent,
    SeguidorViewToggleComponent,
  ],
  imports: [CommonModule, PlantaSeguidoresRoutingModule, SharedModule, FiltersModule],
})
export class PlantaSeguidoresModule {}
