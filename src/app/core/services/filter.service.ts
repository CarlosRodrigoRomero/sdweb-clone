import { Injectable } from '@angular/core';

import { Observable, BehaviorSubject } from 'rxjs';

import { AnomaliaService } from './anomalia.service';
import { ShareReportService } from '@core/services/share-report.service';

import { FiltrableInterface } from '@core/models/filtrableInterface';
import { FilterInterface } from '@core/models/filter';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private typeAddFilters = ['area', 'tipo', 'clase', 'modulo', 'zona'];
  private filters: FilterInterface[] = [];
  public filters$ = new BehaviorSubject<FilterInterface[]>(this.filters);
  private filtersByType: FilterInterface[] = [];
  private filtersByType$ = new BehaviorSubject<FilterInterface[]>(this.filtersByType);
  private filteredElements: FiltrableInterface[] = [];
  public filteredElements$ = new BehaviorSubject<FiltrableInterface[]>(this.filteredElements);
  private _allFiltrableElements: FiltrableInterface[];
  private _initialized = false;
  private initialized$ = new BehaviorSubject<boolean>(this._initialized);

  constructor(private anomaliaService: AnomaliaService, private shareReportService: ShareReportService) {}

  initFilterService(shared: boolean, plantaId: string, sharedId?: string) {
    this.anomaliaService.getAnomaliasPlanta$(plantaId).subscribe((array) => {
      this._allFiltrableElements = array;
      this.filteredElements$.next(array);
      if (shared) {
        // obtenemos lo filtros guardados en al DB y los añadimos
        this.shareReportService.getFiltersByParams(sharedId).subscribe((filters) => this.addFilters(filters));
      }
      this.initialized$.next(true);
    });

    return this.initialized$;
  }

  /* initFilterService(id: string, initType: 'informe' | 'planta' = 'informe') {
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
  } */

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

    // añadimos parametros para compartir
    this.shareReportService.setParams(filter);

    this.applyFilters();
  }

  addFilters(filters: FilterInterface[]) {
    this.filters = filters;
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
    // comprobamos que no es de tipo 'Add'
    if (!this.typeAddFilters.includes(filter.type)) {
      // eliminamos el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
    } else {
      this.filters.splice(this.filters.indexOf(filter), 1);
    }
    this.filters$.next(this.filters);

    // reseteamos parametros para compartir
    this.shareReportService.resetParams(filter);

    this.applyFilters();
  }

  deleteAllFilters() {
    // Elimina todos los filtros
    this.filters = [];
    this.filters$.next(this.filters);

    // reseteamos todos los parametros para compartir
    this.shareReportService.resetAllParams();

    this.applyFilters();
  }

  deleteAllTypeFilters(type: string) {
    // Elimina los filtros del tipo recibido
    this.filters = this.filters.filter((filter) => filter.type !== type);

    this.filters$.next(this.filters);

    this.applyFilters();
  }
}
