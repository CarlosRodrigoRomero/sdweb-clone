import { TestBed, inject } from '@angular/core/testing';

import { PlantaService } from './planta.service';

xdescribe('PlantaService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlantaService]
    });
  });

  it('should be created', inject([PlantaService], (service: PlantaService) => {
    expect(service).toBeTruthy();
  }));
});