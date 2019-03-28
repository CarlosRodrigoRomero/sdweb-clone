import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeViewComponent } from './informe-view.component';

describe('InformeViewComponent', () => {
  let component: InformeViewComponent;
  let fixture: ComponentFixture<InformeViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InformeViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InformeViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
