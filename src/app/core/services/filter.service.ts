import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { AreaFilter } from '@core/models/areaFilter';
import { GradientFilter } from '@core/models/gradientFilter';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  public filters: FilterInterface[] = [];
  public filters$ = new BehaviorSubject<FilterInterface[]>(this.filters);
  public filteredPcs: PcInterface[] = [];
  public filteredPcs$ = new BehaviorSubject<PcInterface[]>(this.filteredPcs);
  public areaFilteredPcs: PcInterface[] = [];

  constructor(private pcService: PcService) {}

  addFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'area'
    if (filter.type !== 'area' && filter.type !== 'tipo') {
      // eliminamos, si lo hubiera, el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
      // añadimos el nuevo filtro
      this.filters.push(filter);
    } else {
      // si es del tipo 'area' se añade al array
      this.filters.push(filter);
    }
    this.filters$.next(this.filters);

    this.applyFilters();
  }

  applyFilters() {
    const everyFilterFilteredPcs: Array<PcInterface[]> = new Array<PcInterface[]>();
    console.log(this.filters);
    // añadimos al array un array de pcs del conjuntos de los filtros 'area'
    this.filters
      .filter((filter) => filter.type === 'area' || filter.type === 'tipo')
      .forEach((filter) => {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        // Si es el primer filtro sustituimos por los nuevos pcs ...
        if (this.filters.filter((f) => f.type === 'area' || filter.type === 'tipo').length === 1) {
          // this.filteredPcs = newFilteredPcs;
          this.areaFilteredPcs = newFilteredPcs;
        } else {
          // ...si no es el primero, añadimos los nuevos pcs
          // revisamos tambien si ya se están mostrando esos pcs para no repetirlos
          this.areaFilteredPcs = this.areaFilteredPcs.concat(
            newFilteredPcs.filter((newPc) => !this.areaFilteredPcs.includes(newPc))
          );
        }
      });
    // comprobamos si hay algun filtro de 'area'
    if (this.filters.filter((filter) => filter.type === 'area' || filter.type === 'tipo').length > 0) {
      everyFilterFilteredPcs.push(this.areaFilteredPcs);
    }

    // añadimos al array los pcs filtrados de los filtros no 'area'
    this.filters
      .filter((filter) => filter.type !== 'area' && filter.type !== 'tipo')
      .forEach((filter) => {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        everyFilterFilteredPcs.push(filter.applyFilter(newFilteredPcs));
      });

    if (everyFilterFilteredPcs.length > 0) {
      this.filteredPcs = everyFilterFilteredPcs.reduce((anterior, actual) =>
        anterior.filter((pc) => actual.includes(pc))
      );
    }

    console.log(everyFilterFilteredPcs.length);

    if (everyFilterFilteredPcs.length === 0) {
      this.filteredPcs = this.pcService.allPcs;
    }

    this.filteredPcs$.next(this.filteredPcs);
  }

  deleteFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'area'
    if (filter.type !== 'area' && filter.type !== 'tipo') {
      // eliminamos el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
    } else {
      console.log(this.filters.indexOf(filter));
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
