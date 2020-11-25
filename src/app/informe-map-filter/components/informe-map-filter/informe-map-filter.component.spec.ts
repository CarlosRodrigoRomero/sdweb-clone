import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeMapFilterComponent } from './informe-map-filter.component';

xdescribe('InformeMapFilterComponent', () => {
  let component: InformeMapFilterComponent;
  let fixture: ComponentFixture<InformeMapFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InformeMapFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InformeMapFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
