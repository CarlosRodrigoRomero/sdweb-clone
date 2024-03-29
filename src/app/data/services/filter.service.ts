import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, BehaviorSubject, Subscription } from 'rxjs';

import { ShareReportService } from '@data/services/share-report.service';
import { FilterControlService } from '@data/services/filter-control.service';
import { AnomaliaService } from './anomalia.service';

import { FilterableElement } from '@core/models/filterableInterface';
import { FilterInterface } from '@core/models/filter';
import { Seguidor } from '@core/models/seguidor';
import { Anomalia } from '@core/models/anomalia';

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private multipleFilters = ['area', 'tipo', 'clase', 'modulo', 'zona', 'criticidad', 'location', 'modelo', 'status'];
  private noAmosSegsFilters = ['area', 'location']; // filtran los seguidores, no las anomalías
  private otherFilters = ['confianza', 'aspectRatio', 'areaM'];
  public filters: FilterInterface[] = [];
  public filters$ = new BehaviorSubject<FilterInterface[]>(this.filters);
  private prevAllFilterableElems: FilterableElement[];
  private _filteredElements: FilterableElement[] = [];
  public filteredElements$ = new BehaviorSubject<FilterableElement[]>(this.filteredElements);
  private _allFiltrableElements: FilterableElement[] = [];
  public allFiltrableElements$ = new BehaviorSubject<FilterableElement[]>(this._allFiltrableElements);
  public plantaSeguidores = false;
  private _cleaningFilters = false;

  private subscriptions: Subscription = new Subscription();

  constructor(
    private router: Router,
    private shareReportService: ShareReportService,
    private filterControlService: FilterControlService,
    private anomaliaService: AnomaliaService
  ) {}

  initService(elems: FilterableElement[], shared?: boolean, sharedId?: string): Promise<boolean> {
    this.allFiltrableElements = elems;
    this.filteredElements = elems;

    return new Promise(async (response, reject) => {
      if (shared) {
        this.subscriptions.add(
          this.shareReportService.getParams().subscribe((params) => this.filterControlService.setInitParams(params))
        );

        // obtenemos lo filtros guardados en al DB y los añadimos
        this.subscriptions.add(
          await this.shareReportService.getFiltersByParams(sharedId).then((filters) => {
            if (filters.length > 0) {
              this.addFilters(filters);
            }
            response(true);
          })
        );
      } else {
        response(true);
      }
    });
  }

  addFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'multiple'
    if (!this.multipleFilters.includes(filter.type)) {
      // eliminamos, si lo hubiera, el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
      // añadimos el nuevo filtro
      this.filters.push(filter);
    } else {
      // si es del tipo 'multiple' se añade al array
      this.filters.push(filter);
    }
    this.filters$.next(this.filters);

    // añadimos parametros para compartir
    this.addFilterToShare(filter);

    this.processFilters();
  }

  addFilters(filters: FilterInterface[]) {
    this.filters = filters;
    this.filters$.next(this.filters);

    this.filters.forEach((filter) => {
      // añadimos parametros para compartir
      this.addFilterToShare(filter);
    });

    this.processFilters();
  }

  addFilterToShare(filter: FilterInterface) {
    if (!this.otherFilters.includes(filter.type)) {
      this.shareReportService.setParams(filter);
    }
  }

  processFilters() {
    // revisamos tipo de planta
    this.getTipoPlanta();

    // comprobamos primero si hay filtros activos
    if (this.filters.length === 0) {
      // desaplicamos filtros si los hubiese
      if (this.plantaSeguidores) {
        this.unapplySegsFilters();
      } else {
        this.unapplyFilters();
      }
    } else {
      if (this.plantaSeguidores) {
        // si todos los filtros son tipo noAnomsSeg le mandamos todos los elems y sino calculamos su interseccion con otros filtros
        if (
          this.filters.map((fil) => fil.type).filter((fil) => this.noAmosSegsFilters.includes(fil)).length ===
          this.filters.length
        ) {
          this.applyNoAnomsSegsFilters(this.allFiltrableElements);
        } else {
          const elemsFiltered = this.allFiltrableElements.filter((elem) => {
            const realAnomalias = this.anomaliaService.getRealAnomalias((elem as Seguidor).anomalias);
            const newAnomaliasCliente = this.applyFilters(realAnomalias) as Anomalia[];
            if (newAnomaliasCliente !== undefined) {
              (elem as Seguidor).anomaliasCliente = newAnomaliasCliente;
            }

            return (elem as Seguidor).anomaliasCliente.length > 0;
          });

          // aplicamos los filtros noAnomsSegs
          this.applyNoAnomsSegsFilters(elemsFiltered);
        }
      } else {
        this.filteredElements = this.applyFilters(this.allFiltrableElements);
      }
    }
  }

  private applyFilters(elements: FilterableElement[]): FilterableElement[] {
    const everyFilterFiltrableElements: Array<FilterableElement[]> = new Array<FilterableElement[]>();

    let multFilters = this.multipleFilters;
    let noMultFilters = this.filters
      .map((filter) => filter.type)
      .filter((filter) => !this.multipleFilters.includes(filter));
    if (this.plantaSeguidores) {
      multFilters = multFilters.filter((filter) => !this.noAmosSegsFilters.includes(filter));
      noMultFilters = noMultFilters.filter((filter) => !this.noAmosSegsFilters.includes(filter));
    }
    // comprobamos si hay filtros de tipo 'multiple'
    if (this.filters.filter((fil) => multFilters.includes(fil.type)).length > 0) {
      // separamos los elems por tipo de filtro
      multFilters.forEach((type) => {
        const newFiltrableElements: FilterableElement[] = [];
        if (this.filters.filter((fil) => fil.type === type).length > 0) {
          // obtenemos un array de las elems filtrados por cada filtro de  diferente tipo
          this.filters
            .filter((fil) => fil.type === type)
            .forEach((fil) => fil.applyFilter(elements).forEach((elem) => newFiltrableElements.push(elem)));
          // añadimos un array de cada tipo
          everyFilterFiltrableElements.push(newFiltrableElements);
        }
      });
    }

    // añadimos al array los elementos filtrados de los filtros no 'multiple'
    this.filters
      .filter((fil) => noMultFilters.includes(fil.type))
      .forEach((fil) => {
        const newFiltrableElements = fil.applyFilter(elements);
        everyFilterFiltrableElements.push(newFiltrableElements);
      });
    // calculamos la interseccion de los array de los diferentes tipos
    let finalElements: FilterableElement[];
    if (everyFilterFiltrableElements.length > 0) {
      finalElements = everyFilterFiltrableElements.reduce((anterior, actual) =>
        anterior.filter((elem) => actual.includes(elem))
      );
    }
    // para calcular el numero de anomalias por filtro tipo
    // this.excludeTipoFilters();
    return finalElements;
  }

  private applyNoAnomsSegsFilters(elems: FilterableElement[]) {
    // comprobamos si hay filtros noAnomsSegs
    if (this.filters.filter((fil) => this.noAmosSegsFilters.includes(fil.type)).length > 0) {
      const everyFilterFiltrableElements = [elems];

      // separamos los elems por tipo de filtro
      this.noAmosSegsFilters.forEach((type) => {
        const newFiltrableElements: FilterableElement[] = [];
        if (this.filters.filter((fil) => fil.type === type).length > 0) {
          // obtenemos un array de las elems filtrados por cada filtro de  diferente tipo
          this.filters
            .filter((fil) => fil.type === type)
            .forEach((fil) => fil.applyFilter(elems).forEach((elem) => newFiltrableElements.push(elem)));
          // añadimos un array de cada tipo
          everyFilterFiltrableElements.push(newFiltrableElements);
        }
      });

      // calculamos la interseccion de los array de los diferentes tipos
      if (everyFilterFiltrableElements.length > 0) {
        this.filteredElements = everyFilterFiltrableElements.reduce((anterior, actual) =>
          anterior.filter((elem) => actual.includes(elem))
        );
      }
    } else {
      this.filteredElements = elems;
    }
  }

  filterCCs(viewSelected: string) {
    if (viewSelected === 'cc') {
      this.prevAllFilterableElems = this.allFiltrableElements;
      this.allFiltrableElements = this.allFiltrableElements.filter((elem) => elem.tipo == 8 || elem.tipo == 9);
      this.allFiltrableElements = this.allFiltrableElements.sort((a, b) => a.numAnom - b.numAnom);
      this.processFilters();
    } else if (this.prevAllFilterableElems !== undefined) {
      this.allFiltrableElements = this.prevAllFilterableElems;
      this.allFiltrableElements = this.allFiltrableElements.sort((a, b) => a.numAnom - b.numAnom);
      this.processFilters();
      this.prevAllFilterableElems = undefined;
    }
  }

  private unapplyFilters() {
    this.cleaningFilters = true;

    this.filteredElements = this.allFiltrableElements;

    setTimeout(() => (this.cleaningFilters = false), 100);
  }

  private unapplySegsFilters() {
    this.allFiltrableElements.forEach((seg) => {
      const seguidor = seg as Seguidor;
      seguidor.anomaliasCliente = seguidor.anomalias.filter((anom) => anom.tipo != 0 && anom.criticidad !== null);
    });

    this.unapplyFilters();
  }

  getAllFilters(): Observable<FilterInterface[]> {
    return this.filters$.asObservable();
  }

  deleteFilter(filter: FilterInterface) {
    // comprobamos que no es de tipo 'multiple'
    if (!this.multipleFilters.includes(filter.type)) {
      // eliminamos el filtro anterior del mismo tipo que el recibido
      this.filters = this.filters.filter((f) => f.type !== filter.type);
    } else {
      this.filters.splice(this.filters.indexOf(filter), 1);
    }
    this.filters$.next(this.filters);

    if (!this.otherFilters.includes(filter.type)) {
      // reseteamos parametros para compartir
      this.shareReportService.resetParams(filter);
    }
    this.processFilters();
  }

  deleteAllFilters() {
    // Elimina todos los filtros
    this.filters = [];
    this.filters$.next(this.filters);

    // reseteamos todos los parametros para compartir
    this.shareReportService.resetAllParams();

    this.processFilters();
  }

  addElement(element: FilterableElement) {
    this.allFiltrableElements.push(element);

    this.processFilters();
  }

  private getTipoPlanta() {
    if (this.router.url.includes('tracker')) {
      this.plantaSeguidores = true;
    }
  }

  resetService() {
    this.multipleFilters = ['area', 'tipo', 'clase', 'modulo', 'zona', 'criticidad', 'location', 'modelo', 'status'];
    this.noAmosSegsFilters = ['area'];
    this.otherFilters = ['confianza', 'aspectRatio', 'areaM'];
    this.filters = [];
    this.filters$.next(this.filters);
    this.prevAllFilterableElems = undefined;
    this.filteredElements = [];
    this.allFiltrableElements = [];
    this.plantaSeguidores = false;

    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
  }

  /////////////////////////////////////////////////

  get allFiltrableElements() {
    return this._allFiltrableElements;
  }

  set allFiltrableElements(value: FilterableElement[]) {
    this._allFiltrableElements = value;
    this.allFiltrableElements$.next(value);
  }

  get filteredElements() {
    return this._filteredElements;
  }

  set filteredElements(value: FilterableElement[]) {
    this._filteredElements = value;
    this.filteredElements$.next(value);
  }

  get cleaningFilters() {
    return this._cleaningFilters;
  }

  set cleaningFilters(value: boolean) {
    this._cleaningFilters = value;
  }
}
