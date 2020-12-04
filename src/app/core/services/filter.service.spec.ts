import { TestBed } from '@angular/core/testing';
import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '@core/models/pc';
import { of, Subject } from 'rxjs';

import { FilterService } from './filter.service';
import { PcService } from './pc.service';

describe('FilterService', () => {
  let filterService: FilterService;
  let pcServiceSpy: jasmine.SpyObj<PcService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('PcService', ['GetPcs']);

    TestBed.configureTestingModule({
      // Proveemos ambos, el servicio a testear y su dependencia (spy)
      providers: [FilterService, { provide: PcService, useValue: spy }],
    });
    // Injectamos ambos, el servicio a testear y su dependencia (spy)
    filterService = TestBed.inject(FilterService);
    pcServiceSpy = TestBed.inject(PcService) as jasmine.SpyObj<PcService>;
  });

  it('#getAllFilters should return expected filters', () => {
    const expectedFilters: FilterInterface[] = [
      { id: 'filter_1' } as FilterInterface,
      { id: 'filter_2' } as FilterInterface,
    ];

    filterService.getAllFilters().subscribe((filters) => expect(filters).toEqual(expectedFilters));

    // expect(filterService.getAllPcs()).toBe(stubValue, 'service returned stub value');
  });
});
