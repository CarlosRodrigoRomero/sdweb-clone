import { Injectable } from '@angular/core';

import { PcService } from './pc.service';

import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '../models/pc';

import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private filters: FilterInterface[] = [];
  public filters$ = new Subject<FilterInterface[]>();
  public filteredPcs: PcInterface[] = [];
  public filteredPcs$ = new BehaviorSubject<PcInterface[]>(this.filteredPcs);
  public areaFilters: FilterInterface[] = [];

  constructor(private pcService: PcService) {
    this.filteredPcs$.next(this.pcService.allPcs);
    this.filteredPcs = this.pcService.allPcs;
  }

  addFilter(filter: FilterInterface) {
    // Añade el filtro y lo aplica
    this.filters.push(filter);
    this.filters$.next(this.filters);

    const newFilteredPcs = filter.applyFilter(this.pcService.allPcs);

    // Si es el primer filtro sustituimos todos los filtros por los nuevos...
    if (this.filters.length === 1) {
      this.filteredPcs = newFilteredPcs;
    } else {
      // ...si no es el primero, añadimos los nuevos
      // revisamos tambien si ya se están mostrando esos pcs para no repetirlos
      this.filteredPcs = this.filteredPcs.concat(newFilteredPcs.filter((newPc) => !this.filteredPcs.includes(newPc)));
    }
    this.filteredPcs$.next(this.filteredPcs);
  }

  getAllFilters() {
    return this.filters$.asObservable();
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

  getAllPcs(): Observable<PcInterface[]> {
    return this.pcService.allPcs$;
  }
}
