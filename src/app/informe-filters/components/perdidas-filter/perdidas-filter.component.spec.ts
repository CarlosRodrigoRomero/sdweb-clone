import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PerdidasFilterComponent } from './perdidas-filter.component';

describe('PerdidasFilterComponent', () => {
  let component: PerdidasFilterComponent;
  let fixture: ComponentFixture<PerdidasFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PerdidasFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PerdidasFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
