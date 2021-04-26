import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import { SharedModule } from '@shared/shared.module';
import { ClustersRoutingModule } from './clusters-routing.module';
import { ClientsModule } from '../clients/clients.module';

import { ClustersComponent } from './components/clusters.component';
import { MapClustersComponent } from './components/map-clusters/map-clusters.component';
import { ImagePointClusterComponent } from './components/image-point-cluster/image-point-cluster.component';
import { ClustersControlComponent } from './components/clusters-control/clusters-control.component';

@NgModule({
  declarations: [ClustersComponent, MapClustersComponent, ImagePointClusterComponent, ClustersControlComponent],
  imports: [CommonModule, ClustersRoutingModule, SharedModule, ClientsModule, HttpClientModule],
})
export class ClustersModule {}
