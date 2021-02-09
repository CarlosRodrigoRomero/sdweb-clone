import { Injectable } from '@angular/core';

import { FilterInterface } from '@core/models/filter';

import { Observable, BehaviorSubject, of } from 'rxjs';
import { FiltrableInterface } from '@core/models/filtrableInterface';
import { AnomaliaService } from './anomalia.service';
import { GLOBAL } from './global';

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
  public _allFiltrableElements: FiltrableInterface[];
  private _initialized = false;
  public initialized$ = new BehaviorSubject<boolean>(this._initialized);
  public labelsTipoPcs: string[] = [];
  public labelsTipoPcs$ = new BehaviorSubject<string[]>(this.labelsTipoPcs);
  private countTipoPcs: number[] = [];
  public countTipoPcs$ = new BehaviorSubject<number[]>(this.countTipoPcs);

  constructor(private anomaliaService: AnomaliaService) {
    // this.anomaliaService
    //   .getAnomalias$('vfMHFBPvNFnOFgfCgM9L')
    //   .pipe(take(1))
    //   .subscribe((anomalias) => {
    //     this.filteredElements$.next(anomalias);
    //   });
  }

  initFilterService(id: string, initType: 'informe' | 'planta' = 'informe') {
    if (initType === 'planta') {
      this.anomaliaService.getAnomaliasPlanta$(id).subscribe((array) => {
        this._allFiltrableElements = array;
        this.filteredElements$.next(array);
        this.getLabelFilterTipoPcs();
        this.initialized$.next(true);
      });
    } else {
      this.anomaliaService.getAnomalias$(id).subscribe((array) => {
        this._allFiltrableElements = array;
        this.filteredElements$.next(array);
        this.getLabelFilterTipoPcs();
        this.initialized$.next(true);
      });
    }

    return this.initialized$;
  }

  addFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'Add'
    if (!this.typeAddFilters.includes(filter.type)) {
      // eliminamos, si lo hubiera, el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
      // añadimos el nuevo filtro
      this.filters.push(filter);

      if (filter.type !== 'tipo') {
        this.updateNumberOfTipoPc();
      }
    } else {
      // si es del tipo 'Add' se añade al array
      this.filters.push(filter);
    }
    this.filters$.next(this.filters);

    this.applyFilters();
  }

  private applyFilters() {
    const everyFilterFiltrableElements: Array<FiltrableInterface[]> = new Array<FiltrableInterface[]>();

    // comprobamos si hay filtros de tipo 'Add'
    if (this.filters.filter((filter) => this.typeAddFilters.includes(filter.type)).length > 0) {
      // separamos los pcs por tipo de filtro
      this.typeAddFilters.forEach((type) => {
        const newFiltrableElements: FiltrableInterface[] = [];
        if (this.filters.filter((filter) => filter.type === type).length > 0) {
          this.filters
            .filter((filter) => filter.type === type)
            .forEach((filter) => {
              filter.applyFilter(this._allFiltrableElements).forEach((pc) => newFiltrableElements.push(pc));
            });
          // añadimos un array de cada tipo
          everyFilterFiltrableElements.push(newFiltrableElements);
        }
      });
    }

    // añadimos al array los pcs filtrados de los filtros no 'Add'
    this.filters
      .filter((filter) => !this.typeAddFilters.includes(filter.type))
      .forEach((filter) => {
        const newFiltrableElements = filter.applyFilter(this._allFiltrableElements);
        everyFilterFiltrableElements.push(newFiltrableElements);
      });

    // calculamos la interseccion de los array de los diferentes tipos
    if (everyFilterFiltrableElements.length > 0) {
      this.filteredElements = everyFilterFiltrableElements.reduce((anterior, actual) =>
        anterior.filter((pc) => actual.includes(pc))
      );
    }

    // comprobamos que hay algun filtro activo
    if (everyFilterFiltrableElements.length === 0) {
      this.filteredElements = this._allFiltrableElements;
    }

    this.filteredElements$.next(this.filteredElements);
  }

  getAllTypeFilters(type: string) {
    this.filtersByType = this.filters.filter((filter) => filter.type === type);
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

    if (filter.type !== 'tipo') {
      this.updateNumberOfTipoPc();
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

  getLabelFilterTipoPcs() {
    const indices: number[] = [];
    this._allFiltrableElements.forEach((elem) => {
      if (typeof elem.tipo === 'number') {
        if (!indices.includes(elem.tipo)) {
          indices.push(elem.tipo);
        }
      } else if (!indices.includes(parseInt(elem.tipo, 0))) {
        indices.push(parseInt(elem.tipo, 0));
      }
    });
    this.labelsTipoPcs = [];
    indices.forEach((i) => this.labelsTipoPcs.push(GLOBAL.labels_tipos[i]));
    // los ordena como estan en GLOBAL
    this.labelsTipoPcs.sort((a, b) => GLOBAL.labels_tipos.indexOf(a) - GLOBAL.labels_tipos.indexOf(b));

    this.labelsTipoPcs$.next(this.labelsTipoPcs);

    // contamos cuantos pcs hay de cada tipo
    /* this.labelsTipoPcs.forEach((label) => this.countTipoPcs.push(this.getNumberOfTipoPc(label)));
    this.countTipoPcs$.next(this.countTipoPcs); */
  }

  getNumberOfTipoPc(label: string): number {
    return this._allFiltrableElements.filter((elem) => elem.tipo == GLOBAL.labels_tipos.indexOf(label)).length;
  }

  updateNumberOfTipoPc() {
    this.countTipoPcs = [];
    this.labelsTipoPcs.forEach((label) =>
      this.countTipoPcs.push(
        this.filteredElements.filter((elem) => elem.tipo == GLOBAL.labels_tipos.indexOf(label)).length
      )
    );
    this.countTipoPcs$.next(this.countTipoPcs);
  }
}
