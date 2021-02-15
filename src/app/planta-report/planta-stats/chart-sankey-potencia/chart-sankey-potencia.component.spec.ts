import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartSankeyPotenciaComponent } from './chart-sankey-potencia.component';

describe('ChartSankeyPotenciaComponent', () => {
  let component: ChartSankeyPotenciaComponent;
  let fixture: ComponentFixture<ChartSankeyPotenciaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartSankeyPotenciaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartSankeyPotenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
