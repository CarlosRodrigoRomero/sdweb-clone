import { TestBed } from '@angular/core/testing';

import { AnomaliaService } from './anomalia.service';

describe('AnomaliaService', () => {
  let service: AnomaliaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnomaliaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
