import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { HttpParams, HttpClient } from '@angular/common/http';

import { StructuresService } from '@core/services/structures.service';

@Component({
  selector: 'app-auto-module-groups',
  templateUrl: './auto-module-groups.component.html',
  styleUrls: ['./auto-module-groups.component.css'],
})
export class AutoModuleGroupsComponent implements OnInit {
  private informeId: string;
  form = new FormGroup({});
  formControl = new FormControl(10, [Validators.min(1), Validators.max(50)]);

  constructor(private http: HttpClient, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.informeId = this.structuresService.informeId;
  }

  autoModuleGroups() {
    const url = `https://europe-west1-sdweb-dev.cloudfunctions.net/agrupaciones`;

    const dilation = this.formControl.value;

    const params = new HttpParams().set('informeId', this.informeId).set('dilation', dilation.toString());

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
