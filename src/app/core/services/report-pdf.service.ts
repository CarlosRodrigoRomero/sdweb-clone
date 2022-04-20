import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { GLOBAL } from './global';
import { ReportControlService } from './report-control.service';

import { Apartado, ApartadosInforme } from 'src/app/planta-ambas/components/download-pdf/pdf-structure';
import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

@Injectable({
  providedIn: 'root',
})
export class ReportPdfService {
  apartadosInforme: Apartado[] = [];
  private _simplePDF = true;
  simplePDF$ = new BehaviorSubject<boolean>(this._simplePDF);
  informeConImagenes = false;
  incluirImagenes = false;

  constructor(private reportControlService: ReportControlService) {}

  loadApartadosInforme(planta: PlantaInterface, selectedInforme: InformeInterface) {
    const nombresApartados = [
      'introduccion',
      'criterios',
      'normalizacion',
      'datosVuelo',
      'paramsTermicos',
      'clasificacion',
      'resultadosClase',
      'resultadosCategoria',
      'resultadosPosicion',
    ];

    if (!this.simplePDF) {
      nombresApartados.push('perdidaPR', 'resultadosMAE');
    }

    if (!this.reportControlService.noAnomsReport) {
      nombresApartados.push('anexo1');
    }

    if (planta.tipo === 'seguidores') {
      nombresApartados.push('anexoSeguidores');

      if (selectedInforme.fecha > GLOBAL.newReportsDate) {
        nombresApartados.push('anexoSegsNoAnoms');
      }
    } else {
      if (this.reportControlService.thereAreZones) {
        nombresApartados.push('planoTermico');
      }
      // solo disponible para plantas con pocas anomalias
      if (this.informeConImagenes && this.incluirImagenes) {
        nombresApartados.push('anexoAnomalias');
      }
      // if (this.planta.tipo === '1 eje') {
      // nombresApartados.push('anexoSeguidores1EjeAnoms', 'anexoSeguidores1EjeNoAnoms');
      // }
    }

    // solo se añade el plano visual si hay zonas y es un informe de 2021 en adelante
    if (this.reportControlService.thereAreZones && selectedInforme.fecha > GLOBAL.newReportsDate) {
      nombresApartados.push('planoVisual');
    }

    nombresApartados.forEach((nombre) => {
      this.apartadosInforme.push(ApartadosInforme.find((apartado) => apartado.nombre === nombre));
    });

    this.apartadosInforme = this.apartadosInforme.sort((a: Apartado, b: Apartado) => {
      return a.orden - b.orden;
    });
  }

  ///////////////////////////////////////////////////////////////////////////////////

  get simplePDF(): boolean {
    return this._simplePDF;
  }

  set simplePDF(value: boolean) {
    this._simplePDF = value;
    this.simplePDF$.next(value);
  }
}
