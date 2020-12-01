import { TestBed } from '@angular/core/testing';
import { FilterInterface } from '@core/models/filter';
import { PcInterface } from '@core/models/pc';

import { FilterService } from './filter.service';

xdescribe('FilterService', () => {
  let service: FilterService;
  let pcs: PcInterface[];
  let filters: FilterInterface[];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FilterService],
    });
    service = TestBed.inject(FilterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return all filters', () => {
    pcs = [{id: 'pc_1'}, {id: 'pc_2'}];
    filters = [{ id: 'filter_1', applyFilter(pcs), unapplyFilter(pcs)},
    { id: 'filter_2', applyFilter(pcs), unapplyFilter(pcs) }];
  });
});
