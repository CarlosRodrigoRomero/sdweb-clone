import { Component, OnDestroy, OnInit } from '@angular/core';

import { Subscription } from 'rxjs';

import { ClustersService } from '@data/services/clusters.service';
import { ResetServices } from '@data/services/reset-services.service';

import { Cluster } from '@core/models/cluster';

@Component({
  selector: 'app-clusters',
  templateUrl: './clusters.component.html',
  styleUrls: ['./clusters.component.css'],
})
export class ClustersComponent implements OnInit, OnDestroy {
  public trayectoriaLoaded = false;
  public nombrePlanta: string;
  clusterSelected: Cluster = undefined;

  private subscriptions: Subscription = new Subscription();

  constructor(private clustersService: ClustersService, private resetServices: ResetServices) {}

  ngOnInit(): void {
    this.subscriptions.add(this.clustersService.initService().subscribe((v) => (this.trayectoriaLoaded = v)));
    this.subscriptions.add(this.clustersService.planta$.subscribe((planta) => (this.nombrePlanta = planta.nombre)));
    this.subscriptions.add(
      this.clustersService.clusterSelected$.subscribe((cluster) => (this.clusterSelected = cluster))
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();

    this.resetServices.resetAllServices();
  }
}
