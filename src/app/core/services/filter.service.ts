import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject, of, from } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public typeAddFilters = ['area', 'tipo', 'clase', 'modulo', 'zona'];
  public filters: FilterInterface[] = [];
  public filters$ = new BehaviorSubject<FilterInterface[]>(this.filters);
  public filteredPcs: PcInterface[] = [];
  public filteredPcs$ = new BehaviorSubject<PcInterface[]>(this.filteredPcs);
  public typeAddFilteredPcs: PcInterface[] = [];

  constructor(private pcService: PcService) {}

  addFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'Add'
    if (!this.typeAddFilters.includes(filter.type)) {
      // eliminamos, si lo hubiera, el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
      // añadimos el nuevo filtro
      this.filters.push(filter);
    } else {
      // si es del tipo 'Add' se añade al array
      this.filters.push(filter);
    }
    this.filters$.next(this.filters);

    this.applyFilters();
  }

  applyFilters() {
    const everyFilterFilteredPcs: Array<PcInterface[]> = new Array<PcInterface[]>();
    // comprobamos si hay filtros de tipo 'Add'
    if (this.filters.filter((filter) => this.typeAddFilters.includes(filter.type)).length > 0) {
      // separamos los pcs por tipo de filtro
      this.typeAddFilters.forEach((type) => {
        const newFilteredPcs: PcInterface[] = [];
        if (this.filters.filter((filter) => filter.type === type).length > 0) {
          this.filters
            .filter((filter) => filter.type === type)
            .forEach((filter) => {
              filter.applyFilter(this.pcService.allPcs).forEach((pc) => newFilteredPcs.push(pc));
            });
          // añadimos un array de cada tipo
          everyFilterFilteredPcs.push(newFilteredPcs);
        }
      });
    }

    // añadimos al array los pcs filtrados de los filtros no 'Add'
    this.filters
      .filter((filter) => !this.typeAddFilters.includes(filter.type))
      .forEach((filter) => {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        everyFilterFilteredPcs.push(newFilteredPcs);
      });

    // calculamos la interseccion de los array de los diferentes tipos
    if (everyFilterFilteredPcs.length > 0) {
      this.filteredPcs = everyFilterFilteredPcs.reduce((anterior, actual) =>
        anterior.filter((pc) => actual.includes(pc))
      );
    }

    // comprobamos que hay algun filtro activo
    if (everyFilterFilteredPcs.length === 0) {
      this.filteredPcs = this.pcService.allPcs;
    }

    this.filteredPcs$.next(this.filteredPcs);
  }

  getAllTypeFilters(type: string) {
    return from(this.filters.filter((filter) => filter.type === type));
  }

  getAllFilters(): Observable<FilterInterface[]> {
    return this.filters$.asObservable();
  }

  deleteFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'area'
    if (!this.typeAddFilters.includes(filter.type)) {
      // eliminamos el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
    } else {
      this.filters.splice(this.filters.indexOf(filter), 1);
    }

    this.filters$.next(this.filters);

    this.applyFilters();
  }

  deleteAllFilters() {
    // Elimina todos los filtros
    this.filters = [];
    this.filters$.next(this.filters);
  }

  deleteAllTypeFilters(type: string) {
    // Elimina los filtros del tipo recibido
    this.filters = this.filters.filter((filter) => filter.type !== type);

    this.filters$.next(this.filters);

    this.applyFilters();
  }
}
