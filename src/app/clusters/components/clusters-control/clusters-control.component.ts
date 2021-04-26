import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

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
  form = new FormGroup({});
  formControlLoc = new FormControl(5, [Validators.min(3), Validators.max(8)]);
  formControlVel = new FormControl(5, [Validators.min(2), Validators.max(8)]);

  constructor(private clustersService: ClustersService, private http: HttpClient) {}

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

  autoCluster() {
    const url = `https://europe-west1-sdweb-dev.cloudfunctions.net/pruebas-2`;

    const umbValue = this.formControlLoc.value / 1000000;
    const velValue = this.formControlVel.value;

    const params = new HttpParams()
      .set('id', 'Alconera02')
      .set('threshold_variation', umbValue.toString())
      .set('threshold_speed', velValue.toString());

    return this.http
      .get(url, { responseType: 'text', params })
      .toPromise()
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }
}
