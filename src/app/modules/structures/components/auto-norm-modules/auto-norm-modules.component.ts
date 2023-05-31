import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { combineLatest, Subscription } from 'rxjs';

import { StructuresService } from '@data/services/structures.service';

import { NormalizedModule } from '@core/models/normalizedModule';
import { ModuleGroup } from '@core/models/moduleGroup';

@Component({
  selector: 'app-auto-norm-modules',
  templateUrl: './auto-norm-modules.component.html',
  styleUrls: ['./auto-norm-modules.component.css'],
})
export class AutoNormModulesComponent implements OnInit, OnDestroy {
  private moduleGroups: any[];
  private normModules: NormalizedModule[];
  groupsWithoutNormMod: ModuleGroup[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(private http: HttpClient, private structuresService: StructuresService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      combineLatest([this.structuresService.allModGroups$, this.structuresService.allNormModules$]).subscribe(
        ([groups, normMods]) => {
          this.moduleGroups = groups;
          this.normModules = normMods;

          // vaciamos el array para que no se acumule
          this.groupsWithoutNormMod = [];

          this.moduleGroups.forEach((group) => {
            if (!this.normModules.map((normMod) => normMod.agrupacionId).includes(group.id)) {
              this.groupsWithoutNormMod.push(group);
            }
          });
        }
      )
    );
  }

  autoNorm(select: string) {
    if (select === 'all') {
      this.autoNormModules(this.moduleGroups);
    } else {
      this.autoNormModules(this.groupsWithoutNormMod);
    }
  }

  autoNormModules(moduleGroups: ModuleGroup[]) {
    const url = `https://modulosbruto-to-modulosnormalizados-rcpywurt6q-ew.a.run.app/`;

    moduleGroups.forEach((group) => {
      const params = new HttpParams().set('informeId', this.structuresService.informeId).set('agrupacionId', group.id);

      return this.http
        .get(url, { responseType: 'text', params })
        .toPromise()
        .then((res) => {
          console.log(res);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
