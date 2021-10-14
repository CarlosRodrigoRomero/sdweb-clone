import { NgxSliderModule } from '@angular-slider/ngx-slider';
import { NgModule } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { IvyCarouselModule } from 'angular-responsive-carousel';

import { SwiperModule } from 'swiper/angular';

import { PlantaFijaRoutingModule } from './planta-fija-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';
import { PlantaStatsModule } from '../planta-stats/planta-stats.module';
import { PlantaAmbasModule } from '../planta-ambas/planta-ambas.module';
import { InformeExportModule } from '../informe-export/informe-export.module';

import { AnomaliasListComponent } from './components/anomalias-list/anomalias-list.component';
import { MapComponent } from './components/map/map.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { SliderOpacityComponent } from './components/slider-opacity/slider-opacity.component';
import { MapControlsComponent } from './components/map-controls/map-controls.component';

@NgModule({
  declarations: [
    MapViewComponent,
    AnomaliaInfoComponent,
    AnomaliasListComponent,
    MapComponent,
    SliderTemporalComponent,
    SliderOpacityComponent,
    MapControlsComponent,
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
    PlantaAmbasModule,
    InformeExportModule,
  ],
  exports: [MapViewComponent],
})
export class PlantaFijaModule {}
