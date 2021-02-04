import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TipoFilterComponent } from './tipo-filter.component';

describe('TipoFilterComponent', () => {
  let component: TipoFilterComponent;
  let fixture: ComponentFixture<TipoFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TipoFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TipoFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
