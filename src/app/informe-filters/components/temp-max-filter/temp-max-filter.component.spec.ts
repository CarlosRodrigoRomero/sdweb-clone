import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TempMaxFilterComponent } from './temp-max-filter.component';

describe('TempMaxFilterComponent', () => {
  let component: TempMaxFilterComponent;
  let fixture: ComponentFixture<TempMaxFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TempMaxFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TempMaxFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
