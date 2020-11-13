import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeMapAreaComponent } from './informe-map-area.component';

describe('InformeMapAreaComponent', () => {
  let component: InformeMapAreaComponent;
  let fixture: ComponentFixture<InformeMapAreaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InformeMapAreaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InformeMapAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
