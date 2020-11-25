import { TestBed, inject } from '@angular/core/testing';

import { OrtoService } from './orto.service';

describe('OrtoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OrtoService]
    });
  });

  it('should be created', inject([OrtoService], (service: OrtoService) => {
    expect(service).toBeTruthy();
  }));
});