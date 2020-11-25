import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InformeListTableComponent } from './informe-list-table.component';

describe('InformeListTableComponent', () => {
  let component: InformeListTableComponent;
  let fixture: ComponentFixture<InformeListTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InformeListTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InformeListTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
