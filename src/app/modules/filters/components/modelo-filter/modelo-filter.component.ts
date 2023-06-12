import { Component, OnInit, OnDestroy } from '@angular/core';
import { SelectionModel } from '@angular/cdk/collections';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { switchMap, take } from 'rxjs/operators';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { FilterService } from '@data/services/filter.service';
import { AnomaliaService } from '@data/services/anomalia.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { ReportControlService } from '@data/services/report-control.service';
import { PlantaService } from '@data/services/planta.service';

import { ModeloFilter } from '@core/models/modeloFilter';
import { Anomalia } from '@core/models/anomalia';
import { PlantaInterface } from '@core/models/planta';


export interface LabelModelo {
  modelo: number;
  label?: string;
  count?: number;
  completed?: boolean;
}

@Component({
  selector: 'app-modelo-filter',
  templateUrl: './modelo-filter.component.html',
  styleUrls: ['./modelo-filter.component.css']
})
export class ModeloFilterComponent implements OnInit, OnDestroy {

  modelosElem: LabelModelo[] = [];
  filtroModelo: ModeloFilter;
  filterModeloCounts: number[] = [];

  defaultLabelStatus = true;
  defaultSelectLabel = 'Modelo';
  selectedLabels: string[] = [this.defaultSelectLabel];

  modelosSelected: boolean[];
  selection = new SelectionModel<LabelModelo>(true, []);

  public plantaId: string;
  private planta: PlantaInterface;
  public informesIdList: string[];
  public allAnomalias: Anomalia[];
  public allModelos: string[];

  public labelsCategoria: string[];
  public coloresCategoria: string[];
  public numsCategoria: number[];

  selectedInformeId: string;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private filterService: FilterService,
    private anomaliaService: AnomaliaService,
    private filterControlService: FilterControlService,
    private reportControlService: ReportControlService,
    private plantaService: PlantaService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.plantaId = this.reportControlService.plantaId;
    this.informesIdList = this.reportControlService.informesIdList;
    // const anomalias = this.anomaliaService.getRealAnomalias(this.reportControlService.allAnomalias);
    // this.modelos = [...new Set(anomalias.map((anomalia) => `${anomalia.modulo.marca} (${anomalia.modulo.potencia}W)`))]

    this.subscriptions.add(
      this.reportControlService.selectedInformeId$.subscribe((informeId) => (this.selectedInformeId = informeId))
    );
    this.subscriptions.add(
      this.plantaService
        .getPlanta(this.plantaId)
        .pipe(
          take(1),
          switchMap((planta) => {
            this.planta = planta;

            return this.anomaliaService.getAnomaliasPlanta$(this.planta, this.reportControlService.informes);
          })
        )
        .subscribe((anomalias) => {
          // filtramos las anomalias que ya no consideramos anomalias
          this.allAnomalias = this.anomaliaService.getRealAnomalias(anomalias);
          this.allModelos = [...new Set (this.allAnomalias.map((anomalia) => `${anomalia.modulo.marca} (${anomalia.modulo.potencia}W)`))].sort();
          this.modelosElem = this.allModelos.map((modelo, i) => ({ modelo: i, label: modelo}));
        })  
    );
    // nos suscribimos a los tipos seleccionados de filter control
    this.subscriptions.add(
      this.filterControlService.modelosSelected$.subscribe((modelosSel) => (this.modelosSelected = modelosSel))
    );

    // nos suscribimos a los labels del filter control
    this.subscriptions.add(
      this.filterControlService.selectedModeloLabels$.subscribe((labels) => (this.selectedLabels = labels))
    );

    // nos suscribimos al estado en el control de filtros
    this.subscriptions.add(
      this.filterControlService.labelModeloDefaultStatus$.subscribe((value) => (this.defaultLabelStatus = value))
    );

    this.subscriptions.add(
      this.translate.stream('Modelo de módulo').subscribe((res: string) => {
        this.defaultSelectLabel = res;
      })
    );
  }

  onChangeFiltroTipo(event: MatCheckboxChange) {
    var marca: string;
    var potencia: number;
    ({marca, potencia} = this.getModuleProperties(event.source.name));
    // var potencia: number = Number(event.source.name.split(' - ')[1]);
    if (event.checked) {
      this.filtroModelo = new ModeloFilter(
        event.source.id,
        'modelo',
        marca,
        potencia
      );
      this.filterService.addFilter(this.filtroModelo);

      this.filterControlService.modelosSelected[Number(event.source.id.replace('modelo_', ''))] = true;
      // añadimos el modelo seleccionado a la variable
      if (this.selectedLabels[0] !== this.defaultSelectLabel) {
        this.filterControlService.selectedModeloLabels.push(event.source.name);
      } else {
        this.filterControlService.labelModeloDefaultStatus = false;
        this.filterControlService.selectedModeloLabels = [event.source.name];
      }
    } else {
      this.filterService.filters$.pipe(take(1)).subscribe((filters) =>
        filters
          .filter((filter) => filter.type === 'modelo')
          .forEach((filter) => {
            if (filter.id === event.source.id) {
              this.filterService.deleteFilter(filter);
            }
          })
      );

      this.filterControlService.modelosSelected[Number(event.source.id.replace('modelo_', ''))] = false;

      // eliminamos el 'tipo' de seleccionados
      this.selectedLabels = this.selectedLabels.filter((sel) => sel !== event.source.name);
      // si era el último ponemos el label por defecto
      if (this.selectedLabels.length === 0) {
        this.filterControlService.labelModeloDefaultStatus = true;
        this.selectedLabels.push(this.defaultSelectLabel);
      }
    }
  }

  getModuleProperties(label: string) {
    var marca = label.split(' ').slice(0, -1).join(' ');
    // Para la potencia tenemos que quitarle el último caracter que es un 'W' y los paréntesis
    var potencia = Number(label.split(' ').slice(-1)[0].slice(1, -2));
    return {marca, potencia};
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

}
