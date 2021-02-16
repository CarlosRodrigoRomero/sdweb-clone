import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClaseFilterComponent } from './clase-filter.component';

describe('ClaseFilterComponent', () => {
  let component: ClaseFilterComponent;
  let fixture: ComponentFixture<ClaseFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClaseFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClaseFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
