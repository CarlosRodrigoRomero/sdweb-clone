import { TestBed } from '@angular/core/testing';
import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '@core/models/pc';
import { of } from 'rxjs';

import { FilterService } from './filter.service';

xdescribe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FilterService] });
    service = TestBed.inject(FilterService);
  });
});
