import { NgModule } from '@angular/core';

import { NgApexchartsModule } from 'ng-apexcharts';

import { SwiperModule } from 'swiper/angular';

import { PlantaFijaRoutingModule } from './fixed-plant-routing.module';
import { SharedModule } from '@shared/shared.module';
import { FiltersModule } from '@modules/filters/filters.module';
import { StatsPlantModule } from '@modules/stats-plant/stats-plant.module';
import { SharedPlantsModule } from '@modules/shared-plants/shared-plants.module';
import { CommentsModule } from '@modules/comments/comments.module';

import { AnomaliaListContainer } from './containers/anomalia-list-container/anomalia-list-container.component';

import { FixedPlantComponent } from './components/fixed-plant.component';
import { AnomaliaListComponent } from './components/anomalia-list/anomalia-list.component';
import { MapComponent } from './components/map/map.component';
import { MapViewComponent } from './components/map-view/map-view.component';
import { AnomaliaInfoComponent } from './components/anomalia-info/anomalia-info.component';
import { SliderOpacityComponent } from './components/slider-opacity/slider-opacity.component';
import { LostDashboardComponent } from './components/lost-dashboard/lost-dashboard.component';
import { MapTestComponent } from './components/map-test/map-test.component';

import { DynamicAnomaliaListDirective } from './directives/dynamic-anomalia-list.directive';

@NgModule({
  declarations: [
    MapViewComponent,
    AnomaliaInfoComponent,
    AnomaliaListContainer,
    AnomaliaListComponent,
    MapComponent,
    SliderOpacityComponent,
    DynamicAnomaliaListDirective,
    LostDashboardComponent,
    MapTestComponent,
    FixedPlantComponent,
  ],
  imports: [
    PlantaFijaRoutingModule,
    NgApexchartsModule,
    FiltersModule,
    SwiperModule,
    StatsPlantModule,
    SharedPlantsModule,
    SharedModule,
    CommentsModule,
  ],
  exports: [MapViewComponent],
})
export class FixedPlantModule {}
