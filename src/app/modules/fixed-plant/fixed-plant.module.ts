import { NgModule } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { IvyCarouselModule } from 'angular-responsive-carousel';

import { SwiperModule } from 'swiper/angular';

import { PlantaFijaRoutingModule } from './fixed-plant-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '../filters/filters.module';
import { StatsPlantModule } from '@modules/stats-plant/stats-plant.module';
import { SharedPlantsModule } from '../shared-plants/shared-plants.module';

import { AnomaliasListComponent } from './components/anomalias-list/anomalias-list.component';
import { MapComponent } from './components/map/map.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { SliderTemporalComponent } from './components/slider-temporal/slider-temporal.component';
import { SliderOpacityComponent } from './components/slider-opacity/slider-opacity.component';

@NgModule({
  declarations: [
    MapViewComponent,
    AnomaliaInfoComponent,
    AnomaliasListComponent,
    MapComponent,
    SliderTemporalComponent,
    SliderOpacityComponent,
  ],
  imports: [
    SharedModule,
    PlantaFijaRoutingModule,
    NgApexchartsModule,
    FiltersModule,
    IvyCarouselModule,
    SwiperModule,
    StatsPlantModule,
    SharedPlantsModule,
  ],
  exports: [MapViewComponent],
})
export class FixedPlantModule {}
