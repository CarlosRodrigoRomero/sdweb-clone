import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnomaliaInfoComponent } from './anomalia-info.component';

describe('AnomaliaInfoComponent', () => {
  let component: AnomaliaInfoComponent;
  let fixture: ComponentFixture<AnomaliaInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AnomaliaInfoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnomaliaInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
