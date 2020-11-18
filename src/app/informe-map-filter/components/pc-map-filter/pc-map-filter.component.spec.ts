import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PcMapFilterComponent } from './pc-map-filter.component';

describe('PcMapFilterComponent', () => {
  let component: PcMapFilterComponent;
  let fixture: ComponentFixture<PcMapFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PcMapFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PcMapFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
