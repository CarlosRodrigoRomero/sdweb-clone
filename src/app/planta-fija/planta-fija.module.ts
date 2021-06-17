import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgModule } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { IvyCarouselModule } from 'angular-responsive-carousel';

import { SwiperModule } from 'swiper/angular';

import { PlantaFijaRoutingModule } from './planta-fija-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';
import { PlantaStatsModule } from '../planta-stats/planta-stats.module';

import { FilterPcsListComponent } from './components/filter-pcs-list/filter-pcs-list.component';
import { ShareMapComponent } from './components/share-map/share-map.component';
import { DownloadReportComponent } from './components/download-report/download-report.component';
import { MapComponent } from './components/map/map.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';

import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { GlobalCoordAreasComponent } from './components/global-coord-areas/global-coord-areas.component';
import { SliderOpacityComponent } from './components/slider-opacity/slider-opacity.component';

@NgModule({
  declarations: [
    MapViewComponent,
    AnomaliaInfoComponent,
    FilterPcsListComponent,
    ShareMapComponent,
    DownloadReportComponent,
    MapComponent,
    SliderTemporalComponent,
    GlobalCoordAreasComponent,
    SliderOpacityComponent,
  ],
  imports: [
    SharedModule,
    NgxSliderModule,
    PlantaFijaRoutingModule,
    NgApexchartsModule,
    FiltersModule,
    IvyCarouselModule,
    SwiperModule,
    PlantaStatsModule,
  ],
  exports: [MapViewComponent],
})
export class PlantaFijaModule {}
