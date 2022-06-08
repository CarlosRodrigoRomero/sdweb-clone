import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class UtilitiesService {
  constructor() {}

  static findDuplicates(values: string[]): string[] {
    return values.filter((value, index) => values.indexOf(value) !== index);
  }
}
