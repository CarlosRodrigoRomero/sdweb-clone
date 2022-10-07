import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';

import { Map } from 'ol';

import { switchMap } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { FilterService } from '@data/services/filter.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { ViewReportService } from '@data/services/view-report.service';

import { Anomalia } from '@core/models/anomalia';

import { GLOBAL } from '@data/constants/global';

import { Colors } from '@core/classes/colors';

@Component({
  selector: 'app-anomalias-list',
  templateUrl: './anomalias-list.component.html',
  styleUrls: ['./anomalias-list.component.css'],
})
export class AnomaliasListComponent implements OnInit, OnDestroy {
  viewSeleccionada: string;
  dataSource: MatTableDataSource<any>;
  selectedRow: string;
  prevSelectedRow: any;
  anomaliaHovered;
  anomaliaSelected;
  private map: Map;
  private selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public filterService: FilterService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService,
    private viewReportService: ViewReportService
  ) {}

  ngOnInit() {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((view) => (this.viewSeleccionada = view))
    );

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$
        .pipe(
          switchMap((informeId) => {
            this.selectedInformeId = informeId;

            return this.filterService.filteredElements$;
          })
        )
        .subscribe((elems) => {
          const filteredElements = [];

          elems
            .filter((elem) => (elem as Anomalia).informeId === this.selectedInformeId)
            .forEach((elem) => {
              const anomalia = elem as Anomalia;

              let numComentarios = null;
              if (anomalia.hasOwnProperty('comentarios')) {
                numComentarios = anomalia.comentarios.length;
              }

              filteredElements.push({
                id: anomalia.id,
                tipoLabel: GLOBAL.labels_tipos[anomalia.tipo],
                tipo: anomalia.tipo,
                perdidas: anomalia.perdidas,
                temp: anomalia.temperaturaMax,
                temperaturaMax: anomalia.temperaturaMax,
                gradiente: anomalia.gradienteNormalizado,
                gradienteNormalizado: anomalia.gradienteNormalizado,
                clase: anomalia.clase,
                anomalia,
                hovered: false,
                selected: false,
                zoom: false,
                numAnom: anomalia.numAnom,
                colors: this.getAnomViewColors(anomalia),
                numComentarios,
              });
            });

          this.dataSource = new MatTableDataSource(filteredElements);

          this.dataSource.filterPredicate = (data, filter: string): boolean => data.numAnom.toString() === filter;
        })
    );

    this.subscriptions.add(
      this.anomaliasControlService.anomaliaHover$.subscribe((anomHov) => (this.anomaliaHovered = anomHov))
    );
    this.subscriptions.add(
      this.anomaliasControlService.anomaliaSelect$.subscribe((anomSel) => (this.anomaliaSelected = anomSel))
    );
  }

  private getAnomViewColors(anomalia: Anomalia): any {
    const colorPerdidas = Colors.getColorPerdidas(anomalia.perdidas, 1);
    const colorCCs = Colors.getColorGradNormMax(anomalia.gradienteNormalizado, 1);
    const colorGradNormMax = Colors.getColorGradNormMax(anomalia.gradienteNormalizado, 1);
    const colorTipo = Colors.getColorTipo(anomalia.tipo);
    return {
      mae: colorPerdidas,
      cc: colorCCs,
      grad: colorGradNormMax,
      tipo: colorTipo,
    };
  }

  hoverAnomalia(row: any) {
    if (this.anomaliasControlService.anomaliaSelect === undefined) {
      if (row.hovered) {
        this.anomaliasControlService.anomaliaHover = row.anomalia;
      } else {
        this.anomaliasControlService.anomaliaHover = undefined;
      }
      this.anomaliasControlService.setExternalStyle(row.id, row.hovered);
    }
  }

  selectAnomalia(row: any) {
    // quitamos el hover de la anomalia
    this.anomaliasControlService.anomaliaHover = undefined;

    // reiniciamos el estilo a la anterior anomalia
    if (this.anomaliasControlService.prevAnomaliaSelect !== undefined) {
      this.anomaliasControlService.setExternalStyle(this.anomaliasControlService.prevAnomaliaSelect.id, false);
    }
    this.anomaliasControlService.prevAnomaliaSelect = row.anomalia;

    this.anomaliasControlService.anomaliaSelect = row.anomalia;
    this.anomaliasControlService.setExternalStyle(row.id, true);

    // centramos la vista al hacer click
    this.centerView(row.anomalia, row.zoom);
  }

  private centerView(anomalia: Anomalia, zoom: boolean) {
    this.map.getView().setCenter(anomalia.featureCoords[0]);
    if (zoom) {
      // aplicamos el zoom en el que cambian la vista de la anomalia para mostrar detalles
      this.map.getView().setZoom(this.anomaliasControlService.zoomChangeView);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
