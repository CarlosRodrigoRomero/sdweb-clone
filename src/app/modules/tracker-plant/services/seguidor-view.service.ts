import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

import { MatSidenav } from '@angular/material/sidenav';

import { SeguidorService } from '@data/services/seguidor.service';
import { SeguidoresControlService } from '@data/services/seguidores-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { ViewReportService } from '@data/services/view-report.service';

import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class SeguidorViewService {
  private _sidenav: MatSidenav;
  private _imageSelected = 0;
  public imageSelected$ = new BehaviorSubject<number>(this._imageSelected);
  private _anomaliaSelected: Anomalia = undefined;
  public anomaliaSelected$ = new BehaviorSubject<Anomalia>(this._anomaliaSelected);
  private _prevAnomaliaSelected: Anomalia = undefined;
  public prevAnomaliaSelected$ = new BehaviorSubject<Anomalia>(this._prevAnomaliaSelected);
  private _anomaliaHovered: Anomalia = undefined;
  public anomaliaHovered$ = new BehaviorSubject<Anomalia>(this._anomaliaHovered);
  private _sliderTemporalSelected: number = 100;
  public sliderTemporalSelected$ = new BehaviorSubject<number>(this._sliderTemporalSelected);
  private _toggleViewSelected = 0;
  public toggleViewSelected$ = new BehaviorSubject<number>(this._toggleViewSelected);
  private _selectedInformeId: string = undefined;
  public selectedInformeId$ = new BehaviorSubject<string>(this._selectedInformeId);
  private _visualCanvas: any = undefined;
  private _thermalCanvas: any = undefined;
  private _anomsCanvas: any = undefined;
  private _imagesLoaded = false;
  public imagesLoaded$ = new BehaviorSubject<boolean>(this._imagesLoaded);
  private viewSelected = 0;

  constructor(
    private seguidoresControlService: SeguidoresControlService,
    private seguidorService: SeguidorService,
    private reportControlService: ReportControlService,
    private viewReportService: ViewReportService
  ) {
    this.toggleViewSelected$.subscribe((view) => (this.viewSelected = view));
    this.viewReportService.toggleViewSelected$.subscribe((viewSelected) => (this.toggleViewSelected = viewSelected));

    this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId));
  }

  getAnomaliaColor(anomalia: Anomalia): string {
    // tslint:disable-next-line: triple-equals
    if (this.viewSelected == 0) {
      return this.seguidorService.getPerdidasAnomColor(anomalia);
      // tslint:disable-next-line: triple-equals
    } else if (this.viewSelected == 1) {
      return this.seguidorService.getCelsCalientesAnomColor(anomalia);
    } else {
      return this.seguidorService.getGradienteAnomColor(anomalia);
    }
  }

  setAnomaliaHoveredStyle(anomalia: Anomalia, hovered: boolean) {
    if (anomalia !== this.anomaliaSelected) {
      const polygon = this.anomsCanvas.getObjects().find((anom) => anom.anomId === anomalia.id);

      if (polygon !== undefined) {
        if (hovered) {
          polygon.set({ stroke: 'white', strokeWidth: 2 });
          this.anomsCanvas.renderAll();
        } else {
          polygon.set({ stroke: this.getAnomaliaColor(anomalia), strokeWidth: 2 });
          this.anomsCanvas.renderAll();
        }
      }
    }
  }

  resetViewValues() {
    this.seguidoresControlService.seguidorSelected = undefined;
    this.seguidoresControlService.prevSeguidorSelected = undefined;
    this.anomaliaSelected = undefined;
    this.seguidoresControlService.urlVisualImageSeguidor = undefined;
    this.seguidoresControlService.urlThermalImageSeguidor = undefined;
    this.imageSelected = 0;
    if (this.visualCanvas !== undefined) {
      this.visualCanvas.clear();
    }
    this.seguidoresControlService.thermalImageExist = true;
    this.seguidoresControlService.visualImageExist = true;
    this.imagesLoaded = false;
    // volvemos el valor al de la vista del mapa
    this.toggleViewSelected = this.viewReportService.toggleViewSelected;
    // limpiamos la feature seleccionada
    this.seguidoresControlService.clearSelectFeature();
    // seleccionamos el mismo que el mapa al cerrar
    this.selectedInformeId = this.reportControlService.selectedInformeId;
  }

  get sidenav() {
    return this._sidenav;
  }

  set sidenav(value: MatSidenav) {
    this._sidenav = value;
  }

  get imageSelected() {
    return this._imageSelected;
  }

  set imageSelected(value: number) {
    this._imageSelected = value;
    this.imageSelected$.next(value);
  }

  get anomaliaSelected() {
    return this._anomaliaSelected;
  }

  set anomaliaSelected(value: Anomalia) {
    this._anomaliaSelected = value;
    this.anomaliaSelected$.next(value);
  }

  get prevAnomaliaSelected() {
    return this._prevAnomaliaSelected;
  }

  set prevAnomaliaSelected(value: Anomalia) {
    this._prevAnomaliaSelected = value;
    this.prevAnomaliaSelected$.next(value);
  }

  get anomaliaHovered() {
    return this._anomaliaHovered;
  }

  set anomaliaHovered(value: Anomalia) {
    this._anomaliaHovered = value;
    this.anomaliaHovered$.next(value);
  }

  get sliderTemporalSelected() {
    return this._sliderTemporalSelected;
  }

  set sliderTemporalSelected(value: number) {
    this._sliderTemporalSelected = value;
    this.sliderTemporalSelected$.next(value);
  }

  get toggleViewSelected() {
    return this._toggleViewSelected;
  }

  set toggleViewSelected(selected: number) {
    this._toggleViewSelected = selected;
    this.toggleViewSelected$.next(selected);
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
