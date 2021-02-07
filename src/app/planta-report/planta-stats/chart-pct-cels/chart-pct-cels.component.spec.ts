import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartPctCelsComponent } from './chart-pct-cels.component';

describe('ChartPctCelsComponent', () => {
  let component: ChartPctCelsComponent;
  let fixture: ComponentFixture<ChartPctCelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartPctCelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartPctCelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
