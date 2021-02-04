import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZonaFilterComponent } from './zona-filter.component';

describe('ZonaFilterComponent', () => {
  let component: ZonaFilterComponent;
  let fixture: ComponentFixture<ZonaFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ZonaFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZonaFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
