import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ActiveFilterListComponent } from './active-filter-list.component';

xdescribe('ActiveFilterListComponent', () => {
  let component: ActiveFilterListComponent;
  let fixture: ComponentFixture<ActiveFilterListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ActiveFilterListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ActiveFilterListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
