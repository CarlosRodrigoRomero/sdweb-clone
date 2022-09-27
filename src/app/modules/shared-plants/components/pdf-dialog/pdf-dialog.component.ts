import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { PdfService } from '@data/services/pdf.service';
import { ReportControlService } from '@data/services/report-control.service';

export interface DialogData {
  id: string;
  label: string;
  completed: boolean;
}

@Component({
  selector: 'app-pdf-dialog',
  templateUrl: './pdf-dialog.component.html',
  styleUrls: ['./pdf-dialog.component.css'],
})
export class PdfDialogComponent implements OnInit {
  elemsIntroduccion: DialogData[] = [
    { id: 'introduccion', label: 'Introducción', completed: true },
    { id: 'criterios', label: 'Criterios', completed: true },
    { id: 'normalizacion', label: 'Normalización', completed: true },
    { id: 'datosVuelo', label: 'Datos de vuelo', completed: true },
    { id: 'irradiancia', label: 'Irradiancia', completed: true },
    { id: 'paramsTermicos', label: 'Parámetros térmicos', completed: true },
    { id: 'perdidaPR', label: 'Pérdida PR', completed: true },
    { id: 'clasificacion', label: 'Clasificación', completed: true },
  ];
  elemsOrtofotos: DialogData[] = [{ id: 'planoVisual', label: 'Ortofoto RGB', completed: true }];
  elemsResultados: DialogData[] = [
    { id: 'resultadosClase', label: 'Resultados por clase (CoA)', completed: true },
    { id: 'resultadosCategoria', label: 'Resultados por tipo de anomalía', completed: true },
    { id: 'resultadosPosicion', label: 'Resultados por posición', completed: true },
  ];
  anexoLista = { id: 'anexoLista', label: 'Listado de anomalías', completed: true };
  anexoAnomalias: any = undefined;
  anexoSeguidores: any = undefined;

  form: FormGroup;
  selectEmail = false;
  emailUser = this.reportControlService.user.email;
  emailSelected: string;

  constructor(
    private pdfService: PdfService,
    private reportControlService: ReportControlService,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit(): void {
    if (this.reportControlService.plantaFija) {
      this.anexoAnomalias = { id: 'anexoAnomalias', label: 'Apartado anomalías', completed: true };
      this.elemsOrtofotos.push({ id: 'planoTermico', label: 'Ortofoto térmica', completed: true });
    } else {
      this.anexoSeguidores = [
        { id: 'anexoSeguidores', label: 'Apartado seguidores', completed: true },
        { id: 'anexoSegsNoAnoms', label: 'Apartado seguidores sin anomalías', completed: true },
      ];
    }

    this.buildForm();
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      email: [, [Validators.required, Validators.email]],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      this.emailSelected = this.form.value.email;

      this.generate();
    }
  }

  generate() {
    this.setApartadosPDF();
    this.setEmail();
    this.pdfService.generatePdf = true;
  }

  private setApartadosPDF() {
    const allSecciones = [...this.elemsIntroduccion, ...this.elemsOrtofotos, ...this.elemsResultados, this.anexoLista];
    if (this.reportControlService.plantaFija) {
      allSecciones.push(this.anexoAnomalias);
    } else {
      allSecciones.push(...this.anexoSeguidores);
    }

    const apartadosSelected = allSecciones.filter((apt) => apt.completed);

    this.pdfService.apartadosInforme = apartadosSelected.map((apt) => apt.id);
  }

  private setEmail() {
    if (this.emailSelected === undefined) {
      this.emailSelected = this.emailUser;
    }

    this.pdfService.emailSelected = this.emailSelected;
  }
}
