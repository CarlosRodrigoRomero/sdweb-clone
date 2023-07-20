import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatRadioChange } from '@angular/material/radio';

import { Subscription } from 'rxjs';

import { PdfService } from '@data/services/pdf.service';
import { ReportControlService } from '@data/services/report-control.service';
import { FilterService } from '@data/services/filter.service';

import { Patches } from '@core/classes/patches';
import { OlMapService } from '@data/services/ol-map.service';

export interface DialogData {
  id: string;
  label: string;
  completed: boolean;
  elems?: DialogData[];
}

@Component({
  selector: 'app-pdf-dialog',
  templateUrl: './pdf-dialog.component.html',
  styleUrls: ['./pdf-dialog.component.css'],
})
export class PdfDialogComponent implements OnInit, OnDestroy {
  elemIntroduccion: DialogData = {
    id: 'introduccion',
    label: 'Introducción',
    completed: false,
    elems: [
      { id: 'criterios', label: 'Criterios', completed: true },
      { id: 'normalizacion', label: 'Normalización', completed: true },
      { id: 'datosVuelo', label: 'Datos de vuelo', completed: true },
      // { id: 'irradiancia', label: 'Irradiancia', completed: true },
      { id: 'paramsTermicos', label: 'Parámetros térmicos', completed: true },
      // { id: 'perdidaPR', label: 'Pérdida PR', completed: true },
      { id: 'clasificacion', label: 'Clasificación', completed: true },
    ],
  };
  allElemsIntroCompleted = true;

  noOrtofotos = false;
  elemOrtofotos: DialogData;
  allElemsOrtoCompleted = true;

  elemResultados: DialogData = {
    id: 'resultados',
    label: 'Resultados termografía',
    completed: false,
    elems: [
      { id: 'resultadosCriticidad', label: 'Resultados por criticidad', completed: true },
      { id: 'resultadosTipo', label: 'Resultados por tipo de anomalía', completed: true },
    ],
  };
  allElemsResultadosCompleted = true;

  // conclusiones = { id: 'conclusiones', label: 'Conclusiones', completed: true };
  anexoLista = { id: 'anexoLista', label: 'Listado de anomalías', completed: true };
  noAptAnoms = false;
  anexoAnomalias: any = undefined;
  elemAnexoSeguidores: DialogData = undefined;
  allElemsSeguidoresCompleted = false;

  form: FormGroup;
  selectEmail = false;
  emailUser = this.reportControlService.user.email;
  emailSelected: string;
  plantaFija = true;
  numAnoms = 0;
  numSegs = 0;
  numElems = 0;
  private selectedInformeId: string;
  filteredPdf = false;
  panelOpenState = false;

  private subscriptions = new Subscription();

  constructor(
    private pdfService: PdfService,
    private reportControlService: ReportControlService,
    private formBuilder: FormBuilder,
    private filterService: FilterService,
    private olMapService: OlMapService
  ) {}

  ngOnInit(): void {
    this.plantaFija = this.reportControlService.plantaFija;

    // si hay más de una fila añadimos este apartado
    if (this.reportControlService.planta.filas > 1) {
      this.elemResultados.elems.push({ id: 'resultadosPosicion', label: 'Resultados por posición', completed: true });
    }

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe(async (informeId) => {
        this.selectedInformeId = informeId;

        if (this.pdfService.filteredPdf) {
          this.numAnoms = this.filterService.filteredElements.filter((anom) => anom.informeId === informeId).length;
          this.numSegs = this.filterService.filteredElements.filter((elem) => elem.informeId === informeId).length;
        } else {
          this.numAnoms = this.reportControlService.allAnomalias.filter((anom) => anom.informeId === informeId).length;
          this.numSegs = this.reportControlService.allFilterableElements.filter(
            (elem) => elem.informeId === informeId
          ).length;
        }

        const informe = this.reportControlService.informes.find((inf) => inf.id === informeId);

        // para plantas de seguidores con servidor antiguo no permitimos las imagenes de tiles
        if (!informe.hasOwnProperty('servidorCapas') || informe.servidorCapas === 'old') {
          this.noOrtofotos = true;
          this.anexoAnomalias = undefined;
        } else if (this.reportControlService.plantaFija) {
          // para Barbastro Sep22 no permitimos los mapas porque fallan
          if (informe.id === 'q915Koqc7kzUQ0GvwwWs') {
            this.noOrtofotos = true;
          }
          this.anexoAnomalias = { id: 'anexoAnomalias', label: 'Imágenes anomalías', completed: false };
        }

        // aplicamos parches para algunos informes
        if (Patches.checkId(informe.id)) {
          this.noOrtofotos = true;
        }

        if (await this.olMapService.checkVisualLayer(informe)) {
          this.elemOrtofotos = {
            id: 'ortofotos',
            label: 'Ortofotos',
            completed: false,
            elems: [{ id: 'planoVisual', label: 'Ortofoto RGB', completed: true }],
          };
        }

        if (this.reportControlService.plantaFija) {
          if (this.elemOrtofotos === undefined) {
            this.elemOrtofotos = {
              id: 'ortofotos',
              label: 'Ortofotos',
              completed: false,
              elems: [{ id: 'planoTermico', label: 'Ortofoto térmica', completed: true }],
            };
          } else {
            this.elemOrtofotos.elems.push({ id: 'planoTermico', label: 'Ortofoto térmica', completed: true });
          }
        } else {
          this.elemAnexoSeguidores = {
            id: 'seguidores',
            label: 'Imágenes seguidores',
            completed: false,
            elems: [
              { id: 'anexoSeguidores', label: 'Seguidores con anomalías', completed: false },
              { id: 'anexoSegsNoAnoms', label: 'Seguidores sin anomalías', completed: false },
            ],
          };
        }
      })
    );

    this.subscriptions.add(
      this.pdfService.filteredPdf$.subscribe((filteredPdf) => {
        if (this.selectedInformeId !== undefined) {
          if (filteredPdf) {
            this.numAnoms = this.filterService.filteredElements.filter(
              (anom) => anom.informeId === this.selectedInformeId
            ).length;
            this.numSegs = this.filterService.filteredElements.filter(
              (elem) => elem.informeId === this.selectedInformeId
            ).length;

            if (!this.reportControlService.plantaFija) {
              this.elemAnexoSeguidores = {
                id: 'seguidores',
                label: 'Imágenes seguidores',
                completed: false,
                elems: [{ id: 'anexoSeguidores', label: 'Seguidores con anomalías', completed: false }],
              };
            }
          } else {
            this.numAnoms = this.reportControlService.allAnomalias.filter(
              (anom) => anom.informeId === this.selectedInformeId
            ).length;
            this.numSegs = this.reportControlService.allFilterableElements.filter(
              (elem) => elem.informeId === this.selectedInformeId
            ).length;

            if (!this.reportControlService.plantaFija) {
              this.elemAnexoSeguidores = {
                id: 'seguidores',
                label: 'Imágenes seguidores',
                completed: false,
                elems: [
                  { id: 'anexoSeguidores', label: 'Seguidores con anomalías', completed: false },
                  { id: 'anexoSegsNoAnoms', label: 'Seguidores sin anomalías', completed: false },
                ],
              };
            }
          }
        }
      })
    );

    this.subscriptions.add(
      this.filterService.filteredElements$.subscribe((filteredElements) => (this.numElems = filteredElements.length))
    );

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
    const allSecciones = [
      // this.conclusiones,
      ...this.elemIntroduccion.elems,
      ...this.elemResultados.elems,
      this.anexoLista,
    ];
    if (!this.noOrtofotos) {
      allSecciones.push(...this.elemOrtofotos.elems);
    }

    if (this.reportControlService.plantaFija) {
      if (this.anexoAnomalias !== undefined) {
        allSecciones.push(this.anexoAnomalias);
      }
    } else {
      allSecciones.push(...this.elemAnexoSeguidores.elems);
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

  setFilteredPdf(event: MatRadioChange) {
    if (event.value === 'filtered') {
      this.pdfService.filteredPdf = true;
    } else {
      this.pdfService.filteredPdf = false;
    }
  }

  updateAllComplete(id: string) {
    switch (id) {
      case 'introduccion':
        this.allElemsIntroCompleted =
          this.elemIntroduccion.elems !== null && this.elemIntroduccion.elems.every((elem) => elem.completed);
        break;
      case 'ortofotos':
        this.allElemsOrtoCompleted =
          this.elemOrtofotos.elems !== null && this.elemOrtofotos.elems.every((elem) => elem.completed);
        break;
      case 'resultados':
        this.allElemsResultadosCompleted =
          this.elemResultados.elems !== null && this.elemResultados.elems.every((elem) => elem.completed);
        break;
      case 'seguidores':
        this.allElemsSeguidoresCompleted =
          this.elemAnexoSeguidores.elems !== null && this.elemAnexoSeguidores.elems.every((elem) => elem.completed);
        break;
    }
  }

  someComplete(id: string): boolean {
    switch (id) {
      case 'introduccion':
        if (this.elemIntroduccion.elems === null) {
          return false;
        }
        return this.elemIntroduccion.elems.filter((elem) => elem.completed).length > 0 && !this.allElemsIntroCompleted;
      case 'ortofotos':
        if (this.elemOrtofotos.elems === null) {
          return false;
        }
        return this.elemOrtofotos.elems.filter((elem) => elem.completed).length > 0 && !this.allElemsOrtoCompleted;
      case 'resultados':
        if (this.elemResultados.elems === null) {
          return false;
        }
        return (
          this.elemResultados.elems.filter((elem) => elem.completed).length > 0 && !this.allElemsResultadosCompleted
        );
      case 'seguidores':
        if (this.elemAnexoSeguidores.elems === null) {
          return false;
        }
        return (
          this.elemAnexoSeguidores.elems.filter((elem) => elem.completed).length > 0 &&
          !this.allElemsSeguidoresCompleted
        );
    }
  }

  setAll(completed: boolean, id: string) {
    switch (id) {
      case 'introduccion':
        this.allElemsIntroCompleted = completed;
        if (this.elemIntroduccion.elems == null) {
          return;
        }
        this.elemIntroduccion.elems.forEach((elem) => (elem.completed = completed));
        break;
      case 'ortofotos':
        this.allElemsOrtoCompleted = completed;
        if (this.elemOrtofotos.elems == null) {
          return;
        }
        this.elemOrtofotos.elems.forEach((elem) => (elem.completed = completed));
        break;
      case 'resultados':
        this.allElemsResultadosCompleted = completed;
        if (this.elemResultados.elems == null) {
          return;
        }
        this.elemResultados.elems.forEach((elem) => (elem.completed = completed));
        break;
      case 'seguidores':
        this.allElemsSeguidoresCompleted = completed;
        if (this.elemAnexoSeguidores.elems == null) {
          return;
        }
        this.elemAnexoSeguidores.elems.forEach((elem) => (elem.completed = completed));
        break;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
