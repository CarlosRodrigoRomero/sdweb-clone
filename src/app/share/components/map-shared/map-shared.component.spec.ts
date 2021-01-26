import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapSharedComponent } from './map-shared.component';

describe('MapSharedComponent', () => {
  let component: MapSharedComponent;
  let fixture: ComponentFixture<MapSharedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapSharedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapSharedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
