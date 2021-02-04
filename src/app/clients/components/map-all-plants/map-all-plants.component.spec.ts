import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MapAllPlantsComponent } from './map-all-plants.component';

describe('MapAllPlantsComponent', () => {
  let component: MapAllPlantsComponent;
  let fixture: ComponentFixture<MapAllPlantsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MapAllPlantsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapAllPlantsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
