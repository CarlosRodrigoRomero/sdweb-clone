import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartAnomaliasZonasComponent } from './chart-anomalias-zonas.component';

describe('ChartAnomaliasZonasComponent', () => {
  let component: ChartAnomaliasZonasComponent;
  let fixture: ComponentFixture<ChartAnomaliasZonasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartAnomaliasZonasComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartAnomaliasZonasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
