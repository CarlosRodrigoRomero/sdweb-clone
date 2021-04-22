import { Component, OnInit } from '@angular/core';

import { ClustersService } from '@core/services/clusters.service';

@Component({
  selector: 'app-clusters-control',
  templateUrl: './clusters-control.component.html',
  styleUrls: ['./clusters-control.component.css'],
})
export class ClustersControlComponent implements OnInit {
  deleteMode = false;
  joinActive = false;
  isClusterSelected = false;
  createClusterActive = false;

  constructor(private clustersService: ClustersService) {}

  ngOnInit(): void {
    this.clustersService.clusterSelected$.subscribe((cluster) => {
      if (cluster) {
        this.isClusterSelected = true;
      } else {
        this.isClusterSelected = false;
      }
    });
    this.clustersService.joinActive$.subscribe((join) => (this.joinActive = join));
    this.clustersService.createClusterActive$.subscribe((create) => (this.createClusterActive = create));
  }

  activeDeleteMode() {
    this.deleteMode = !this.deleteMode;
    this.clustersService.deleteMode = this.deleteMode;
  }

  activeJoinMode() {
    this.clustersService.joinActive = !this.clustersService.joinActive;
  }

  createCluster() {
    this.clustersService.clusterSelected = undefined;
    this.clustersService.createClusterActive = !this.clustersService.createClusterActive;
  }
}
