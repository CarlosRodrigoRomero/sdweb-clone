import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';

import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root'
})
export class AnomaliaImgService {
  private _selectedInformeId: string = undefined;
  public selectedInformeId$ = new BehaviorSubject<string>(this._selectedInformeId);
  private _visualCanvas: any = undefined;
  private _thermalCanvas: any = undefined;
  private _anomsCanvas: any = undefined;
  private _imagesLoaded = false;
  public imagesLoaded$ = new BehaviorSubject<boolean>(this._imagesLoaded);

  constructor(
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
  ) {
    this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));
  }

  resetViewValues() {
    if (this.visualCanvas !== undefined) {
      this.visualCanvas.clear();
    }
    this.anomaliasControlService.thermalImageExist = true;
    this.anomaliasControlService.visualImageExist = true;
    this.imagesLoaded = false;
    // volvemos el valor al de la vista del mapa
    // this.seguidorViewSelected = 'tipo';
    // // limpiamos la feature seleccionada
    // this.anomaliasControlService.clearSelectFeature();
    // seleccionamos el mismo que el mapa al cerrar
    this.selectedInformeId = this.reportControlService.selectedInformeId;
  }

  get selectedInformeId() {
    return this._selectedInformeId;
  }

  set selectedInformeId(value: string) {
    this._selectedInformeId = value;
    this.selectedInformeId$.next(value);
  }

  get visualCanvas() {
    return this._visualCanvas;
  }

  set visualCanvas(value: any) {
    this._visualCanvas = value;
  }

  get thermalCanvas() {
    return this._thermalCanvas;
  }

  set thermalCanvas(value: any) {
    this._thermalCanvas = value;
  }

  get anomsCanvas() {
    return this._anomsCanvas;
  }

  set anomsCanvas(value: any) {
    this._anomsCanvas = value;
  }

  get imagesLoaded() {
    return this._imagesLoaded;
  }

  set imagesLoaded(value: boolean) {
    this._imagesLoaded = value;
    this.imagesLoaded$.next(value);
  }
}
