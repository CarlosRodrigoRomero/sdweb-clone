import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subscription } from 'rxjs';

import { ComentariosControlService } from '@data/services/comentarios-control.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { AnomaliaInfoService } from '@data/services/anomalia-info.service';
import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ViewCommentsService } from '@data/services/view-comments.service';
import { PcService } from '@data/services/pc.service';

import { Anomalia } from '@core/models/anomalia';
import { Seguidor } from '@core/models/seguidor';

interface AnomaliaInfo {
  numAnom: number;
  localizacion: string;
  tipo: string;
  modulo: string;
}

@Component({
  selector: 'app-anomalia-info',
  templateUrl: './anomalia-info.component.html',
  styleUrls: ['./anomalia-info.component.css'],
})
export class AnomaliaInfoComponent implements OnInit, AfterViewInit, OnDestroy {
  anomaliaSelected: Anomalia;
  anomaliaInfo: AnomaliaInfo = undefined;
  editInput = false;
  form: FormGroup;
  localizacion: string;
  seguidorSelected: Seguidor;
  plantaFija: boolean;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private comentariosControlService: ComentariosControlService,
    private anomaliaService: AnomaliaService,
    private formBuilder: FormBuilder,
    private anomaliaInfoService: AnomaliaInfoService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService,
    private viewCommentsService: ViewCommentsService,
    private pcService: PcService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.plantaFija = this.reportControlService.plantaFija;

    this.subscriptions.add(
      this.comentariosControlService.anomaliaSelected$.subscribe((anom) => {
        this.anomaliaSelected = anom;

        // volvemos el input no editable al cambiar de anomalía
        this.editInput = false;

        if (this.anomaliaSelected !== undefined) {
          let localizacion: string;
          if (this.plantaFija) {
            localizacion = this.anomaliaInfoService.getLocalizacionCompleteTranslateLabel(
              this.anomaliaSelected,
              this.reportControlService.planta
            );
          } else {
            localizacion = this.anomaliaInfoService.getPosicionModuloLabel(
              this.anomaliaSelected,
              this.reportControlService.planta
            );
          }

          this.anomaliaInfo = {
            numAnom: this.anomaliaSelected.numAnom,
            localizacion,
            tipo: this.anomaliaInfoService.getTipoLabel(this.anomaliaSelected),
            modulo: this.anomaliaInfoService.getModuloLabel(this.anomaliaSelected),
          };

          if (this.anomaliaSelected.hasOwnProperty('numeroSerie')) {
            this.form.patchValue({ numeroSerie: this.anomaliaSelected.numeroSerie });
          } else {
            this.form.patchValue({ numeroSerie: null });
          }
        }
      })
    );

    this.subscriptions.add(
      this.comentariosControlService.seguidorSelected$.subscribe((seguidor) => (this.seguidorSelected = seguidor))
    );
  }

  ngAfterViewInit(): void {
    if (!this.plantaFija) {
      const position = document.getElementById('pos-map');
      if (position) {
        position.style.display = 'none';
      }
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      numeroSerie: [, Validators.required],
      módulo: [, Validators.required],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.form.valid) {
      if (this.form.get('numeroSerie').value !== null) {
        if (this.reportControlService.plantaFija) {
          this.updateAnomalia(this.form.get('numeroSerie').value, 'numeroSerie');
        } else {
          this.updatePc(this.form.get('numeroSerie').value, 'numeroSerie');
        }

        // volvemos el input a no editable
        this.editInput = false;
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

  goToAnomMap() {
    const coords = this.anomaliaSelected.featureCoords[0];
    const zoom = this.viewCommentsService.zoomChangeAnomsView;

    this.olMapService.setViewCenter(coords);
    this.olMapService.setViewZoom(zoom);

    this.comentariosControlService.infoOpened = false;
    this.comentariosControlService.listOpened = false;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
