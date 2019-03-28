import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PcFilterComponent } from './pc-filter.component';

describe('PcFilterComponent', () => {
  let component: PcFilterComponent;
  let fixture: ComponentFixture<PcFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PcFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PcFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
