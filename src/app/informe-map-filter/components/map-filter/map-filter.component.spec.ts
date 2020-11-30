import { async, ComponentFixture, TestBed } from '@angular/core/testing';

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

  beforeEach(async(() => {
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
    it('Should ');
  });
});
