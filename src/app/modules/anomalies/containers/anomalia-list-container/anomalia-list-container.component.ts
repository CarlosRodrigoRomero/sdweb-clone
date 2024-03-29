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
import { NumAnomFilter } from '@core/models/numAnomFilter';

import { GLOBAL } from '@data/constants/global';

import { Colors } from '@core/classes/colors';

@Component({
  selector: 'app-anomalia-list-container',
  templateUrl: './anomalia-list-container.component.html',
  styleUrls: ['./anomalia-list-container.component.css'],
})
export class AnomaliaListContainer implements OnInit, OnDestroy {
  viewSeleccionada: string;
  dataSource: MatTableDataSource<any>;
  allData: any[];
  selectedRow: string;
  prevSelectedRow: any;
  anomaliaHovered;
  anomaliaSelected;
  private map: Map;
  private selectedInformeId: string;
  private dataInforme: any[];

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

    this.loadData().then(() => {
      this.subscriptions.add(
        this.reportControlService.selectedInformeId$
          .pipe(
            switchMap((informeId) => {
              this.selectedInformeId = informeId;
              if (this.selectedInformeId !== undefined) {
                this.dataInforme = this.allData.filter((data) => data.informeId === this.selectedInformeId);

                this.dataSource = new MatTableDataSource(this.dataInforme);

                this.dataSource.filterPredicate = (data, filter: string): boolean => data.numAnom.toString() === filter;
              }

              return this.filterService.filteredElements$;
            })
          )
          .subscribe((elems) => {
            if (this.allData !== undefined) {
              if (this.filterService.cleaningFilters) {
                this.dataSource.data = this.dataInforme;
              } else if (elems.length !== this.allData.length) {
                this.dataSource.data = this.dataInforme.filter((dataElem) =>
                  elems.map((elem) => elem.id).includes(dataElem.id)
                );
              }
            }
          })
      );
    });

    this.subscriptions.add(
      this.anomaliasControlService.anomaliaHover$.subscribe((anomHov) => (this.anomaliaHovered = anomHov))
    );
    this.subscriptions.add(
      this.anomaliasControlService.anomaliaSelect$.subscribe((anomSel) => (this.anomaliaSelected = anomSel))
    );
  }

  private loadData(): Promise<void> {
    return new Promise((resolve, reject) => {
      const data: any[] = [];

      this.reportControlService.allAnomalias.forEach((anom) => {
        let numComentarios = null;
        if (anom.hasOwnProperty('comentarios')) {
          numComentarios = anom.comentarios.length;
        }

        data.push({
          id: anom.id,
          informeId: anom.informeId,
          tipoLabel: GLOBAL.labels_tipos[anom.tipo],
          tipo: anom.tipo,
          perdidas: anom.perdidas,
          temp: anom.temperaturaMax,
          temperaturaMax: anom.temperaturaMax,
          gradiente: anom.gradienteNormalizado,
          gradienteNormalizado: anom.gradienteNormalizado,
          clase: anom.clase,
          anomalia: anom,
          hovered: false,
          selected: false,
          zoom: false,
          numAnom: anom.numAnom,
          colors: this.getAnomViewColors(anom),
          numComentarios,
        });
      });

      this.allData = data;

      resolve();
    });
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
    // if (this.anomaliasControlService.anomaliaSelect === undefined) {
    if (row.hovered && this.map) {
      this.anomaliasControlService.anomaliaHover = row.anomalia;
      let coords = row.anomalia.featureCoords[0];
      this.anomaliasControlService.setPopupPosition(coords);
    } else {
      this.anomaliasControlService.anomaliaHover = undefined;
    }
    this.anomaliasControlService.setExternalStyle(row.id, row.hovered, row.anomalia.featureType);
    // }
  }

  selectAnomalia(row: any) {
    if (row !== undefined) {
      // quitamos el hover de la anomalia
      this.anomaliasControlService.anomaliaHover = undefined;

      // reiniciamos el estilo a la anterior anomalia
      if (this.anomaliasControlService.prevAnomaliaSelect !== undefined) {
        this.anomaliasControlService.setExternalStyle(
          this.anomaliasControlService.prevAnomaliaSelect.id,
          false,
          this.anomaliasControlService.prevAnomaliaSelect.featureType
        );
      }
      this.anomaliasControlService.prevAnomaliaSelect = row.anomalia;

      this.anomaliasControlService.anomaliaSelect = row.anomalia;
      this.anomaliasControlService.selectionMethod = 'list';
      this.anomaliasControlService.setExternalStyle(row.id, true, row.anomalia.featureType);

      // centramos la vista al hacer click
      this.centerView(row.anomalia, row.zoom);
    } else {
      this.anomaliasControlService.anomaliaSelect = undefined;
    }
  }

  filterAnoms(filterValue: string) {
    const filter = new NumAnomFilter('id', 'numAnom', Number(filterValue));

    if (filterValue !== '') {
      this.filterService.addFilter(filter);
    } else {
      this.filterService.deleteFilter(filter);
    }
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
