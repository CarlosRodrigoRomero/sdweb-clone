import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { Map } from 'ol';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { GLOBAL } from '@data/constants/global';
import { FilterService } from '@data/services/filter.service';
import { AnomaliasControlService } from '@data/services/anomalias-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { OlMapService } from '@data/services/ol-map.service';
import { PlantaService } from '@data/services/planta.service';
import { ViewReportService } from '@data/services/view-report.service';
import { ZonesControlService } from '@data/services/zones-control.service';

import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';

@Component({
  selector: 'app-anomalias-list',
  templateUrl: './anomalias-list.component.html',
  styleUrls: ['./anomalias-list.component.css'],
})
export class AnomaliasListComponent implements OnInit, AfterViewInit, OnDestroy {
  viewSeleccionada = 0;
  displayedColumns: string[] = [];
  dataSource: MatTableDataSource<any>;
  public selectedRow: string;
  public prevSelectedRow: any;
  public anomaliaHover;
  public anomaliaSelect;
  private map: Map;
  private planta: PlantaInterface;
  private selectedInformeId: string;

  @ViewChild(MatSort) sort: MatSort;

  private subscriptions: Subscription = new Subscription();

  constructor(
    public filterService: FilterService,
    private anomaliasControlService: AnomaliasControlService,
    private reportControlService: ReportControlService,
    private olMapService: OlMapService,
    private plantaService: PlantaService,
    private viewReportService: ViewReportService,
    private zonesControlService: ZonesControlService
  ) {}

  ngOnInit() {
    this.subscriptions.add(this.olMapService.map$.subscribe((map) => (this.map = map)));

    this.subscriptions.add(
      this.viewReportService.reportViewSelected$.subscribe((sel) => {
        this.viewSeleccionada = Number(sel);

        // cambiammos la ultima columna con la vista seleccionada
        switch (this.viewSeleccionada) {
          case 0:
            this.displayedColumns = ['numAnom', 'tipo', 'temp', 'perdidas'];
            break;
          case 1:
            this.displayedColumns = ['numAnom', 'tipo', 'temp', 'celsCalientes'];
            break;
          case 2:
            this.displayedColumns = ['numAnom', 'tipo', 'temp', 'gradiente'];
            break;
        }
      })
    );

    this.planta = this.reportControlService.planta;

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
            .forEach((anom) =>
              filteredElements.push({
                id: anom.id,
                tipoLabel: GLOBAL.labels_tipos[anom.tipo],
                tipo: anom.tipo,
                perdidas: anom.perdidas,
                temp: anom.temperaturaMax,
                temperaturaMax: anom.temperaturaMax,
                gradiente: anom.gradienteNormalizado,
                gradienteNormalizado: anom.gradienteNormalizado,
                color: GLOBAL.colores_tipos[anom.tipo],
                clase: anom.clase,
                anomalia: anom,
                selected: false,
                hovered: false,
                numAnom: anom.numAnom,
              })
            );

          this.dataSource = new MatTableDataSource(filteredElements);
          this.dataSource.sort = this.sort;

          this.dataSource.filterPredicate = (data, filter: string): boolean => data.numAnom.toString() === filter;
        })
    );

    this.subscriptions.add(
      this.anomaliasControlService.anomaliaHover$.subscribe((anomHov) => (this.anomaliaHover = anomHov))
    );
    this.subscriptions.add(
      this.anomaliasControlService.anomaliaSelect$.subscribe((anomSel) => (this.anomaliaSelect = anomSel))
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  hoverAnomalia(row: any) {
    if (this.anomaliasControlService.anomaliaSelect === undefined) {
      this.anomaliasControlService.anomaliaHover = row.anomalia;
      this.anomaliasControlService.setExternalStyle(row.id, true, true);
    }
  }

  unhoverAnomalia(row: any) {
    if (this.anomaliasControlService.anomaliaSelect === undefined) {
      this.anomaliasControlService.anomaliaHover = undefined;
      this.anomaliasControlService.setExternalStyle(row.id, false, false);
    }
  }

  selectAnomalia(row: any, zoom: boolean) {
    // quitamos el hover de la anomalia
    this.anomaliasControlService.anomaliaHover = undefined;

    this.zonesControlService.currentLayerSelected = this.anomaliasControlService.getLayerViewAnomalias(row.id);

    // reiniciamos el estilo a la anterior anomalia
    if (this.anomaliasControlService.prevAnomaliaSelect !== undefined) {
      this.anomaliasControlService.setExternalStyle(this.anomaliasControlService.prevAnomaliaSelect.id, false);
    }
    this.anomaliasControlService.prevAnomaliaSelect = row.anomalia;

    this.anomaliasControlService.anomaliaSelect = row.anomalia;
    this.anomaliasControlService.setExternalStyle(row.id, true, true);

    // centramos la vista al hacer click
    this.centerView(row.anomalia, zoom);
  }

  private centerView(anomalia: Anomalia, zoom: boolean) {
    this.map.getView().setCenter(anomalia.featureCoords[0]);
    if (zoom) {
      this.map.getView().setZoom(this.planta.zoom + 6);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
