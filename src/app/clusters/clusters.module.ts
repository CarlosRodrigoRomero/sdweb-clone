import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClustersRoutingModule } from './clusters-routing.module';
import { ClustersComponent } from './components/clusters.component';
import { MapClustersComponent } from './components/map-clusters/map-clusters.component';


@NgModule({
  declarations: [ClustersComponent, MapClustersComponent],
  imports: [
    CommonModule,
    ClustersRoutingModule
  ]
})
export class ClustersModule { }
