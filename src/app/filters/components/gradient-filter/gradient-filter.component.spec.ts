import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GradientFilterComponent } from './gradient-filter.component';

describe('GradientFilterComponent', () => {
  let component: GradientFilterComponent;
  let fixture: ComponentFixture<GradientFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GradientFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GradientFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
