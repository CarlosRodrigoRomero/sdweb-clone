import { Component, OnDestroy, OnInit } from '@angular/core';

import { MatCheckboxChange } from '@angular/material/checkbox';

import { GLOBAL } from '@core/services/global';
import { PcService } from '@core/services/pc.service';
import { FilterService } from '@core/services/filter.service';

import { ModuloPcFilter } from '@core/models/moduloFilter';
import { FilterableElement } from '@core/models/filterableInterface';
import { AnomaliaService } from '@core/services/anomalia.service';
import { Subscription } from 'rxjs';

interface ModuloPc {
  label?: string;
  completed?: boolean;
  modulosPcs?: ModuloPc[];
}

@Component({
  selector: 'app-modulo-filter',
  templateUrl: './modulo-filter.component.html',
  styleUrls: ['./modulo-filter.component.css'],
})
export class ModuloFilterComponent implements OnInit, OnDestroy {
  modulosTask: ModuloPc;
  modulosPcs: ModuloPc[] = [];
  allComplete: boolean;
  filtroModulo: ModuloPcFilter;

  defaultSelect = 'Tipo módulo';
  selected: string[] = [this.defaultSelect];

  private subscriptions: Subscription = new Subscription();

  constructor(
    private pcService: PcService,
    private filterService: FilterService,
    private anomaliaService: AnomaliaService
  ) {}

  ngOnInit(): void {
    this.getModulos().forEach((modulo) =>
      this.modulosPcs.push({
        label: modulo,
        completed: false,
      })
    );

    this.modulosTask = {
      modulosPcs: this.modulosPcs,
    };
  }

  onChangeFiltroModulo(event: MatCheckboxChange) {
    if (event.checked) {
      this.filtroModulo = new ModuloPcFilter(event.source.id, 'modulo', event.source.name);
      this.filterService.addFilter(this.filtroModulo);

      // añadimos el modulo seleccionado a la variable
      if (this.selected[0] !== this.defaultSelect) {
        this.selected.push(event.source.name);
      } else {
        this.selected = [event.source.name];
      }
    } else {
      this.subscriptions.add(
        this.filterService.filters$.subscribe((filters) =>
          filters
            .filter((filter) => filter.type === 'modulo')
            .forEach((filter) => {
              if (filter.id === event.source.id) {
                this.filterService.deleteFilter(filter);
              }
            })
        )
      );

      // eliminamos el 'tipo' de seleccionados
      this.selected = this.selected.filter((sel) => sel !== event.source.name);
      // si era el último ponemos el label por defecto
      if (this.selected.length === 0) {
        this.selected.push(this.defaultSelect);
      }
    }
  }

  getModulos(): string[] {
    const modulos: string[] = [];

    this.filterService.filteredElements$.subscribe((elems) =>
      elems.forEach((elem) => {
        console.log(elem);
        /* if (!modulos.includes(this.getModuloLabel(elem))) {
          modulos.push(this.getModuloLabel(elem));
        } */
      })
    );

    return modulos;
  }

  getModuloLabel(elem: FilterableElement): string {
    let moduloLabel: string;
    if (elem.modulo.marca === undefined) {
      if (elem.modulo.modelo === undefined) {
        moduloLabel = elem.modulo.potencia + 'W';
      } else {
        moduloLabel = elem.modulo.modelo + ' ' + elem.modulo.potencia + 'W';
      }
    } else {
      if (elem.modulo.modelo === undefined) {
        moduloLabel = elem.modulo.marca + ' ' + elem.modulo.potencia + 'W';
      } else {
        moduloLabel = elem.modulo.marca + ' ' + elem.modulo.modelo + ' ' + elem.modulo.potencia + 'W';
      }
    }
    return moduloLabel;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
