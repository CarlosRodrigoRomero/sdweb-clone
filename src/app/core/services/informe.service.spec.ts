import { TestBed, inject } from '@angular/core/testing';

import { InformeService } from './informe.service';

describe('InformeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InformeService]
    });
  });

  it('should be created', inject([InformeService], (service: InformeService) => {
    expect(service).toBeTruthy();
  }));
});