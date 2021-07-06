import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { StructuresService } from '@core/services/structures.service';

@Component({
  selector: 'app-auto-norm-modules',
  templateUrl: './auto-norm-modules.component.html',
  styleUrls: ['./auto-norm-modules.component.css'],
})
export class AutoNormModulesComponent implements OnInit {
  private moduleGroups: any[];
  form: FormGroup;

  constructor(
    private http: HttpClient,
    private formBuilder: FormBuilder,
    private structuresService: StructuresService
  ) {}

  ngOnInit(): void {
    this.structuresService.getModuleGroups().subscribe((groups) => (this.moduleGroups = groups));

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      filas: [1, [Validators.required, Validators.min(1)]],
      columnas: [1, [Validators.required, Validators.min(1)]],
      ventana: [7, [Validators.required, Validators.min(3), Validators.max(10)]],
    });
  }

  autoNormModules(event: Event) {
    event.preventDefault();

    const url = `https://europe-west1-sdweb-dev.cloudfunctions.net/estructura`;

    if (this.form.valid) {
      const filas = this.form.get('filas').value;
      const columnas = this.form.get('columnas').value;
      const ventana = this.form.get('ventana').value;

      this.moduleGroups.forEach((group) => {
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
}
