import { NgModule } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { IvyCarouselModule } from 'angular-responsive-carousel';

import { SwiperModule } from 'swiper/angular';

import { PlantaFijaRoutingModule } from './fixed-plant-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '@modules/filters/filters.module';
import { StatsPlantModule } from '@modules/stats-plant/stats-plant.module';
import { SharedPlantsModule } from '@modules/shared-plants/shared-plants.module';

import { AnomaliasListContainer } from './containers/anomalia-list-container/anomalia-list-container.component';

import { AnomaliaListComponent } from './components/anomalia-list/anomalia-list.component';
import { MapComponent } from './components/map/map.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { SliderOpacityComponent } from './components/slider-opacity/slider-opacity.component';

@NgModule({
  declarations: [
    MapViewComponent,
    AnomaliaInfoComponent,
    AnomaliasListContainer,
    AnomaliaListComponent,
    MapComponent,
    SliderOpacityComponent,
  ],
  imports: [
    PlantaFijaRoutingModule,
    NgApexchartsModule,
    FiltersModule,
    IvyCarouselModule,
    SwiperModule,
    StatsPlantModule,
    SharedPlantsModule,
    SharedModule,
  ],
  exports: [MapViewComponent],
})
export class FixedPlantModule {}
