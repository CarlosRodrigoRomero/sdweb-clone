import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgApexchartsModule } from 'ng-apexcharts';

import { IvyCarouselModule } from 'angular-responsive-carousel';

import { SwiperModule } from 'swiper/angular';

import { SharedModule } from '@shared/shared.module';
import { SharedPlantsModule } from '@modules/shared-plants/shared-plants.module';
import { FiltersModule } from '@modules/filters/filters.module';
import { CubiertaRoutingModule } from './rooftop-plant-routing.module';
import { StatsPlantModule } from '@modules/stats-plant/stats-plant.module';

import { AnomaliaListContainer } from './containers/anomalia-list-container/anomalia-list-container.component';

import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { AnomaliaListComponent } from './components/anomalia-list/anomalia-list.component';
import { MapComponent } from './components/map/map.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { RooftopPlantComponent } from './components/rooftop-plant.component';
import { MapAnomComponent } from './components/map-anom/map-anom.component';



@NgModule({
  declarations: [
    AnomaliaInfoComponent,
    AnomaliaListComponent,
    MapComponent,
    MapViewComponent,
    RooftopPlantComponent,
    AnomaliaListContainer,
    MapAnomComponent
  ],
  imports: [
    CommonModule,
    SharedPlantsModule,
    SharedModule,
    NgApexchartsModule,
    FiltersModule,
    IvyCarouselModule,
    SwiperModule,
    CubiertaRoutingModule,
    StatsPlantModule
  ],
  exports: [MapViewComponent],
})
export class RooftopPlantModule { }
