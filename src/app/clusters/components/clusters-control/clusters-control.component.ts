import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { ClustersService } from '@core/services/clusters.service';

@Component({
  selector: 'app-clusters-control',
  templateUrl: './clusters-control.component.html',
  styleUrls: ['./clusters-control.component.css'],
})
export class ClustersControlComponent implements OnInit {
  joinActive = false;
  isClusterSelected = false;
  createClusterActive = false;
  form: FormGroup;
  formControl = new FormControl(16, Validators.min(10));

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

  deleteCluster() {
    this.clustersService.deleteCluster();
    this.clustersService.clusterSelected = undefined;
  }

  activeJoinMode() {
    this.clustersService.joinActive = !this.clustersService.joinActive;
  }

  createCluster() {
    this.clustersService.clusterSelected = undefined;
    this.clustersService.createClusterActive = !this.clustersService.createClusterActive;
  }

  deleteClusterUnion() {
    this.clustersService.deleteClustersUnion();
    this.clustersService.clusterSelected = undefined;
  }
}
