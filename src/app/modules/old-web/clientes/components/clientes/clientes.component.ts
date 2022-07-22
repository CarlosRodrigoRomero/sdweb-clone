import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { PlantaService } from '@data/services/planta.service';
import { SeguidorService } from '@data/services/seguidor.service';
import { InformeService } from '@data/services/informe.service';

import { PlantaInterface } from '@core/models/planta';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {
  dataLoaded = false;

  constructor(
    private router: Router,
    private plantaService: PlantaService,
    private seguidorService: SeguidorService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    if (this.router.url.includes('informe-view')) {
      const informeId = this.router.url.split('/')[this.router.url.split('/').length - 2];

      this.informeService
        .getInforme(informeId)
        .pipe(switchMap((informe) => this.plantaService.getPlanta(informe.plantaId)))
        .subscribe((planta) => {
          this.seguidorService.planta = planta;

          this.dataLoaded = true;
        });
    } else {
      this.dataLoaded = true;
    }
  }
}
