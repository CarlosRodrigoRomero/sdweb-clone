import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OlMapMarkerComponent } from './ol-map-marker.component';

describe('OlMapMakerComponent', () => {
  let component: OlMapMarkerComponent;
  let fixture: ComponentFixture<OlMapMakerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OlMapMarkerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OlMapMarkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
