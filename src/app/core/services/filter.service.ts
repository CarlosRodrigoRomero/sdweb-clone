import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';

import { AnomaliaService } from './anomalia.service';
import { ShareReportService } from '@core/services/share-report.service';

import { FiltrableInterface } from '@core/models/filtrableInterface';
import { FilterInterface } from '@core/models/filter';
import { GLOBAL } from './global';

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
  private labelsTipoPcs: string[] = [];
  public labelsTipoPcs$ = new BehaviorSubject<string[]>(this.labelsTipoPcs);
  private countTipoPcs: number[] = [];
  public countTipoPcs$ = new BehaviorSubject<number[]>(this.countTipoPcs);

  constructor(private anomaliaService: AnomaliaService, private shareReportService: ShareReportService) {
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

    // añadimos parametros para compartir
    this.shareReportService.setParams(filter);

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

    // comprueba que cantidad de filtros "tipo" no se afecten unos a otros
    if (filter.type !== 'tipo') {
      this.updateNumberOfTipoPc();
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
