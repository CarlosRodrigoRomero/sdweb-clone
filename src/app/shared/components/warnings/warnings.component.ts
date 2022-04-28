import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { switchMap, take } from 'rxjs/operators';

import { WarningService } from '@core/services/warning.service';
import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';
import { GLOBAL } from '@core/services/global';

import { Warning } from '../warnings-menu/warnings';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-warnings',
  templateUrl: './warnings.component.html',
  styleUrls: ['./warnings.component.css'],
})
export class WarningsComponent implements OnInit {
  warnings: Warning[] = [];
  private planta: PlantaInterface;

  @Input() informeId: string;

  constructor(
    private warningService: WarningService,
    private router: Router,
    private plantaService: PlantaService,
    private informeService: InformeService
  ) {}

  ngOnInit(): void {
    this.warningService.getWarnings(this.informeId).subscribe((warnings) => (this.warnings = warnings));

    this.informeService
      .getInforme(this.informeId)
      .pipe(
        take(1),
        switchMap((informe) => this.plantaService.getPlanta(informe.plantaId)),
        take(1)
      )
      .subscribe((planta) => (this.planta = planta));
  }

  fixProblem(action: string): void {
    const urlPlantaEdit = this.router.serializeUrl(this.router.createUrlTree(['admin/plants/edit/' + this.planta.id]));
    const urlLocalizaciones = this.router.serializeUrl(
      this.router.createUrlTree(['clientes/auto-loc/' + this.planta.id])
    );
    let urlInforme = this.router.serializeUrl(this.router.createUrlTree(['clients/tracker/' + this.planta.id]));
    if (this.planta.tipo !== 'seguidores') {
      urlInforme = this.router.serializeUrl(this.router.createUrlTree(['clients/fixed/' + this.planta.id]));
    }
    const urlStorage = GLOBAL.urlStorageInformes + '~2F' + this.informeId;

    switch (action) {
      case 'irInforme':
        window.open(urlInforme, '_blank');
        break;
      case 'irPlantaEdit':
        window.open(urlPlantaEdit, '_blank');
        break;
      case 'irLocs':
        window.open(urlLocalizaciones, '_blank');
        break;
      case 'irStorage':
        window.open(urlStorage, '_blank');
        break;
    }
  }
}
