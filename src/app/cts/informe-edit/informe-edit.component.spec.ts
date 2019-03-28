import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeEditComponent } from './informe-edit.component';

describe('InformeEditComponent', () => {
  let component: InformeEditComponent;
  let fixture: ComponentFixture<InformeEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InformeEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InformeEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
