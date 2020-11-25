import { TestBed, inject } from '@angular/core/testing';

import { PcService } from './pc.service';

describe('PcService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PcService]
    });
  });

  it('should be created', inject([PcService], (service: PcService) => {
    expect(service).toBeTruthy();
  }));
});