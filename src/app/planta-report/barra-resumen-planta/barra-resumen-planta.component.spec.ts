import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BarraResumenPlantaComponent } from './barra-resumen-planta.component';

describe('BarraResumenPlantaComponent', () => {
  let component: BarraResumenPlantaComponent;
  let fixture: ComponentFixture<BarraResumenPlantaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BarraResumenPlantaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BarraResumenPlantaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
