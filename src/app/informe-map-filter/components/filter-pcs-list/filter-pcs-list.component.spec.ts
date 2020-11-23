import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FilterPcsListComponent } from './filter-pcs-list.component';

describe('FilterPcsListComponent', () => {
  let component: FilterPcsListComponent;
  let fixture: ComponentFixture<FilterPcsListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FilterPcsListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterPcsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
