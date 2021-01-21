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
    if (filter.type !== 'area') {
      // eliminamos, si lo hubiera, el filtro anterior del mismo tipo que el recibido
      // this.filters.forEach(f => console.log(f.type));
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
    everyFilterFilteredPcs.push(this.pcService.allPcs);
    this.filters
      .filter((filter) => filter.type === 'area')
      .forEach((filter) => {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        console.log(this.filters.filter((f) => f.type === 'area').length);
        // Si es el primer filtro sustituimos todos los filtros por los nuevos...
        if (this.filters.filter((f) => f.type === 'area').length === 1) {
          // this.filteredPcs = newFilteredPcs;
          everyFilterFilteredPcs.push(newFilteredPcs);
        } else {
          // ...si no es el primero, añadimos los nuevos
          // revisamos tambien si ya se están mostrando esos pcs para no repetirlos
          /* this.filteredPcs = this.filteredPcs.concat(
            newFilteredPcs.filter((newPc) => !this.filteredPcs.includes(newPc))
          ); */
          everyFilterFilteredPcs.push(
            this.filteredPcs.concat(newFilteredPcs.filter((newPc) => !this.filteredPcs.includes(newPc)))
          );
        }
      });

    this.filters
      .filter((filter) => filter.type !== 'area')
      .forEach((filter) => {
        const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);
        everyFilterFilteredPcs.push(filter.applyFilter(newFilteredPcs));
        // this.filteredPcs = this.areaFilteredPcs.filter((pc) => newFilteredPcs.includes(pc));
        /* if (this.filters.length === 1) {
          this.filteredPcs = newFilteredPcs;
        } else {
          this.filteredPcs = newFilteredPcs.filter((pc) => this.filteredPcs.includes(pc));
          // this.filteredPcs = this.filteredPcs.filter((pc) => newFilteredPcs.includes(pc));
        } */
      });
    console.log(everyFilterFilteredPcs);

    this.filteredPcs = everyFilterFilteredPcs.reduce((anterior, actual) =>
      anterior.filter((pc) => actual.includes(pc))
    );

    // this.filters$.next(this.filters);

    this.filteredPcs$.next(this.filteredPcs);
  }

  deleteFilter(filter: FilterInterface) {
    // Elimina el filtro y lo desactiva
    this.filters.splice(this.filters.indexOf(filter), 1);
    this.filters$.next(this.filters);

    // Si era el último filtro mostramos todas las pcs...
    if (this.filters.length === 0) {
      this.filteredPcs = this.pcService.allPcs;
    } else {
      // ... si no era el último, eliminamos solo el filtro
      let newFilteredPcs = filter.unapplyFilter(this.filteredPcs);

      // comprobamos que no se eliminen pcs que pertenezcan a otros filtros
      this.filters.forEach((f) => {
        const coincidentPcs = f.applyFilter(this.filteredPcs).filter((pc) => !newFilteredPcs.includes(pc));
        newFilteredPcs = newFilteredPcs.concat(coincidentPcs);
      });

      this.filteredPcs = newFilteredPcs;
    }
    this.filteredPcs$.next(this.filteredPcs);
  }

  deleteAllFilters() {
    // Elimina todos los filtros
    this.filters = [];
    this.filters$.next(this.filters);

    // Vuelve a mostrar todos los pcs
    this.filteredPcs = this.pcService.allPcs;
    this.filteredPcs$.next(this.filteredPcs);
  }

  getAllFilters(): Observable<FilterInterface[]> {
    return this.filters$.asObservable();
  }
}
