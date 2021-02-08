import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartCelsPorZonasComponent } from './chart-cels-por-zonas.component';

describe('ChartCelsPorZonasComponent', () => {
  let component: ChartCelsPorZonasComponent;
  let fixture: ComponentFixture<ChartCelsPorZonasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartCelsPorZonasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartCelsPorZonasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
