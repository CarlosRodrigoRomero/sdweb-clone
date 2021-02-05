import { Injectable } from '@angular/core';

import { FilterInterface } from '@core/models/filter';

import { Observable, BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { FiltrableInterface } from '@core/models/filtrableInterface';
import { AnomaliaService } from './anomalia.service';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public typeAddFilters = ['area', 'tipo', 'clase', 'modulo', 'zona'];
  public filters: FilterInterface[] = [];
  public filters$ = new BehaviorSubject<FilterInterface[]>(this.filters);
  public filtersByType: FilterInterface[] = [];
  public filtersByType$ = new BehaviorSubject<FilterInterface[]>(this.filtersByType);
  public filteredElements: FiltrableInterface[] = [];
  public filteredElements$ = new BehaviorSubject<FiltrableInterface[]>(this.filteredElements);
  public typeAddFilteredPcs: FiltrableInterface[] = [];
  private allFiltrableElements: FiltrableInterface[];

  constructor(private anomaliaService: AnomaliaService) {
    this.anomaliaService
      .getAnomalias$('vfMHFBPvNFnOFgfCgM9L')
      .pipe(take(1))
      .subscribe((anomalias) => {
        this.filteredElements$.next(anomalias);
      });
  }

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

  private applyFilters() {
    const everyFilterFilteredPcs: Array<FiltrableInterface[]> = new Array<FiltrableInterface[]>();

    // comprobamos si hay filtros de tipo 'Add'
    if (this.filters.filter((filter) => this.typeAddFilters.includes(filter.type)).length > 0) {
      // separamos los pcs por tipo de filtro
      this.typeAddFilters.forEach((type) => {
        const newFilteredPcs: FiltrableInterface[] = [];
        if (this.filters.filter((filter) => filter.type === type).length > 0) {
          this.filters
            .filter((filter) => filter.type === type)
            .forEach((filter) => {
              filter.applyFilter(this.allFiltrableElements).forEach((pc) => newFilteredPcs.push(pc));
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
        const newFilteredPcs = filter.applyFilter(this.allFiltrableElements);
        everyFilterFilteredPcs.push(newFilteredPcs);
      });

    // calculamos la interseccion de los array de los diferentes tipos
    if (everyFilterFilteredPcs.length > 0) {
      this.filteredElements = everyFilterFilteredPcs.reduce((anterior, actual) =>
        anterior.filter((pc) => actual.includes(pc))
      );
    }

    // comprobamos que hay algun filtro activo
    if (everyFilterFilteredPcs.length === 0) {
      this.filteredElements = this.allFiltrableElements;
    }

    this.filteredElements$.next(this.filteredElements);
  }

  getAllTypeFilters(type: string) {
    this.filtersByType = this.filters.filter((filter) => filter.type === type);
    console.log(this.filters);
    console.log(this.filtersByType);
    this.filtersByType$.next(this.filtersByType);
    return this.filtersByType$.asObservable();
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
