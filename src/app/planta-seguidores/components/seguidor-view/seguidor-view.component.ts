import { Component, OnInit } from '@angular/core';
import { Seguidor } from '@core/models/seguidor';

import { SeguidoresControlService } from '../../services/seguidores-control.service';

@Component({
  selector: 'app-seguidor-view',
  templateUrl: './seguidor-view.component.html',
  styleUrls: ['./seguidor-view.component.css'],
})
export class SeguidorViewComponent implements OnInit {
  public seguidorSelected: Seguidor = undefined;
  public moduloLabel: string;

  constructor(private seguidoresControlService: SeguidoresControlService) {}

  ngOnInit(): void {
    this.seguidoresControlService.seguidorSelected$.subscribe((seguidor) => {
      this.seguidorSelected = seguidor;
      if (seguidor !== undefined) {
        this.moduloLabel = this.getModuloLabel(seguidor);
      }

      this.seguidoresControlService.getImageSeguidor('jpg');
    });
  }

  getModuloLabel(elem: Seguidor): string {
    let moduloLabel: string;
    if (elem.modulo !== undefined) {
      if (elem.modulo.marca === undefined) {
        if (elem.modulo.modelo === undefined) {
          moduloLabel = elem.modulo.potencia + 'W';
        } else {
          moduloLabel = elem.modulo.modelo + ' ' + elem.modulo.potencia + 'W';
        }
      } else {
        if (elem.modulo.modelo === undefined) {
          moduloLabel = elem.modulo.marca + ' ' + elem.modulo.potencia + 'W';
        } else {
          moduloLabel = elem.modulo.marca + ' ' + elem.modulo.modelo + ' ' + elem.modulo.potencia + 'W';
        }
      }
    } else {
      moduloLabel = 'Desconocido';
    }

    return moduloLabel;
  }
}
