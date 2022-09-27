import { Injectable } from '@angular/core';

import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  private _apartados: string[] = [];
  apartadosInforme$ = new BehaviorSubject<string[]>(this._apartados);
  private _generatePdf = false;
  generatePdf$ = new BehaviorSubject<boolean>(this._generatePdf);
  private _emailSelected: string = '';
  emailSelected$ = new BehaviorSubject<string>(this._emailSelected);

  constructor() {}

  get apartadosInforme(): string[] {
    return this._apartados;
  }

  set apartadosInforme(value: string[]) {
    this._apartados = value;
    this.apartadosInforme$.next(this._apartados);
  }

  get generatePdf(): boolean {
    return this._generatePdf;
  }

  set generatePdf(value: boolean) {
    this._generatePdf = value;
    this.generatePdf$.next(this._generatePdf);
  }

  get emailSelected(): string {
    return this._emailSelected;
  }

  set emailSelected(value: string) {
    this._emailSelected = value;
    this.emailSelected$.next(this._emailSelected);
  }
}
