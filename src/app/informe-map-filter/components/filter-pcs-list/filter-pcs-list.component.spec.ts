import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { PcInterface } from '@core/models/pc';
import { FilterService } from '@core/services/filter.service';
import { BehaviorSubject } from 'rxjs';

import { FilterPcsListComponent } from './filter-pcs-list.component';

class MockFilterService {
  filteredPcs: PcInterface[] = [{ id: 'test 1' }, { id: 'test 2' }];
  filteredPcs$ = new BehaviorSubject<PcInterface[]>(this.filteredPcs);
}

xdescribe('FilterPcsListComponent', () => {
  let component: FilterPcsListComponent;
  let fixture: ComponentFixture<FilterPcsListComponent>;
  let filterService: FilterService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      providers: [FilterPcsListComponent, { provide: FilterService, useClass: MockFilterService }],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
    });
    // injectamos ambos, el componente y el servicio de dependencia
    component = TestBed.inject(FilterPcsListComponent);
    filterService = TestBed.inject(FilterService);
  }));

  /* it('should not have welcome message after construction', () => {
    expect(component.welcome);
  }); */

  /* beforeEach(() => {
    fixture = TestBed.createComponent(FilterPcsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }); */

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display error when FilterService fails', fakeAsync(() => {
    component.ngOnInit();
    fixture.detectChanges();
  }));
});
