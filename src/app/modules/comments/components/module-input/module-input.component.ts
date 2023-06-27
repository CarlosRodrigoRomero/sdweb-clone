import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { PcService } from '@data/services/pc.service';
import { ReportControlService } from '@data/services/report-control.service';

import { ModuleInputDialogComponent } from '../module-input-dialog/module-input-dialog.component';

import { Anomalia } from '@core/models/anomalia';
import { ModuloInterface } from '@core/models/modulo';

@Component({
  selector: 'app-module-input',
  templateUrl: './module-input.component.html',
  styleUrls: ['./module-input.component.css'],
})
export class ModuleInputComponent implements OnChanges {
  @Input() anomaliaSelected: Anomalia;

  modulo: string;

  constructor(
    private reportControlService: ReportControlService,
    private pcService: PcService,
    private anomaliaService: AnomaliaService,
    private anomaliaInfoService: AnomaliaInfoService,
    public dialog: MatDialog
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.hasOwnProperty('anomaliaSelected')) {
      if (this.anomaliaSelected !== undefined) {
        this.modulo = this.anomaliaInfoService.getModuloLabel(this.anomaliaSelected);
      }
    }
  }

  updateAnomalia(value: any, field: string) {
    // la actualizamos en la anomalía local
    this.anomaliaSelected[field] = value;
    // la actualizamos en la DB
    this.anomaliaService.updateAnomaliaField(this.anomaliaSelected.id, field, value);
  }

  updatePc(value: any, field: string) {
    // la actualizamos en la anomalía local
    this.anomaliaSelected[field] = value;
    // la actualizamos en la DB
    this.pcService.updatePcField(this.anomaliaSelected.id, field, value);
  }

  openDialog() {
    let data = {};
    if (
      this.anomaliaSelected.hasOwnProperty('modulo') &&
      this.anomaliaSelected.modulo !== null &&
      this.anomaliaSelected.modulo !== undefined
    ) {
      data = {
        marca: this.anomaliaSelected.modulo.marca,
        potencia: this.anomaliaSelected.modulo.potencia,
      };
    }

    const dialogRef = this.dialog.open(ModuleInputDialogComponent, {
      data,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result !== undefined) {
        this.saveModule(result.data);
      }
    });
  }

  saveModule(data: any) {
    let modulo: ModuloInterface;
    if (
      this.anomaliaSelected.hasOwnProperty('modulo') &&
      this.anomaliaSelected.modulo !== null &&
      this.anomaliaSelected.modulo !== undefined
    ) {
      modulo = this.anomaliaSelected.modulo;
    }

    // actualizamos el módulo respecto al de la DB
    modulo = {
      ...modulo,
      marca: data.marca,
      potencia: data.potencia,
    };

    // actualizamos el label del módulo
    this.modulo = data.marca + ' (' + data.potencia + 'W)';

    if (this.reportControlService.plantaFija) {
      this.updateAnomalia(modulo, 'modulo');
    } else {
      this.updatePc(modulo, 'modulo');
    }
  }
}
