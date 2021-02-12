import { TestBed } from '@angular/core/testing';

import { OlMapService } from './ol-map.service';

describe('OlMapService', () => {
  let service: OlMapService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OlMapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
