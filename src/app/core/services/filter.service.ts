import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public typeAddFilters = ['area', 'tipo', 'clase', 'modulo'];
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
    console.log(this.filters);

    this.filters$.next(this.filters);

    this.applyFilters();
  }

  applyFilters() {
    const everyFilterFilteredPcs: Array<PcInterface[]> = new Array<PcInterface[]>();
    // añadimos al array un array de pcs del conjuntos de los filtros 'Add'
    this.filters
      .filter((filter) => this.typeAddFilters.includes(filter.type))
      .forEach((filter) => {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        // Si es el primer filtro sustituimos por los nuevos pcs ...
        if (this.filters.filter((f) => this.typeAddFilters.includes(f.type)).length === 1) {
          this.typeAddFilteredPcs = newFilteredPcs;
        } else {
          // ...si no es el primero, añadimos los nuevos pcs
          // revisamos tambien si ya se están mostrando esos pcs para no repetirlos
          this.typeAddFilteredPcs = this.typeAddFilteredPcs.concat(
            newFilteredPcs.filter((newPc) => !this.typeAddFilteredPcs.includes(newPc))
          );
        }
      });
    // comprobamos si hay algun filtro de 'area'
    if (this.filters.filter((filter) => this.typeAddFilters.includes(filter.type)).length > 0) {
      everyFilterFilteredPcs.push(this.typeAddFilteredPcs);
    }

    // añadimos al array los pcs filtrados de los filtros no 'Add'
    this.filters
      .filter((filter) => !this.typeAddFilters.includes(filter.type))
      .forEach((filter) => {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        everyFilterFilteredPcs.push(filter.applyFilter(newFilteredPcs));
      });

    if (everyFilterFilteredPcs.length > 0) {
      this.filteredPcs = everyFilterFilteredPcs.reduce((anterior, actual) =>
        anterior.filter((pc) => actual.includes(pc))
      );
    }

    if (everyFilterFilteredPcs.length === 0) {
      this.filteredPcs = this.pcService.allPcs;
    }

    this.filteredPcs$.next(this.filteredPcs);
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

    // Vuelve a mostrar todos los pcs
    /* this.filteredPcs = this.pcService.allPcs;
    this.filteredPcs$.next(this.filteredPcs); */
  }

  deleteAllTypeFilters(type: string) {
    // Elimina los filtros del tipo recibido
    this.filters = this.filters.filter((filter) => filter.type !== type);

    this.filters$.next(this.filters);

    this.applyFilters();
  }

  getAllFilters(): Observable<FilterInterface[]> {
    return this.filters$.asObservable();
  }
}
