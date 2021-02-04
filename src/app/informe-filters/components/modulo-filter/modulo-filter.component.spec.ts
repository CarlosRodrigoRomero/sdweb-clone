import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuloFilterComponent } from './modulo-filter.component';

describe('ModuloFilterComponent', () => {
  let component: ModuloFilterComponent;
  let fixture: ComponentFixture<ModuloFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ModuloFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ModuloFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
