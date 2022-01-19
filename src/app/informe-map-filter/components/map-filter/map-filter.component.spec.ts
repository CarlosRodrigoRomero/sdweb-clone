import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PlantaService } from '@core/services/planta.service';
import { InformeService } from '@core/services/informe.service';

import { MapFilterComponent } from './map-filter.component';
import { PlantaInterface } from '@core/models/planta';
import { InformeInterface } from '@core/models/informe';

class PlantaServiceStub {
  planta: PlantaInterface = { id: 'id_planta', nombre: 'nombre_planta' };
  get() {
    return this.planta;
  }
}

class InformeServiceStub {
  informe: InformeInterface = { id: 'id_informe', plantaId: 'planta_informe' };
  get() {
    return this.informe;
  }
}

xdescribe('InformeMapFilterComponent', () => {
  let component: MapFilterComponent;
  let fixture: ComponentFixture<MapFilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [MapFilterComponent],
      providers: [
        { provide: PlantaService, useClass: PlantaServiceStub }.provide,
        { provide: InformeService, useClass: InformeServiceStub },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('When component is inicializated', () => {
    const planta = require('./map-filter.component');
    const informe = require('./map-filter.component');
    const circleRadius = require('./map-filter.component');

    it('Should assign initial values', () => {
      expect(circleRadius).toEqual(5);
    });
  });
});
