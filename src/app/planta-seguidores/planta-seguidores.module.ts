import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PlantaSeguidoresRoutingModule } from './planta-seguidores-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';
import { PlantaStatsModule } from '../planta-stats/planta-stats.module';
import { PlantaAmbasModule } from '../planta-ambas/planta-ambas.module';

import { MapViewComponent } from './components/map-view/map-view.component';
import { SeguidoresListComponent } from './components/seguidores-list/seguidores-list.component';
import { MapSeguidoresComponent } from './components/map-seguidores/map-seguidores.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { ViewToggleComponent } from './components/view-toggle/view-toggle.component';
import { SliderOpacityComponent } from './components/slider-opacity/slider-opacity.component';
import { SeguidorInfoComponent } from './components/seguidor-info/seguidor-info.component';
import { ShareReportComponent } from './components/share-report/share-report.component';
import { SeguidorViewComponent } from './components/seguidor-view/seguidor-view.component';
import { SeguidorImagesComponent } from './components/seguidor-images/seguidor-images.component';
import { OldPcDetailsDialogComponent } from './components/old-pc-details-dialog/old-pc-details-dialog.component';
import { SeguidorViewToggleComponent } from './components/seguidor-view-toggle/seguidor-view-toggle.component';
import { SeguidorImageToggleComponent } from './components/seguidor-image-toggle/seguidor-image-toggle.component';
import { SeguidorSliderTemporalComponent } from './components/seguidor-slider-temporal/seguidor-slider-temporal.component';
import { SeguidorAnomaliaInfoComponent } from './components/seguidor-anomalia-info/seguidor-anomalia-info.component';
import { SeguidorAnomaliasListComponent } from './components/seguidor-anomalias-list/seguidor-anomalias-list.component';
import { SeguidorImageDownloadComponent } from './components/seguidor-image-download/seguidor-image-download.component';
import { DownloadReportComponent } from './components/download-report/download-report.component';
import { LeyendaComponent } from './components/leyenda/leyenda.component';

@NgModule({
  declarations: [
    MapViewComponent,
    SeguidoresListComponent,
    MapSeguidoresComponent,
    SliderTemporalComponent,
    ViewToggleComponent,
    SliderOpacityComponent,
    SeguidorInfoComponent,
    ShareReportComponent,
    SeguidorViewComponent,
    SeguidorImagesComponent,
    OldPcDetailsDialogComponent,
    SeguidorViewToggleComponent,
    SeguidorImageToggleComponent,
    SeguidorSliderTemporalComponent,
    SeguidorAnomaliaInfoComponent,
    SeguidorAnomaliasListComponent,
    SeguidorImageDownloadComponent,
    DownloadReportComponent,
    LeyendaComponent,
  ],
  imports: [
    CommonModule,
    PlantaSeguidoresRoutingModule,
    SharedModule,
    FiltersModule,
    PlantaStatsModule,
    PlantaAmbasModule,
  ],
})
export class PlantaSeguidoresModule {}
