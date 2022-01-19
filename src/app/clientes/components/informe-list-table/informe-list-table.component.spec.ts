import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { InformeListTableComponent } from './informe-list-table.component';

xdescribe('InformeListTableComponent', () => {
  let component: InformeListTableComponent;
  let fixture: ComponentFixture<InformeListTableComponent>;

  beforeEach(waitForAsync(() => {
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
