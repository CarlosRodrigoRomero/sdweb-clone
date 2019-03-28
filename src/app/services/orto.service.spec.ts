import { TestBed } from '@angular/core/testing';

import { OrtoService } from './orto.service';

describe('OrtoService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OrtoService = TestBed.get(OrtoService);
    expect(service).toBeTruthy();
  });
});
