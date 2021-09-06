import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { combineLatest, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { StructuresService } from '@core/services/structures.service';

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
  form: FormGroup;
  groupsWithoutNormMod: ModuleGroup[] = [];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private structuresService: StructuresService
  ) {}

  ngOnInit(): void {
    combineLatest([this.structuresService.getModuleGroups(), this.structuresService.getNormModules()])
      .pipe(take(1))
      .subscribe(([groups, normMods]) => {
        this.moduleGroups = groups;
        this.normModules = normMods;

        this.moduleGroups.forEach((group) => {
          if (this.normModules.map((normMod) => normMod.agrupacionId).includes(group.id)) {
            this.groupsWithoutNormMod.push(group);
          }
        });
      });

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      filas: [1, [Validators.required, Validators.min(1)]],
      columnas: [1, [Validators.required, Validators.min(1)]],
      ventana: [7, [Validators.required, Validators.min(3), Validators.max(10)]],
    });
  }

  onSubmit(select: string) {
    if (select === 'all') {
      this.autoNormModules(this.moduleGroups);
    } else {
      this.autoNormModules(this.groupsWithoutNormMod);
    }
  }

  autoNormModules(moduleGroups: ModuleGroup[]) {
    const url = `https://europe-west1-sdweb-d33ce.cloudfunctions.net/estructura`;

    if (this.form.valid) {
      const filas = this.form.get('filas').value;
      const columnas = this.form.get('columnas').value;
      const ventana = this.form.get('ventana').value;

      moduleGroups.forEach((group) => {
        const params = new HttpParams()
          .set('informeId', this.structuresService.informeId)
          .set('agrupacionId', group.id)
          .set('filas', filas.toString())
          .set('columnas', columnas.toString())
          .set('ventana', ventana.toString());

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
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
